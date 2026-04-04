"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let AdminService = class AdminService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async listInstructors(status) {
        return this.prisma.instructorProfile.findMany({
            where: status ? { approvalStatus: status } : {},
            include: {
                user: { select: { firstName: true, lastName: true, email: true, createdAt: true } },
                location: { select: { city: true, country: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async approveInstructor(instructorId, adminId) {
        const profile = await this.prisma.instructorProfile.findUnique({
            where: { id: instructorId },
        });
        if (!profile)
            throw new common_1.NotFoundException('Instructor not found');
        if (profile.userId === adminId) {
            throw new common_1.ForbiddenException('Cannot approve your own profile');
        }
        const [updated] = await this.prisma.$transaction([
            this.prisma.instructorProfile.update({
                where: { id: instructorId },
                data: {
                    approvalStatus: 'APPROVED',
                    approvedAt: new Date(),
                    approvedBy: adminId,
                },
            }),
            this.prisma.auditLog.create({
                data: {
                    userId: adminId,
                    action: 'INSTRUCTOR_APPROVED',
                    targetType: 'InstructorProfile',
                    targetId: instructorId,
                },
            }),
        ]);
        return updated;
    }
    async rejectInstructor(instructorId, adminId) {
        const profile = await this.prisma.instructorProfile.findUnique({
            where: { id: instructorId },
        });
        if (!profile)
            throw new common_1.NotFoundException();
        const [updated] = await this.prisma.$transaction([
            this.prisma.instructorProfile.update({
                where: { id: instructorId },
                data: { approvalStatus: 'REJECTED' },
            }),
            this.prisma.auditLog.create({
                data: {
                    userId: adminId,
                    action: 'INSTRUCTOR_REJECTED',
                    targetType: 'InstructorProfile',
                    targetId: instructorId,
                },
            }),
        ]);
        return updated;
    }
    async suspendInstructor(instructorId, adminId) {
        const profile = await this.prisma.instructorProfile.findUnique({
            where: { id: instructorId },
        });
        if (!profile)
            throw new common_1.NotFoundException();
        const [updated] = await this.prisma.$transaction([
            this.prisma.instructorProfile.update({
                where: { id: instructorId },
                data: { approvalStatus: 'SUSPENDED' },
            }),
            this.prisma.auditLog.create({
                data: {
                    userId: adminId,
                    action: 'INSTRUCTOR_SUSPENDED',
                    targetType: 'InstructorProfile',
                    targetId: instructorId,
                },
            }),
        ]);
        return updated;
    }
    async listUsers() {
        return this.prisma.user.findMany({
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                isActive: true,
                emailVerified: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async toggleUserActive(userId, adminId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user)
            throw new common_1.NotFoundException();
        if (user.id === adminId)
            throw new common_1.ForbiddenException('Cannot ban yourself');
        const [updated] = await this.prisma.$transaction([
            this.prisma.user.update({
                where: { id: userId },
                data: { isActive: !user.isActive },
            }),
            this.prisma.auditLog.create({
                data: {
                    userId: adminId,
                    action: user.isActive ? 'USER_BANNED' : 'USER_UNBANNED',
                    targetType: 'User',
                    targetId: userId,
                },
            }),
        ]);
        return updated;
    }
    async getAuditLogs(limit = 50) {
        return this.prisma.auditLog.findMany({
            include: {
                user: { select: { firstName: true, lastName: true, email: true } },
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
    }
    async getDashboardStats() {
        const [totalUsers, totalInstructors, pendingApprovals, totalBookings] = await Promise.all([
            this.prisma.user.count(),
            this.prisma.instructorProfile.count({ where: { approvalStatus: 'APPROVED' } }),
            this.prisma.instructorProfile.count({ where: { approvalStatus: 'PENDING' } }),
            this.prisma.booking.count(),
        ]);
        return { totalUsers, totalInstructors, pendingApprovals, totalBookings };
    }
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AdminService);
//# sourceMappingURL=admin.service.js.map