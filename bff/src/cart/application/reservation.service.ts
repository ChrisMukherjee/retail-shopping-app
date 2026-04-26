import { Injectable, Inject } from '@nestjs/common';
import { Cart } from '../domain/cart.entity';
import type { IProductRepository } from '../../catalogue/domain/repositories/product.repository.interface';
import { PRODUCT_REPOSITORY } from '../../catalogue/domain/repositories/product.repository.interface';

@Injectable()
export class ReservationService {
  constructor(
    @Inject(PRODUCT_REPOSITORY) private readonly productRepo: IProductRepository,
  ) {}

  async reserve(productId: string, qty: number): Promise<void> {
    const product = await this.productRepo.findById(productId);
    if (!product) return;
    product.stockReserved += qty;
    await this.productRepo.save(product);
  }

  async release(productId: string, qty: number): Promise<void> {
    const product = await this.productRepo.findById(productId);
    if (!product) return;
    product.stockReserved = Math.max(0, product.stockReserved - qty);
    await this.productRepo.save(product);
  }

  async releaseAll(cart: Cart): Promise<void> {
    for (const item of cart.items) {
      await this.release(item.productId, item.quantity);
    }
  }
}
