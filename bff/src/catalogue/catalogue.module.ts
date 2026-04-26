import { Module } from '@nestjs/common';
import { CatalogueController } from './presentation/catalogue.controller';
import { CatalogueService } from './application/catalogue.service';
import { DiscountEngineService } from './application/discount-engine/discount-engine.service';
import { InMemoryProductRepository } from './infrastructure/in-memory-product.repository';
import { InMemoryDiscountRepository } from './infrastructure/in-memory-discount.repository';
import { PRODUCT_REPOSITORY } from './domain/repositories/product.repository.interface';
import { DISCOUNT_REPOSITORY } from './domain/repositories/discount.repository.interface';

@Module({
  controllers: [CatalogueController],
  providers: [
    CatalogueService,
    DiscountEngineService,
    { provide: PRODUCT_REPOSITORY, useClass: InMemoryProductRepository },
    { provide: DISCOUNT_REPOSITORY, useClass: InMemoryDiscountRepository },
  ],
  exports: [PRODUCT_REPOSITORY, DISCOUNT_REPOSITORY, DiscountEngineService],
})
export class CatalogueModule {}
