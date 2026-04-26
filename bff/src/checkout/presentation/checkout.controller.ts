import { Controller, Post, Param } from '@nestjs/common';
import { CheckoutService } from '../application/checkout.service';

@Controller('carts')
export class CheckoutController {
  constructor(private readonly checkoutService: CheckoutService) {}

  @Post(':id/checkout')
  async checkout(@Param('id') id: string) {
    const data = await this.checkoutService.checkout(id);
    return { data };
  }
}
