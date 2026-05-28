import { IsIn, IsOptional, IsString } from 'class-validator';
import {
  OrderStatusValues,
  PaymentStatusValues,
} from '../order.entity';
import type { OrderStatus, PaymentStatus } from '../order.entity';

export class UpdateOrderStatusDto {
  @IsOptional()
  @IsIn(OrderStatusValues)
  status?: OrderStatus;

  @IsOptional()
  @IsIn(PaymentStatusValues)
  paymentStatus?: PaymentStatus;

  @IsOptional()
  @IsString()
  note?: string;
}