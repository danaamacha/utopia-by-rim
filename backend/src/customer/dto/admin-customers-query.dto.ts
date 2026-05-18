// backend/src/customer/dto/admin-customers-query.dto.ts
import { IsOptional, IsIn, IsString } from 'class-validator';

export class AdminCustomersQueryDto {
  @IsOptional()
  @IsString()
  page?: string;

  @IsOptional()
  @IsString()
  limit?: string;

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sort?: 'asc' | 'desc';

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsIn(['owner', 'admin'])
  role?: 'owner' | 'admin';
}