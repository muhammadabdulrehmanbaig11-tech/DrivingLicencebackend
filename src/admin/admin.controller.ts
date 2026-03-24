import {
    Controller,
    Get,
    Patch,
    Param,
    Query,
    UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard, RolesGuard } from '../common/guards';
import { Roles, CurrentUser } from '../common/decorators';
import { UserRole, ApprovalStatus } from '@prisma/client';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
    constructor(private adminService: AdminService) { }

    /** GET /api/admin/dashboard — Stats overview */
    @Get('dashboard')
    getDashboardStats() {
        return this.adminService.getDashboardStats();
    }

    /** GET /api/admin/instructors?status=PENDING */
    @Get('instructors')
    listInstructors(@Query('status') status?: ApprovalStatus) {
        return this.adminService.listInstructors(status);
    }

    /** PATCH /api/admin/instructors/:id/approve */
    @Patch('instructors/:id/approve')
    approveInstructor(
        @Param('id') id: string,
        @CurrentUser() user: { id: string },
    ) {
        return this.adminService.approveInstructor(id, user.id);
    }

    /** PATCH /api/admin/instructors/:id/reject */
    @Patch('instructors/:id/reject')
    rejectInstructor(
        @Param('id') id: string,
        @CurrentUser() user: { id: string },
    ) {
        return this.adminService.rejectInstructor(id, user.id);
    }

    /** PATCH /api/admin/instructors/:id/suspend */
    @Patch('instructors/:id/suspend')
    suspendInstructor(
        @Param('id') id: string,
        @CurrentUser() user: { id: string },
    ) {
        return this.adminService.suspendInstructor(id, user.id);
    }

    /** GET /api/admin/users */
    @Get('users')
    listUsers() {
        return this.adminService.listUsers();
    }

    /** PATCH /api/admin/users/:id/toggle-active */
    @Patch('users/:id/toggle-active')
    toggleUserActive(
        @Param('id') id: string,
        @CurrentUser() user: { id: string },
    ) {
        return this.adminService.toggleUserActive(id, user.id);
    }

    /** GET /api/admin/audit-logs */
    @Get('audit-logs')
    getAuditLogs() {
        return this.adminService.getAuditLogs();
    }
}
