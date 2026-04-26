import { Injectable } from '@nestjs/common';
import { Cart } from '../domain/cart.entity';
import { ICartRepository } from '../domain/repositories/cart.repository.interface';

@Injectable()
export class InMemoryCartRepository implements ICartRepository {
  private readonly store = new Map<string, Cart>();

  async findById(id: string): Promise<Cart | null> {
    return this.store.get(id) ?? null;
  }

  async findActiveBefore(cutoff: Date): Promise<Cart[]> {
    return Array.from(this.store.values()).filter(
      (c) => c.status === 'active' && c.lastActivityAt < cutoff,
    );
  }

  async save(cart: Cart): Promise<void> {
    this.store.set(cart.id, cart);
  }

  async delete(id: string): Promise<void> {
    this.store.delete(id);
  }
}
