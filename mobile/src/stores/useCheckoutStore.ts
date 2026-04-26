import { create } from 'zustand';
import { Order, ApiError } from '../types';
import { checkoutService } from '../services/checkout.service';

interface CheckoutStore {
  order: Order | null;
  error: ApiError | null;
  isLoading: boolean;
  checkout: (cartId: string) => Promise<boolean>;
  reset: () => void;
}

export const useCheckoutStore = create<CheckoutStore>((set) => ({
  order: null,
  error: null,
  isLoading: false,

  checkout: async (cartId: string) => {
    set({ isLoading: true, error: null, order: null });
    try {
      const order = await checkoutService.checkout(cartId);
      set({ order, isLoading: false });
      return true;
    } catch (e) {
      const err = e as ApiError;
      set({ error: err, isLoading: false });
      return false;
    }
  },

  reset: () => set({ order: null, error: null, isLoading: false }),
}));
