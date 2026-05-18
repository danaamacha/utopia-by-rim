import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Order } from '../orders/order.entity';
import { PaymentMethodValues } from '../orders/order.entity';

export const PaymentRecordStatusValues = ['pending', 'paid', 'failed'] as const;
export type PaymentRecordStatus = (typeof PaymentRecordStatusValues)[number];

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Order, { onDelete: 'CASCADE' })
  order: Order;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'varchar', default: 'USD' })
  currency: string;

  @Column({ type: 'varchar' })
  method: (typeof PaymentMethodValues)[number];

  @Column({ type: 'varchar', default: 'pending' })
  status: PaymentRecordStatus;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

