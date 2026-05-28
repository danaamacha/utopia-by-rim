// backend/src/discounts/discounts.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DiscountCode } from './discount-code.entity';
import { DiscountsService } from './discounts.service';
import { DiscountsController } from './discounts.controller';

@Module({
  imports: [TypeOrmModule.forFeature([DiscountCode])],
  providers: [DiscountsService],
  controllers: [DiscountsController],
  exports: [DiscountsService], // exported so OrdersModule can use it
})
export class DiscountsModule {}