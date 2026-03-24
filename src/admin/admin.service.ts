import {
    Injectable,
    NotFoundException,
    ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ApprovalStatus } from '@prisma/client';

@Injectable()
export class AdminService {
    constructor(private prisma: PrismaService) { }

    /**
     * List instructors filtered by approval status.
     */
    async listInstructors(status?: ApprovalStatus) {
        return this.prisma.instructorProfile.findMany({
            where: status ? { approvalStatus: status } : {},
            include: {
                user: { select: { firstName: true, lastName: true, email: true, createdAt: true } },
                location: { select: { city: true, country: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    /**
     * Approve an instructor. Creates an audit log.
     */
    async approveInstructor(instructorId: string, adminId: string) {
        const profile = await this.prisma.instructorProfile.findUnique({
            where: { id: instructorId },
        });
        if (!profile) throw new NotFoundException('Instructor not found');
        if (profile.userId === adminId) {
            throw new ForbiddenException('Cannot approve your own profile');
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

    /**
     * Reject an instructor. Creates an audit log.
     */
    async rejectInstructor(instructorId: string, adminId: string) {
        const profile = await this.prisma.instructorProfile.findUnique({
            where: { id: instructorId },
        });
        if (!profile) throw new NotFoundException();

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

    /**
     * Suspend an instructor. Creates an audit log.
     */
    async suspendInstructor(instructorId: string, adminId: string) {
        const profile = await this.prisma.instructorProfile.findUnique({
            where: { id: instructorId },
        });
        if (!profile) throw new NotFoundException();

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

    /**
     * List all users for admin management.
     */
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

    /**
     * Ban/unban a user.
     */
    async toggleUserActive(userId: string, adminId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user) throw new NotFoundException();
        if (user.id === adminId) throw new ForbiddenException('Cannot ban yourself');

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

    /**
     * Get audit logs for admin review.
     */
    async getAuditLogs(limit = 50) {
        return this.prisma.auditLog.findMany({
            include: {
                user: { select: { firstName: true, lastName: true, email: true } },
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
    }

    /**
     * Get dashboard stats.
     */
    async getDashboardStats() {
        const [totalUsers, totalInstructors, pendingApprovals, totalBookings] =
            await Promise.all([
                this.prisma.user.count(),
                this.prisma.instructorProfile.count({ where: { approvalStatus: 'APPROVED' } }),
                this.prisma.instructorProfile.count({ where: { approvalStatus: 'PENDING' } }),
                this.prisma.booking.count(),
            ]);

        return { totalUsers, totalInstructors, pendingApprovals, totalBookings };
    }
}
