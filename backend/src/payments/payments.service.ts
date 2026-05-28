import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from './payment.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentStatusDto } from './dto/update-payment-status.dto';
import { Order } from '../orders/order.entity';
import { AdminPaymentsQueryDto } from './dto/admin-payments-query.dto';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
  ) {}

  async createPayment(
    userId: string,
    orderId: string,
    dto: CreatePaymentDto,
  ): Promise<Payment> {
    const order = await this.orderRepo.findOne({
      where: { id: orderId },
      relations: ['user'],
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.user && order.user.id !== userId) {
      throw new ForbiddenException('You cannot pay for this order');
    }

    if (order.paymentStatus === 'paid') {
      throw new BadRequestException('Order is already paid');
    }

    const existingActive = await this.paymentRepo.findOne({
      where: {
        order: { id: orderId },
        status: 'pending',
      },
    });

    if (existingActive) {
      throw new BadRequestException('A pending payment already exists for this order');
    }

    const payment = this.paymentRepo.create({
      order,
      amount: Number(order.total),
      currency: order.currency,
      method: dto.paymentMethod,
      status: 'pending',
    });

    const saved = await this.paymentRepo.save(payment);
    return saved;
  }

  async updatePaymentStatus(
    paymentId: string,
    dto: UpdatePaymentStatusDto,
  ): Promise<Payment> {
    const payment = await this.paymentRepo.findOne({
      where: { id: paymentId },
      relations: ['order'],
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    payment.status = dto.status;
    await this.paymentRepo.save(payment);

    if (dto.status === 'paid') {
      await this.orderRepo.update(
        { id: payment.order.id },
        {
          paymentStatus: 'paid',
          status: 'confirmed',
        },
      );
    } else if (dto.status === 'failed') {
      await this.orderRepo.update(
        { id: payment.order.id },
        {
          paymentStatus: 'failed',
          status: 'pending',
        },
      );
    }

    return payment;
  }

  async getPaymentByIdForAdmin(id: string): Promise<Payment> {
    const payment = await this.paymentRepo.findOne({
      where: { id },
      relations: ['order', 'order.user'],
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    return payment;
  }

  async getPaymentsForOrder(userId: string, orderId: string): Promise<Payment[]> {
    const order = await this.orderRepo.findOne({
      where: { id: orderId },
      relations: ['user'],
    });
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    if (order.user && order.user.id !== userId) {
      throw new ForbiddenException('You cannot view payments for this order');
    }

    return this.paymentRepo.find({
      where: { order: { id: orderId } },
      order: { createdAt: 'DESC' },
    });
  }

  async adminListPayments(query: AdminPaymentsQueryDto): Promise<Payment[]> {
    const qb = this.paymentRepo
      .createQueryBuilder('payment')
      .leftJoinAndSelect('payment.order', 'order')
      .leftJoinAndSelect('order.user', 'user')
      .orderBy('payment.createdAt', 'DESC');

    if (query.status) {
      qb.andWhere('payment.status = :status', { status: query.status });
    }

    if (query.method) {
      qb.andWhere('payment.method = :method', { method: query.method });
    }

    if (query.dateFrom) {
      qb.andWhere('payment.createdAt >= :dateFrom', { dateFrom: query.dateFrom });
    }

    if (query.dateTo) {
      qb.andWhere('payment.createdAt <= :dateTo', { dateTo: query.dateTo });
    }

    return qb.getMany();
  }
}

