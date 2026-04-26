import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Cart, ApiError } from '../types';
import { cartService } from '../services/cart.service';

const CART_ID_KEY = 'cartId';

interface CartStore {
  cartId: string | null;
  cart: Cart | null;
  isLoading: boolean;
  error: string | null;
  initCart: () => Promise<void>;
  fetchCart: () => Promise<void>;
  addItem: (productId: string, quantity: number) => Promise<void>;
  updateItem: (productId: string, quantity: number) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  clearCart: () => Promise<void>;
}

export const useCartStore = create<CartStore>((set, get) => ({
  cartId: null,
  cart: null,
  isLoading: false,
  error: null,

  initCart: async () => {
    const storedId = await AsyncStorage.getItem(CART_ID_KEY);
    if (!storedId) return;
    try {
      const cart = await cartService.getCart(storedId);
      if (cart.status === 'active') {
        set({ cartId: storedId, cart });
      } else {
        await AsyncStorage.removeItem(CART_ID_KEY);
      }
    } catch {
      await AsyncStorage.removeItem(CART_ID_KEY);
    }
  },

  fetchCart: async () => {
    const { cartId } = get();
    if (!cartId) return;
    set({ isLoading: true, error: null });
    try {
      const cart = await cartService.getCart(cartId);
      set({ cart, isLoading: false });
    } catch (e) {
      const err = e as ApiError;
      if (err.code === 'CART_EXPIRED') {
        set({ cartId: null, cart: null, error: 'Your session expired and your cart was cleared.', isLoading: false });
        await AsyncStorage.removeItem(CART_ID_KEY);
      } else {
        set({ error: err.message, isLoading: false });
      }
    }
  },

  addItem: async (productId: string, quantity: number) => {
    set({ isLoading: true, error: null });
    try {
      let { cartId } = get();
      if (!cartId) {
        cartId = await cartService.createCart();
        await AsyncStorage.setItem(CART_ID_KEY, cartId);
        set({ cartId });
      }
      const cart = await cartService.addItem(cartId, productId, quantity);
      set({ cart, isLoading: false });
    } catch (e) {
      const err = e as ApiError;
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  updateItem: async (productId: string, quantity: number) => {
    const { cartId } = get();
    if (!cartId) return;
    set({ isLoading: true, error: null });
    try {
      const cart = await cartService.updateItem(cartId, productId, quantity);
      set({ cart, isLoading: false });
    } catch (e) {
      const err = e as ApiError;
      set({ error: err.message, isLoading: false });
    }
  },

  removeItem: async (productId: string) => {
    const { cartId } = get();
    if (!cartId) return;
    set({ isLoading: true, error: null });
    try {
      const cart = await cartService.removeItem(cartId, productId);
      set({ cart, isLoading: false });
    } catch (e) {
      const err = e as ApiError;
      set({ error: err.message, isLoading: false });
    }
  },

  clearCart: async () => {
    await AsyncStorage.removeItem(CART_ID_KEY);
    set({ cartId: null, cart: null, error: null });
  },
}));
