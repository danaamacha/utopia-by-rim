import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cart } from './cart.entity';
import { CartItem } from './cart-item.entity';
import { Product } from '../products/product.entity';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(Cart)
    private readonly cartRepo: Repository<Cart>,
    @InjectRepository(CartItem)
    private readonly cartItemRepo: Repository<CartItem>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
  ) {}

  async getOrCreateCart(userId: string): Promise<Cart> {
    let cart = await this.cartRepo.findOne({
      where: { user: { id: userId } },
      relations: ['items', 'items.product', 'items.product.images'],
    });

    if (!cart) {
      const newCart = this.cartRepo.create({
        user: { id: userId } as any,
      });
      const savedCart = await this.cartRepo.save(newCart);
      // Reload with relations
      cart = await this.cartRepo.findOne({
        where: { id: savedCart.id },
        relations: ['items', 'items.product', 'items.product.images'],
      });
      
      if (!cart) {
        throw new Error('Failed to create cart');
      }
    }

    return cart;
  }

  async getCart(userId: string): Promise<Cart> {
    const cart = await this.cartRepo.findOne({
      where: { user: { id: userId } },
      relations: ['items', 'items.product', 'items.product.images'],
      order: {
        items: {
          createdAt: 'ASC',
        },
      },
    });

    if (!cart) {
      return this.getOrCreateCart(userId);
    }

    return cart;
  }

  async addToCart(userId: string, dto: AddToCartDto): Promise<Cart> {
    // Verify product exists and is active
    const product = await this.productRepo.findOne({
      where: { id: dto.productId, isActive: true },
    });

    if (!product) {
      throw new NotFoundException('Product not found or not available');
    }

    // Check stock availability
    if (product.stockQuantity < dto.quantity) {
      throw new BadRequestException(
        `Insufficient stock. Available: ${product.stockQuantity}`,
      );
    }

    // Get or create cart
    const cart = await this.getOrCreateCart(userId);

    // Check if item already exists in cart
    const existingItem = await this.cartItemRepo.findOne({
      where: {
        cart: { id: cart.id },
        product: { id: dto.productId },
      },
    });

    if (existingItem) {
      // Update quantity
      const newQuantity = existingItem.quantity + dto.quantity;
      if (product.stockQuantity < newQuantity) {
        throw new BadRequestException(
          `Insufficient stock. Available: ${product.stockQuantity}, Requested: ${newQuantity}`,
        );
      }
      existingItem.quantity = newQuantity;
      existingItem.unitPrice = Number(product.price);
      await this.cartItemRepo.save(existingItem);
    } else {
      // Create new cart item
      const cartItem = this.cartItemRepo.create({
        cart,
        product,
        quantity: dto.quantity,
        unitPrice: Number(product.price),
      });
      await this.cartItemRepo.save(cartItem);
    }

    // Return updated cart
    return this.getCart(userId);
  }

  async updateCartItem(
    userId: string,
    itemId: string,
    dto: UpdateCartItemDto,
  ): Promise<Cart> {
    const cart = await this.getCart(userId);

    const item = await this.cartItemRepo.findOne({
      where: { id: itemId, cart: { id: cart.id } },
      relations: ['product'],
    });

    if (!item) {
      throw new NotFoundException('Cart item not found');
    }

    // Check stock availability
    if (item.product.stockQuantity < dto.quantity) {
      throw new BadRequestException(
        `Insufficient stock. Available: ${item.product.stockQuantity}`,
      );
    }

    item.quantity = dto.quantity;
    await this.cartItemRepo.save(item);

    return this.getCart(userId);
  }

  async removeCartItem(userId: string, itemId: string): Promise<Cart> {
    const cart = await this.getCart(userId);

    const item = await this.cartItemRepo.findOne({
      where: { id: itemId, cart: { id: cart.id } },
    });

    if (!item) {
      throw new NotFoundException('Cart item not found');
    }

    await this.cartItemRepo.remove(item);

    return this.getCart(userId);
  }

  async clearCart(userId: string): Promise<void> {
    const cart = await this.getCart(userId);
    await this.cartItemRepo.delete({ cart: { id: cart.id } });
  }
}

