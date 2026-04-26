# Product Requirements Document — Retail Shopping App

## Overview

A full-stack retail shopping experience consisting of a React Native mobile app backed by a NestJS Backend for Frontend (BFF) API. The domain is a retail cart system with a product catalogue and a discount engine.

**Scope:** Single customer-facing flow — browse products, build a cart, checkout.  
**Actor:** Customer (no authentication required).

---

## User Stories

### Catalogue

| ID | Story | Acceptance Criteria |
|----|-------|---------------------|
| CAT-01 | As a customer, I want to browse all available products so I can decide what to buy. | Product listing shows name, price, and current stock availability. Out-of-stock products are visually distinguished. |
| CAT-02 | As a customer, I want to view the full details of a product so I can make an informed decision. | Product detail shows name, description, price, stock level, and any applicable discounts. |
| CAT-03 | As a customer, I want to see live stock levels so I know whether an item is available. | Stock count displayed; updates after checkout. |

### Cart

| ID | Story | Acceptance Criteria |
|----|-------|---------------------|
| CART-01 | As a customer, I want to add a product to my cart from the product detail screen. | Item appears in cart with correct quantity and line price. |
| CART-02 | As a customer, I want to change the quantity of an item in my cart. | Quantity updates; line total and cart total recalculate immediately. Cannot exceed available stock. |
| CART-03 | As a customer, I want to remove an item from my cart. | Item is removed; totals recalculate. |
| CART-04 | As a customer, I want to see my cart's running total so I know what I'll be charged. | Cart screen shows subtotal, discount savings (if any), and grand total. |
| CART-05 | As a customer, I want any applicable discounts applied automatically so I get the best price. | Discount line items appear in cart summary; no manual coupon codes required. |

### Checkout

| ID | Story | Acceptance Criteria |
|----|-------|---------------------|
| CHK-01 | As a customer, I want to check out successfully when all items are in stock. | Order summary displayed: order ID, items, discounts applied, total paid, estimated delivery. Stock levels in BFF decrease accordingly. |
| CHK-02 | As a customer, I want clear feedback when checkout fails due to insufficient stock. | User-readable message lists exactly which items are unavailable and by how much. |
| CHK-03 | As a customer, I want my cart to be cleared after a successful checkout. | Cart returns to empty state; customer can start a new session. |

### Stock Reservation

| ID | Story | Acceptance Criteria |
|----|-------|---------------------|
| RSV-01 | As a system, stock is soft-reserved while a cart is active. | Adding an item to cart reduces the visible available quantity for other carts. |
| RSV-02 | As a system, reservations are released when a cart is inactive for 2 minutes. | After 2 min of no activity, available stock is restored. |
| RSV-03 | As a system, reservations are released on checkout (success or failure). | Whether checkout passes or fails, the reservation lock is dropped immediately. |

---

## Out of Scope

- User authentication / accounts
- Payment processing (simulated only)
- Admin product/discount management endpoints
- Push notifications
- Order history
- Cloud deployment

---

## Discount Types (Seed Data)

Five promotional discount types will be seeded at BFF startup:

| Type | Example | Engine Behaviour |
|------|---------|-----------------|
| **Percentage off entire cart** | 10% off everything | Applies to cart subtotal |
| **Buy N get 1 free** | Buy 3, get 1 free (per product) | Reduces quantity charged |
| **Minimum spend threshold** | 15% off when cart ≥ £100 | Percentage applied once threshold met |
| **Category percentage** | 20% off all Electronics | Applies only to matching category items |
| **Fixed amount off cart** | £5 off when cart ≥ £30 | Flat deduction from subtotal |

Only one discount is applied per cart (best-value wins), unless discounts are stackable (to be decided by the discount engine — see SYSTEM_DESIGN.md).

---

## Error States & Feedback

| Scenario | User-facing Message |
|----------|---------------------|
| Item out of stock (add to cart) | "Only X left in stock" / "Out of stock" |
| Checkout fails — insufficient stock | "Sorry, [Product] only has X in stock. Please update your cart." |
| Checkout fails — cart empty | "Your cart is empty." |
| Network error | "Something went wrong. Please try again." |
| Cart expired (2 min timeout) | "Your session expired and your cart was cleared." |
