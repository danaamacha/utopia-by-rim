// backend/src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { CategoriesModule } from './categories/categories.module';
import { ProductsModule } from './products/products.module';
import { MediaModule } from './media/media.module';
import { CartModule } from './cart/cart.module';
import { OrdersModule } from './orders/orders.module';
import { PaymentsModule } from './payments/payments.module';
import { ContactModule } from './contact/contact.module';
import { CustomersModule } from './customer/customers.module';
import { PagesModule } from './pages/pages.module';
import { DiscountsModule } from './Disscount/discounts.module'; // ✅ ADD
import { DashboardModule } from './dashboard/dashboard.module'; // ✅ ADD

import { UploadsModule } from '../uploads/uploads.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
    }),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const databaseUrl = config.get<string>('DATABASE_URL');
        return {
          type: 'postgres',
          url: databaseUrl,
          autoLoadEntities: true,
          synchronize: true, // dev only
          ssl: databaseUrl?.includes('supabase')
            ? { rejectUnauthorized: false }
            : false,
        };
      },
    }),

    UploadsModule,
    UsersModule,
    AuthModule,
    CategoriesModule,
    ProductsModule,
    MediaModule,
    CartModule,
    OrdersModule,
    PaymentsModule,
    ContactModule,
    CustomersModule,
    PagesModule,
    DiscountsModule, // ✅ ADD
    DashboardModule, // ✅ ADD
  ],
})
export class AppModule {}