import { Module, forwardRef } from '@nestjs/common';
import { CheckoutService } from './application/checkout.service';
import { CatalogueModule } from '../catalogue/catalogue.module';
import { CartModule } from '../cart/cart.module';

@Module({
  imports: [CatalogueModule, forwardRef(() => CartModule)],
  providers: [CheckoutService],
  exports: [CheckoutService],
})
export class CheckoutModule {}
