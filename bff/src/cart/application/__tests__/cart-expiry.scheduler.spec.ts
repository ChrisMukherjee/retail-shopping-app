import { CartExpiryScheduler } from '../cart-expiry.scheduler';
import { Cart } from '../../domain/cart.entity';

function makeCart(minutesAgo: number): Cart {
  const cart = new Cart(`cart_${Math.random()}`);
  cart.lastActivityAt = new Date(Date.now() - minutesAgo * 60 * 1000);
  return cart;
}

describe('CartExpiryScheduler', () => {
  it('expires carts inactive for more than 2 minutes', async () => {
    const staleCart = makeCart(3);
    const freshCart = makeCart(1);

    const cartRepo = {
      findActiveBefore: jest.fn().mockResolvedValue([staleCart]),
      save: jest.fn().mockResolvedValue(undefined),
      findById: jest.fn(),
      delete: jest.fn(),
    };
    const reservationService = {
      releaseAll: jest.fn().mockResolvedValue(undefined),
    };

    const scheduler = new CartExpiryScheduler(cartRepo as any, reservationService as any);
    await scheduler.expireInactiveCarts();

    expect(reservationService.releaseAll).toHaveBeenCalledWith(staleCart);
    expect(staleCart.status).toBe('expired');
    expect(freshCart.status).toBe('active');
  });

  it('does nothing when no stale carts exist', async () => {
    const cartRepo = {
      findActiveBefore: jest.fn().mockResolvedValue([]),
      save: jest.fn(),
      findById: jest.fn(),
      delete: jest.fn(),
    };
    const reservationService = { releaseAll: jest.fn() };

    const scheduler = new CartExpiryScheduler(cartRepo as any, reservationService as any);
    await scheduler.expireInactiveCarts();

    expect(reservationService.releaseAll).not.toHaveBeenCalled();
  });
});
