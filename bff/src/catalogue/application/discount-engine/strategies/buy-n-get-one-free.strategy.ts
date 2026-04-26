import { Discount } from '../../../domain/discount.entity';
import { CartSummary, DiscountResult, DiscountStrategy } from '../discount-strategy.interface';

export class BuyNGetOneFreeStrategy implements DiscountStrategy {
  readonly type = 'BUY_N_GET_ONE_FREE';

  isEligible(cart: CartSummary, discount: Discount): boolean {
    const { productId, n } = discount.config;
    if (!productId || n === undefined) return false;
    const item = cart.items.find((i) => i.productId === productId);
    return !!item && item.quantity >= n + 1;
  }

  calculate(cart: CartSummary, discount: Discount): DiscountResult {
    const { productId, n } = discount.config;
    const item = cart.items.find((i) => i.productId === productId)!;
    const freeUnits = Math.floor(item.quantity / ((n ?? 1) + 1));
    const saving = parseFloat((freeUnits * item.unitPrice).toFixed(2));
    return { discountId: discount.id, description: discount.description, saving };
  }
}
