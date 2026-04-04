import {
    Controller,
    Get,
    Patch,
    Param,
    Query,
    UseGuards,
    Req,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AdminGuard } from '../common/guards/admin.guard';
import { Permissions, CurrentUser } from '../common/decorators';
import { ApprovalStatus } from '@prisma/client';

@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
    constructor(private adminService: AdminService) { }

    /** GET /api/admin/dashboard — Stats overview */
    @Get('dashboard')
    @Permissions('view_reports')
    getDashboardStats() {
        return this.adminService.getDashboardStats();
    }

    /** GET /api/admin/instructors?status=PENDING&city=London&search=John */
    @Get('instructors')
    @Permissions('manage_instructors')
    listInstructors(
        @Query('status') status?: ApprovalStatus,
        @Query('city') city?: string,
        @Query('search') search?: string,
        @Query('limit') limit?: string,
        @Query('offset') offset?: string,
    ) {
        return this.adminService.listInstructors({
            status,
            city,
            search,
            limit: limit ? parseInt(limit) : undefined,
            offset: offset ? parseInt(offset) : undefined,
        });
    }

    /** PATCH /api/admin/instructors/:id/approve */
    @Patch('instructors/:id/approve')
    @Permissions('approve_instructors')
    approveInstructor(
        @Param('id') id: string,
        @CurrentUser() user: { id: string },
    ) {
        return this.adminService.approveInstructor(id, user.id);
    }

    /** PATCH /api/admin/instructors/:id/reject */
    @Patch('instructors/:id/reject')
    @Permissions('reject_instructors')
    rejectInstructor(
        @Param('id') id: string,
        @CurrentUser() user: { id: string },
    ) {
        return this.adminService.rejectInstructor(id, user.id);
    }

    /** PATCH /api/admin/instructors/:id/suspend */
    @Patch('instructors/:id/suspend')
    @Permissions('suspend_users')
    suspendInstructor(
        @Param('id') id: string,
        @CurrentUser() user: { id: string },
    ) {
        return this.adminService.suspendInstructor(id, user.id);
    }

    /** GET /api/admin/users */
    @Get('users')
    @Permissions('manage_students')
    listUsers(
        @Query('search') search?: string,
        @Query('role') role?: 'STUDENT' | 'ADMIN',
        @Query('limit') limit?: string,
        @Query('offset') offset?: string,
    ) {
        return this.adminService.listUsers({
            search,
            role,
            limit: limit ? parseInt(limit) : undefined,
            offset: offset ? parseInt(offset) : undefined,
        });
    }

    /** PATCH /api/admin/users/:id/toggle-active */
    @Patch('users/:id/toggle-active')
    @Permissions('suspend_users')
    toggleUserActive(
        @Param('id') id: string,
        @CurrentUser() user: { id: string },
    ) {
        return this.adminService.toggleUserActive(id, user.id);
    }

    /** GET /api/admin/bookings */
    @Get('bookings')
    @Permissions('manage_bookings')
    listBookings(
        @Query('status') status?: string,
        @Query('limit') limit?: string,
        @Query('offset') offset?: string,
    ) {
        return this.adminService.listBookings({ 
            status, 
            limit: limit ? parseInt(limit) : undefined, 
            offset: offset ? parseInt(offset) : undefined 
        });
    }

    /** GET /api/admin/reviews */
    @Get('reviews')
    @Permissions('manage_reviews')
    listReviews(@Query('limit') limit?: string) {
        return this.adminService.listReviews(limit ? parseInt(limit) : undefined);
    }

    /** GET /api/admin/audit-logs */
    @Get('audit-logs')
    @Permissions('view_audit_logs')
    getAuditLogs() {
        return this.adminService.getAuditLogs();
    }

    /** GET /api/admin/payments */
    @Get('payments')
    @Permissions('view_payments')
    listPayments(
        @Query('status') status?: string,
        @Query('limit') limit?: string,
        @Query('offset') offset?: string,
    ) {
        return this.adminService.listPayments({ 
            status, 
            limit: limit ? parseInt(limit) : undefined, 
            offset: offset ? parseInt(offset) : undefined 
        });
    }

    /** POST /api/admin/payments/:id/refund */
    @Patch('payments/:id/refund')
    @Permissions('manage_refunds')
    processRefund(
        @Param('id') id: string,
        @CurrentUser() user: { id: string },
    ) {
        return this.adminService.processRefund(id, user.id);
    }

    /** GET /api/admin/financial-report */
    @Get('financial-report')
    @Permissions('view_reports')
    getFinancialReport() {
        return this.adminService.getFinancialOverview();
    }
}


