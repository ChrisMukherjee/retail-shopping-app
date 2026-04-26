import React from 'react';
import { render } from '@testing-library/react-native';
import { DiscountBadge } from '../src/components/cart/DiscountBadge';

const discount = { discountId: 'd1', description: '10% off your entire order', saving: 15.5 };

describe('DiscountBadge', () => {
  it('renders the discount description', () => {
    const { getByText } = render(<DiscountBadge discount={discount} />);
    expect(getByText(/10% off your entire order/)).toBeTruthy();
  });

  it('renders the saving amount', () => {
    const { getByText } = render(<DiscountBadge discount={discount} />);
    expect(getByText('-£15.50')).toBeTruthy();
  });
});
