import {
    Body,
    Controller,
    Post,
    Get,
    Query,
    Res,
    Req,
    HttpCode,
    HttpStatus,
    UnauthorizedException,
} from '@nestjs/common';
import type { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, ForgotPasswordDto, ResetPasswordDto } from './dto';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    /**
     * POST /api/auth/register
     * Create a new Student or Instructor account.
     */
    @Post('register')
    async register(@Body() dto: RegisterDto, @Res() res: Response) {
        const result = await this.authService.register(dto);
        this.setRefreshCookie(res, result.refreshToken);
        return res.json({
            accessToken: result.accessToken,
            user: result.user,
        });
    }

    /**
     * POST /api/auth/login
     * Authenticate with email + password.
     * Access token in body, refresh token in httpOnly cookie.
     */
    @Post('login')
    @HttpCode(HttpStatus.OK)
    async login(@Body() dto: LoginDto, @Res() res: Response) {
        const result = await this.authService.login(dto);
        this.setRefreshCookie(res, result.refreshToken);
        return res.json({
            accessToken: result.accessToken,
            user: result.user,
        });
    }

    /**
     * POST /api/auth/refresh
     * Use the httpOnly refresh cookie to get a new access token.
     */
    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    async refresh(@Req() req: Request, @Res() res: Response) {
        const refreshToken = req.cookies?.refreshToken;
        if (!refreshToken) {
            throw new UnauthorizedException('No refresh token');
        }

        const result = await this.authService.refreshToken(refreshToken);
        this.setRefreshCookie(res, result.refreshToken);
        return res.json({
            accessToken: result.accessToken,
            user: result.user,
        });
    }

    /**
     * POST /api/auth/logout
     * Clear the refresh token cookie.
     */
    @Post('logout')
    @HttpCode(HttpStatus.OK)
    async logout(@Res() res: Response) {
        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/',
        });
        return res.json({ message: 'Logged out' });
    }

    /**
     * POST /api/auth/forgot-password
     * Request a password reset email.
     * Always returns success to prevent email enumeration.
     */
    @Post('forgot-password')
    @HttpCode(HttpStatus.OK)
    async forgotPassword(@Body() dto: ForgotPasswordDto) {
        return this.authService.forgotPassword(dto);
    }

    /**
     * GET /api/auth/verify-reset-token?token=xxx
     * Check if a password reset token is valid and not expired.
     */
    @Get('verify-reset-token')
    async verifyResetToken(@Query('token') token: string) {
        if (!token) {
            throw new UnauthorizedException('Token is required');
        }
        return this.authService.verifyResetToken(token);
    }

    /**
     * POST /api/auth/reset-password
     * Reset password using a valid token.
     */
    @Post('reset-password')
    @HttpCode(HttpStatus.OK)
    async resetPassword(@Body() dto: ResetPasswordDto) {
        return this.authService.resetPassword(dto);
    }

    /**
     * Set the refresh token as a secure httpOnly cookie.
     * This prevents XSS attacks from stealing the token.
     */
    private setRefreshCookie(res: Response, token: string) {
        res.cookie('refreshToken', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
            path: '/',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });
    }
}
