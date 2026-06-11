import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsArray,
  IsUUID,
  Min,
  IsObject,
} from 'class-validator';
import { Transform } from 'class-transformer';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;
const trimLower = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim().toLowerCase() : value;

export class UpdateProductDto {
  @Transform(trim)
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @Transform(trimLower)
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  slug?: string;

  @Transform(trim)
  @IsOptional()
  @IsString()
  description?: string;

  // ✅ Original price
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  // ✅ Sale price (optional, can be null to remove discount)
  @IsOptional()
  @IsNumber()
  @Min(0)
  salePrice?: number | null;

  @Transform(trim)
  @IsOptional()
  @IsString()
  currency?: string;

  @Transform(trim)
  @IsOptional()
  @IsString()
  sku?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  stockQuantity?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  categoryIds?: string[];

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
