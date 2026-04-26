import { apiClient } from './api.client';
import { Cart } from '../types';

export const cartService = {
  async createCart(): Promise<string> {
    const res = await apiClient.post<{ data: { cartId: string } }>('/carts');
    return res.data.data.cartId;
  },

  async getCart(cartId: string): Promise<Cart> {
    const res = await apiClient.get<{ data: Cart }>(`/carts/${cartId}`);
    return res.data.data;
  },

  async addItem(cartId: string, productId: string, quantity: number): Promise<Cart> {
    const res = await apiClient.post<{ data: Cart }>(`/carts/${cartId}/items`, { productId, quantity });
    return res.data.data;
  },

  async updateItem(cartId: string, productId: string, quantity: number): Promise<Cart> {
    const res = await apiClient.patch<{ data: Cart }>(`/carts/${cartId}/items/${productId}`, { quantity });
    return res.data.data;
  },

  async removeItem(cartId: string, productId: string): Promise<Cart> {
    const res = await apiClient.delete<{ data: Cart }>(`/carts/${cartId}/items/${productId}`);
    return res.data.data;
  },
};
