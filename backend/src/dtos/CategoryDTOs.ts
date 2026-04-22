import { IsString, IsNotEmpty, MinLength, IsOptional } from 'class-validator';

export class CreateCategoryDTO {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  name: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  description: string;
}

export class UpdateCategoryDTO {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  description?: string;
}