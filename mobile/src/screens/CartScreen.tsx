import React, { useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';
import { useCartStore } from '../stores/useCartStore';
import { useCheckoutStore } from '../stores/useCheckoutStore';
import { CartItemRow } from '../components/cart/CartItemRow';
import { DiscountBadge } from '../components/cart/DiscountBadge';
import { ErrorMessage } from '../components/shared/ErrorMessage';
import { EmptyState } from '../components/shared/EmptyState';
import { LoadingSpinner } from '../components/shared/LoadingSpinner';

type Props = NativeStackScreenProps<RootStackParamList, 'Cart'>;

export function CartScreen({ navigation }: Props) {
  const { cart, isLoading, error, fetchCart, updateItem, removeItem, cartId, clearError } = useCartStore();
  const { checkout, isLoading: checkoutLoading } = useCheckoutStore();
  const cartError = useCheckoutStore((s) => s.error);

  useEffect(() => {
    fetchCart();
  }, []);

  useFocusEffect(
    useCallback(() => {
      return () => clearError();
    }, [clearError])
  );

  const handleCheckout = async () => {
    if (!cartId) return;
    const success = await checkout(cartId);
    if (success) {
      await useCartStore.getState().clearCart();
    }
    navigation.navigate('CheckoutResult');
  };

  if (isLoading && !cart) {
    return <LoadingSpinner />;
  }

  const isEmpty = !cart || cart.items.length === 0;

  return (
    <View style={styles.container}>
      {error && <ErrorMessage message={error.message} />}
      {cartError && <ErrorMessage message={`Checkout failed: ${cartError.message}`} />}

      {isEmpty ? (
        <EmptyState message={`Your cart is empty.\nBrowse products to get started.`} />
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {cart.items.map((item) => (
            <CartItemRow
              key={item.productId}
              item={item}
              onQuantityChange={(qty) => updateItem(item.productId, qty)}
              onRemove={() => removeItem(item.productId)}
            />
          ))}

          <View style={styles.summary}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>£{cart.subtotal.toFixed(2)}</Text>
            </View>

            {cart.discountApplied && (
              <DiscountBadge discount={cart.discountApplied} />
            )}

            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>£{cart.total.toFixed(2)}</Text>
            </View>
          </View>
        </ScrollView>
      )}

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.checkoutBtn, (isEmpty || checkoutLoading) && styles.checkoutBtnDisabled]}
          onPress={handleCheckout}
          disabled={isEmpty || checkoutLoading}
          accessibilityLabel="Checkout"
        >
          <Text style={styles.checkoutBtnText}>
            {checkoutLoading ? 'Processing…' : 'Checkout'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  content: { padding: 16 },
  summary: { marginTop: 16, backgroundColor: '#fff', borderRadius: 10, padding: 16 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  summaryLabel: { fontSize: 15, color: '#6B7280' },
  summaryValue: { fontSize: 15, color: '#111827', fontWeight: '600' },
  totalRow: { marginTop: 8, borderTopWidth: 1, borderTopColor: '#E5E7EB', paddingTop: 12 },
  totalLabel: { fontSize: 17, fontWeight: '700', color: '#111827' },
  totalValue: { fontSize: 17, fontWeight: '800', color: '#1D4ED8' },
  footer: { padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#E5E7EB' },
  checkoutBtn: { backgroundColor: '#1D4ED8', padding: 16, borderRadius: 10, alignItems: 'center' },
  checkoutBtnDisabled: { backgroundColor: '#9CA3AF' },
  checkoutBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
