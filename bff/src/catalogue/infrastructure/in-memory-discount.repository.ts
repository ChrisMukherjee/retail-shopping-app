import { Injectable } from '@nestjs/common';
import { Discount } from '../domain/discount.entity';
import { IDiscountRepository } from '../domain/repositories/discount.repository.interface';
import { DISCOUNTS_SEED } from './seed/discounts.seed';

@Injectable()
export class InMemoryDiscountRepository implements IDiscountRepository {
  private readonly store = new Map<string, Discount>(
    DISCOUNTS_SEED.map((d) => [d.id, d]),
  );

  async findAll(): Promise<Discount[]> {
    return Array.from(this.store.values());
  }

  async findActive(): Promise<Discount[]> {
    return Array.from(this.store.values()).filter((d) => d.isActive);
  }

  async findById(id: string): Promise<Discount | null> {
    return this.store.get(id) ?? null;
  }
}
