"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const argon2 = __importStar(require("argon2"));
const crypto = __importStar(require("crypto"));
const prisma_service_1 = require("../prisma/prisma.service");
const email_service_1 = require("../common/email.service");
let AuthService = AuthService_1 = class AuthService {
    prisma;
    jwtService;
    emailService;
    logger = new common_1.Logger(AuthService_1.name);
    constructor(prisma, jwtService, emailService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
        this.emailService = emailService;
    }
    async register(dto) {
        if (dto.role === 'ADMIN') {
            throw new common_1.ConflictException('Cannot register as admin');
        }
        const email = dto.email.toLowerCase().trim();
        const firstName = dto.firstName?.trim();
        const lastName = dto.lastName?.trim();
        this.logger.log(`Registration attempt: email=${email}, role=${dto.role}, firstNameLength=${firstName?.length || 0}, lastNameLength=${lastName?.length || 0}`);
        try {
            const existingUser = await this.prisma.user.findUnique({
                where: { email },
            });
            if (existingUser) {
                this.logger.warn(`Registration conflict: email ${email} already exists`);
                throw new common_1.ConflictException('A user with this email already exists');
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
            this.logger.log(`Registration successful: userId=${user.id}, email=${user.email}, role=${user.role}`);
            return this.generateTokens(user.id, user.email, user.role);
        }
        catch (error) {
            if (error instanceof common_1.ConflictException) {
                throw error;
            }
            const prismaError = error;
            this.logger.error(`Registration DB error: code=${prismaError.code ?? 'unknown'}, message=${prismaError.message ?? 'unknown'}, meta=${JSON.stringify(prismaError.meta ?? {})}`);
            throw new common_1.ConflictException('Registration failed. Please try again or contact support.');
        }
    }
    async login(dto) {
        const email = dto.email.toLowerCase().trim();
        const user = await this.prisma.user.findUnique({
            where: { email },
        });
        if (!user) {
            throw new common_1.UnauthorizedException('Invalid email or password');
        }
        if (!user.isActive) {
            throw new common_1.UnauthorizedException('Account is deactivated');
        }
        const validPassword = await argon2.verify(user.passwordHash, dto.password);
        if (!validPassword) {
            throw new common_1.UnauthorizedException('Invalid email or password');
        }
        this.logger.log(`Login successful: userId=${user.id}, email=${user.email}`);
        return this.generateTokens(user.id, user.email, user.role);
    }
    async refreshToken(refreshToken) {
        try {
            const payload = this.jwtService.verify(refreshToken);
            if (!payload?.sub) {
                throw new common_1.UnauthorizedException('Invalid refresh token payload');
            }
            const user = await this.prisma.user.findUnique({
                where: { id: payload.sub },
            });
            if (!user || !user.isActive) {
                throw new common_1.UnauthorizedException('Invalid or expired refresh token');
            }
            return this.generateTokens(user.id, user.email, user.role);
        }
        catch (error) {
            this.logger.warn(`Refresh token failed: ${error?.message ?? 'unknown error'}`);
            throw new common_1.UnauthorizedException('Invalid or expired refresh token');
        }
    }
    async forgotPassword(dto) {
        const email = dto.email.toLowerCase().trim();
        const user = await this.prisma.user.findUnique({
            where: { email },
        });
        if (!user) {
            this.logger.warn(`Password reset requested for non-existent email: ${email}`);
            return {
                message: 'If an account exists with that email, we have sent password reset instructions.',
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
        const frontendUrl = process.env.FRONTEND_URL?.trim() || 'https://teachmedrive.co.uk';
        const resetLink = `${frontendUrl}/reset-password?token=${encodeURIComponent(rawToken)}`;
        await this.emailService.sendPasswordReset(email, resetLink);
        this.logger.log(`Password reset email sent: userId=${user.id}, email=${email}`);
        return {
            message: 'If an account exists with that email, we have sent password reset instructions.',
        };
    }
    async verifyResetToken(token) {
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
            throw new common_1.BadRequestException('Invalid or expired reset link. Please request a new one.');
        }
        return { valid: true };
    }
    async resetPassword(dto) {
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
            throw new common_1.BadRequestException('Invalid or expired reset link. Please request a new one.');
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
            message: 'Your password has been reset successfully. You can now sign in.',
        };
    }
    generateTokens(userId, email, role) {
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
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        email_service_1.EmailService])
], AuthService);
//# sourceMappingURL=auth.service.js.map