import { apiClient } from './api.client';
import { Product } from '../types';

export const productsService = {
  async getProducts(): Promise<Product[]> {
    const res = await apiClient.get<{ data: Product[] }>('/products');
    return res.data.data;
  },

  async getProduct(id: string): Promise<Product> {
    const res = await apiClient.get<{ data: Product }>(`/products/${id}`);
    return res.data.data;
  },
};
