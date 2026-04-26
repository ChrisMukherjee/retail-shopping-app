import { Module } from '@nestjs/common';
import { CheckoutService } from './application/checkout.service';
import { CheckoutController } from './presentation/checkout.controller';
import { CatalogueModule } from '../catalogue/catalogue.module';
import { CartModule } from '../cart/cart.module';

@Module({
  imports: [CatalogueModule, CartModule],
  controllers: [CheckoutController],
  providers: [CheckoutService],
})
export class CheckoutModule {}
