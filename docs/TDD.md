# Technical Design Document — Retail Shopping App

## Repository Structure

```
retail-shopping-app/                  # Monorepo root
├── bff/                              # NestJS Backend for Frontend
├── mobile/                          # React Native app (Expo)
├── docs/                            # PRD, SYSTEM_DESIGN, TDD
├── SOLUTION.md                      # Reviewer setup guide
└── package.json                     # Root scripts (run both, run all tests)
```

A flat monorepo (no Nx/Turborepo) keeps the submission simple while still co-locating both apps in one repository.

---

## BFF — NestJS + TypeScript

### Tech Choices

| Choice | Rationale |
|--------|-----------|
| NestJS | Required. Provides DI container, module system, and decorator-based routing — maps naturally to Clean Architecture layers |
| `@nestjs/schedule` | Cron job for the 2-minute cart expiry check |
| `class-validator` + `class-transformer` | DTO validation with automatic pipe |
| `uuid` | Deterministic ID generation for carts/orders |
| Jest + `@nestjs/testing` | NestJS-native testing utilities |
| `supertest` | HTTP-level integration tests |

### Project Setup

```bash
cd bff
npm install
npm run start:dev      # ts-node-dev watch mode
npm run test           # unit tests
npm run test:e2e       # integration (supertest) tests
```

### NestJS Module Breakdown

```
AppModule  (ScheduleModule.forRoot() registered here)
├── CatalogueModule
│   ├── CatalogueController
│   ├── CatalogueService
│   ├── DiscountEngineService
│   ├── InMemoryProductRepository  (implements IProductRepository)
│   └── InMemoryDiscountRepository (implements IDiscountRepository)
├── CartModule
│   ├── CartController
│   ├── CartService
│   ├── ReservationService
│   ├── CartExpiryScheduler        (@Cron — lives inside CartModule)
│   └── InMemoryCartRepository     (implements ICartRepository)
└── CheckoutModule
    ├── CheckoutController
    └── CheckoutService
```

**Dependency injection tokens:** Repositories are injected via string tokens (`PRODUCT_REPOSITORY`, `CART_REPOSITORY`) so the concrete class can be swapped without changing service constructors. This satisfies the Dependency Inversion principle and keeps tests clean.

### DTO Validation

Every request body and param is typed and validated:

```typescript
// POST /carts/:id/items
class AddItemDto {
  @IsString() @IsNotEmpty()
  productId: string;

  @IsInt() @Min(1)
  quantity: number;
}
```

`ValidationPipe` is applied globally with `whitelist: true, forbidNonWhitelisted: true`.

### Global Exception Filter

```typescript
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    // Maps HttpException, DomainException, and unknown errors
    // to the standard { error: { code, message, details } } envelope
  }
}
```

Domain exceptions:
- `InsufficientStockException` → 409
- `CartNotFoundException` → 404
- `CartExpiredException` → 410
- `CartAlreadyCheckedOutException` → 422

### Cart Expiry Scheduler

```typescript
@Injectable()
export class CartExpiryScheduler {
  @Cron(CronExpression.EVERY_30_SECONDS)
  async expireInactiveCarts(): Promise<void> {
    const cutoff = new Date(Date.now() - 2 * 60 * 1000);
    const staleCarts = await this.cartRepo.findActiveBefore(cutoff);
    for (const cart of staleCarts) {
      await this.reservationService.releaseAll(cart);
      cart.status = 'expired';
      await this.cartRepo.save(cart);
    }
  }
}
```

The scheduler runs every 30s (half the 2-minute window) to ensure timely expiry without excessive overhead.

---

## Mobile App — React Native + TypeScript

### Tech Choices

| Choice | Rationale |
|--------|-----------|
| Expo (managed workflow) | Fastest local setup for reviewers — no native build chain required; `npx expo start` just works |
| React Navigation v6 (Native Stack) | De-facto standard; native stack gives performant transitions |
| Zustand | Lightweight Flux-like state — minimal boilerplate, excellent TypeScript support, no Provider wrappers needed |
| Axios | Interceptors for auth headers (future-proofing), error normalisation, and timeout handling |
| `@react-native-async-storage/async-storage` | Persist `cartId` across app restarts |
| Jest + React Native Testing Library | Standard RN test setup |

### Project Setup

```bash
cd mobile
npm install
npx expo start         # Expo dev server — scan QR code or press i/a for simulator
npm run test           # Jest
```

### Configuration

`mobile/src/config/api.config.ts`:
```typescript
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';
```

Reviewers can override via a `.env` file at `mobile/.env`:
```
EXPO_PUBLIC_API_URL=http://192.168.x.x:3000   # for physical device
```

### Zustand Store Design

#### `useCartStore`
```typescript
interface CartStore {
  cartId: string | null;
  cart: Cart | null;
  isLoading: boolean;
  error: string | null;

  initCart: () => Promise<void>;          // load or create cartId from AsyncStorage
  fetchCart: () => Promise<void>;
  addItem: (productId: string, quantity: number) => Promise<void>;
  updateItem: (productId: string, quantity: number) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  clearCart: () => void;                  // called post-checkout
}
```

#### `useProductStore`
```typescript
interface ProductStore {
  products: Product[];
  selectedProduct: Product | null;
  isLoading: boolean;
  error: string | null;

  fetchProducts: () => Promise<void>;
  fetchProduct: (id: string) => Promise<void>;
}
```

