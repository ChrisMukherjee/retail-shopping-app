import React from 'react';
import { render } from '@testing-library/react-native';
import { StockBadge } from '../src/components/shared/StockBadge';

describe('StockBadge', () => {
  it('shows "Out of stock" when stock is 0', () => {
    const { getByText } = render(<StockBadge stock={0} />);
    expect(getByText('Out of stock')).toBeTruthy();
  });

  it('shows "Only N left" for low stock', () => {
    const { getByText } = render(<StockBadge stock={2} />);
    expect(getByText('Only 2 left')).toBeTruthy();
  });

  it('shows "In stock" for sufficient stock', () => {
    const { getByText } = render(<StockBadge stock={10} />);
    expect(getByText('In stock')).toBeTruthy();
  });
});
