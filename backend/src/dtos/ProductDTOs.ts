import { IsString, IsNotEmpty, IsNumber, IsPositive, IsMongoId, MinLength, IsOptional, IsUrl, Min } from 'class-validator';

export class CreateProductDTO {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  name: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  description: string;

  @IsNumber()
  @IsPositive()
  price: number;

  @IsMongoId()
  categoryId: string;

  @IsString()
  @IsNotEmpty()
  @IsUrl()
  imageUrl: string;

  @IsNumber()
  @Min(0)
  stock: number;
}

export class UpdateProductDTO {
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

  @IsOptional()
  @IsNumber()
  @IsPositive()
  price?: number;

  @IsOptional()
  @IsMongoId()
  categoryId?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @IsUrl()
  imageUrl?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  stock?: number;
}