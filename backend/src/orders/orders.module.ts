// backend/src/orders/orders.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { Order } from './order.entity';
import { OrderItem } from './order-item.entity';
import { Cart } from '../cart/cart.entity';
import { CartItem } from '../cart/cart-item.entity';
import { Product } from '../products/product.entity';
import { OrderStatusHistory } from './order-status-history.entity';
import { User } from '../users/user.entity';
import { MailModule } from '../mail/mail.module';
import { NotificationLog } from '../notifications/notification-log.entity';
import { DiscountsModule } from '../Disscount/discounts.module'; // ✅ ADD THIS

@Module({
  imports: [
    MailModule,
    DiscountsModule, // ✅ ADD THIS
    TypeOrmModule.forFeature([
      Order,
      OrderItem,
      OrderStatusHistory,
      Cart,
      CartItem,
      Product,
      User,
      NotificationLog,
    ]),
  ],
  providers: [OrdersService],
  controllers: [OrdersController],
})
export class OrdersModule {}