import { Injectable, Inject } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import type { ICartRepository } from '../../cart/domain/repositories/cart.repository.interface';
import { CART_REPOSITORY } from '../../cart/domain/repositories/cart.repository.interface';
import type { IProductRepository } from '../../catalogue/domain/repositories/product.repository.interface';
import { PRODUCT_REPOSITORY } from '../../catalogue/domain/repositories/product.repository.interface';
import { ReservationService } from '../../cart/application/reservation.service';
import { DiscountEngineService } from '../../catalogue/application/discount-engine/discount-engine.service';
import { Order, OrderItem } from '../domain/order.entity';
import {
  CartNotFoundException,
  CartExpiredException,
  CartAlreadyCheckedOutException,
  InsufficientStockException,
} from '../../shared/exceptions/domain.exception';
import { CartItemSummary } from '../../catalogue/application/discount-engine/discount-strategy.interface';

@Injectable()
export class CheckoutService {
  constructor(
    @Inject(CART_REPOSITORY) private readonly cartRepo: ICartRepository,
    @Inject(PRODUCT_REPOSITORY) private readonly productRepo: IProductRepository,
    private readonly reservationService: ReservationService,
    private readonly discountEngine: DiscountEngineService,
  ) {}

  async checkout(cartId: string) {
    const cart = await this.cartRepo.findById(cartId);
    if (!cart) throw new CartNotFoundException(cartId);
    if (cart.status === 'expired') throw new CartExpiredException(cartId);
    if (cart.status === 'checked_out') throw new CartAlreadyCheckedOutException(cartId);

    const products = await Promise.all(
      cart.items.map((item) => this.productRepo.findById(item.productId)),
    );

    // Reservations must be released before validating stock. If we validated first,
    // the cart's own stockReserved would make stockAvailable appear lower than it is,
    // producing a false-positive INSUFFICIENT_STOCK on the customer's own items.
    // Reservations are not re-applied on failure — the customer must start a new cart.
    await this.reservationService.releaseAll(cart);
    cart.status = 'checked_out';
    await this.cartRepo.save(cart);

    // Re-fetch after release so stockAvailable reflects the updated stockReserved values.
    const freshProducts = await Promise.all(
      cart.items.map((item) => this.productRepo.findById(item.productId)),
    );

    const stockIssues: { productId: string; name: string; requested: number; available: number }[] = [];
    for (let i = 0; i < cart.items.length; i++) {
      const item = cart.items[i];
      const product = freshProducts[i];
      if (!product || product.stockAvailable < item.quantity) {
        stockIssues.push({
          productId: item.productId,
          name: product?.name ?? item.productId,
          requested: item.quantity,
          available: product?.stockAvailable ?? 0,
        });
      }
    }

    if (stockIssues.length > 0) {
      throw new InsufficientStockException(stockIssues);
    }

    // Commit stock
    for (let i = 0; i < cart.items.length; i++) {
      const item = cart.items[i];
      const product = freshProducts[i]!;
      product.stockTotal -= item.quantity;
      await this.productRepo.save(product);
    }

    // Compute discount
    const itemSummaries: CartItemSummary[] = cart.items.map((item, i) => ({
      productId: item.productId,
      category: freshProducts[i]?.category ?? '',
      quantity: item.quantity,
      unitPrice: item.unitPriceSnapshot,
      lineTotal: item.lineTotal,
    }));

    const subtotal = cart.subtotal;
    const discount = await this.discountEngine.getBestDiscount({ items: itemSummaries, subtotal });
    const total = discount ? parseFloat((subtotal - discount.saving).toFixed(2)) : subtotal;

    const orderItems: OrderItem[] = cart.items.map((item, i) => ({
      productId: item.productId,
      name: freshProducts[i]?.name ?? item.productId,
      quantity: item.quantity,
      unitPrice: item.unitPriceSnapshot,
      lineTotal: item.lineTotal,
    }));

    const confirmedAt = new Date();
    const estimatedDelivery = this.addBusinessDays(confirmedAt, 3);

    const order = new Order(
      `ord_${uuidv4().slice(0, 8)}`,
      cartId,
      orderItems,
      subtotal,
      discount,
      total,
      confirmedAt,
      estimatedDelivery,
    );

    return {
      orderId: order.id,
      status: 'confirmed',
      items: order.items,
      subtotal: order.subtotal,
      discountApplied: order.discountApplied,
      total: order.total,
      confirmedAt: order.confirmedAt,
      estimatedDelivery: order.estimatedDelivery,
    };
  }

  private addBusinessDays(date: Date, days: number): Date {
    const result = new Date(date);
    let added = 0;
    while (added < days) {
      result.setDate(result.getDate() + 1);
      const day = result.getDay();
      if (day !== 0 && day !== 6) added++;
    }
    return result;
  }
}
