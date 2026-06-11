import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
  Request,
} from '@nestjs/common';
import { CartService } from './cart.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller()
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @UseGuards(JwtAuthGuard)
  @Get('cart')
  async getCart(@Request() req: any) {
    const userId = req.user.userId;
    return this.cartService.getCart(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('cart/items')
  async addToCart(@Request() req: any, @Body() dto: AddToCartDto) {
    const userId = req.user.userId;
    return this.cartService.addToCart(userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('cart/items/:id')
  async updateCartItem(
    @Request() req: any,
    @Param('id') itemId: string,
    @Body() dto: UpdateCartItemDto,
  ) {
    const userId = req.user.userId;
    return this.cartService.updateCartItem(userId, itemId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('cart/items/:id')
  async removeCartItem(@Request() req: any, @Param('id') itemId: string) {
    const userId = req.user.userId;
    return this.cartService.removeCartItem(userId, itemId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('cart')
  async clearCart(@Request() req: any) {
    const userId = req.user.userId;
    await this.cartService.clearCart(userId);
    return { success: true, message: 'Cart cleared' };
  }
}





