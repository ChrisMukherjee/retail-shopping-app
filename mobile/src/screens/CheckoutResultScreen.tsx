import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';
import { useCheckoutStore } from '../stores/useCheckoutStore';

type Props = NativeStackScreenProps<RootStackParamList, 'CheckoutResult'>;

export function CheckoutResultScreen({ navigation }: Props) {
  const { order: storeOrder, error: storeError, reset } = useCheckoutStore();
  const [order] = useState(storeOrder);
  const [error] = useState(storeError);

  useFocusEffect(
    useCallback(() => {
      return () => reset();
    }, [reset])
  );

  const handleContinue = () => {
    navigation.reset({ index: 0, routes: [{ name: 'ProductList' }] });
  };

  if (order) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.successIcon}>✅</Text>
        <Text style={styles.title}>Order Confirmed!</Text>
        <Text style={styles.subtitle}>Order ID: {order.orderId}</Text>

        <View style={styles.card}>
          {order.items.map((item) => (
            <View key={item.productId} style={styles.itemRow}>
              <Text style={styles.itemName} numberOfLines={1}>{item.name} × {item.quantity}</Text>
              <Text style={styles.itemTotal}>£{item.lineTotal.toFixed(2)}</Text>
            </View>
          ))}

          <View style={styles.divider} />

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>£{order.subtotal.toFixed(2)}</Text>
          </View>

          {order.discountApplied && (
            <View style={styles.summaryRow}>
              <Text style={styles.discountLabel}>{order.discountApplied.description}</Text>
              <Text style={styles.discountValue}>-£{order.discountApplied.saving.toFixed(2)}</Text>
            </View>
          )}

          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total paid</Text>
            <Text style={styles.totalValue}>£{order.total.toFixed(2)}</Text>
          </View>
        </View>

        <Text style={styles.delivery}>
          Estimated delivery: {new Date(order.estimatedDelivery).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
        </Text>

        <TouchableOpacity style={styles.continueBtn} onPress={handleContinue}>
          <Text style={styles.continueBtnText}>Continue Shopping</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.errorIcon}>❌</Text>
      <Text style={styles.errorTitle}>Checkout Failed</Text>
      <Text style={styles.errorMessage}>{error?.message ?? 'Something went wrong.'}</Text>

      {error?.details && error.details.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.detailsHeader}>Unavailable items:</Text>
          {error.details.map((d) => (
            <Text key={d.productId} style={styles.detailItem}>
              • {d.name}: requested {d.requested}, only {d.available} available
            </Text>
          ))}
        </View>
      )}

      <TouchableOpacity
        style={styles.retryBtn}
        onPress={() => navigation.reset({ index: 1, routes: [{ name: 'ProductList' }, { name: 'Cart' }] })}
      >
        <Text style={styles.retryBtnText}>Update Cart</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  content: { padding: 24, alignItems: 'center' },
  successIcon: { fontSize: 56, marginBottom: 12 },
  title: { fontSize: 24, fontWeight: '800', color: '#111827', marginBottom: 4 },
  subtitle: { fontSize: 13, color: '#6B7280', marginBottom: 24 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, width: '100%', marginBottom: 16 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  itemName: { flex: 1, fontSize: 14, color: '#374151', marginRight: 8 },
  itemTotal: { fontSize: 14, fontWeight: '600', color: '#111827' },
  divider: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 12 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  summaryLabel: { fontSize: 14, color: '#6B7280' },
  summaryValue: { fontSize: 14, color: '#111827' },
  discountLabel: { fontSize: 14, color: '#16A34A' },
  discountValue: { fontSize: 14, fontWeight: '600', color: '#16A34A' },
  totalRow: { borderTopWidth: 1, borderTopColor: '#E5E7EB', paddingTop: 10, marginTop: 4 },
  totalLabel: { fontSize: 16, fontWeight: '700', color: '#111827' },
  totalValue: { fontSize: 16, fontWeight: '800', color: '#1D4ED8' },
  delivery: { fontSize: 14, color: '#6B7280', marginBottom: 24, textAlign: 'center' },
  continueBtn: { backgroundColor: '#1D4ED8', padding: 16, borderRadius: 10, width: '100%', alignItems: 'center' },
  continueBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  errorIcon: { fontSize: 56, marginBottom: 12 },
  errorTitle: { fontSize: 22, fontWeight: '800', color: '#B91C1C', marginBottom: 8 },
  errorMessage: { fontSize: 15, color: '#374151', textAlign: 'center', marginBottom: 16 },
  detailsHeader: { fontSize: 14, fontWeight: '700', color: '#374151', marginBottom: 8 },
  detailItem: { fontSize: 13, color: '#6B7280', marginBottom: 4 },
  retryBtn: { backgroundColor: '#DC2626', padding: 16, borderRadius: 10, width: '100%', alignItems: 'center' },
  retryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
