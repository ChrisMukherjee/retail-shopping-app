import { CartService } from '../cart.service';
import { Cart, CartItem } from '../../domain/cart.entity';
import { Product } from '../../../catalogue/domain/product.entity';

function makeProduct(overrides: Partial<Product> = {}): Product {
  return Object.assign(new Product('prod_001', 'Test Product', 'Desc', 100, 'Electronics', 10), overrides);
}

function makeCart(id = 'cart_1'): Cart {
  return new Cart(id);
}

function makeDeps(product: Product, cart: Cart | null = null) {
  const cartRepo = {
    findById: jest.fn().mockResolvedValue(cart),
    save: jest.fn().mockResolvedValue(undefined),
    findActiveBefore: jest.fn(),
    delete: jest.fn(),
  };
  const productRepo = {
    findById: jest.fn().mockResolvedValue(product),
    findAll: jest.fn(),
    save: jest.fn().mockResolvedValue(undefined),
  };
  const reservationService = {
    reserve: jest.fn().mockResolvedValue(undefined),
    release: jest.fn().mockResolvedValue(undefined),
    releaseAll: jest.fn().mockResolvedValue(undefined),
  };
  const discountEngine = {
    getBestDiscount: jest.fn().mockResolvedValue(null),
  };
  return { cartRepo, productRepo, reservationService, discountEngine };
}

function buildService(deps: ReturnType<typeof makeDeps>): CartService {
  return new CartService(deps.cartRepo as any, deps.productRepo as any, deps.reservationService as any, deps.discountEngine as any);
}

describe('CartService', () => {
  describe('createCart', () => {
    it('creates and saves a new cart', async () => {
      const { cartRepo, productRepo, reservationService, discountEngine } = makeDeps(makeProduct());
      cartRepo.findById.mockResolvedValue(null);
      const svc = buildService({ cartRepo, productRepo, reservationService, discountEngine });
      const result = await svc.createCart();
      expect(result.cartId).toBeDefined();
      expect(cartRepo.save).toHaveBeenCalled();
    });
  });

  describe('addItem', () => {
    it('reserves stock when item is added', async () => {
      const product = makeProduct();
      const cart = makeCart();
      const deps = makeDeps(product, cart);
      const svc = buildService(deps);
      await svc.addItem('cart_1', 'prod_001', 2);
      expect(deps.reservationService.reserve).toHaveBeenCalledWith('prod_001', 2);
    });

    it('throws when quantity exceeds available stock', async () => {
      const product = makeProduct({ stockTotal: 5, stockReserved: 0 } as any);
      const cart = makeCart();
      const deps = makeDeps(product, cart);
      const svc = buildService(deps);
      await expect(svc.addItem('cart_1', 'prod_001', 6)).rejects.toMatchObject({ code: 'INSUFFICIENT_STOCK' });
    });

    it('increments quantity for existing item', async () => {
      const product = makeProduct();
      const cart = makeCart();
      cart.items.push(new CartItem('prod_001', 3, 100));
      const deps = makeDeps(product, cart);
      const svc = buildService(deps);
      await svc.addItem('cart_1', 'prod_001', 2);
      expect(cart.findItem('prod_001')?.quantity).toBe(5);
    });
  });

  describe('removeItem', () => {
    it('releases stock when item is removed', async () => {
      const product = makeProduct();
      const cart = makeCart();
      cart.items.push(new CartItem('prod_001', 2, 100));
      const deps = makeDeps(product, cart);
      const svc = buildService(deps);
      await svc.removeItem('cart_1', 'prod_001');
      expect(deps.reservationService.release).toHaveBeenCalledWith('prod_001', 2);
      expect(cart.items).toHaveLength(0);
    });
  });

  describe('updateItem', () => {
    it('reserves additional stock on quantity increase', async () => {
      const product = makeProduct();
      const cart = makeCart();
      cart.items.push(new CartItem('prod_001', 2, 100));
      const deps = makeDeps(product, cart);
      const svc = buildService(deps);
      await svc.updateItem('cart_1', 'prod_001', 4);
      expect(deps.reservationService.reserve).toHaveBeenCalledWith('prod_001', 2);
    });

    it('releases stock on quantity decrease', async () => {
      const product = makeProduct();
      const cart = makeCart();
      cart.items.push(new CartItem('prod_001', 4, 100));
      const deps = makeDeps(product, cart);
      const svc = buildService(deps);
      await svc.updateItem('cart_1', 'prod_001', 2);
      expect(deps.reservationService.release).toHaveBeenCalledWith('prod_001', 2);
    });

    it('removes item when quantity set to 0', async () => {
      const product = makeProduct();
      const cart = makeCart();
      cart.items.push(new CartItem('prod_001', 2, 100));
      const deps = makeDeps(product, cart);
      const svc = buildService(deps);
      await svc.updateItem('cart_1', 'prod_001', 0);
      expect(cart.items).toHaveLength(0);
    });
  });
});
