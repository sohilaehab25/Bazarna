import { IsEmail, IsString, MinLength } from 'class-validator';

export class RegisterDTO {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  name: string;
}

export class LoginDTO {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}