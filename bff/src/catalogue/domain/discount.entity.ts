export type DiscountType =
  | 'PERCENTAGE_CART'
  | 'BUY_N_GET_ONE_FREE'
  | 'MIN_SPEND_PERCENTAGE'
  | 'CATEGORY_PERCENTAGE'
  | 'FIXED_AMOUNT_OFF';

export interface DiscountConfig {
  rate?: number;
  productId?: string;
  n?: number;
  threshold?: number;
  category?: string;
  amount?: number;
}

export class Discount {
  constructor(
    public readonly id: string,
    public readonly type: DiscountType,
    public readonly description: string,
    public readonly isActive: boolean,
    public readonly config: DiscountConfig,
  ) {}
}
