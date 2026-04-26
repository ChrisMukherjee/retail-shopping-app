import { Module, forwardRef } from '@nestjs/common';
import { CheckoutService } from './application/checkout.service';
import { CatalogueModule } from '../catalogue/catalogue.module';
import { CartModule } from '../cart/cart.module';

// forwardRef resolves the circular dependency: CartModule imports CheckoutModule
// (CartController delegates /carts/:id/checkout to CheckoutService), while
// CheckoutModule imports CartModule (CheckoutService needs CART_REPOSITORY and
// ReservationService). NestJS requires forwardRef on at least one side to break the cycle.
@Module({
  imports: [CatalogueModule, forwardRef(() => CartModule)],
  providers: [CheckoutService],
  exports: [CheckoutService],
})
export class CheckoutModule {}
