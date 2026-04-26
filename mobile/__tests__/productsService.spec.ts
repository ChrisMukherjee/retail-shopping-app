import { productsService } from '../src/services/products.service';
import { apiClient } from '../src/services/api.client';

jest.mock('../src/services/api.client', () => ({
  apiClient: {
    get: jest.fn(),
  },
}));

const mockProduct = {
  id: 'prod_001',
  name: 'Sony WH-1000XM5 Headphones',
  description: 'Premium noise-cancelling headphones',
  price: 299.99,
  category: 'Electronics',
  stockAvailable: 15,
};

describe('productsService', () => {
  beforeEach(() => jest.clearAllMocks());

  it('getProducts returns the product list', async () => {
    (apiClient.get as jest.Mock).mockResolvedValue({ data: { data: [mockProduct] } });

    const products = await productsService.getProducts();

    expect(apiClient.get).toHaveBeenCalledWith('/products');
    expect(products).toHaveLength(1);
    expect(products[0].id).toBe('prod_001');
  });

  it('getProduct returns a single product by id', async () => {
    (apiClient.get as jest.Mock).mockResolvedValue({ data: { data: mockProduct } });

    const product = await productsService.getProduct('prod_001');

    expect(apiClient.get).toHaveBeenCalledWith('/products/prod_001');
    expect(product.name).toBe('Sony WH-1000XM5 Headphones');
  });
});
