import { act } from 'react';
import { useCheckoutStore } from '../src/stores/useCheckoutStore';
import { checkoutService } from '../src/services/checkout.service';

jest.mock('../src/services/checkout.service');

const mockOrder = {
  orderId: 'ord_123',
  status: 'confirmed',
  items: [{ productId: 'prod_001', name: 'Product', quantity: 1, unitPrice: 100, lineTotal: 100 }],
  subtotal: 100,
  discountApplied: null,
  total: 100,
  confirmedAt: new Date().toISOString(),
  estimatedDelivery: new Date().toISOString(),
};

describe('useCheckoutStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useCheckoutStore.setState({ order: null, error: null, isLoading: false });
  });

  it('sets order on successful checkout', async () => {
    (checkoutService.checkout as jest.Mock).mockResolvedValue(mockOrder);

    let success: boolean;
    await act(async () => {
      success = await useCheckoutStore.getState().checkout('cart_1');
    });

    expect(success!).toBe(true);
    expect(useCheckoutStore.getState().order?.orderId).toBe('ord_123');
    expect(useCheckoutStore.getState().error).toBeNull();
  });

  it('sets error on failed checkout', async () => {
    (checkoutService.checkout as jest.Mock).mockRejectedValue({
      code: 'INSUFFICIENT_STOCK',
      message: 'Some items unavailable.',
      details: [{ productId: 'prod_001', name: 'Product', requested: 2, available: 0 }],
    });

    let success: boolean;
    await act(async () => {
      success = await useCheckoutStore.getState().checkout('cart_1');
    });

    expect(success!).toBe(false);
    expect(useCheckoutStore.getState().error?.code).toBe('INSUFFICIENT_STOCK');
    expect(useCheckoutStore.getState().order).toBeNull();
  });

  it('reset clears order and error', () => {
    useCheckoutStore.setState({ order: mockOrder as any, error: { code: 'ERR', message: 'err' } });

    act(() => {
      useCheckoutStore.getState().reset();
    });

    expect(useCheckoutStore.getState().order).toBeNull();
    expect(useCheckoutStore.getState().error).toBeNull();
  });
});
