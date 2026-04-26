import { cartService } from '../src/services/cart.service';
import { apiClient } from '../src/services/api.client';

jest.mock('../src/services/api.client', () => ({
  apiClient: {
    post: jest.fn(),
    get: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

const mockCart = {
  id: 'cart_1',
  status: 'active',
  items: [],
  subtotal: 0,
  discountApplied: null,
  total: 0,
  lastActivityAt: new Date().toISOString(),
};

describe('cartService', () => {
  beforeEach(() => jest.clearAllMocks());

  it('createCart returns the cartId from the response', async () => {
    (apiClient.post as jest.Mock).mockResolvedValue({ data: { data: { cartId: 'cart_1' } } });

    const id = await cartService.createCart();

    expect(apiClient.post).toHaveBeenCalledWith('/carts');
    expect(id).toBe('cart_1');
  });

  it('getCart returns the cart from the response', async () => {
    (apiClient.get as jest.Mock).mockResolvedValue({ data: { data: mockCart } });

    const cart = await cartService.getCart('cart_1');

    expect(apiClient.get).toHaveBeenCalledWith('/carts/cart_1');
    expect(cart.id).toBe('cart_1');
  });

  it('addItem posts to the correct endpoint and returns the updated cart', async () => {
    (apiClient.post as jest.Mock).mockResolvedValue({ data: { data: mockCart } });

    const cart = await cartService.addItem('cart_1', 'prod_001', 2);

    expect(apiClient.post).toHaveBeenCalledWith('/carts/cart_1/items', { productId: 'prod_001', quantity: 2 });
    expect(cart).toEqual(mockCart);
  });

  it('updateItem patches the correct endpoint and returns the updated cart', async () => {
    (apiClient.patch as jest.Mock).mockResolvedValue({ data: { data: mockCart } });

    const cart = await cartService.updateItem('cart_1', 'prod_001', 3);

    expect(apiClient.patch).toHaveBeenCalledWith('/carts/cart_1/items/prod_001', { quantity: 3 });
    expect(cart).toEqual(mockCart);
  });

  it('removeItem deletes the correct endpoint and returns the updated cart', async () => {
    (apiClient.delete as jest.Mock).mockResolvedValue({ data: { data: mockCart } });

    const cart = await cartService.removeItem('cart_1', 'prod_001');

    expect(apiClient.delete).toHaveBeenCalledWith('/carts/cart_1/items/prod_001');
    expect(cart).toEqual(mockCart);
  });
});
