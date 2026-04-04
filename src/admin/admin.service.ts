import {
    Injectable,
    NotFoundException,
    ForbiddenException,
    ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ApprovalStatus } from '@prisma/client';

@Injectable()
export class AdminService {
    constructor(private prisma: PrismaService) { }

    /**
     * List instructors with advanced filtering and pagination.
     */
    async listInstructors(query: { status?: ApprovalStatus; city?: string; search?: string; limit?: number; offset?: number }) {
        const { status, city, search, limit = 50, offset = 0 } = query;
        return this.prisma.instructorProfile.findMany({
            where: {
                approvalStatus: status,
                ...(city && { location: { city: { contains: city, mode: 'insensitive' } } }),
                ...(search && {
                    OR: [
                        { user: { firstName: { contains: search, mode: 'insensitive' } } },
                        { user: { lastName: { contains: search, mode: 'insensitive' } } },
                        { user: { email: { contains: search, mode: 'insensitive' } } },
                    ],
                }),
            },
            include: {
                user: { select: { firstName: true, lastName: true, email: true, createdAt: true, isActive: true } },
                location: true,
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
            skip: offset,
        });
    }

    /**
     * List all users (students/admins) with filtering.
     */
    async listUsers(query: { search?: string; role?: 'STUDENT' | 'ADMIN'; limit?: number; offset?: number }) {
        const { search, role, limit = 50, offset = 0 } = query;
        return this.prisma.user.findMany({
            where: {
                role: role,
                ...(search && {
                    OR: [
                        { firstName: { contains: search, mode: 'insensitive' } },
                        { lastName: { contains: search, mode: 'insensitive' } },
                        { email: { contains: search, mode: 'insensitive' } },
                    ],
                }),
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
            skip: offset,
        });
    }

    /**
     * List and manage bookings.
     */
    async listBookings(query: { status?: any; limit?: number; offset?: number }) {
        return this.prisma.booking.findMany({
            where: query.status ? { status: query.status } : {},
            include: {
                student: { select: { firstName: true, lastName: true, email: true } },
                instructor: { include: { user: { select: { firstName: true, lastName: true } } } },
                payment: true,
            },
            orderBy: { date: 'desc' },
            take: query.limit || 50,
            skip: query.offset || 0,
        });
    }

    /**
     * List reviews for moderation.
     */
    async listReviews(limit = 50) {
        return this.prisma.review.findMany({
            include: {
                student: { select: { firstName: true, lastName: true } },
                instructor: { include: { user: { select: { firstName: true, lastName: true } } } },
                booking: true,
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
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
                    metadata: { timestamp: new Date() },
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
    async getAuditLogs(limit = 100) {
        return this.prisma.auditLog.findMany({
            include: {
                user: { select: { firstName: true, lastName: true, email: true } },
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
    }

    /**
     * List all payments with status filtering.
     */
    async listPayments(query: { status?: any; limit?: number; offset?: number }) {
        return this.prisma.payment.findMany({
            where: query.status ? { status: query.status } : {},
            include: {
                user: { select: { firstName: true, lastName: true, email: true } },
                booking: true,
            },
            orderBy: { createdAt: 'desc' },
            take: query.limit || 50,
            skip: query.offset || 0,
        });
    }

    /**
     * Process a refund (Admin only).
     */
    async processRefund(paymentId: string, adminId: string) {
        const payment = await this.prisma.payment.findUnique({
            where: { id: paymentId },
            include: { booking: true },
        });

        if (!payment) throw new NotFoundException('Payment record not found');
        if (payment.status === 'REFUNDED') throw new ConflictException('Payment already refunded');

        // Logic for Stripe refund would go here
        // const refund = await this.stripe.refunds.create({ charge: payment.stripeChargeId });

        const [updated] = await this.prisma.$transaction([
            this.prisma.payment.update({
                where: { id: paymentId },
                data: { status: 'REFUNDED' },
            }),
            this.prisma.auditLog.create({
                data: {
                    userId: adminId,
                    action: 'PAYMENT_REFUNDED',
                    targetType: 'Payment',
                    targetId: paymentId,
                    metadata: { amount: payment.amount, bookingId: payment.bookingId },
                },
            }),
        ]);

        return updated;
    }

    /**
     * Get financial health and overview.
     */
    async getFinancialOverview() {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const [totalRevenue, monthlyRevenue, refundedAmount] = await Promise.all([
            this.prisma.payment.aggregate({
                _sum: { amount: true },
                where: { status: 'SUCCEEDED' },
            }),
            this.prisma.payment.aggregate({
                _sum: { amount: true },
                where: { status: 'SUCCEEDED', createdAt: { gte: thirtyDaysAgo } },
            }),
            this.prisma.payment.aggregate({
                _sum: { amount: true },
                where: { status: 'REFUNDED' },
            }),
        ]);

        return {
            totalVolume: Number(totalRevenue._sum.amount || 0),
            monthlyVolume: Number(monthlyRevenue._sum.amount || 0),
            refundedTotal: Number(refundedAmount._sum.amount || 0),
            netRevenue: Number(totalRevenue._sum.amount || 0) - Number(refundedAmount._sum.amount || 0),
        };
    }

    /**
     * Get dashboard stats with financial overview.
     */
    async getDashboardStats() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const [
            totalUsers,
            totalInstructors,
            pendingApprovals,
            totalBookings,
            bookingsToday,
            revenueData,
        ] = await Promise.all([
            this.prisma.user.count(),
            this.prisma.instructorProfile.count({ where: { approvalStatus: 'APPROVED' } }),
            this.prisma.instructorProfile.count({ where: { approvalStatus: 'PENDING' } }),
            this.prisma.booking.count(),
            this.prisma.booking.count({ where: { createdAt: { gte: today } } }),
            this.prisma.payment.aggregate({
                _sum: { amount: true },
                where: { status: 'SUCCEEDED' },
            }),
        ]);

        return {
            totalUsers,
            totalInstructors,
            pendingApprovals,
            totalBookings,
            bookingsToday,
            totalRevenue: revenueData._sum.amount || 0,
            systemAlerts: pendingApprovals > 5 ? 'High volume of pending approvals' : null,
        };
    }
}