#### `useCheckoutStore`
```typescript
interface CheckoutStore {
  order: Order | null;
  error: CheckoutError | null;
  isLoading: boolean;

  checkout: (cartId: string) => Promise<void>;
  reset: () => void;
}
```

### Screen Responsibilities

| Screen | Store dependencies | Key behaviour |
|--------|--------------------|---------------|
| `ProductListScreen` | `useProductStore` | Fetches on mount; pulls to refresh; navigates to detail on tap |
| `ProductDetailScreen` | `useProductStore`, `useCartStore` | Add to cart button; shows stock badge; quantity picker |
| `CartScreen` | `useCartStore` | Renders items, totals, discount line; swipe-to-delete; quantity stepper; Checkout button |
| `CheckoutResultScreen` | `useCheckoutStore` | Shows `OrderSummary` on success or `CheckoutError` on failure; clears cart on success |

### Cart Persistence (AsyncStorage)

On app launch, `useCartStore.initCart()` reads `cartId` from AsyncStorage.
- If found: calls `GET /carts/:id`. If 404 or 410 (expired), creates a new cart.
- If not found: no cart created yet — lazy creation on first `addItem`.

This means the customer's cart survives app restarts within the 2-minute inactivity window.

---

## Testing Strategy

### BFF Tests

#### Unit Tests (`*.spec.ts`)

| Unit | What to test |
|------|-------------|
| `DiscountEngineService` | Each strategy: correct saving calculation, eligibility edge cases (qty = N, qty = N+1 for buy-N-get-one), best-value selection when multiple qualify |
| `CartService` | Add item reduces available stock; update item adjusts reservation delta; remove item restores stock; cannot add more than available stock |
| `CheckoutService` | Success path decrements `stockTotal`; failure path returns correct `INSUFFICIENT_STOCK` details; reservations always released post-checkout |
| `ReservationService` | `releaseAll` correctly reduces `stockReserved` for all cart items |
| `CartExpiryScheduler` | Scheduler calls `releaseAll` for carts older than 2 minutes; does not expire recently-active carts |

#### Integration Tests (`*.e2e-spec.ts`)

End-to-end HTTP tests using `supertest` against a fully-wired NestJS app (no mocks — real in-memory repos):

| Scenario | Assertions |
|----------|-----------|
| Full happy path | Create cart → add items → GET cart shows correct totals with discount → checkout → 200 with order summary → product stock reduced |
| Insufficient stock at checkout | Fill cart beyond available stock → checkout → 409 with correct `details` array |
| Cart expiry | Create cart, add items, fast-forward time mock, trigger scheduler → stock restored |
| Duplicate checkout | Checkout cart → attempt second checkout → 422 |

### Mobile App Tests

#### Unit Tests — Stores (`useCartStore`, `useCheckoutStore`)

| Unit | Scenarios covered |
|------|------------------|
| `useCartStore` | `addItem` creates cart on first call then adds item; `addItem` sets `error` when API rejects; `removeItem` calls service and clears item from state; `clearCart` resets `cartId` and `cart` to null |
| `useCheckoutStore` | `checkout` sets `order` and returns `true` on success; `checkout` sets typed `error` and returns `false` on API failure; `reset` clears both `order` and `error` |

#### Component Tests (React Native Testing Library)

| Component | Scenarios covered |
|-----------|------------------|
| `DiscountBadge` | Renders the discount description text; renders the saving formatted as `-£X.XX` |
| `StockBadge` | Shows "Out of stock" when `stock === 0`; shows "Only N left" for low stock; shows "In stock" for sufficient stock |

### Running All Tests

From repository root (via root `package.json` scripts):
```bash
npm run test           # runs both bff and mobile test suites
npm run test:bff       # bff unit + e2e
npm run test:mobile    # mobile jest
```

---

## Implementation Sequence

Recommended build order to maintain a working state throughout:

1. **BFF scaffold** — NestJS project, module structure, repository interfaces
2. **Catalogue** — seed data, product/discount endpoints, in-memory repos
3. **Discount engine** — all 5 strategies, unit-tested
4. **Cart CRUD** — create/get/add/update/remove, stock reservation logic
5. **Checkout** — stock validation, order creation, reservation release
6. **Cart expiry scheduler** — cron job + integration test
7. **BFF e2e tests** — full happy path and failure scenarios
8. **Mobile scaffold** — Expo project, navigation, API client, stores
9. **Product screens** — list + detail
10. **Cart screen** — full cart management
11. **Checkout flow** — trigger checkout, result screen
12. **Mobile tests** — stores + key components
13. **SOLUTION.md** — reviewer setup guide

---

## Assumptions

- **Currency:** All prices in GBP (£), stored as floats. No multi-currency, no rounding beyond 2dp display.
- **Stock reservation and checkout are not atomic transactions** (in-memory, single-process — race conditions are not a concern for this exercise).
- **Single active cart per session** — the mobile app manages one `cartId` at a time; no multi-cart support.
- **Best-value discount wins** — only one discount applied per checkout. Not stackable.
- **BuyNGetOneFree** applies per product line (not mixed across products).
- **Cart ID** is a UUID generated server-side on `POST /carts`; the client stores it in AsyncStorage.
- **estimatedDelivery** in the order summary is a simulated value (3 business days from order date).
- **No pagination** on product listing — catalogue is small enough to return in one response.
- **Physical device testing** requires updating `EXPO_PUBLIC_API_URL` to the host machine's LAN IP (documented in SOLUTION.md).
