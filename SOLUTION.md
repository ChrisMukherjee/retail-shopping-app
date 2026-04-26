# SOLUTION.md — Retail Shopping App

## Repository Structure

```
retail-shopping-app/
├── bff/          # NestJS Backend for Frontend (port 3000)
├── mobile/       # React Native app (Expo managed workflow)
├── docs/         # PRD, SYSTEM_DESIGN, TDD design documents
├── SOLUTION.md   # This file
├── CLAUDE.md     # AI assistant context (development notes)
└── package.json  # Root scripts to run both apps and all tests
```

A flat monorepo was chosen over Nx/Turborepo to keep the reviewer setup simple — no monorepo toolchain to install.

---

## Prerequisites

- **Node.js** 20+ and **npm** 10+
- **Expo CLI** (installed automatically via `npx`)
- For running the app on a physical device: [Expo Go](https://expo.dev/client) installed on your phone

---

## Running the BFF

```bash
cd bff
npm install
npm run start:dev
```

The BFF starts on **http://localhost:3000**.

To verify it is running:
```bash
curl http://localhost:3000/products
```

You should receive a JSON list of 7 seeded products.

### Environment

No environment configuration is required. The BFF runs entirely in-memory with hardcoded seed data.

---

## Running the React Native App

```bash
cd mobile
npm install
npx expo start
```

Then:
- Press **`i`** to open in iOS Simulator (Mac only, Xcode required)
- Press **`a`** to open in Android Emulator (Android Studio required)
- Scan the QR code with **Expo Go** on a physical device

### Connecting to the BFF

By default the app points to `http://localhost:3000`. This works for simulators running on the same machine as the BFF.

**Physical device:** Create `mobile/.env` with your machine's LAN IP:
```
EXPO_PUBLIC_API_URL=http://192.168.x.x:3000
```

Then restart the Expo dev server.

---

## Running the Tests

### All tests (from repo root)

```bash
# First-time setup — installs dependencies for both sub-packages
npm run install:all

# Run all tests
npm run test
```

### BFF only

```bash
cd bff
npm run test          # unit tests
npm run test:e2e      # integration (supertest) tests
npm run test:all      # unit + e2e
```

### Mobile only

```bash
cd mobile
npm run test
```

---

## Discount Engine

Discounts are evaluated at cart-read time and again at checkout. The engine follows a **Strategy pattern** — each discount type is a self-contained class. Only one discount is applied per cart (best-value wins).

### Discount Types

| Type | ID | Description | How it works |
|------|----|-------------|--------------|
| `PERCENTAGE_CART` | disc_001 | 10% off your entire order | Multiplies cart subtotal by the rate |
| `BUY_N_GET_ONE_FREE` | disc_002 | Buy 2 Nike Air Max, get 1 free | For every N+1 units of the target product, 1 unit is free. Saving = `floor(qty / (N+1)) × unitPrice` |
| `MIN_SPEND_PERCENTAGE` | disc_003 | 15% off when you spend £100 or more | Applies the rate to the full subtotal when the threshold is met |
| `CATEGORY_PERCENTAGE` | disc_004 | 20% off all Electronics | Applies the rate to the sum of line totals in the target category |
| `FIXED_AMOUNT_OFF` | disc_005 | £5 off orders over £30 | Deducts a flat amount when the subtotal meets the threshold |

### Evaluation Flow

```
1. Load all active discounts from the discount repository
2. For each discount, find its matching DiscountStrategy
3. Filter to discounts where isEligible(cart) returns true
4. Calculate the saving each eligible discount would produce
5. Apply the single discount with the highest saving (best-value wins)
6. Return the applied discount details and final total
```

New discount types can be added by implementing `DiscountStrategy` and registering it — no changes to existing code required (Open/Closed Principle).

---

## Data Persistence

All storage is **in-memory only**. There is no database.

- **Product catalogue** and **discounts** are hardcoded seed data initialised when the BFF process starts. They represent the starting state and persist for the lifetime of the process.
- **Cart state** is managed in a plain in-memory `Map` keyed by cart ID. Restarting the BFF clears all active carts and resets stock to seed values.
- **Orders** (post-checkout) are also held in-memory. There is no order history endpoint — the order summary is returned in the checkout response and displayed immediately in the app.

This is deliberate — the exercise explicitly prohibits a real database.

---

## Stock Reservation Lifecycle

1. Adding an item to a cart immediately increments `stockReserved` on that product. The available quantity visible to other carts decreases accordingly.
2. A NestJS `@Cron` job runs every 30 seconds. Any cart whose `lastActivityAt` is older than 2 minutes has its reservations released and its status set to `expired`.
3. On checkout, **reservations are released first**, before stock is re-validated. This is intentional: if validation happened before releasing, the cart's own `stockReserved` would inflate the reserved count and make `stockAvailable` appear lower than it really is — causing a false-positive 409 on the customer's own items. Releasing first gives an accurate picture of what stock is genuinely available to others. On success, `stockTotal` is then decremented. On failure, reservations are not re-applied — the customer must re-add items to a new cart.

---

## Navigation & State Management Decisions

**Navigation:** React Navigation v6 (Native Stack). A single root stack with four screens keeps the navigation structure flat and straightforward. The cart icon in the header provides persistent access to the cart from any screen.

**State:** Zustand was chosen over Redux for its minimal boilerplate and first-class TypeScript support. Each store maps to one domain slice (`useProductStore`, `useCartStore`, `useCheckoutStore`). Screens are thin orchestrators — business logic lives in stores and services.

**API layer:** A typed service layer wraps Axios. Screens and stores never call `fetch`/`axios` directly. This isolates network concerns and makes services trivially mockable in tests.

**Cart persistence:** The `cartId` is persisted in AsyncStorage so the customer's cart survives app restarts within the 2-minute inactivity window. On launch, if the stored cart ID resolves to a 404 or 410 (expired), a fresh cart is created transparently.

---

## Testing Strategy

**BFF focus:** Unit tests cover the discount engine strategies (eligibility edge cases and saving calculations), cart service (stock reservation mutations), checkout service (success/failure paths), and the expiry scheduler. Integration tests use `supertest` against a fully-wired NestJS app (no mocks — real in-memory repositories) to cover complete HTTP flows.

**Mobile focus:** Unit tests cover store actions and the API service layer (with Axios mocked). Component tests (React Native Testing Library) cover the critical UI components — discount badge rendering and stock availability badge states.

**Why fully-wired integration tests rather than mocked repositories?** Because the storage layer is in-memory, spinning up the complete NestJS app in tests costs essentially nothing — there are no connections to open, no seeding scripts, and no teardown. This makes fully-wired tests the better choice here: they catch things unit tests alone cannot (DI misconfiguration, filter/pipe ordering, incorrect HTTP status codes) without any of the infrastructure overhead that would make this approach impractical against a real database. In a production app the approach would change: repository interfaces would be swapped for in-memory test doubles via NestJS's `overrideProvider()` for integration tests, with a smaller suite of true end-to-end smoke tests running against a dedicated test database.

See [`docs/TDD.md`](docs/TDD.md) for the full test case breakdown.

---

## Assumptions

- **Currency:** All prices are in GBP (£), stored as JavaScript `number` (float). Display is rounded to 2 decimal places. No real payment processing.
- **Single active cart per session:** The mobile app manages one `cartId` at a time via AsyncStorage.
- **Best-value discount wins:** Only the highest-saving eligible discount is applied. Discounts do not stack.
- **BuyNGetOneFree** applies per product line (not mixed across different products).
- **Cart expiry is approximate:** The scheduler runs every 30 seconds, so a cart may be active for up to 2.5 minutes before expiry fires. This is acceptable for the exercise.
- **Stock reservation and checkout are not atomic:** In-memory single-process — race conditions between concurrent requests are not a concern for this exercise.
- **No pagination:** The product catalogue is small enough to return in a single response.
- **Estimated delivery** in the order summary is a simulated value: 3 business days from the confirmed date.
- **Physical device testing** requires setting `EXPO_PUBLIC_API_URL` to the host machine's LAN IP (see above).
- **`POST /carts`** creates the cart server-side and returns a UUID `cartId`. The client stores this in AsyncStorage and includes it in all subsequent cart requests.
