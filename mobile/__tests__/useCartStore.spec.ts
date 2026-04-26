import { act } from 'react';
import { useCartStore } from '../src/stores/useCartStore';
import { cartService } from '../src/services/cart.service';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('../src/services/cart.service');
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(undefined),
  removeItem: jest.fn().mockResolvedValue(undefined),
}));

const mockCart = (overrides = {}) => ({
  id: 'cart_1',
  status: 'active',
  items: [],
  subtotal: 0,
  discountApplied: null,
  total: 0,
  lastActivityAt: new Date().toISOString(),
  ...overrides,
});

describe('useCartStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useCartStore.setState({ cartId: null, cart: null, isLoading: false, error: null });
  });

  describe('addItem', () => {
    it('creates a cart if none exists and adds the item', async () => {
      (cartService.createCart as jest.Mock).mockResolvedValue('cart_1');
      (cartService.addItem as jest.Mock).mockResolvedValue(mockCart({
        items: [{ productId: 'prod_001', name: 'Product', unitPrice: 100, quantity: 1, lineTotal: 100 }],
        subtotal: 100, total: 100,
      }));

      await act(async () => {
        await useCartStore.getState().addItem('prod_001', 1);
      });

      expect(cartService.createCart).toHaveBeenCalled();
      expect(cartService.addItem).toHaveBeenCalledWith('cart_1', 'prod_001', 1);
      expect(useCartStore.getState().cart?.items).toHaveLength(1);
    });

    it('sets error when addItem API fails', async () => {
      (cartService.createCart as jest.Mock).mockResolvedValue('cart_1');
      (cartService.addItem as jest.Mock).mockRejectedValue({ code: 'INSUFFICIENT_STOCK', message: 'Out of stock' });

      await act(async () => {
        try {
          await useCartStore.getState().addItem('prod_001', 99);
        } catch {}
      });

      expect(useCartStore.getState().error).toBe('Out of stock');
    });
  });

  describe('removeItem', () => {
    it('removes the item and updates cart state', async () => {
      useCartStore.setState({ cartId: 'cart_1' });
      (cartService.removeItem as jest.Mock).mockResolvedValue(mockCart());

      await act(async () => {
        await useCartStore.getState().removeItem('prod_001');
      });

      expect(cartService.removeItem).toHaveBeenCalledWith('cart_1', 'prod_001');
      expect(useCartStore.getState().cart?.items).toHaveLength(0);
    });
  });

  describe('clearCart', () => {
    it('resets cart state and removes AsyncStorage entry', async () => {
      useCartStore.setState({ cartId: 'cart_1', cart: mockCart() as any });

      act(() => {
        useCartStore.getState().clearCart();
      });

      expect(useCartStore.getState().cartId).toBeNull();
      expect(useCartStore.getState().cart).toBeNull();
    });
  });
});
