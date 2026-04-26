# CLAUDE.md — Retail Shopping App

## What This Project Is

A take-home exercise. Full-stack retail shopping app:
- **BFF:** NestJS + TypeScript (port 3000, in-memory storage)
- **Mobile:** React Native + TypeScript (Expo managed workflow)

Both apps live in this monorepo. The design documents in `docs/` (PRD, SYSTEM_DESIGN, TDD) are the source of truth for requirements and architecture. **Do not deviate from those designs without good reason.**

---

## Architecture Decisions — Do Not Re-litigate

These are settled. Implement them as specified.

### BFF
- **Clean/Onion architecture** with three bounded contexts: `catalogue`, `cart`, `checkout`
- **Repository pattern** with interfaces (`IProductRepository`, `ICartRepository`, `IDiscountRepository`) injected via DI tokens (`PRODUCT_REPOSITORY` etc.) — never instantiate repositories directly in services
- **Discount engine** uses Strategy pattern (`DiscountStrategy` interface) — evaluated at cart-read time and checkout; best-value wins; no stacking
- **Global exception filter** formats all errors to `{ error: { code, message, details } }` — no raw exceptions escape to HTTP responses
- **All responses wrapped** as `{ data: ... }` for success
- **Cart expiry** via `@nestjs/schedule` cron every 30 seconds; 2-minute inactivity window
- **In-memory storage only** — `Map`-based repositories, no database

### Mobile
- **Expo managed workflow** (not bare RN) — reviewers need zero native toolchain
- **Zustand** for state (`useProductStore`, `useCartStore`, `useCheckoutStore`)
- **React Navigation v6 Native Stack** — four screens: ProductList, ProductDetail, Cart, CheckoutResult
- **Typed Axios service layer** — screens/stores never call fetch/axios directly
- **AsyncStorage** for persisting `cartId` across restarts
- **Base URL** from `EXPO_PUBLIC_API_URL` env var, defaulting to `http://localhost:3000`

---

## Implementation Sequence

Follow this order to maintain a working state throughout:

1. BFF scaffold — NestJS project, module structure, repository interfaces, global filter
2. Catalogue — seed data (7 products, 5 discounts), product/discount endpoints, in-memory repos
3. Discount engine — all 5 strategies with unit tests
4. Cart CRUD — create/get/add/update/remove with stock reservation logic
5. Checkout — stock validation, order creation, reservation release
6. Cart expiry scheduler — cron job
7. BFF integration tests (supertest)
8. Mobile scaffold — Expo, navigation, API client, stores
9. Product screens — list + detail
10. Cart screen
11. Checkout flow + result screen
12. Mobile tests
13. Polish SOLUTION.md and verify everything runs from clean clone

---

## Key Constraints

- **No auth** — no JWT, no sessions, no middleware guarding routes
- **No real database** — in-memory only; restarting BFF resets all state
- **No cloud** — runs locally only
- **No admin endpoints** — catalogue and discounts are read-only from the API perspective
- **No discount stacking** — best-value single discount applied
- **TypeScript strict mode** throughout — no `any` types
- `npm run test` from root must run the full test suite

---

## Code Style

- TypeScript strict mode, no `any`
- No comments unless the WHY is genuinely non-obvious
- No multi-paragraph docstrings
- Prefer small, focused functions and classes
- DTOs use `class-validator` decorators; `ValidationPipe` is global with `whitelist: true`
- Domain exceptions extend a base `DomainException` and are caught by the global filter
- Money is stored as `number` (GBP float); displayed to 2dp — no `Decimal` library needed

---

## Seed Data Summary

### Products (7)
| ID | Name | Category | Price | Stock |
|----|------|----------|-------|-------|
| prod_001 | Sony WH-1000XM5 Headphones | Electronics | £299.99 | 15 |
| prod_002 | Kindle Paperwhite (16GB) | Electronics | £149.99 | 8 |
| prod_003 | Nike Air Max 270 (UK 10) | Footwear | £124.99 | 20 |
| prod_004 | LEGO Technic Porsche 911 | Toys | £89.99 | 5 |
| prod_005 | Dyson V12 Detect Slim | Home | £549.99 | 3 |
| prod_006 | Nespresso Vertuo Pop Machine | Home | £79.99 | 12 |
| prod_007 | Fitbit Charge 6 | Electronics | £119.99 | 10 |

### Discounts (5)
| ID | Type | Config |
|----|------|--------|
| disc_001 | `PERCENTAGE_CART` | rate: 0.10 |
| disc_002 | `BUY_N_GET_ONE_FREE` | productId: prod_003, n: 2 |
| disc_003 | `MIN_SPEND_PERCENTAGE` | threshold: £100, rate: 0.15 |
| disc_004 | `CATEGORY_PERCENTAGE` | category: Electronics, rate: 0.20 |
| disc_005 | `FIXED_AMOUNT_OFF` | threshold: £30, amount: £5 |

---

## API Contract (Summary)

```
GET    /products              → list all products with stockAvailable
GET    /products/:id          → single product detail
GET    /discounts             → list active discounts

POST   /carts                 → create cart → { data: { cartId } }
GET    /carts/:id             → cart with items, totals, applied discount
POST   /carts/:id/items       → add item { productId, quantity }
PATCH  /carts/:id/items/:pid  → update quantity { quantity }
DELETE /carts/:id/items/:pid  → remove item
DELETE /carts/:id             → abandon cart

POST   /carts/:id/checkout    → checkout → 200 order summary or 409 INSUFFICIENT_STOCK
```

---

## Error Codes

| Exception | HTTP Status | Code |
|-----------|-------------|------|
| `InsufficientStockException` | 409 | `INSUFFICIENT_STOCK` |
| `CartNotFoundException` | 404 | `CART_NOT_FOUND` |
| `CartExpiredException` | 410 | `CART_EXPIRED` |
| `CartAlreadyCheckedOutException` | 422 | `CART_ALREADY_CHECKED_OUT` |
| Validation error | 400 | `VALIDATION_ERROR` |

---

## Testing Priorities

**BFF unit tests (highest value):**
- `DiscountEngineService` — each strategy, eligibility edge cases, best-value selection
- `CartService` — stock reservation mutations
- `CheckoutService` — success path decrements stockTotal; failure returns correct details; reservations always released

**BFF integration tests:**
- Full happy path (create cart → add items → checkout → stock decremented)
- Insufficient stock checkout → 409
- Duplicate checkout → 422

**Mobile unit tests:**
- Store actions (`useCartStore`, `useCheckoutStore`)
- API service layer (Axios mocked)

**Mobile component tests:**
- `DiscountBadge` — renders description and saving amount
- `StockBadge` — out of stock / low stock / in stock states

---

## What SOLUTION.md Must Cover (Checklist)

- [x] How to run the BFF (`cd bff && npm install && npm run start:dev`)
- [x] How to run the mobile app (`cd mobile && npm install && npx expo start`)
- [x] How to run all tests (`npm run install:all && npm run test` from root)
- [x] Physical device URL override (EXPO_PUBLIC_API_URL)
- [x] Discount engine explanation (all 5 types, evaluation flow)
- [x] Data persistence approach (in-memory, reset on restart)
- [x] Assumptions list
- [x] Navigation & state management rationale
- [x] Repository structure explanation
