// backend/src/discounts/dto/apply-discount.dto.ts
import { IsString, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ApplyDiscountDto {
  @IsString()
  code: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  total: number;
}