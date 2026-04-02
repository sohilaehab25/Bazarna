import { IsEmail, IsString, MinLength, IsOptional, IsEnum } from 'class-validator';
import { UserRole } from '../models/User';

export class RegisterDTO {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}

export class LoginDTO {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}

export class RefreshTokenDTO {
  @IsString()
  refreshToken: string;
}