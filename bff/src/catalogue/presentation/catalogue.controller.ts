import { Controller, Get, Param } from '@nestjs/common';
import { CatalogueService } from '../application/catalogue.service';

@Controller()
export class CatalogueController {
  constructor(private readonly catalogueService: CatalogueService) {}

  @Get('products')
  async getProducts() {
    const data = await this.catalogueService.getProducts();
    return { data };
  }

  @Get('products/:id')
  async getProduct(@Param('id') id: string) {
    const data = await this.catalogueService.getProduct(id);
    return { data };
  }

  @Get('discounts')
  async getDiscounts() {
    const data = await this.catalogueService.getDiscounts();
    return { data };
  }
}
