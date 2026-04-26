import { Cart } from '../cart.entity';

export const CART_REPOSITORY = 'CART_REPOSITORY';

export interface ICartRepository {
  findById(id: string): Promise<Cart | null>;
  save(cart: Cart): Promise<void>;
  delete(id: string): Promise<void>;
}
