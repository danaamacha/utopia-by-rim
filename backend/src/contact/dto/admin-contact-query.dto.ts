// src/contact/dto/admin-contact-query.dto.ts
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { ContactMessageStatus } from '../entities/contact-message.entity';

export class AdminContactQueryDto {
  @IsOptional()
  @IsEnum(ContactMessageStatus)
  status?: ContactMessageStatus;

  @IsOptional()
  @IsString()
  dateFrom?: string; // ISO string

  @IsOptional()
  @IsString()
  dateTo?: string; // ISO string

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;
}
