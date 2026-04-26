import { Discount } from '../discount.entity';

export const DISCOUNT_REPOSITORY = 'DISCOUNT_REPOSITORY';

export interface IDiscountRepository {
  findAll(): Promise<Discount[]>;
  findActive(): Promise<Discount[]>;
  findById(id: string): Promise<Discount | null>;
}
