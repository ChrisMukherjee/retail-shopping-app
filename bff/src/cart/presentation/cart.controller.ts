import { Controller, Post, Get, Patch, Delete, Param, Body, HttpCode } from '@nestjs/common';
import { CartService } from '../application/cart.service';
import { AddItemDto } from './dto/add-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { CheckoutService } from '../../checkout/application/checkout.service';

@Controller('carts')
export class CartController {
  constructor(
    private readonly cartService: CartService,
    private readonly checkoutService: CheckoutService,
  ) {}

  @Post()
  async createCart() {
    const data = await this.cartService.createCart();
    return { data };
  }

  @Get(':id')
  async getCart(@Param('id') id: string) {
    const data = await this.cartService.getCart(id);
    return { data };
  }

  @Post(':id/items')
  async addItem(@Param('id') id: string, @Body() dto: AddItemDto) {
    const data = await this.cartService.addItem(id, dto.productId, dto.quantity);
    return { data };
  }

  @Patch(':id/items/:productId')
  async updateItem(
    @Param('id') id: string,
    @Param('productId') productId: string,
    @Body() dto: UpdateItemDto,
  ) {
    const data = await this.cartService.updateItem(id, productId, dto.quantity);
    return { data };
  }

  @Delete(':id/items/:productId')
  async removeItem(@Param('id') id: string, @Param('productId') productId: string) {
    const data = await this.cartService.removeItem(id, productId);
    return { data };
  }

  @Delete(':id')
  @HttpCode(204)
  async abandonCart(@Param('id') id: string) {
    await this.cartService.abandonCart(id);
  }

  @Post(':id/checkout')
  async checkout(@Param('id') id: string) {
    const data = await this.checkoutService.checkout(id);
    return { data };
  }
}
