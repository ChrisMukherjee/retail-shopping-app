import { create } from 'zustand';
import { Product, ApiError } from '../types';
import { productsService } from '../services/products.service';

interface ProductStore {
  products: Product[];
  selectedProduct: Product | null;
  isLoading: boolean;
  error: ApiError | null;
  fetchProducts: () => Promise<void>;
  fetchProduct: (id: string) => Promise<void>;
}

export const useProductStore = create<ProductStore>((set) => ({
  products: [],
  selectedProduct: null,
  isLoading: false,
  error: null,

  fetchProducts: async () => {
    set({ isLoading: true, error: null });
    try {
      const products = await productsService.getProducts();
      set({ products, isLoading: false });
    } catch (e) {
      set({ error: e as ApiError, isLoading: false });
    }
  },

  fetchProduct: async (id: string) => {
    set({ isLoading: true, error: null, selectedProduct: null });
    try {
      const selectedProduct = await productsService.getProduct(id);
      set({ selectedProduct, isLoading: false });
    } catch (e) {
      set({ error: e as ApiError, isLoading: false });
    }
  },
}));
