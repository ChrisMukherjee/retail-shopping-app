import { apiClient } from './api.client';
import { Order } from '../types';

export const checkoutService = {
  async checkout(cartId: string): Promise<Order> {
    const res = await apiClient.post<{ data: Order }>(`/carts/${cartId}/checkout`);
    return res.data.data;
  },
};
