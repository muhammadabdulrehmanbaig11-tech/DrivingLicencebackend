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
import { RegisterDto, LoginDto, ForgotPasswordDto, ResetPasswordDto } from './dto';

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);

    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
    ) { }

    /**
     * Register a new user account.
     * Password is hashed with Argon2 before storage.
     */
    async register(dto: RegisterDto) {
        // Prevent ADMIN role from being self-assigned
        if (dto.role === 'ADMIN') {
            throw new ConflictException('Cannot register as admin');
        }

        // Check for existing email
        const existing = await this.prisma.user.findUnique({
            where: { email: dto.email.toLowerCase().trim() },
        });
        if (existing) {
            throw new ConflictException('A user with this email already exists');
        }

        // Hash password with Argon2
        const passwordHash = await argon2.hash(dto.password);

        // Create user
        const user = await this.prisma.user.create({
            data: {
                email: dto.email.toLowerCase().trim(),
                passwordHash,
                firstName: dto.firstName.trim(),
                lastName: dto.lastName.trim(),
                role: dto.role,
            },
        });

        return this.generateTokens(user.id, user.email, user.role);
    }

    /**
     * Authenticate a user with email + password.
     * Returns access token in body and sets refresh token in httpOnly cookie.
     */
    async login(dto: LoginDto) {
        const user = await this.prisma.user.findUnique({
            where: { email: dto.email.toLowerCase().trim() },
        });

        if (!user) {
            throw new UnauthorizedException('Invalid email or password');
        }

        // Verify password with Argon2
        const valid = await argon2.verify(user.passwordHash, dto.password);
        if (!valid) {
            throw new UnauthorizedException('Invalid email or password');
        }

        if (!user.isActive) {
            throw new UnauthorizedException('Account is deactivated');
        }

        return this.generateTokens(user.id, user.email, user.role);
    }

    /**
     * Generate new access token from a valid refresh token.
     */
    async refreshToken(refreshToken: string) {
        try {
            const payload = this.jwtService.verify(refreshToken);
            const user = await this.prisma.user.findUnique({
                where: { id: payload.sub },
            });

            if (!user || !user.isActive) {
                throw new UnauthorizedException();
            }

            return this.generateTokens(user.id, user.email, user.role);
        } catch {
            throw new UnauthorizedException('Invalid or expired refresh token');
        }
    }

    /**
     * Request a password reset.
     * Generates a secure token, hashes it, and stores it with a 1-hour expiry.
     * Always returns success to prevent email enumeration.
     */
    async forgotPassword(dto: ForgotPasswordDto) {
        const email = dto.email.toLowerCase().trim();
        const user = await this.prisma.user.findUnique({
            where: { email },
        });

        // Always return success even if user not found (prevents email enumeration)
        if (!user) {
            this.logger.warn(`Password reset requested for non-existent email: ${email}`);
            return { message: 'If an account exists with that email, we have sent password reset instructions.' };
        }

        // Generate a 32-byte random token
        const rawToken = crypto.randomBytes(32).toString('hex');

        // Store the SHA-256 hash of the token (never store raw tokens)
        const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

        // Set 1-hour expiry
        const expiry = new Date(Date.now() + 60 * 60 * 1000);

        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                resetToken: hashedToken,
                resetTokenExpiry: expiry,
            },
        });

        // Log the reset link (in production, send via email service)
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const resetLink = `${frontendUrl}/reset-password?token=${rawToken}`;
        this.logger.log(`🔑 Password reset link for ${email}: ${resetLink}`);

        return { message: 'If an account exists with that email, we have sent password reset instructions.' };
    }

    /**
     * Verify that a reset token is valid and not expired.
     */
    async verifyResetToken(token: string) {
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        const user = await this.prisma.user.findFirst({
            where: {
                resetToken: hashedToken,
                resetTokenExpiry: { gt: new Date() },
            },
        });

        if (!user) {
            throw new BadRequestException('Invalid or expired reset link. Please request a new one.');
        }

        return { valid: true };
    }

    /**
     * Reset password using a valid token.
     * Validates token, hashes new password, clears token.
     */
    async resetPassword(dto: ResetPasswordDto) {
        const hashedToken = crypto.createHash('sha256').update(dto.token).digest('hex');

        const user = await this.prisma.user.findFirst({
            where: {
                resetToken: hashedToken,
                resetTokenExpiry: { gt: new Date() },
            },
        });

        if (!user) {
            throw new BadRequestException('Invalid or expired reset link. Please request a new one.');
        }

        // Hash the new password
        const passwordHash = await argon2.hash(dto.newPassword);

        // Update password and clear reset token
        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                passwordHash,
                resetToken: null,
                resetTokenExpiry: null,
            },
        });

        this.logger.log(`Password reset successful for user: ${user.email}`);

        return { message: 'Your password has been reset successfully. You can now sign in.' };
    }

    /**
     * Generate JWT access and refresh tokens.
     */
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
            user: { id: userId, email, role },
        };
    }
}
