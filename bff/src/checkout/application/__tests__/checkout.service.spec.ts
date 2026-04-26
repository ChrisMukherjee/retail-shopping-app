import { CheckoutService } from '../checkout.service';
import { Cart, CartItem } from '../../../cart/domain/cart.entity';
import { Product } from '../../../catalogue/domain/product.entity';

function makeProduct(id: string, stock: number): Product {
  return new Product(id, `Product ${id}`, 'Desc', 100, 'Electronics', stock);
}

function makeCart(items: { productId: string; qty: number; price: number }[]): Cart {
  const cart = new Cart('cart_test');
  cart.items = items.map((i) => new CartItem(i.productId, i.qty, i.price));
  return cart;
}

function makeDeps(cart: Cart, products: Product[]) {
  const cartRepo = {
    findById: jest.fn().mockResolvedValue(cart),
    save: jest.fn().mockResolvedValue(undefined),
    findActiveBefore: jest.fn(),
    delete: jest.fn(),
  };
  const productRepo = {
    findById: jest.fn().mockImplementation((id: string) =>
      Promise.resolve(products.find((p) => p.id === id) ?? null),
    ),
    findAll: jest.fn(),
    save: jest.fn().mockResolvedValue(undefined),
  };
  const reservationService = { releaseAll: jest.fn().mockResolvedValue(undefined) };
  const discountEngine = { getBestDiscount: jest.fn().mockResolvedValue(null) };
  return { cartRepo, productRepo, reservationService, discountEngine };
}

function buildService(deps: ReturnType<typeof makeDeps>): CheckoutService {
  return new CheckoutService(deps.cartRepo as any, deps.productRepo as any, deps.reservationService as any, deps.discountEngine as any);
}

describe('CheckoutService', () => {
  it('succeeds and decrements stockTotal when stock is available', async () => {
    const product = makeProduct('prod_001', 10);
    const cart = makeCart([{ productId: 'prod_001', qty: 3, price: 100 }]);
    const deps = makeDeps(cart, [product]);
    const svc = buildService(deps);

    const result = await svc.checkout('cart_test');

    expect(result.status).toBe('confirmed');
    expect(product.stockTotal).toBe(7);
    expect(deps.reservationService.releaseAll).toHaveBeenCalledWith(cart);
    expect(cart.status).toBe('checked_out');
  });

  it('throws INSUFFICIENT_STOCK and still releases reservations', async () => {
    const product = makeProduct('prod_001', 2);
    const cart = makeCart([{ productId: 'prod_001', qty: 5, price: 100 }]);
    const deps = makeDeps(cart, [product]);
    const svc = buildService(deps);

    await expect(svc.checkout('cart_test')).rejects.toMatchObject({ code: 'INSUFFICIENT_STOCK' });
    expect(deps.reservationService.releaseAll).toHaveBeenCalledWith(cart);
    expect(cart.status).toBe('checked_out');
  });

  it('throws CART_ALREADY_CHECKED_OUT on duplicate checkout', async () => {
    const cart = makeCart([{ productId: 'prod_001', qty: 1, price: 100 }]);
    cart.status = 'checked_out';
    const product = makeProduct('prod_001', 10);
    const deps = makeDeps(cart, [product]);
    const svc = buildService(deps);

    await expect(svc.checkout('cart_test')).rejects.toMatchObject({ code: 'CART_ALREADY_CHECKED_OUT' });
  });

  it('throws CART_EXPIRED for an expired cart', async () => {
    const cart = makeCart([]);
    cart.status = 'expired';
    const deps = makeDeps(cart, []);
    const svc = buildService(deps);

    await expect(svc.checkout('cart_test')).rejects.toMatchObject({ code: 'CART_EXPIRED' });
  });

  it('applies discount to the order total', async () => {
    const product = makeProduct('prod_001', 10);
    const cart = makeCart([{ productId: 'prod_001', qty: 2, price: 100 }]);
    const deps = makeDeps(cart, [product]);
    deps.discountEngine.getBestDiscount.mockResolvedValue({ discountId: 'd1', description: '10% off', saving: 20 });
    const svc = buildService(deps);

    const result = await svc.checkout('cart_test');
    expect(result.total).toBe(180);
    expect(result.discountApplied?.saving).toBe(20);
  });
});
