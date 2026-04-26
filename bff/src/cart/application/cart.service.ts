import { Injectable, Inject } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { Cart, CartItem } from '../domain/cart.entity';
import type { ICartRepository } from '../domain/repositories/cart.repository.interface';
import { CART_REPOSITORY } from '../domain/repositories/cart.repository.interface';
import type { IProductRepository } from '../../catalogue/domain/repositories/product.repository.interface';
import { PRODUCT_REPOSITORY } from '../../catalogue/domain/repositories/product.repository.interface';
import { ReservationService } from './reservation.service';
import { DiscountEngineService } from '../../catalogue/application/discount-engine/discount-engine.service';
import {
  CartNotFoundException,
  CartExpiredException,
  CartAlreadyCheckedOutException,
  ProductNotFoundException,
  InsufficientStockToAddException,
} from '../../shared/exceptions/domain.exception';
import { CartItemSummary } from '../../catalogue/application/discount-engine/discount-strategy.interface';

@Injectable()
export class CartService {
  constructor(
    @Inject(CART_REPOSITORY) private readonly cartRepo: ICartRepository,
    @Inject(PRODUCT_REPOSITORY) private readonly productRepo: IProductRepository,
    private readonly reservationService: ReservationService,
    private readonly discountEngine: DiscountEngineService,
  ) {}

  private readonly EXPIRY_MS = 2 * 60 * 1000;
  private readonly expiryTimers = new Map<string, NodeJS.Timeout>();

  async createCart(): Promise<{ cartId: string }> {
    const cart = new Cart(uuidv4());
    await this.cartRepo.save(cart);
    this.scheduleExpiry(cart.id);
    return { cartId: cart.id };
  }

  async getCart(cartId: string) {
    const cart = await this.resolveActiveCart(cartId);
    return this.buildCartView(cart);
  }

  async addItem(cartId: string, productId: string, quantity: number) {
    const cart = await this.resolveActiveCart(cartId);
    const product = await this.productRepo.findById(productId);
    if (!product) throw new ProductNotFoundException(productId);

    const existingQty = cart.findItem(productId)?.quantity ?? 0;
    const totalRequested = existingQty + quantity;

    if (totalRequested > product.stockAvailable + existingQty) {
      throw new InsufficientStockToAddException(product.name, product.stockAvailable);
    }

    const existing = cart.findItem(productId);
    if (existing) {
      existing.quantity += quantity;
    } else {
      cart.items.push(new CartItem(productId, quantity, product.price));
    }

    await this.reservationService.reserve(productId, quantity);
    cart.touch();
    await this.cartRepo.save(cart);
    this.scheduleExpiry(cartId);
    return this.buildCartView(cart);
  }

  async updateItem(cartId: string, productId: string, quantity: number) {
    const cart = await this.resolveActiveCart(cartId);
    const item = cart.findItem(productId);
    if (!item) throw new ProductNotFoundException(productId);

    const product = await this.productRepo.findById(productId);
    if (!product) throw new ProductNotFoundException(productId);

    const delta = quantity - item.quantity;

    if (delta > 0 && delta > product.stockAvailable) {
      throw new InsufficientStockToAddException(product.name, product.stockAvailable);
    }

    if (quantity === 0) {
      cart.items = cart.items.filter((i) => i.productId !== productId);
      await this.reservationService.release(productId, item.quantity);
    } else {
      item.quantity = quantity;
      if (delta > 0) await this.reservationService.reserve(productId, delta);
      if (delta < 0) await this.reservationService.release(productId, -delta);
    }

    cart.touch();
    await this.cartRepo.save(cart);
    this.scheduleExpiry(cartId);
    return this.buildCartView(cart);
  }

  async removeItem(cartId: string, productId: string) {
    const cart = await this.resolveActiveCart(cartId);
    const item = cart.findItem(productId);
    if (!item) throw new ProductNotFoundException(productId);

    cart.items = cart.items.filter((i) => i.productId !== productId);
    await this.reservationService.release(productId, item.quantity);
    cart.touch();
    await this.cartRepo.save(cart);
    this.scheduleExpiry(cartId);
    return this.buildCartView(cart);
  }

  async abandonCart(cartId: string): Promise<void> {
    this.cancelExpiry(cartId);
    const cart = await this.cartRepo.findById(cartId);
    if (!cart) return;
    await this.reservationService.releaseAll(cart);
    cart.status = 'expired';
    await this.cartRepo.save(cart);
  }

  private scheduleExpiry(cartId: string): void {
    const existing = this.expiryTimers.get(cartId);
    if (existing) clearTimeout(existing);
    this.expiryTimers.set(
      cartId,
      setTimeout(async () => { await this.expireCart(cartId); }, this.EXPIRY_MS),
    );
  }

  private cancelExpiry(cartId: string): void {
    const existing = this.expiryTimers.get(cartId);
    if (existing) {
      clearTimeout(existing);
      this.expiryTimers.delete(cartId);
    }
  }

  private async expireCart(cartId: string): Promise<void> {
    this.expiryTimers.delete(cartId);
    const cart = await this.cartRepo.findById(cartId);
    if (!cart || cart.status !== 'active') return;
    await this.reservationService.releaseAll(cart);
    cart.status = 'expired';
    await this.cartRepo.save(cart);
  }

  private async resolveActiveCart(cartId: string): Promise<Cart> {
    const cart = await this.cartRepo.findById(cartId);
    if (!cart) throw new CartNotFoundException(cartId);
    if (cart.status === 'expired') throw new CartExpiredException(cartId);
    if (cart.status === 'checked_out') throw new CartAlreadyCheckedOutException(cartId);
    return cart;
  }

  private async buildCartView(cart: Cart) {
    const products = await Promise.all(
      cart.items.map((item) => this.productRepo.findById(item.productId)),
    );

    const itemSummaries: CartItemSummary[] = cart.items.map((item, i) => ({
      productId: item.productId,
      category: products[i]?.category ?? '',
      quantity: item.quantity,
      unitPrice: item.unitPriceSnapshot,
      lineTotal: item.lineTotal,
    }));

    const subtotal = cart.subtotal;
    const cartSummary = { items: itemSummaries, subtotal };
    const discount = await this.discountEngine.getBestDiscount(cartSummary);
    const total = discount ? parseFloat((subtotal - discount.saving).toFixed(2)) : subtotal;

    return {
      id: cart.id,
      status: cart.status,
      items: cart.items.map((item, i) => ({
        productId: item.productId,
        name: products[i]?.name ?? item.productId,
        unitPrice: item.unitPriceSnapshot,
        quantity: item.quantity,
        lineTotal: item.lineTotal,
      })),
      subtotal,
      discountApplied: discount,
      total,
      lastActivityAt: cart.lastActivityAt,
    };
  }
}
