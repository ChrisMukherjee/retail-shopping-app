import { Injectable, Inject } from '@nestjs/common';
import type { IDiscountRepository } from '../../domain/repositories/discount.repository.interface';
import { DISCOUNT_REPOSITORY } from '../../domain/repositories/discount.repository.interface';
import { CartSummary, DiscountResult, DiscountStrategy } from './discount-strategy.interface';
import { PercentageCartStrategy } from './strategies/percentage-cart.strategy';
import { BuyNGetOneFreeStrategy } from './strategies/buy-n-get-one-free.strategy';
import { MinSpendPercentageStrategy } from './strategies/min-spend-percentage.strategy';
import { CategoryPercentageStrategy } from './strategies/category-percentage.strategy';
import { FixedAmountOffStrategy } from './strategies/fixed-amount-off.strategy';

@Injectable()
export class DiscountEngineService {
  private readonly strategies: DiscountStrategy[] = [
    new PercentageCartStrategy(),
    new BuyNGetOneFreeStrategy(),
    new MinSpendPercentageStrategy(),
    new CategoryPercentageStrategy(),
    new FixedAmountOffStrategy(),
  ];

  constructor(
    @Inject(DISCOUNT_REPOSITORY)
    private readonly discountRepo: IDiscountRepository,
  ) {}

  async getBestDiscount(cart: CartSummary): Promise<DiscountResult | null> {
    if (cart.items.length === 0) return null;

    const activeDiscounts = await this.discountRepo.findActive();
    const results: DiscountResult[] = [];

    for (const discount of activeDiscounts) {
      const strategy = this.strategies.find((s) => s.type === discount.type);
      if (!strategy) continue;
      if (!strategy.isEligible(cart, discount)) continue;
      const result = strategy.calculate(cart, discount);
      if (result.saving > 0) results.push(result);
    }

    if (results.length === 0) return null;
    return results.reduce((best, r) => (r.saving > best.saving ? r : best));
  }
}
