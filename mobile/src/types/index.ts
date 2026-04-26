export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  stockAvailable: number;
}

export interface Discount {
  id: string;
  type: string;
  description: string;
  config: Record<string, unknown>;
}

export interface CartItem {
  productId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface AppliedDiscount {
  discountId: string;
  description: string;
  saving: number;
}

export interface Cart {
  id: string;
  status: string;
  items: CartItem[];
  subtotal: number;
  discountApplied: AppliedDiscount | null;
  total: number;
  lastActivityAt: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface Order {
  orderId: string;
  status: string;
  items: OrderItem[];
  subtotal: number;
  discountApplied: AppliedDiscount | null;
  total: number;
  confirmedAt: string;
  estimatedDelivery: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: { productId: string; name: string; requested: number; available: number }[];
}
