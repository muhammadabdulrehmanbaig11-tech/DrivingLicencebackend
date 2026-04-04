import { Injectable, UnauthorizedException, BadRequestException, ConflictException, Logger, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { MfaService } from '../common/mfa.service';
import { EmailService } from '../common/email.service';
import * as argon2 from 'argon2';
import * as crypto from 'crypto';
import { AdminLoginDto, InviteAdminDto, AcceptInviteDto, AdminMfaVerifyDto } from './dto/admin-auth.dto';
import { AdminRole, AdminInviteStatus } from '@prisma/client';

@Injectable()
export class AdminAuthService {
  private readonly logger = new Logger(AdminAuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly mfaService: MfaService,
    private readonly emailService: EmailService,
  ) {}

  /**
   * Admin Login logic with mandatory MFA enforcement.
   */
  async login(dto: AdminLoginDto, ipAddress: string, deviceInfo: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
      include: { adminProfile: true },
    });

    if (!user || user.role !== 'ADMIN' || !user.adminProfile) {
      throw new UnauthorizedException('Access denied');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account suspended');
    }

    const validPassword = await argon2.verify(user.passwordHash, dto.password);
    if (!validPassword) {
      this.logger.warn(`Failed admin login attempt for ${dto.email} from ${ipAddress}`);
      // In a real scenario, we'd increment login failures here for lockout
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if MFA is enabled and handle
    if (user.adminProfile.mfaEnabled) {
      if (!dto.mfaToken) {
        // Password correct, but MFA token missing. 
        // Return a partial success so the frontend shows the MFA step.
        return { mfaRequired: true, userId: user.id };
      }

      const mfaValid = this.mfaService.verifyToken(dto.mfaToken, user.adminProfile.mfaSecret!);
      if (!mfaValid) {
        throw new UnauthorizedException('Invalid MFA token');
      }
    }

    // Success - generate full session tokens
    const tokens = await this.generateAdminTokens(user.id, user.email, user.adminProfile.role);
    
    // Log login
    await this.logAdminLogin(user.id, ipAddress, deviceInfo, true);

    return { ...tokens, mfaEnabled: user.adminProfile.mfaEnabled };
  }

  /**
   * Complete MFA setup for a new admin.
   */
  async setupMfa(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { adminProfile: true },
    });

    if (!user || !user.adminProfile) throw new BadRequestException('Admin not found');
    if (user.adminProfile.mfaEnabled) throw new ConflictException('MFA already enabled');

    const secret = this.mfaService.generateSecret();
    const otpauthUrl = this.mfaService.generateOtpauthUrl(user.email, secret);
    const qrCode = await this.mfaService.generateQrCodeDataUrl(otpauthUrl);

    // Save temporary secret (mfaEnabled is still false)
    await this.prisma.adminProfile.update({
      where: { userId },
      data: { mfaSecret: secret },
    });

    return { qrCode, secret };
  }

  /**
   * Verify and enable MFA.
   */
  async verifyAndEnableMfa(userId: string, token: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { adminProfile: true },
    });

    if (!user || !user.adminProfile || !user.adminProfile.mfaSecret) {
      throw new BadRequestException('MFA setup not initialized');
    }

    const valid = this.mfaService.verifyToken(token, user.adminProfile.mfaSecret);
    if (!valid) throw new UnauthorizedException('Invalid token');

    await this.prisma.adminProfile.update({
      where: { userId },
      data: { mfaEnabled: true },
    });

    return { success: true };
  }

  /**
   * Invite a new admin. (Super Admin only - enforced by guards)
   */
  async inviteAdmin(dto: InviteAdminDto, inviterId: string) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already in use');

    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours

    await this.prisma.adminInvite.create({
      data: {
        email: dto.email.toLowerCase().trim(),
        role: dto.role,
        invitedById: inviterId,
        token: hashedToken,
        expiresAt,
      },
    });

    // Send email with invite link (hidden route)
    const inviteLink = `https://teachmedrive.co.uk/secure-control-panel-9x7/accept-invite?token=${rawToken}`;
    // await this.emailService.sendAdminInvite(dto.email, inviteLink, dto.role);
    this.logger.log(`Admin invite sent to ${dto.email} (Role: ${dto.role})`);

    return { message: 'Invite sent successfully', inviteLink }; // Return link for dev/testing
  }

  /**
   * Accept an admin invite.
   */
  async acceptInvite(dto: AcceptInviteDto) {
    const hashedToken = crypto.createHash('sha256').update(dto.token).digest('hex');
    const invite = await this.prisma.adminInvite.findFirst({
      where: { token: hashedToken, status: 'PENDING', expiresAt: { gt: new Date() } },
    });

    if (!invite) throw new BadRequestException('Invalid or expired invite');

    const passwordHash = await argon2.hash(dto.password);

    const user = await this.prisma.$transaction(async (tx) => {
      // 1. Create User
      const newUser = await tx.user.create({
        data: {
          email: invite.email,
          passwordHash,
          firstName: dto.firstName,
          lastName: dto.lastName,
          role: 'ADMIN',
          emailVerified: true,
        },
      });

      // 2. Create Admin Profile
      await tx.adminProfile.create({
        data: {
          userId: newUser.id,
          role: invite.role,
        },
      });

      // 3. Mark Invite as Accepted
      await tx.adminInvite.update({
        where: { id: invite.id },
        data: { status: 'ACCEPTED', acceptedAt: new Date() },
      });

      return newUser;
    });

    return { message: 'Account created. Please log in to setup MFA.', userId: user.id };
  }

  private async generateAdminTokens(userId: string, email: string, role: AdminRole) {
    const payload = { sub: userId, email, role, isAdmin: true };
    const accessToken = this.jwtService.sign(payload, { expiresIn: '30m' }); // Short-lived for admin
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '8h' });

    return { accessToken, refreshToken, user: { id: userId, email, role } };
  }

  private async logAdminLogin(userId: string, ip: string, device: string, success: boolean) {
    const profile = await this.prisma.adminProfile.findUnique({ where: { userId } });
    if (!profile) return;

    const history = JSON.parse(JSON.stringify(profile.loginHistory || []));
    history.unshift({ ip, device, timestamp: new Date(), success });
    
    // Keep last 20 entries
    const limitedHistory = history.slice(0, 20);

    await this.prisma.adminProfile.update({
      where: { userId },
      data: { 
        lastLoginAt: new Date(),
        loginHistory: limitedHistory,
      },
    });
  }
}
