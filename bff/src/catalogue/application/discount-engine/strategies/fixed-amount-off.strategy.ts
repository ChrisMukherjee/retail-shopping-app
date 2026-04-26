import { Discount } from '../../../domain/discount.entity';
import { CartSummary, DiscountResult, DiscountStrategy } from '../discount-strategy.interface';

export class FixedAmountOffStrategy implements DiscountStrategy {
  readonly type = 'FIXED_AMOUNT_OFF';

  isEligible(cart: CartSummary, discount: Discount): boolean {
    return cart.subtotal >= (discount.config.threshold ?? Infinity);
  }

  calculate(cart: CartSummary, discount: Discount): DiscountResult {
    const saving = parseFloat(Math.min(discount.config.amount ?? 0, cart.subtotal).toFixed(2));
    return { discountId: discount.id, description: discount.description, saving };
  }
}
