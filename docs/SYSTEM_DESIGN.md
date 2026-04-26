# System Design — Retail Shopping App

## Architecture Overview

```
┌─────────────────────────────┐
│      React Native App       │  (Expo / RN CLI)
│  Flux-like state (Zustand)  │
│  Typed API client layer     │
└────────────┬────────────────┘
             │ HTTP/REST (JSON)
             ▼
┌─────────────────────────────┐
│     NestJS BFF (Port 3000)  │
│   Clean / Onion Architecture│
│   In-memory repositories    │
└─────────────────────────────┘
```

The BFF is purpose-built for this mobile client — endpoint shapes, payload design, and response structures are optimised for the mobile consumer, not for generic REST conventions.

---

## BFF — Onion / Clean Architecture

The BFF is organised in concentric layers. Inner layers have no knowledge of outer layers.

```
src/
├── shared/                      # Shared kernel (cross-cutting concerns)
│   ├── filters/                 # GlobalExceptionFilter
│   └── exceptions/              # DomainException base + typed domain exceptions
│
├── catalogue/                   # Bounded context: Products & Discounts
│   ├── domain/
│   │   ├── product.entity.ts
│   │   ├── discount.entity.ts
│   │   └── repositories/        # Interfaces (IProductRepository, IDiscountRepository)
│   ├── application/
│   │   ├── catalogue.service.ts
│   │   └── discount-engine/
│   │       ├── discount-engine.service.ts
│   │       ├── discount-strategy.interface.ts
│   │       └── strategies/      # One class per DiscountType
│   ├── infrastructure/
│   │   ├── in-memory-product.repository.ts
│   │   ├── in-memory-discount.repository.ts
│   │   └── seed/
│   │       ├── products.seed.ts
│   │       └── discounts.seed.ts
│   └── presentation/
│       ├── catalogue.controller.ts
│       └── dto/
│
├── cart/                        # Bounded context: Cart lifecycle
│   ├── domain/
│   │   ├── cart.entity.ts       # Cart + CartItem defined here
│   │   └── repositories/        # ICartRepository
│   ├── application/
│   │   ├── cart.service.ts
│   │   ├── reservation.service.ts
│   │   └── cart-expiry.scheduler.ts
│   ├── infrastructure/
│   │   └── in-memory-cart.repository.ts
│   └── presentation/
│       ├── cart.controller.ts
│       └── dto/
│
└── checkout/                    # Bounded context: Checkout & Order
    ├── domain/
    │   └── order.entity.ts
    ├── application/
    │   └── checkout.service.ts
    └── presentation/
        └── checkout.controller.ts  # POST /carts/:id/checkout
```

### SOLID Application

| Principle | How Applied |
|-----------|-------------|
| **S** — Single Responsibility | Each service owns one use-case group (cart mutation vs reservation vs checkout) |
| **O** — Open/Closed | `DiscountEngine` evaluates a list of `DiscountStrategy` objects — new discount types extend the list, no existing code changes |
| **L** — Liskov Substitution | `IProductRepository` can be swapped from in-memory to a real DB without callers noticing |
| **I** — Interface Segregation | Repositories expose only the methods each consumer needs |
| **D** — Dependency Inversion | Services depend on repository interfaces; NestJS DI injects the concrete implementation |

---

## API Endpoints

All responses are wrapped:
```json
{ "data": { ... } }                                                  // success
{ "error": { "code": "...", "message": "...", "details": [...] } }  // failure
```

### Catalogue

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/products` | List all products with available stock |
| `GET` | `/products/:id` | Single product detail |
| `GET` | `/discounts` | List active discounts |

**`GET /products` response:**
```json
{
  "data": [
    {
      "id": "prod_001",
      "name": "Sony WH-1000XM5 Headphones",
      "description": "...",
      "price": 299.99,
      "category": "Electronics",
      "stockAvailable": 12,
      "imageUrl": null
    }
  ]
}
```

### Cart

A cart is created automatically when the customer first adds an item. The `cartId` is persisted client-side (AsyncStorage).

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/carts` | Create a new cart → returns `{ cartId }` |
| `GET` | `/carts/:id` | Get cart with items, totals, and applied discounts |
| `POST` | `/carts/:id/items` | Add item `{ productId, quantity }` |
| `PATCH` | `/carts/:id/items/:productId` | Update quantity `{ quantity }` |
| `DELETE` | `/carts/:id/items/:productId` | Remove item |
| `DELETE` | `/carts/:id` | Abandon cart (release reservations) |

