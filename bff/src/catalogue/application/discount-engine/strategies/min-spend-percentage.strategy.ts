import { Discount } from '../../../domain/discount.entity';
import { CartSummary, DiscountResult, DiscountStrategy } from '../discount-strategy.interface';

export class MinSpendPercentageStrategy implements DiscountStrategy {
  readonly type = 'MIN_SPEND_PERCENTAGE';

  isEligible(cart: CartSummary, discount: Discount): boolean {
    return cart.subtotal >= (discount.config.threshold ?? Infinity);
  }

  calculate(cart: CartSummary, discount: Discount): DiscountResult {
    const saving = parseFloat((cart.subtotal * (discount.config.rate ?? 0)).toFixed(2));
    return { discountId: discount.id, description: discount.description, saving };
  }
}
