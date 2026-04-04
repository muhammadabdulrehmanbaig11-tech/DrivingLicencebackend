import { Controller, Post, Body, Req, Get, Query, UseGuards, Param } from '@nestjs/common';
import type { Request } from 'express';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import { AdminAuthService } from './admin-auth.service';
import { AdminLoginDto, InviteAdminDto, AcceptInviteDto, AdminMfaVerifyDto } from './dto/admin-auth.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AdminGuard } from '../common/guards/admin.guard';

@Controller('admin-auth')
export class AdminAuthController {
  constructor(private readonly adminAuthService: AdminAuthService) {}

  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async login(@Body() dto: AdminLoginDto, @Req() req: Request) {
    const ip = req.ip || req.get('x-forwarded-for') || 'unknown';
    const device = req.get('user-agent') || 'unknown';
    return this.adminAuthService.login(dto, ip, device);
  }

  @Post('invite')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async invite(@Body() dto: InviteAdminDto, @Req() req: any) {
    // Only SUPER_ADMIN should be able to invite (Enforced in AdminGuard if we add granular checks)
    return this.adminAuthService.inviteAdmin(dto, req.user.id);
  }

  @Post('accept-invite')
  async acceptInvite(@Body() dto: AcceptInviteDto) {
    return this.adminAuthService.acceptInvite(dto);
  }

  @Post('mfa/setup')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async setupMfa(@Req() req: any) {
    return this.adminAuthService.setupMfa(req.user.id);
  }

  @Post('mfa/verify')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async verifyMfa(@Body() dto: { token: string }, @Req() req: any) {
    return this.adminAuthService.verifyAndEnableMfa(req.user.id, dto.token);
  }
}
