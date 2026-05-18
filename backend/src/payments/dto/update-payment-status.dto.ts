import { IsEnum } from 'class-validator';
import { PaymentRecordStatusValues } from '../payment.entity';
import type { PaymentRecordStatus } from '../payment.entity';

export class UpdatePaymentStatusDto {
  @IsEnum(PaymentRecordStatusValues)
  status: PaymentRecordStatus;
}



