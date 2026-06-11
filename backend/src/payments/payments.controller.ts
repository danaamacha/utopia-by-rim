import {
  Body,
  Controller,
  Param,
  Patch,
  Post,
  Get,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentStatusDto } from './dto/update-payment-status.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { AdminPaymentsQueryDto } from './dto/admin-payments-query.dto';

@Controller()
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @UseGuards(JwtAuthGuard)
  @Post('orders/:orderId/payments')
  createPayment(
    @Request() req: any,
    @Param('orderId') orderId: string,
    @Body() dto: CreatePaymentDto,
  ) {
    const userId = req.user.userId;
    return this.paymentsService.createPayment(userId, orderId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('orders/:orderId/payments')
  getPaymentsForOrder(@Request() req: any, @Param('orderId') orderId: string) {
    const userId = req.user.userId;
    return this.paymentsService.getPaymentsForOrder(userId, orderId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('owner', 'admin')
  @Patch('admin/payments/:id/status')
  adminUpdateStatus(
    @Param('id') id: string,
    @Body() dto: UpdatePaymentStatusDto,
  ) {
    return this.paymentsService.updatePaymentStatus(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('owner', 'admin')
  @Get('admin/payments')
  adminList(@Query() query: AdminPaymentsQueryDto) {
    return this.paymentsService.adminListPayments(query);
  }
}

