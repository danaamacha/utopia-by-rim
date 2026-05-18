// backend/src/discounts/discount-code.entity.ts
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export type DiscountType = 'percent' | 'fixed' | 'free_shipping';

@Entity('discount_codes')
export class DiscountCode {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', unique: true })
  code: string; // always stored UPPERCASE

  @Column({ type: 'varchar', nullable: true })
  label: string | null;

  @Column({ type: 'varchar', default: 'percent' })
  type: DiscountType;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  value: number; // percent or fixed amount; 0 for free_shipping

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  minOrder: number; // minimum order total to apply

  @Column({ type: 'date', nullable: true })
  startDate: string | null;

  @Column({ type: 'date', nullable: true })
  endDate: string | null;

  @Column({ type: 'int', nullable: true })
  usageLimit: number | null; // null = unlimited

  @Column({ type: 'int', default: 0 })
  usedCount: number;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}