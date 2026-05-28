import { IsOptional, IsInt, Min, IsUUID, IsBoolean, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class BestSellersQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  days?: number; // Filter by last N days. Ignored if dateFrom/dateTo are provided.

  @IsOptional()
  @IsUUID('4')
  categoryId?: string;

  // Admin only
  @IsOptional()
  @IsDateString()
  dateFrom?: string; // Priority: dateFrom/dateTo take precedence over 'days' if both provided

  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  includeInactive?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;
}

