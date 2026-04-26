import { Discount } from '../../domain/discount.entity';

export interface CartSummary {
  items: CartItemSummary[];
  subtotal: number;
}

export interface CartItemSummary {
  productId: string;
  category: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface DiscountResult {
  discountId: string;
  description: string;
  saving: number;
}

export interface DiscountStrategy {
  readonly type: string;
  isEligible(cart: CartSummary, discount: Discount): boolean;
  calculate(cart: CartSummary, discount: Discount): DiscountResult;
}
