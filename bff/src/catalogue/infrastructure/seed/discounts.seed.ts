import { Discount } from '../../domain/discount.entity';

export const DISCOUNTS_SEED: Discount[] = [
  new Discount('disc_001', 'PERCENTAGE_CART', '10% off your entire order', true, { rate: 0.10 }),
  new Discount('disc_002', 'BUY_N_GET_ONE_FREE', 'Buy 2 Nike Air Max, get 1 free', true, { productId: 'prod_003', n: 2 }),
  new Discount('disc_003', 'MIN_SPEND_PERCENTAGE', 'Spend £100 or more, get 15% off', true, { threshold: 100, rate: 0.15 }),
  new Discount('disc_004', 'CATEGORY_PERCENTAGE', '20% off all Electronics', true, { category: 'Electronics', rate: 0.20 }),
  new Discount('disc_005', 'FIXED_AMOUNT_OFF', '£5 off orders over £30', true, { threshold: 30, amount: 5 }),
];
