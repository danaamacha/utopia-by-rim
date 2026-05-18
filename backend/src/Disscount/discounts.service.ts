// backend/src/discounts/discounts.service.ts
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Logger } from '@nestjs/common';
import { DiscountCode } from './discount-code.entity';
import { CreateDiscountDto } from './dto/create-discount.dto';
import { UpdateDiscountDto } from './dto/update-discount.dto';

export interface DiscountResult {
  discountId: string;
  code: string;
  type: string;
  discountAmount: number;   // how much was deducted
  finalTotal: number;       // total after discount
  freeShipping: boolean;
}

@Injectable()
export class DiscountsService {
  private readonly logger = new Logger(DiscountsService.name);

  constructor(
    @InjectRepository(DiscountCode)
    private readonly discountRepo: Repository<DiscountCode>,
  ) {}

  // ─── ADMIN CRUD ───────────────────────────────────────────────────────────

  async adminList(): Promise<DiscountCode[]> {
    return this.discountRepo.find({
      order: { createdAt: 'DESC' },
    });
  }

  async adminGetById(id: string): Promise<DiscountCode> {
    const d = await this.discountRepo.findOne({ where: { id } });
    if (!d) throw new NotFoundException(`Discount ${id} not found`);
    return d;
  }

  async adminCreate(dto: CreateDiscountDto): Promise<DiscountCode> {
    const code = dto.code.trim().toUpperCase();

    const existing = await this.discountRepo.findOne({ where: { code } });
    if (existing) throw new ConflictException(`Code "${code}" already exists`);

    return this.discountRepo.save(
      this.discountRepo.create({
        code,
        label:      dto.label     ?? null,
        type:       dto.type,
        value:      dto.value     ?? 0,
        minOrder:   dto.minOrder  ?? 0,
        startDate:  dto.startDate ?? null,
        endDate:    dto.endDate   ?? null,
        usageLimit: dto.usageLimit ?? null,
        isActive:   dto.isActive  ?? true,
        usedCount:  0,
      }),
    );
  }

  async adminUpdate(id: string, dto: UpdateDiscountDto): Promise<DiscountCode> {
    const discount = await this.adminGetById(id);

    if (dto.code) {
      const code = dto.code.trim().toUpperCase();
      const conflict = await this.discountRepo.findOne({ where: { code } });
      if (conflict && conflict.id !== id) {
        throw new ConflictException(`Code "${code}" already exists`);
      }
      discount.code = code;
    }

    if (dto.label      !== undefined) discount.label      = dto.label ?? null;
    if (dto.type       !== undefined) discount.type       = dto.type;
    if (dto.value      !== undefined) discount.value      = dto.value ?? 0;
    if (dto.minOrder   !== undefined) discount.minOrder   = dto.minOrder ?? 0;
    if (dto.startDate  !== undefined) discount.startDate  = dto.startDate ?? null;
    if (dto.endDate    !== undefined) discount.endDate    = dto.endDate ?? null;
    if (dto.usageLimit !== undefined) discount.usageLimit = dto.usageLimit ?? null;
    if (dto.isActive   !== undefined) discount.isActive   = dto.isActive;

    return this.discountRepo.save(discount);
  }

  async adminDelete(id: string): Promise<void> {
    const discount = await this.adminGetById(id);
    await this.discountRepo.remove(discount);
  }

  // ─── VALIDATE + APPLY (used by checkout) ─────────────────────────────────

  /**
   * Validates a code against a subtotal.
   * Returns the discount result WITHOUT incrementing usedCount.
   * Call incrementUsage() after the order is committed.
   */
  async validateCode(code: string, subtotal: number): Promise<DiscountResult> {
    const normalized = code.trim().toUpperCase();
    const discount = await this.discountRepo.findOne({ where: { code: normalized } });

    this.logger.log(`validateCode: code="${normalized}" subtotal=${subtotal} type=${typeof subtotal}`);
    this.logger.log(`found: ${JSON.stringify(discount)}`);

    if (!discount || !discount.isActive) {
      throw new BadRequestException(`Discount code "${normalized}" is invalid or inactive`);
    }

    // Date validation
    const today = new Date().toISOString().slice(0, 10);
    if (discount.startDate && today < discount.startDate) {
      throw new BadRequestException(`Discount code "${normalized}" is not yet active`);
    }
    if (discount.endDate && today > discount.endDate) {
      throw new BadRequestException(`Discount code "${normalized}" has expired`);
    }

    // Usage limit
    if (
      discount.usageLimit !== null &&
      discount.usedCount >= discount.usageLimit
    ) {
      throw new BadRequestException(`Discount code "${normalized}" has reached its usage limit`);
    }

    // Minimum order
    const sub = Number(subtotal);
    if (Number(discount.minOrder) > 0 && sub < Number(discount.minOrder)) {
      throw new BadRequestException(
        `Minimum order of $${Number(discount.minOrder).toFixed(2)} required for this code`,
      );
    }

    // Calculate discount
    let discountAmount = 0;
    let freeShipping   = false;

    if (discount.type === 'percent') {
      discountAmount = (sub * Number(discount.value)) / 100;
    } else if (discount.type === 'fixed') {
      discountAmount = Math.min(Number(discount.value), sub);
    } else if (discount.type === 'free_shipping') {
      freeShipping   = true;
      discountAmount = 0;
    }

    discountAmount = Math.round(discountAmount * 100) / 100;
    const finalTotal = Math.max(0, sub - discountAmount);

    return {
      discountId:     discount.id,
      code:           discount.code,
      type:           discount.type,
      discountAmount,
      finalTotal,
      freeShipping,
    };
  }

  /**
   * Increment usedCount after a successful order commit.
   * Call this inside the checkout transaction.
   */
  async incrementUsage(discountId: string): Promise<void> {
    await this.discountRepo.increment({ id: discountId }, 'usedCount', 1);
  }
}