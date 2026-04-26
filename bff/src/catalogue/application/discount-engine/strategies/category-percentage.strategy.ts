import { Discount } from '../../../domain/discount.entity';
import { CartSummary, DiscountResult, DiscountStrategy } from '../discount-strategy.interface';

export class CategoryPercentageStrategy implements DiscountStrategy {
  readonly type = 'CATEGORY_PERCENTAGE';

  isEligible(cart: CartSummary, discount: Discount): boolean {
    return cart.items.some((i) => i.category === discount.config.category);
  }

  calculate(cart: CartSummary, discount: Discount): DiscountResult {
    const categoryTotal = cart.items
      .filter((i) => i.category === discount.config.category)
      .reduce((sum, i) => sum + i.lineTotal, 0);
    const saving = parseFloat((categoryTotal * (discount.config.rate ?? 0)).toFixed(2));
    return { discountId: discount.id, description: discount.description, saving };
  }
}
