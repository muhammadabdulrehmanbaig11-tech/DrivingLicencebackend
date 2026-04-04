import { IsEmail, IsNotEmpty, IsString, Length, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { AdminRole } from '@prisma/client';

export class AdminLoginDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsString()
  @IsOptional()
  mfaToken?: string; // Token from Authenticator App
}

export class AdminMfaVerifyDto {
  @IsString()
  @IsNotEmpty()
  @Length(6, 6)
  token: string;

  @IsUUID()
  @IsNotEmpty()
  userId: string;
}

export class InviteAdminDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsEnum(AdminRole)
  @IsNotEmpty()
  role: AdminRole;
}

export class AcceptInviteDto {
  @IsString()
  @IsNotEmpty()
  token: string;

  @IsString()
  @IsNotEmpty()
  @Length(8, 64)
  password: string;

  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;
}
