import { Injectable, Inject } from '@nestjs/common';
import type { IProductRepository } from '../domain/repositories/product.repository.interface';
import { PRODUCT_REPOSITORY } from '../domain/repositories/product.repository.interface';
import type { IDiscountRepository } from '../domain/repositories/discount.repository.interface';
import { DISCOUNT_REPOSITORY } from '../domain/repositories/discount.repository.interface';
import { ProductNotFoundException } from '../../shared/exceptions/domain.exception';

@Injectable()
export class CatalogueService {
  constructor(
    @Inject(PRODUCT_REPOSITORY) private readonly productRepo: IProductRepository,
    @Inject(DISCOUNT_REPOSITORY) private readonly discountRepo: IDiscountRepository,
  ) {}

  async getProducts() {
    const products = await this.productRepo.findAll();
    return products.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      price: p.price,
      category: p.category,
      stockAvailable: p.stockAvailable,
    }));
  }

  async getProduct(id: string) {
    const product = await this.productRepo.findById(id);
    if (!product) throw new ProductNotFoundException(id);
    return {
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      category: product.category,
      stockAvailable: product.stockAvailable,
    };
  }

  async getDiscounts() {
    const discounts = await this.discountRepo.findActive();
    return discounts.map((d) => ({
      id: d.id,
      type: d.type,
      description: d.description,
      config: d.config,
    }));
  }
}
