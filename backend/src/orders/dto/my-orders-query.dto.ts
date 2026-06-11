import { IsEnum, IsNumberString, IsOptional, IsString } from 'class-validator';
import { OrderStatusValues } from '../order.entity';
import type { OrderStatus } from '../order.entity';

export class MyOrdersQueryDto {
  @IsOptional()
  @IsEnum(OrderStatusValues)
  status?: OrderStatus;

  @IsOptional()
  @IsString()
  dateFrom?: string;

  @IsOptional()
  @IsString()
  dateTo?: string;

  @IsOptional()
  @IsNumberString()
  page?: string;

  @IsOptional()
  @IsNumberString()
  limit?: string;

  @IsOptional()
  @IsString()
  sort?: 'asc' | 'desc';
}



