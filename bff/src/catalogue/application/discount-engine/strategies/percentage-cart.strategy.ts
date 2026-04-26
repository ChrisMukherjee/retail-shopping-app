import { Discount } from '../../../domain/discount.entity';
import { CartSummary, DiscountResult, DiscountStrategy } from '../discount-strategy.interface';

export class PercentageCartStrategy implements DiscountStrategy {
  readonly type = 'PERCENTAGE_CART';

  isEligible(_cart: CartSummary, _discount: Discount): boolean {
    return true;
  }

  calculate(cart: CartSummary, discount: Discount): DiscountResult {
    const saving = parseFloat((cart.subtotal * (discount.config.rate ?? 0)).toFixed(2));
    return { discountId: discount.id, description: discount.description, saving };
  }
}
