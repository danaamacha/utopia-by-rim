import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CheckoutDto } from './dto/checkout.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { MyOrdersQueryDto } from './dto/my-orders-query.dto';
import { AdminOrdersQueryDto } from './dto/admin-orders-query.dto';
import { CancelOrderDto } from './dto/cancel-order.dto';

@Controller()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // ─── CUSTOMER ENDPOINTS ───────────────────────────────────────────────────

  @UseGuards(JwtAuthGuard)
  @Post('orders/checkout')
  checkout(@Request() req: any, @Body() dto: CheckoutDto) {
    const userId = req.user.userId;
    return this.ordersService.checkout(userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('orders/my')
  getMyOrders(@Request() req: any, @Query() query: MyOrdersQueryDto) {
    const userId = req.user.userId;
    return this.ordersService.getUserOrders(userId, query);
  }

  // ✅ IMPORTANT: this must stay BELOW 'orders/my' and BELOW 'orders/checkout'
  // so NestJS does not swallow static segments as :id
  @UseGuards(JwtAuthGuard)
  @Get('orders/:id')
  getMyOrderById(@Request() req: any, @Param('id') id: string) {
    const userId = req.user.userId;
    return this.ordersService.getOrderDetailForUser(id, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('orders/:id/cancel')
  cancelMyOrder(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: CancelOrderDto,
  ) {
    const userId = req.user.userId;
    return this.ordersService.customerCancelOrder(id, userId, dto);
  }

  // ─── ADMIN ENDPOINTS ──────────────────────────────────────────────────────
  // Routes: /api/admin/orders, /api/admin/orders/:id, etc.

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('owner', 'admin')
  @Get('admin/orders')
  listAll(@Query() query: AdminOrdersQueryDto) {
    return this.ordersService.adminListOrders(query);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('owner', 'admin')
  @Get('admin/orders/:id')
  getById(@Param('id') id: string) {
    return this.ordersService.adminGetOrderById(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('owner', 'admin')
  @Get('admin/notifications')
  getNotifications(@Query('orderId') orderId?: string) {
    return this.ordersService.getNotificationLogs(orderId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('owner', 'admin')
  @Patch('admin/orders/:id/status')
  updateStatus(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    const adminUserId = req.user.userId;
    return this.ordersService.adminUpdateStatus(id, dto, adminUserId);
  }
}