**`GET /carts/:id` response:**
```json
{
  "data": {
    "id": "cart_abc",
    "items": [
      {
        "productId": "prod_001",
        "name": "Sony WH-1000XM5 Headphones",
        "unitPrice": 299.99,
        "quantity": 2,
        "lineTotal": 599.98
      }
    ],
    "subtotal": 599.98,
    "discountApplied": {
      "discountId": "disc_002",
      "description": "10% off everything",
      "saving": 59.99
    },
    "total": 539.99,
    "lastActivityAt": "2024-01-15T10:30:00Z"
  }
}
```

### Checkout

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/carts/:id/checkout` | Attempt checkout for cart |

**Success response (200):**
```json
{
  "data": {
    "orderId": "ord_xyz",
    "status": "confirmed",
    "items": [ { "name": "...", "quantity": 2, "lineTotal": 539.99 } ],
    "subtotal": 599.98,
    "discountApplied": { "description": "10% off everything", "saving": 59.99 },
    "total": 539.99,
    "confirmedAt": "2024-01-15T10:31:00Z",
    "estimatedDelivery": "2024-01-18"
  }
}
```

**Failure response (409):**
```json
{
  "error": {
    "code": "INSUFFICIENT_STOCK",
    "message": "Some items are no longer available in the requested quantity.",
    "details": [
      { "productId": "prod_001", "name": "Sony Headphones", "requested": 3, "available": 1 }
    ]
  }
}
```

---

## Data Models

### Product
```typescript
interface Product {
  id: string;
  name: string;
  description: string;
  price: number;           // GBP, stored as float (display only — no payment processing)
  category: string;
  stockTotal: number;      // physical stock
  stockReserved: number;   // sum of active cart reservations
  // stockAvailable = stockTotal - stockReserved
}
```

### Discount
```typescript
type DiscountType =
  | 'PERCENTAGE_CART'       // % off cart subtotal
  | 'BUY_N_GET_ONE_FREE'   // every N+1 units, 1 is free
  | 'MIN_SPEND_PERCENTAGE' // % off when subtotal >= threshold
  | 'CATEGORY_PERCENTAGE'  // % off products in a category
  | 'FIXED_AMOUNT_OFF';    // flat £ off when subtotal >= threshold

interface Discount {
  id: string;
  type: DiscountType;
  description: string;
  isActive: boolean;
  config: DiscountConfig;   // type-specific parameters
}
```

### Cart
```typescript
interface Cart {
  id: string;
  items: CartItem[];
  createdAt: Date;
  lastActivityAt: Date;    // reset on every mutation; drives 2-min timeout
  status: 'active' | 'checked_out' | 'expired';
}

interface CartItem {
  productId: string;
  quantity: number;
  unitPriceSnapshot: number;  // price at time of adding — avoids price-change issues
}
```

### Order (post-checkout)
```typescript
interface Order {
  id: string;
  cartId: string;
  items: OrderItem[];
  subtotal: number;
  discountApplied: AppliedDiscount | null;
  total: number;
  confirmedAt: Date;
  estimatedDelivery: Date;
}
```

---

## Discount Engine

The engine follows an **Open/Closed** strategy pattern. Each discount type is a `DiscountStrategy` class implementing:

```typescript
interface DiscountStrategy {
  readonly type: DiscountType;
  isEligible(cart: CartSummary, discount: Discount): boolean;
  calculate(cart: CartSummary, discount: Discount): DiscountResult;
}
```

### Evaluation Flow

```
1. Load all active discounts
2. For each discount, find the matching DiscountStrategy
3. Filter to eligible discounts (isEligible returns true)
4. Calculate the saving for each eligible discount
5. Apply the single highest saving (best-value wins)
   — this is a deliberate simplicity choice; stacking is not required
6. Return applied discount + final total
```

### Strategy Implementations

| Strategy | `isEligible` condition | `calculate` logic |
|----------|----------------------|-------------------|
| `PercentageCartStrategy` | Always eligible | `subtotal * rate` |
| `BuyNGetOneFreeStrategy` | Cart contains ≥ N+1 of the target product | floor(qty / (N+1)) free units × unitPrice |
| `MinSpendPercentageStrategy` | `subtotal >= threshold` | `subtotal * rate` |
| `CategoryPercentageStrategy` | Cart contains items in the target category | sum of category items × rate |
| `FixedAmountStrategy` | `subtotal >= threshold` | flat deduction |

---

## Stock Reservation Lifecycle

```
Customer adds item
       │
       ▼
