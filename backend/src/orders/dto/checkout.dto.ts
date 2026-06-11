// backend/src/orders/dto/checkout.dto.ts
import { IsEnum, IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';
import { PaymentMethodValues } from '../order.entity';
import type { PaymentMethod } from '../order.entity';

export class CheckoutDto {
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsNotEmpty()
  addressLine1: string;

  @IsString()
  @IsOptional()
  addressLine2?: string;

  @IsString()
  @IsNotEmpty()
  city: string;

  @IsString()
  @IsNotEmpty()
  state: string;

  @IsString()
  @IsNotEmpty()
  country: string;

  @IsString()
  @IsOptional()
  @Length(2, 12)
  postalCode?: string;

  @IsEnum(PaymentMethodValues, { message: 'paymentMethod must be COD or MANUAL' })
  paymentMethod: PaymentMethod;

  @IsString()
  @IsNotEmpty()
  email: string;

  // ─── Discount code (optional) ─────────────────────────────────────────────
  @IsString()
  @IsOptional()
  discountCode?: string;
}