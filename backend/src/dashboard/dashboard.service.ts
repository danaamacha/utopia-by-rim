// backend/src/dashboard/dashboard.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../orders/order.entity';
import { Product } from '../products/product.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,

    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
  ) {}

  async getStats() {
    const now = new Date();

    // Today's date range (midnight → now)
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd   = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

    // ── Today's orders count ──────────────────────────────────────────────
    const todayOrders = await this.orderRepo
      .createQueryBuilder('ord')
      .where('ord.createdAt >= :start', { start: todayStart })
      .andWhere('ord.createdAt < :end',   { end: todayEnd })
      .andWhere("ord.status != 'cancelled'")
      .getCount();

    // ── Today's sales (sum of totals) ─────────────────────────────────────
    const todaySalesResult = await this.orderRepo
      .createQueryBuilder('ord')
      .select('SUM(CAST(ord.total AS numeric))', 'total')
      .where('ord.createdAt >= :start', { start: todayStart })
      .andWhere('ord.createdAt < :end',   { end: todayEnd })
      .andWhere("ord.status != 'cancelled'")
      .getRawOne<{ total: string }>();

    const todaySales = parseFloat(todaySalesResult?.total ?? '0');

    // ── Open orders (pending + confirmed + processing) ────────────────────
    const openOrders = await this.orderRepo
      .createQueryBuilder('ord')
      .where("ord.status IN ('pending', 'confirmed', 'processing')")
      .getCount();

    // ── Low stock products (stockQuantity <= 5 and isActive) ─────────────
    const lowStock = await this.productRepo
      .createQueryBuilder('p')
      .where('p.stockQuantity <= :threshold', { threshold: 5 })
      .andWhere('p.isActive = true')
      .getCount();

    // ── Recent orders (last 5) ────────────────────────────────────────────
    const recentOrders = await this.orderRepo
      .createQueryBuilder('ord')
      .leftJoin('ord.user', 'user')
      .select([
        'ord.id',
        'ord.createdAt',
        'ord.status',
        'ord.paymentStatus',
        'ord.total',
        'ord.currency',
        'ord.fullName',
        'ord.email',
        'user.id',
        'user.name',
        'user.email',
      ])
      .orderBy('ord.createdAt', 'DESC')
      .take(5)
      .getMany();

    return {
      todayOrders,
      todaySales,
      openOrders,
      lowStock,
      recentOrders: recentOrders.map((o) => ({
        id:            o.id,
        createdAt:     o.createdAt,
        status:        o.status,
        paymentStatus: o.paymentStatus,
        total:         Number(o.total),
        currency:      o.currency,
        customerName:  o.fullName ?? (o as any).user?.name ?? (o as any).user?.email ?? 'Customer',
      })),
    };
  }
}