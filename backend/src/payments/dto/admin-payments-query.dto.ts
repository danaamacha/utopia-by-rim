import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaymentRecordStatusValues } from '../payment.entity';
import { PaymentMethodValues } from '../../orders/order.entity';
import type { PaymentRecordStatus } from '../payment.entity';
import type { PaymentMethod } from '../../orders/order.entity';

export class AdminPaymentsQueryDto {
  @IsOptional()
  @IsEnum(PaymentRecordStatusValues)
  status?: PaymentRecordStatus;

  @IsOptional()
  @IsEnum(PaymentMethodValues)
  method?: PaymentMethod;

  @IsOptional()
  @IsString()
  dateFrom?: string;

  @IsOptional()
  @IsString()
  dateTo?: string;
}



