import { Injectable } from '@nestjs/common';
import { Product } from '../domain/product.entity';
import { IProductRepository } from '../domain/repositories/product.repository.interface';
import { PRODUCTS_SEED } from './seed/products.seed';

@Injectable()
export class InMemoryProductRepository implements IProductRepository {
  private readonly store = new Map<string, Product>(
    PRODUCTS_SEED.map((p) => [p.id, p]),
  );

  async findAll(): Promise<Product[]> {
    return Array.from(this.store.values());
  }

  async findById(id: string): Promise<Product | null> {
    return this.store.get(id) ?? null;
  }

  async save(product: Product): Promise<void> {
    this.store.set(product.id, product);
  }
}
