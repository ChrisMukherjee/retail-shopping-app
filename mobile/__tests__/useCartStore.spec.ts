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

    it('reuses existing cartId without creating a new cart', async () => {
      useCartStore.setState({ cartId: 'cart_1' });
      (cartService.addItem as jest.Mock).mockResolvedValue(mockCart());

      await act(async () => {
        await useCartStore.getState().addItem('prod_001', 1);
      });

      expect(cartService.createCart).not.toHaveBeenCalled();
    });

    it('sets error and rethrows when addItem API fails', async () => {
      (cartService.createCart as jest.Mock).mockResolvedValue('cart_1');
      (cartService.addItem as jest.Mock).mockRejectedValue({ code: 'INSUFFICIENT_STOCK', message: 'Out of stock' });

      await act(async () => {
        try {
          await useCartStore.getState().addItem('prod_001', 99);
        } catch {}
      });

      expect(useCartStore.getState().error?.message).toBe('Out of stock');
    });
  });

  describe('updateItem', () => {
    it('updates cart state on success', async () => {
      useCartStore.setState({ cartId: 'cart_1' });
      const updated = mockCart({
        items: [{ productId: 'prod_001', name: 'Product', unitPrice: 100, quantity: 3, lineTotal: 300 }],
        subtotal: 300, total: 300,
      });
      (cartService.updateItem as jest.Mock).mockResolvedValue(updated);

      await act(async () => {
        await useCartStore.getState().updateItem('prod_001', 3);
      });

      expect(cartService.updateItem).toHaveBeenCalledWith('cart_1', 'prod_001', 3);
      expect(useCartStore.getState().cart?.items[0].quantity).toBe(3);
    });

    it('clears cart and cartId when cart is expired', async () => {
      useCartStore.setState({ cartId: 'cart_1' });
      (cartService.updateItem as jest.Mock).mockRejectedValue({ code: 'CART_EXPIRED', message: 'Expired' });

      await act(async () => {
        await useCartStore.getState().updateItem('prod_001', 2);
      });

      expect(useCartStore.getState().cartId).toBeNull();
      expect(useCartStore.getState().cart).toBeNull();
      expect(AsyncStorage.removeItem).toHaveBeenCalled();
    });

    it('clears cart and cartId when cart is not found', async () => {
      useCartStore.setState({ cartId: 'cart_1' });
      (cartService.updateItem as jest.Mock).mockRejectedValue({ code: 'CART_NOT_FOUND', message: 'Not found' });

      await act(async () => {
        await useCartStore.getState().updateItem('prod_001', 2);
      });

      expect(useCartStore.getState().cartId).toBeNull();
      expect(useCartStore.getState().cart).toBeNull();
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

    it('clears cart state when cart is expired', async () => {
      useCartStore.setState({ cartId: 'cart_1' });
      (cartService.removeItem as jest.Mock).mockRejectedValue({ code: 'CART_EXPIRED', message: 'Expired' });

      await act(async () => {
        await useCartStore.getState().removeItem('prod_001');
      });

      expect(useCartStore.getState().cartId).toBeNull();
      expect(useCartStore.getState().cart).toBeNull();
      expect(AsyncStorage.removeItem).toHaveBeenCalled();
    });
  });

  describe('fetchCart', () => {
    it('loads cart into state', async () => {
      useCartStore.setState({ cartId: 'cart_1' });
      (cartService.getCart as jest.Mock).mockResolvedValue(mockCart({ id: 'cart_1' }));

      await act(async () => {
        await useCartStore.getState().fetchCart();
      });

      expect(useCartStore.getState().cart?.id).toBe('cart_1');
    });

    it('clears cart state when cart is expired', async () => {
      useCartStore.setState({ cartId: 'cart_1' });
      (cartService.getCart as jest.Mock).mockRejectedValue({ code: 'CART_EXPIRED', message: 'Expired' });

      await act(async () => {
        await useCartStore.getState().fetchCart();
      });

      expect(useCartStore.getState().cartId).toBeNull();
      expect(useCartStore.getState().cart).toBeNull();
      expect(AsyncStorage.removeItem).toHaveBeenCalled();
    });

    it('does nothing when cartId is null', async () => {
      await act(async () => {
        await useCartStore.getState().fetchCart();
      });

      expect(cartService.getCart).not.toHaveBeenCalled();
    });
  });

  describe('clearCart', () => {
    it('resets cart state and removes AsyncStorage entry', async () => {
      useCartStore.setState({ cartId: 'cart_1', cart: mockCart() as any });

      await act(async () => {
        await useCartStore.getState().clearCart();
      });

      expect(useCartStore.getState().cartId).toBeNull();
      expect(useCartStore.getState().cart).toBeNull();
      expect(AsyncStorage.removeItem).toHaveBeenCalled();
    });
  });
});