stockReserved += qty   ←──── stockAvailable decreases for all other carts
       │
  ┌────┴──────────────────────────────────────────────────┐
  │ Cart active                                           │
  │  • Every mutation resets lastActivityAt               │
  │  • Scheduler checks every 30s for carts where         │
  │    now - lastActivityAt > 2 minutes                   │
  └────┬──────────────────────────────────────────────────┘
       │
   ┌───┴─────────────────────────────┐
   │ Inactive 2 min    │ Checkout     │
   ▼                   ▼             │
stockReserved -= qty  stockTotal -= qty (success)
cart.status = expired cart.status = checked_out
                       stockReserved -= qty (always)
```

**Implementation:** NestJS `@Cron` (from `@nestjs/schedule`) runs every 30 seconds to expire stale carts.

---

## Seed Data

### Products (7 items)

| Name | Category | Price | Stock |
|------|----------|-------|-------|
| Sony WH-1000XM5 Headphones | Electronics | £299.99 | 15 |
| Kindle Paperwhite (16GB) | Electronics | £149.99 | 8 |
| Nike Air Max 270 (UK 10) | Footwear | £124.99 | 20 |
| LEGO Technic Porsche 911 | Toys | £89.99 | 5 |
| Dyson V12 Detect Slim | Home | £549.99 | 3 |
| Nespresso Vertuo Pop Machine | Home | £79.99 | 12 |
| Fitbit Charge 6 | Electronics | £119.99 | 10 |

### Discounts (5 active)

| ID | Type | Config | Description |
|----|------|--------|-------------|
| disc_001 | `PERCENTAGE_CART` | rate: 0.10 | 10% off your entire order |
| disc_002 | `BUY_N_GET_ONE_FREE` | productId: prod_003 (Nike), n: 2 | Buy 2 Nike Air Max, get 1 free |
| disc_003 | `MIN_SPEND_PERCENTAGE` | threshold: £100, rate: 0.15 | Spend £100 or more, get 15% off |
| disc_004 | `CATEGORY_PERCENTAGE` | category: Electronics, rate: 0.20 | 20% off all Electronics |
| disc_005 | `FIXED_AMOUNT_OFF` | threshold: £30, amount: £5 | £5 off orders over £30 |

---

## React Native App Architecture

### Pattern: Flux (Zustand stores)

Zustand provides a lightweight Flux-like unidirectional data flow without Redux boilerplate. Each store maps to a domain slice.

```
stores/
  useProductStore.ts    # products list + selected product
  useCartStore.ts       # cart state, add/remove/update actions
  useCheckoutStore.ts   # checkout result (order summary or error)
```

### Navigation Structure (React Navigation — Stack)

```
RootStack
├── ProductListScreen      (/products)
├── ProductDetailScreen    (/products/:id)
├── CartScreen             (/cart)
└── CheckoutResultScreen   (/checkout/result)
```

The Cart icon in the header navigates to `CartScreen` from anywhere. `CheckoutResultScreen` is pushed after checkout resolves.

### Typed API Client Layer

A thin service layer wraps `axios` — screens and stores never call `fetch`/`axios` directly:

```
services/
  api.client.ts          # axios instance, base URL from config, interceptors
  products.service.ts    # getProducts(), getProduct(id)
  discounts.service.ts   # getDiscounts()
  cart.service.ts        # createCart(), getCart(), addItem(), updateItem(), removeItem()
  checkout.service.ts    # checkout(cartId)
```

This isolates network concerns and makes services trivially mockable in tests.

### Component Architecture

```
screens/          # One component per route — orchestrates stores and services
components/
  catalogue/      # ProductCard, ProductList, StockBadge
  cart/           # CartItemRow, CartSummary, DiscountBadge
  checkout/       # OrderSummary, CheckoutError
  shared/         # Button, LoadingSpinner, ErrorMessage, EmptyState
```

Screens are thin — they read from stores and dispatch actions. Business logic lives in stores and services, not components.

---

## Error Handling Strategy

### BFF
- Global `HttpExceptionFilter` catches all exceptions and formats them into the standard error envelope.
- Domain errors (e.g., `InsufficientStockException`) are mapped to appropriate HTTP status codes at the controller/filter boundary.
- Validation via `class-validator` DTOs returns 400 with field-level detail.

### React Native App
- Axios interceptor catches network errors and normalises them to typed `ApiError` objects.
- Each Zustand store holds an `error` field; screens render `<ErrorMessage>` when set.
- No blank screens — every async state (loading / error / empty / data) is explicitly handled.

---

## Testing Strategy

See [TDD.md](./TDD.md) for the full breakdown.

**BFF focus:** Unit tests for the discount engine strategies and cart service, integration tests for controller endpoints.  
**App focus:** Unit tests for store actions/selectors and service layer mocks; component tests for critical UI flows.
