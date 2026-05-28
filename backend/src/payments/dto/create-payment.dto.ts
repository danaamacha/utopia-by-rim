import { IsEnum } from 'class-validator';
import { PaymentMethodValues } from '../../orders/order.entity';
import type { PaymentMethod } from '../../orders/order.entity';

export class CreatePaymentDto {
  @IsEnum(PaymentMethodValues)
  paymentMethod: PaymentMethod;
}



