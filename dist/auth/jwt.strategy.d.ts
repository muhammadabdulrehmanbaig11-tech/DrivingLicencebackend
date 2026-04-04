import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
declare const JwtStrategy_base: new (...args: unknown[]) => any;
export declare class JwtStrategy extends JwtStrategy_base {
    private prisma;
    constructor(configService: ConfigService, prisma: PrismaService);
    validate(payload: {
        sub: string;
        email: string;
        role: string;
    }): Promise<{
        firstName: string;
        lastName: string;
        email: string;
        role: import("@prisma/client").$Enums.UserRole;
        id: string;
        isActive: boolean;
        emailVerified: boolean;
    }>;
}
export {};
