// backend/src/orders/orders.service.ts
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { validate as isUuid } from 'uuid';

import { Order } from './order.entity';
import { OrderItem } from './order-item.entity';
import { OrderStatusHistory } from './order-status-history.entity';
import type { OrderStatus } from './order.entity';

import { Cart } from '../cart/cart.entity';
import { CartItem } from '../cart/cart-item.entity';
import { Product } from '../products/product.entity';
import { User } from '../users/user.entity';

import { CheckoutDto } from './dto/checkout.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { MyOrdersQueryDto } from './dto/my-orders-query.dto';
import { AdminOrdersQueryDto } from './dto/admin-orders-query.dto';
import { CancelOrderDto } from './dto/cancel-order.dto';

import { MailService } from '../mail/mail.service';
import { NotificationLog } from '../notifications/notification-log.entity';
import { DiscountsService } from '../Disscount/discounts.service';

type EmailItem = { name: string; qty: number; price: number };

// ─── Safe pagination helper ────────────────────────────────────────────────
function parsePage(raw: string | undefined, defaultVal: number, max?: number): number {
  const n = Math.max(parseInt(raw ?? String(defaultVal), 10), 1);
  return max ? Math.min(n, max) : n;
}

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepo: Repository<OrderItem>,
    @InjectRepository(Cart)
    private readonly cartRepo: Repository<Cart>,
    @InjectRepository(CartItem)
    private readonly cartItemRepo: Repository<CartItem>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(OrderStatusHistory)
    private readonly orderStatusHistoryRepo: Repository<OrderStatusHistory>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(NotificationLog)
    private readonly notificationLogRepo: Repository<NotificationLog>,
    private readonly dataSource: DataSource,
    private readonly mailService: MailService,
    private readonly discountsService: DiscountsService,
  ) {}

  // ─── CHECKOUT ─────────────────────────────────────────────────────────────

  async checkout(userId: string, dto: CheckoutDto) {
    if (!userId || !isUuid(userId)) {
      throw new UnauthorizedException('A valid authenticated user is required to checkout');
    }

    if (!dto.email) {
      throw new BadRequestException('Email is required');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    let savedOrderId: string | null = null;

    try {
      const manager = queryRunner.manager;

      // Load cart with items + products inside the transaction
      const cart = await manager.findOne(Cart, {
        where: { user: { id: userId } },
        relations: ['items', 'items.product'],
        order: { items: { createdAt: 'ASC' } },
      });

      if (!cart || !cart.items?.length) {
        throw new BadRequestException('Cart is empty or not found');
      }

      // Re-fetch products for fresh stock data
      const productIds = cart.items.map((i) => i.product.id);
      const freshProducts = await manager.findBy(Product, { id: In(productIds) });
      const productMap = new Map(freshProducts.map((p) => [p.id, p]));

      let subtotal = 0;
      const itemsToInsert: Partial<OrderItem>[] = [];

      for (const item of cart.items) {
        const product = productMap.get(item.product.id);

        if (!product) {
          throw new BadRequestException(`Product "${item.product.id}" no longer exists`);
        }

        if (!product.isActive) {
          throw new BadRequestException(`Product "${product.name}" is currently unavailable`);
        }

        if (product.stockQuantity < item.quantity) {
          throw new BadRequestException(
            `Insufficient stock for "${product.name}": requested ${item.quantity}, available ${product.stockQuantity}`,
          );
        }

        const unitPrice = Number(product.salePrice ?? product.price ?? 0);
        const lineTotal = unitPrice * item.quantity;
        subtotal += lineTotal;

        itemsToInsert.push({
          productId: product.id,
          product,
          productName: product.name,
          quantity: item.quantity,
          unitPrice,
          lineTotal,
        });
      }

      // ─── Apply discount code if provided ──────────────────────────────────
      let discountAmount = 0;
      let discountId: string | null = null;
      let appliedCode: string | null = null;

      if (dto.discountCode?.trim()) {
        const result = await this.discountsService.validateCode(
          dto.discountCode.trim(),
          subtotal,
        );
        discountAmount = result.discountAmount;
        discountId     = result.discountId;
        appliedCode    = result.code;
      }

      const total = Math.max(0, subtotal - discountAmount);

      // Create and save the order
      const newOrder = manager.create(Order, {
        user:          { id: userId } as unknown as User,
        subtotal,
        total,
        currency:      freshProducts[0]?.currency ?? 'USD',
        status:        'pending' as OrderStatus,
        paymentStatus: 'unpaid',
        paymentMethod: dto.paymentMethod ?? 'COD',
        email:         dto.email,
        fullName:      dto.fullName     ?? undefined,
        phone:         dto.phone        ?? undefined,
        addressLine1:  dto.addressLine1 ?? undefined,
        addressLine2:  dto.addressLine2 ?? undefined,
        city:          dto.city         ?? undefined,
        state:         dto.state        ?? undefined,
        country:       dto.country      ?? undefined,
        postalCode:    dto.postalCode   ?? undefined,
        discountCode:   appliedCode     ?? undefined,
        discountAmount: discountAmount > 0 ? discountAmount : undefined,
      });

      const savedOrder = await manager.save(Order, newOrder);
      savedOrderId = savedOrder.id;

      // Bulk-insert order items
      const orderItemEntities = itemsToInsert.map((oi) =>
        manager.create(OrderItem, { ...oi, order: savedOrder }),
      );
      await manager.save(OrderItem, orderItemEntities);

      // Decrement stock
      for (const item of cart.items) {
        await manager.decrement(Product, { id: item.product.id }, 'stockQuantity', item.quantity);
      }

      // Clear cart
      await manager.delete(CartItem, { cart: { id: cart.id } });

      // Increment discount usage count
      if (discountId) {
        await this.discountsService.incrementUsage(discountId);
      }

      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }

    // Reload after commit (outside transaction)
    const loadedOrder = await this.orderRepo.findOne({
      where: { id: savedOrderId! },
      relations: ['items', 'items.product'],
    });

    if (!loadedOrder) {
      throw new InternalServerErrorException('Order was created but could not be retrieved');
    }

    // Send confirmation email (non-fatal, outside transaction)
    const emailItems: EmailItem[] = loadedOrder.items.map((i) => ({
      name: i.productName,
      qty: i.quantity,
      price: Number(i.unitPrice),
    }));

    const notification = await this.sendConfirmationEmail({
      to: dto.email,
      fullName: dto.fullName ?? 'Customer',
      orderId: loadedOrder.id,
      total: Number(loadedOrder.total),
      items: emailItems,
      userId,
    });

    return {
      order: this.serializeOrder(loadedOrder),
      notification,
    };
  }

  // ─── GET USER ORDERS ───────────────────────────────────────────────────────

  async getUserOrders(userId: string, query: MyOrdersQueryDto) {
    if (!userId || !isUuid(userId)) {
      throw new UnauthorizedException('Valid user ID required');
    }

    const page  = parsePage(query.page, 1);
    const limit = parsePage(query.limit, 10, 50);
    const skip  = (page - 1) * limit;
    const sort  = query.sort === 'asc' ? 'ASC' : 'DESC';

    const qb = this.orderRepo
      .createQueryBuilder('ord')
      .leftJoinAndSelect('ord.items', 'items')
      .leftJoinAndSelect('items.product', 'product')
      .where('CAST(ord.userId AS text) = :userId', { userId })
      .orderBy('ord.createdAt', sort)
      .addOrderBy('items.createdAt', 'ASC')
      .skip(skip)
      .take(limit);

    if (query.status) {
      qb.andWhere('ord.status = :status', { status: query.status });
    }

    if (query.dateFrom) {
      qb.andWhere('ord.createdAt >= :dateFrom', { dateFrom: new Date(query.dateFrom) });
    }

    if (query.dateTo) {
      qb.andWhere('ord.createdAt <= :dateTo', { dateTo: new Date(query.dateTo) });
    }

    const [data, total] = await qb.getManyAndCount();

    return {
      data: data.map((o) => this.serializeOrder(o)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ─── GET SINGLE ORDER FOR USER ─────────────────────────────────────────────

  async getOrderDetailForUser(orderId: string, userId: string): Promise<object> {
    if (!userId || !isUuid(userId)) {
      throw new UnauthorizedException('Valid user ID required');
    }

    if (!orderId || !isUuid(orderId)) {
      throw new BadRequestException('Valid order ID required');
    }

    const order = await this.orderRepo.findOne({
      where: { id: orderId },
      relations: ['items', 'items.product'],
    });

    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }

    const owner = await this.orderRepo
      .createQueryBuilder('ord')
      .select('ord.userId')
      .where('ord.id = :orderId', { orderId })
      .getRawOne<{ ord_userId: string }>();

    if (!owner || owner.ord_userId !== userId) {
      throw new ForbiddenException('You do not have access to this order');
    }

    const history = await this.orderStatusHistoryRepo.find({
      where: { order: { id: orderId } },
      order: { createdAt: 'DESC' },
    });

    return {
      ...this.serializeOrder(order),
      statusHistory: history,
    };
  }

  // ─── ADMIN LIST ────────────────────────────────────────────────────────────

  async adminListOrders(query: AdminOrdersQueryDto) {
    const page  = parsePage(query.page, 1);
    const limit = parsePage(query.limit, 10, 100);
    const skip  = (page - 1) * limit;
    const sort  = query.sort === 'asc' ? 'ASC' : 'DESC';

    const qb = this.orderRepo
      .createQueryBuilder('ord')
      .leftJoinAndSelect('ord.items', 'items')
      .leftJoinAndSelect('ord.user', 'user')
      .orderBy('ord.createdAt', sort)
      .addOrderBy('items.createdAt', 'ASC')
      .skip(skip)
      .take(limit);

    if (query.status) {
      qb.andWhere('ord.status = :status', { status: query.status });
    }

    if (query.paymentStatus) {
      qb.andWhere('ord.paymentStatus = :paymentStatus', { paymentStatus: query.paymentStatus });
    }

    if (query.userId) {
      qb.andWhere('CAST(ord.userId AS text) = :userId', { userId: query.userId });
    }

    if (query.search?.trim()) {
      const search = `%${query.search.trim()}%`;
      qb.andWhere(
        `(ord.id::text ILIKE :search
          OR ord.email ILIKE :search
          OR ord.fullName ILIKE :search
          OR user.email ILIKE :search)`,
        { search },
      );
    }

    if (query.dateFrom) {
      qb.andWhere('ord.createdAt >= :dateFrom', { dateFrom: new Date(query.dateFrom) });
    }

    if (query.dateTo) {
      qb.andWhere('ord.createdAt <= :dateTo', { dateTo: new Date(query.dateTo) });
    }

    const [data, total] = await qb.getManyAndCount();

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  // ─── ADMIN GET BY ID ───────────────────────────────────────────────────────

  async adminGetOrderById(id: string): Promise<object> {
    if (!id || !isUuid(id)) {
      throw new BadRequestException('Valid order ID required');
    }

    const order = await this.orderRepo.findOne({
      where: { id },
      relations: ['items', 'items.product', 'user', 'payments'],
      order: {
        items:    { createdAt: 'ASC' },
        payments: { createdAt: 'DESC' },
      },
    });

    if (!order) throw new NotFoundException('Order not found');

    const history = await this.orderStatusHistoryRepo.find({
      where: { order: { id } },
      order: { createdAt: 'DESC' },
    });

    return { ...order, statusHistory: history };
  }

  // ─── ADMIN UPDATE STATUS ───────────────────────────────────────────────────

  async adminUpdateStatus(
    orderId: string,
    dto: UpdateOrderStatusDto,
    adminUserId: string,
  ): Promise<Order> {
    if (!orderId || !isUuid(orderId)) {
      throw new BadRequestException('Valid order ID required');
    }

    const order = await this.orderRepo.findOne({
      where: { id: orderId },
      relations: ['items', 'user', 'payments'],
    });

    if (!order) throw new NotFoundException('Order not found');

    const fromStatus = order.status;

    if (dto.status) {
      this.assertTransition(
        order.status,
        dto.status,
        'admin',
        order.paymentMethod,
        order.paymentStatus,
      );
      order.status = dto.status;
    }

    if (dto.paymentStatus) {
      order.paymentStatus = dto.paymentStatus;
    }

    await this.orderRepo.save(order);

    if (dto.status) {
      await this.logHistory(order.id, fromStatus, dto.status, adminUserId, dto.note);
    }

    return order;
  }

  // ─── CUSTOMER CANCEL ──────────────────────────────────────────────────────

  async customerCancelOrder(
    orderId: string,
    userId: string,
    dto: CancelOrderDto,
  ): Promise<Order> {
    if (!orderId || !isUuid(orderId)) {
      throw new BadRequestException('Valid order ID required');
    }

    if (!userId || !isUuid(userId)) {
      throw new UnauthorizedException('Valid user ID required');
    }

    const order = await this.orderRepo.findOne({
      where: { id: orderId },
      relations: ['user', 'payments'],
    });

    if (!order) throw new NotFoundException('Order not found');

    const ownerId = (order.user as User | undefined)?.id ?? (order as any).userId;
    if (!ownerId || ownerId !== userId) {
      throw new ForbiddenException('You cannot cancel this order');
    }

    this.assertTransition(
      order.status,
      'cancelled',
      'customer',
      order.paymentMethod,
      order.paymentStatus,
    );

    const fromStatus = order.status;
    order.status = 'cancelled';
    await this.orderRepo.save(order);
    await this.logHistory(order.id, fromStatus, 'cancelled', userId, dto.note);

    return order;
  }

  // ─── NOTIFICATION LOGS ────────────────────────────────────────────────────

  async getNotificationLogs(orderId?: string): Promise<NotificationLog[]> {
    const qb = this.notificationLogRepo
      .createQueryBuilder('log')
      .orderBy('log.createdAt', 'DESC');

    if (orderId) {
      qb.where('log.orderId = :orderId', { orderId });
    }

    return qb.getMany();
  }

  // ─── PRIVATE HELPERS ──────────────────────────────────────────────────────

  private serializeOrder(order: Order) {
    const { user, ...rest } = order as Order & { user?: User };
    return {
      ...rest,
      user: user
        ? { id: user.id, email: user.email, fullName: (user as any).fullName ?? null }
        : undefined,
    };
  }

  private async sendConfirmationEmail(params: {
    to: string;
    fullName: string;
    orderId: string;
    total: number;
    items: EmailItem[];
    userId: string;
  }) {
    const result = {
      emailAttempted: true,
      emailSent: false,
      errorMessage: undefined as string | undefined,
    };

    try {
      await this.mailService.sendOrderConfirmation({
        to: params.to,
        fullName: params.fullName,
        orderId: params.orderId,
        total: params.total,
        items: params.items,
      });
      result.emailSent = true;
    } catch (err) {
      result.emailSent = false;
      result.errorMessage = err instanceof Error ? err.message : 'Unknown email error';
      this.logger.warn(`Order ${params.orderId} — email failed: ${result.errorMessage}`);
    }

    await this.notificationLogRepo.save(
      this.notificationLogRepo.create({
        orderId: params.orderId,
        userId: params.userId,
        type: 'email',
        status: result.emailSent ? 'sent' : 'failed',
        errorMessage: result.errorMessage ?? null,
      }),
    );

    return result;
  }

  private assertTransition(
    current: OrderStatus,
    target: OrderStatus,
    actor: 'admin' | 'customer',
    paymentMethod: 'COD' | 'MANUAL',
    paymentStatus: string,
  ) {
    if (current === target) {
      throw new BadRequestException(`Order is already "${current}"`);
    }

    if (current === 'delivered' || current === 'cancelled') {
      throw new BadRequestException(`Cannot change status of a "${current}" order`);
    }

    if (actor === 'customer') {
      if (target !== 'cancelled') {
        throw new BadRequestException('Customers can only cancel orders');
      }
      if (current !== 'pending') {
        throw new BadRequestException('Customers can only cancel orders with status "pending"');
      }
    } else {
      const statusOrder: OrderStatus[] = [
        'pending', 'confirmed', 'processing', 'shipped', 'delivered',
      ];

      if (target !== 'cancelled') {
        const currentIdx = statusOrder.indexOf(current);
        const targetIdx  = statusOrder.indexOf(target);

        if (targetIdx === -1 || targetIdx <= currentIdx) {
          throw new BadRequestException(
            `Transition from "${current}" to "${target}" is not allowed`,
          );
        }
      }
    }

    if (
      ['processing', 'shipped', 'delivered'].includes(target) &&
      paymentMethod === 'MANUAL' &&
      paymentStatus !== 'paid'
    ) {
      throw new BadRequestException(
        'Payment must be marked as paid before advancing this order',
      );
    }
  }

  private async logHistory(
    orderId: string,
    fromStatus: string,
    toStatus: string,
    changedByUserId: string | null,
    note?: string,
  ) {
    await this.orderStatusHistoryRepo.save(
      this.orderStatusHistoryRepo.create({
        order: { id: orderId } as Order,
        fromStatus,
        toStatus,
        changedByUserId,
        note: note ?? null,
      }),
    );
  }
}