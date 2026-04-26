export class DomainException extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly details?: unknown[],
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class InsufficientStockException extends DomainException {
  constructor(details: { productId: string; name: string; requested: number; available: number }[]) {
    super('INSUFFICIENT_STOCK', 'Some items are no longer available in the requested quantity.', details);
  }
}

export class CartNotFoundException extends DomainException {
  constructor(cartId: string) {
    super('CART_NOT_FOUND', `Cart ${cartId} not found.`);
  }
}

export class CartExpiredException extends DomainException {
  constructor(cartId: string) {
    super('CART_EXPIRED', `Cart ${cartId} has expired due to inactivity.`);
  }
}

export class CartAlreadyCheckedOutException extends DomainException {
  constructor(cartId: string) {
    super('CART_ALREADY_CHECKED_OUT', `Cart ${cartId} has already been checked out.`);
  }
}

export class ProductNotFoundException extends DomainException {
  constructor(productId: string) {
    super('PRODUCT_NOT_FOUND', `Product ${productId} not found.`);
  }
}

export class InsufficientStockToAddException extends DomainException {
  constructor(name: string, available: number) {
    super('INSUFFICIENT_STOCK', `Only ${available} unit(s) of "${name}" available.`);
  }
}
