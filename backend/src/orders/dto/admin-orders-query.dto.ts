import { IsEnum, IsNumberString, IsOptional, IsString } from 'class-validator';
import {
  OrderStatusValues,
  PaymentStatusValues,
} from '../order.entity';
import type { OrderStatus, PaymentStatus } from '../order.entity';

export class AdminOrdersQueryDto {
  @IsOptional()
  @IsEnum(OrderStatusValues)
  status?: OrderStatus;

  @IsOptional()
  @IsEnum(PaymentStatusValues)
  paymentStatus?: PaymentStatus;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  search?: string; // orderId or email

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



