import {
    IsEmail,
    IsNotEmpty,
    IsString,
    MinLength,
    IsEnum,
    MaxLength,
} from 'class-validator';
import { UserRole } from '@prisma/client';

export class RegisterDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(50)
    firstName: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(50)
    lastName: string;

    @IsEmail()
    email: string;

    @IsString()
    @MinLength(8, { message: 'Password must be at least 8 characters' })
    @MaxLength(128)
    password: string;

    @IsEnum(UserRole, { message: 'Role must be STUDENT or INSTRUCTOR' })
    role: UserRole;
}

export class LoginDto {
    @IsEmail()
    email: string;

    @IsString()
    @IsNotEmpty()
    password: string;
}
