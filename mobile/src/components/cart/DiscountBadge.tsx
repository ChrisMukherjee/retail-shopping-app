import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AppliedDiscount } from '../../types';

interface Props {
  discount: AppliedDiscount;
}

export function DiscountBadge({ discount }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>🏷 {discount.description}</Text>
      <Text style={styles.saving}>-£{discount.saving.toFixed(2)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#DCFCE7', padding: 10, borderRadius: 8, marginVertical: 4 },
  label: { fontSize: 13, color: '#166534', flex: 1 },
  saving: { fontSize: 14, fontWeight: '700', color: '#16A34A' },
});
