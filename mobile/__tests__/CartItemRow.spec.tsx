import React from 'react';
import { act, render, fireEvent } from '@testing-library/react-native';
import { CartItemRow } from '../src/components/cart/CartItemRow';
import { CartItem } from '../src/types';

const makeItem = (quantity = 2): CartItem => ({
  productId: 'prod_001',
  name: 'Sony Headphones',
  unitPrice: 299.99,
  quantity,
  lineTotal: parseFloat((quantity * 299.99).toFixed(2)),
});

describe('CartItemRow', () => {
  let onQuantityChange: jest.Mock;
  let onRemove: jest.Mock;

  beforeEach(() => {
    jest.useFakeTimers();
    onQuantityChange = jest.fn();
    onRemove = jest.fn();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders item name, unit price, quantity and line total', () => {
    const { getByText } = render(
      <CartItemRow item={makeItem(2)} onQuantityChange={onQuantityChange} onRemove={onRemove} />
    );
    expect(getByText('Sony Headphones')).toBeTruthy();
    expect(getByText('£299.99 each')).toBeTruthy();
    expect(getByText('2')).toBeTruthy();
    expect(getByText('£599.98')).toBeTruthy();
  });

  describe('increment (+)', () => {
    it('immediately updates the displayed quantity', () => {
      const { getByText } = render(
        <CartItemRow item={makeItem(2)} onQuantityChange={onQuantityChange} onRemove={onRemove} />
      );
      fireEvent.press(getByText('+'));
      expect(getByText('3')).toBeTruthy();
    });

    it('does not call onQuantityChange until the debounce settles', () => {
      const { getByText } = render(
        <CartItemRow item={makeItem(2)} onQuantityChange={onQuantityChange} onRemove={onRemove} />
      );
      fireEvent.press(getByText('+'));
      expect(onQuantityChange).not.toHaveBeenCalled();
      act(() => { jest.advanceTimersByTime(500); });
      expect(onQuantityChange).toHaveBeenCalledTimes(1);
      expect(onQuantityChange).toHaveBeenCalledWith(3);
    });

    it('collapses rapid presses into a single callback with the final value', () => {
      const { getByText } = render(
        <CartItemRow item={makeItem(2)} onQuantityChange={onQuantityChange} onRemove={onRemove} />
      );
      fireEvent.press(getByText('+'));
      fireEvent.press(getByText('+'));
      fireEvent.press(getByText('+'));
      act(() => { jest.advanceTimersByTime(500); });
      expect(onQuantityChange).toHaveBeenCalledTimes(1);
      expect(onQuantityChange).toHaveBeenCalledWith(5);
    });
  });

  describe('decrement (−)', () => {
    it('immediately updates the displayed quantity when qty > 1', () => {
      const { getByText } = render(
        <CartItemRow item={makeItem(2)} onQuantityChange={onQuantityChange} onRemove={onRemove} />
      );
      fireEvent.press(getByText('−'));
      expect(getByText('1')).toBeTruthy();
      act(() => { jest.advanceTimersByTime(500); });
      expect(onQuantityChange).toHaveBeenCalledWith(1);
    });

    it('calls onRemove instead of onQuantityChange when qty is 1', () => {
      const { getByText } = render(
        <CartItemRow item={makeItem(1)} onQuantityChange={onQuantityChange} onRemove={onRemove} />
      );
      fireEvent.press(getByText('−'));
      expect(onRemove).toHaveBeenCalledTimes(1);
      expect(onQuantityChange).not.toHaveBeenCalled();
    });
  });

  describe('Remove button', () => {
    it('calls onRemove when pressed', () => {
      const { getByText } = render(
        <CartItemRow item={makeItem(2)} onQuantityChange={onQuantityChange} onRemove={onRemove} />
      );
      fireEvent.press(getByText('Remove'));
      expect(onRemove).toHaveBeenCalledTimes(1);
    });

    it('only calls onRemove once when pressed twice in quick succession', () => {
      const { getByText } = render(
        <CartItemRow item={makeItem(2)} onQuantityChange={onQuantityChange} onRemove={onRemove} />
      );
      fireEvent.press(getByText('Remove'));
      fireEvent.press(getByText('Remove'));
      expect(onRemove).toHaveBeenCalledTimes(1);
    });
  });

  describe('external prop update', () => {
    it('syncs displayed quantity when prop changes and no debounce is pending', () => {
      const { getByText, rerender } = render(
        <CartItemRow item={makeItem(2)} onQuantityChange={onQuantityChange} onRemove={onRemove} />
      );
      rerender(
        <CartItemRow item={makeItem(5)} onQuantityChange={onQuantityChange} onRemove={onRemove} />
      );
      expect(getByText('5')).toBeTruthy();
    });

    it('does not overwrite local quantity while a debounce is in flight', () => {
      const { getByText, rerender } = render(
        <CartItemRow item={makeItem(2)} onQuantityChange={onQuantityChange} onRemove={onRemove} />
      );
      fireEvent.press(getByText('+'));
      // Debounce is now in flight with local qty=3; parent re-renders with original qty=2
      rerender(
        <CartItemRow item={makeItem(2)} onQuantityChange={onQuantityChange} onRemove={onRemove} />
      );
      expect(getByText('3')).toBeTruthy();
      act(() => { jest.advanceTimersByTime(500); });
    });
  });
});
