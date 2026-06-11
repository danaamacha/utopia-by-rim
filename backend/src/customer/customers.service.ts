// backend/src/customer/customers.service.ts
import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { Order } from '../orders/order.entity';
import { AdminCustomersQueryDto } from './dto/admin-customers-query.dto';

function parsePage(raw: string | undefined, defaultVal: number, max?: number): number {
  const n = Math.max(parseInt(raw ?? String(defaultVal), 10), 1);
  return max ? Math.min(n, max) : n;
}

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,

    private readonly dataSource: DataSource,
  ) {}

  // ─── ADMIN: list customers (only users with at least 1 order) ─────────────

  async adminListCustomers(query: AdminCustomersQueryDto) {
    const page  = parsePage(query.page, 1);
    const limit = parsePage(query.limit, 50, 100);
    const skip  = (page - 1) * limit;
    const sort  = query.sort === 'asc' ? 'ASC' : 'DESC';

    /*
     * Single query: JOIN users → orders, GROUP BY user,
     * HAVING COUNT(orders) > 0 ensures only buyers appear.
     * Sorted by most recent order date by default.
     */
    const qb = this.dataSource
      .createQueryBuilder()
      .select('usr.id',          'id')
      .addSelect('usr.email',    'email')
      .addSelect('usr.name',     'name')
      .addSelect('usr.role',     'role')
      .addSelect('usr.createdAt','createdAt')
      .addSelect('COUNT(ord.id)',                    'totalOrders')
      .addSelect('SUM(CAST(ord.total AS numeric))',  'totalSpent')
      .addSelect('MAX(ord.createdAt)',               'lastOrderAt')
      .from(User, 'usr')
      .innerJoin(Order, 'ord', 'ord.userId = usr.id')
      .groupBy('usr.id')
      .having('COUNT(ord.id) > 0')
      .orderBy('MAX(ord.createdAt)', sort)
      .offset(skip)
      .limit(limit);

    if (query.search?.trim()) {
      const search = `%${query.search.trim()}%`;
      qb.andWhere(
        '(usr.name ILIKE :search OR usr.email ILIKE :search)',
        { search },
      );
    }

    if (query.role) {
      qb.andWhere('usr.role = :role', { role: query.role });
    }

    // Count query (no pagination)
    const countQb = this.dataSource
      .createQueryBuilder()
      .select('COUNT(DISTINCT usr.id)', 'count')
      .from(User, 'usr')
      .innerJoin(Order, 'ord', 'ord.userId = usr.id');

    if (query.search?.trim()) {
      const search = `%${query.search.trim()}%`;
      countQb.where(
        '(usr.name ILIKE :search OR usr.email ILIKE :search)',
        { search },
      );
    }
    if (query.role) {
      countQb.andWhere('usr.role = :role', { role: query.role });
    }

    const [rows, countRow] = await Promise.all([
      qb.getRawMany(),
      countQb.getRawOne<{ count: string }>(),
    ]);

    const total = parseInt(countRow?.count ?? '0', 10);

    const data = rows.map((r) => ({
      id:          r.id,
      email:       r.email,
      name:        r.name,
      role:        r.role,
      createdAt:   r.createdAt,
      totalOrders: parseInt(r.totalOrders, 10),
      totalSpent:  parseFloat(r.totalSpent ?? '0'),
      lastOrderAt: r.lastOrderAt ?? null,
    }));

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  // ─── ADMIN: get single customer with orders ───────────────────────────────

  async adminGetCustomerById(id: string) {
    const user = await this.userRepo.findOne({
      where: { id },
      select: ['id', 'email', 'name', 'role', 'createdAt', 'updatedAt'],
    });

    if (!user) throw new NotFoundException(`Customer ${id} not found`);

    const orders = await this.orderRepo.find({
      where: { user: { id } },
      relations: ['items'],
      order: { createdAt: 'DESC' },
      select: {
        id: true,
        status: true,
        paymentStatus: true,
        paymentMethod: true,
        total: true,
        currency: true,
        createdAt: true,
      },
    });

    if (!orders.length) {
      throw new NotFoundException(`No orders found for user ${id}`);
    }

    const totalSpent = orders.reduce((sum, o) => sum + Number(o.total ?? 0), 0);

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      totalOrders: orders.length,
      totalSpent,
      lastOrderAt: orders[0]?.createdAt ?? null,
      orders: orders.map((o) => ({
        id: o.id,
        status: o.status,
        paymentStatus: o.paymentStatus,
        paymentMethod: o.paymentMethod,
        total: Number(o.total),
        currency: o.currency,
        createdAt: o.createdAt,
        itemCount: o.items?.length ?? 0,
      })),
    };
  }
}