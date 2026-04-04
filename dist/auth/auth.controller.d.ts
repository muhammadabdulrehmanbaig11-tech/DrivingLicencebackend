import type { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, ForgotPasswordDto, ResetPasswordDto } from './dto';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    register(dto: RegisterDto, res: Response): Promise<any>;
    login(dto: LoginDto, res: Response): Promise<any>;
    refresh(req: Request, res: Response): Promise<any>;
    logout(res: Response): Promise<any>;
    forgotPassword(dto: ForgotPasswordDto): Promise<{
        message: string;
    }>;
    verifyResetToken(token: string): Promise<{
        valid: boolean;
    }>;
    resetPassword(dto: ResetPasswordDto): Promise<{
        message: string;
    }>;
    private setRefreshCookie;
}
