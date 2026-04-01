import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import {
  RegisterDto,
  LoginDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from './dto';
import { EmailService } from '../common/email.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
  ) {}

  async register(dto: RegisterDto) {
    if (dto.role === 'ADMIN') {
      throw new ConflictException('Cannot register as admin');
    }

    const email = dto.email.toLowerCase().trim();
    const firstName = dto.firstName?.trim();
    const lastName = dto.lastName?.trim();

    this.logger.log(
      `Registration attempt: email=${email}, role=${dto.role}, firstNameLength=${firstName?.length || 0}, lastNameLength=${lastName?.length || 0}`,
    );

    try {
      const existingUser = await this.prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        this.logger.warn(`Registration conflict: email ${email} already exists`);
        throw new ConflictException('A user with this email already exists');
      }

      const passwordHash = await argon2.hash(dto.password);

      const user = await this.prisma.user.create({
        data: {
          email,
          passwordHash,
          firstName,
          lastName,
          role: dto.role,
        },
      });

      this.logger.log(
        `Registration successful: userId=${user.id}, email=${user.email}, role=${user.role}`,
      );

      return this.generateTokens(user.id, user.email, user.role);
    } catch (error: unknown) {
      if (error instanceof ConflictException) {
        throw error;
      }

      const prismaError = error as {
        code?: string;
        meta?: unknown;
        message?: string;
      };

      this.logger.error(
        `Registration DB error: code=${prismaError.code ?? 'unknown'}, message=${prismaError.message ?? 'unknown'}, meta=${JSON.stringify(prismaError.meta ?? {})}`,
      );

      throw new ConflictException(
        'Registration failed. Please try again or contact support.',
      );
    }
  }

  async login(dto: LoginDto) {
    const email = dto.email.toLowerCase().trim();

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    const validPassword = await argon2.verify(user.passwordHash, dto.password);

    if (!validPassword) {
      throw new UnauthorizedException('Invalid email or password');
    }

    this.logger.log(`Login successful: userId=${user.id}, email=${user.email}`);

    return this.generateTokens(user.id, user.email, user.role);
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken) as {
        sub: string;
        email: string;
        role: string;
      };

      if (!payload?.sub) {
        throw new UnauthorizedException('Invalid refresh token payload');
      }

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user || !user.isActive) {
        throw new UnauthorizedException('Invalid or expired refresh token');
      }

      return this.generateTokens(user.id, user.email, user.role);
    } catch (error) {
      this.logger.warn(`Refresh token failed: ${(error as Error)?.message ?? 'unknown error'}`);
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const email = dto.email.toLowerCase().trim();

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      this.logger.warn(`Password reset requested for non-existent email: ${email}`);
      return {
        message:
          'If an account exists with that email, we have sent password reset instructions.',
      };
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');

    const expiry = new Date(Date.now() + 60 * 60 * 1000);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: hashedToken,
        resetTokenExpiry: expiry,
      },
    });

    const frontendUrl =
      process.env.FRONTEND_URL?.trim() || 'https://teachmedrive.co.uk';
    const resetLink = `${frontendUrl}/reset-password?token=${encodeURIComponent(rawToken)}`;

    await this.emailService.sendPasswordReset(email, resetLink);

    this.logger.log(`Password reset email sent: userId=${user.id}, email=${email}`);

    return {
      message:
        'If an account exists with that email, we have sent password reset instructions.',
    };
  }

  async verifyResetToken(token: string) {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await this.prisma.user.findFirst({
      where: {
        resetToken: hashedToken,
        resetTokenExpiry: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      throw new BadRequestException(
        'Invalid or expired reset link. Please request a new one.',
      );
    }

    return { valid: true };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const hashedToken = crypto
      .createHash('sha256')
      .update(dto.token)
      .digest('hex');

    const user = await this.prisma.user.findFirst({
      where: {
        resetToken: hashedToken,
        resetTokenExpiry: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      throw new BadRequestException(
        'Invalid or expired reset link. Please request a new one.',
      );
    }

    const passwordHash = await argon2.hash(dto.newPassword);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    this.logger.log(`Password reset successful for userId=${user.id}, email=${user.email}`);

    return {
      message:
        'Your password has been reset successfully. You can now sign in.',
    };
  }

  private generateTokens(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: '15m',
    });

    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: '7d',
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: userId,
        email,
        role,
      },
    };
  }
}