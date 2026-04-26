export interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface AppliedDiscount {
  discountId: string;
  description: string;
  saving: number;
}

export class Order {
  constructor(
    public readonly id: string,
    public readonly cartId: string,
    public readonly items: OrderItem[],
    public readonly subtotal: number,
    public readonly discountApplied: AppliedDiscount | null,
    public readonly total: number,
    public readonly confirmedAt: Date,
    public readonly estimatedDelivery: Date,
  ) {}
}
