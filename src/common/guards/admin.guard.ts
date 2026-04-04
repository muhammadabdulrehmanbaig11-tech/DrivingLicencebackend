import { Injectable, CanActivate, ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';
import { UserRole, AdminRole } from '@prisma/client';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || user.role !== 'ADMIN') {
      throw new ForbiddenException('Admin access required');
    }

    // Fetch the admin profile to check granular role and permissions
    const adminProfile = await this.prisma.adminProfile.findUnique({
      where: { userId: user.id },
    });

    if (!adminProfile) {
      throw new UnauthorizedException('Admin profile not found or inactive');
    }

    // Attach admin profile to request for use in controllers
    request.adminProfile = adminProfile;

    // Check for required permissions if any are defined on the handler
    const requiredPermissions = this.reflector.get<string[]>('permissions', context.getHandler());
    
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    // Check if admin has any of the required permissions OR is a SUPER_ADMIN
    if (adminProfile.role === 'SUPER_ADMIN') {
      return true;
    }

    // Basic role-based permission expansion (optional, can be moved to a service)
    const adminPermissions = this.getPermissionsByRole(adminProfile.role, adminProfile.permissions);
    
    const hasPermission = requiredPermissions.every(p => adminPermissions.includes(p));

    if (!hasPermission) {
      throw new ForbiddenException('Insufficient admin permissions');
    }

    return true;
  }

  private getPermissionsByRole(role: AdminRole, overrides: string[]): string[] {
    const basePermissions: Record<AdminRole, string[]> = {
      SUPER_ADMIN: ['*'], // All permissions
      OPERATIONS: ['manage_instructors', 'manage_students', 'manage_bookings', 'view_reports'],
      SUPPORT: ['manage_students', 'manage_bookings', 'manage_reviews', 'manage_disputes'],
      FINANCE: ['view_payments', 'manage_refunds', 'view_reports'],
      CONTENT_REVIEWER: ['manage_content', 'manage_reviews'],
    };

    const rolePerms = basePermissions[role] || [];
    // Combine role-based permissions with any granular overrides stored in the DB
    return Array.from(new Set([...rolePerms, ...overrides]));
  }
}
