import { DiscountEngineService } from '../discount-engine.service';
import { DISCOUNT_REPOSITORY } from '../../../domain/repositories/discount.repository.interface';
import { Discount } from '../../../domain/discount.entity';
import { CartSummary } from '../discount-strategy.interface';
import { Test } from '@nestjs/testing';

const electronics = (qty: number, unitPrice: number) => ({
  productId: 'prod_001',
  category: 'Electronics',
  quantity: qty,
  unitPrice,
  lineTotal: qty * unitPrice,
});

const nikeItem = (qty: number) => ({
  productId: 'prod_003',
  category: 'Footwear',
  quantity: qty,
  unitPrice: 124.99,
  lineTotal: qty * 124.99,
});

function makeService(discounts: Discount[]) {
  const repo = { findActive: jest.fn().mockResolvedValue(discounts), findAll: jest.fn(), findById: jest.fn() };
  return new DiscountEngineService(repo as any);
}

describe('DiscountEngineService', () => {
  describe('PERCENTAGE_CART', () => {
    it('applies 10% to cart subtotal', async () => {
      const svc = makeService([new Discount('d1', 'PERCENTAGE_CART', '10% off', true, { rate: 0.1 })]);
      const cart: CartSummary = { items: [electronics(1, 100)], subtotal: 100 };
      const result = await svc.getBestDiscount(cart);
      expect(result?.saving).toBe(10);
    });
  });

  describe('BUY_N_GET_ONE_FREE', () => {
    it('is eligible when qty >= n+1', async () => {
      const svc = makeService([new Discount('d2', 'BUY_N_GET_ONE_FREE', 'Buy 2 get 1 free', true, { productId: 'prod_003', n: 2 })]);
      const cart: CartSummary = { items: [nikeItem(3)], subtotal: 3 * 124.99 };
      const result = await svc.getBestDiscount(cart);
      expect(result?.saving).toBe(124.99);
    });

    it('is not eligible when qty < n+1', async () => {
      const svc = makeService([new Discount('d2', 'BUY_N_GET_ONE_FREE', 'Buy 2 get 1 free', true, { productId: 'prod_003', n: 2 })]);
      const cart: CartSummary = { items: [nikeItem(2)], subtotal: 2 * 124.99 };
      const result = await svc.getBestDiscount(cart);
      expect(result).toBeNull();
    });

    it('gives 2 free units when qty=6, n=2', async () => {
      const svc = makeService([new Discount('d2', 'BUY_N_GET_ONE_FREE', 'Buy 2 get 1 free', true, { productId: 'prod_003', n: 2 })]);
      const cart: CartSummary = { items: [nikeItem(6)], subtotal: 6 * 124.99 };
      const result = await svc.getBestDiscount(cart);
      expect(result?.saving).toBe(2 * 124.99);
    });
  });

  describe('MIN_SPEND_PERCENTAGE', () => {
    it('applies when subtotal meets threshold', async () => {
      const svc = makeService([new Discount('d3', 'MIN_SPEND_PERCENTAGE', '15% off over £100', true, { threshold: 100, rate: 0.15 })]);
      const cart: CartSummary = { items: [electronics(1, 150)], subtotal: 150 };
      const result = await svc.getBestDiscount(cart);
      expect(result?.saving).toBe(22.5);
    });

    it('does not apply below threshold', async () => {
      const svc = makeService([new Discount('d3', 'MIN_SPEND_PERCENTAGE', '15% off over £100', true, { threshold: 100, rate: 0.15 })]);
      const cart: CartSummary = { items: [electronics(1, 50)], subtotal: 50 };
      const result = await svc.getBestDiscount(cart);
      expect(result).toBeNull();
    });
  });

  describe('CATEGORY_PERCENTAGE', () => {
    it('applies only to Electronics items', async () => {
      const svc = makeService([new Discount('d4', 'CATEGORY_PERCENTAGE', '20% off Electronics', true, { category: 'Electronics', rate: 0.2 })]);
      const cart: CartSummary = {
        items: [electronics(1, 200), nikeItem(1)],
        subtotal: 200 + 124.99,
      };
      const result = await svc.getBestDiscount(cart);
      expect(result?.saving).toBe(40);
    });

    it('is not eligible when no Electronics in cart', async () => {
      const svc = makeService([new Discount('d4', 'CATEGORY_PERCENTAGE', '20% off Electronics', true, { category: 'Electronics', rate: 0.2 })]);
      const cart: CartSummary = { items: [nikeItem(1)], subtotal: 124.99 };
      const result = await svc.getBestDiscount(cart);
      expect(result).toBeNull();
    });
  });

  describe('FIXED_AMOUNT_OFF', () => {
    it('deducts flat amount when threshold met', async () => {
      const svc = makeService([new Discount('d5', 'FIXED_AMOUNT_OFF', '£5 off over £30', true, { threshold: 30, amount: 5 })]);
      const cart: CartSummary = { items: [electronics(1, 50)], subtotal: 50 };
      const result = await svc.getBestDiscount(cart);
      expect(result?.saving).toBe(5);
    });

    it('does not apply below threshold', async () => {
      const svc = makeService([new Discount('d5', 'FIXED_AMOUNT_OFF', '£5 off over £30', true, { threshold: 30, amount: 5 })]);
      const cart: CartSummary = { items: [electronics(1, 20)], subtotal: 20 };
      const result = await svc.getBestDiscount(cart);
      expect(result).toBeNull();
    });
  });

  describe('best-value selection', () => {
    it('picks the discount with highest saving', async () => {
      const discounts = [
        new Discount('d1', 'PERCENTAGE_CART', '10% off', true, { rate: 0.1 }),
        new Discount('d3', 'MIN_SPEND_PERCENTAGE', '15% off over £100', true, { threshold: 100, rate: 0.15 }),
      ];
      const svc = makeService(discounts);
      const cart: CartSummary = { items: [electronics(1, 200)], subtotal: 200 };
      const result = await svc.getBestDiscount(cart);
      expect(result?.discountId).toBe('d3');
      expect(result?.saving).toBe(30);
    });
  });

  describe('empty cart', () => {
    it('returns null for empty cart', async () => {
      const svc = makeService([new Discount('d1', 'PERCENTAGE_CART', '10% off', true, { rate: 0.1 })]);
      const result = await svc.getBestDiscount({ items: [], subtotal: 0 });
      expect(result).toBeNull();
    });
  });
});
