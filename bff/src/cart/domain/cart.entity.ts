export type CartStatus = 'active' | 'checked_out' | 'expired';

export class CartItem {
  constructor(
    public productId: string,
    public quantity: number,
    public unitPriceSnapshot: number,
  ) {}

  get lineTotal(): number {
    return parseFloat((this.quantity * this.unitPriceSnapshot).toFixed(2));
  }
}

export class Cart {
  public items: CartItem[] = [];
  public status: CartStatus = 'active';
  public lastActivityAt: Date = new Date();

  constructor(
    public readonly id: string,
    public readonly createdAt: Date = new Date(),
  ) {}

  touch(): void {
    this.lastActivityAt = new Date();
  }

  get subtotal(): number {
    return parseFloat(this.items.reduce((sum, item) => sum + item.lineTotal, 0).toFixed(2));
  }

  findItem(productId: string): CartItem | undefined {
    return this.items.find((i) => i.productId === productId);
  }
}
