import {
    Injectable,
    ConflictException,
    UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto, LoginDto } from './dto';

@Injectable()
export class AuthService {
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
