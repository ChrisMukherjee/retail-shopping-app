import { Module } from '@nestjs/common';
import { CartController } from './presentation/cart.controller';
import { CartService } from './application/cart.service';
import { ReservationService } from './application/reservation.service';
import { InMemoryCartRepository } from './infrastructure/in-memory-cart.repository';
import { CART_REPOSITORY } from './domain/repositories/cart.repository.interface';
import { CatalogueModule } from '../catalogue/catalogue.module';
@Module({
  imports: [CatalogueModule],
  controllers: [CartController],
  providers: [
    CartService,
    ReservationService,
    { provide: CART_REPOSITORY, useClass: InMemoryCartRepository },
  ],
  exports: [CART_REPOSITORY, ReservationService],
})
export class CartModule {}
