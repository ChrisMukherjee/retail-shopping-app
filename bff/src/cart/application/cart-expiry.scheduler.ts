import { Injectable, Inject, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import type { ICartRepository } from '../domain/repositories/cart.repository.interface';
import { CART_REPOSITORY } from '../domain/repositories/cart.repository.interface';
import { ReservationService } from './reservation.service';

const TWO_MINUTES_MS = 2 * 60 * 1000;

@Injectable()
export class CartExpiryScheduler {
  private readonly logger = new Logger(CartExpiryScheduler.name);

  constructor(
    @Inject(CART_REPOSITORY) private readonly cartRepo: ICartRepository,
    private readonly reservationService: ReservationService,
  ) {}

  @Cron(CronExpression.EVERY_30_SECONDS)
  async expireInactiveCarts(): Promise<void> {
    const cutoff = new Date(Date.now() - TWO_MINUTES_MS);
    const staleCarts = await this.cartRepo.findActiveBefore(cutoff);

    for (const cart of staleCarts) {
      await this.reservationService.releaseAll(cart);
      cart.status = 'expired';
      await this.cartRepo.save(cart);
      this.logger.log(`Cart ${cart.id} expired — reservations released.`);
    }
  }
}
