import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props {
  stock: number;
}

export function StockBadge({ stock }: Props) {
  if (stock === 0) {
    return <View style={[styles.badge, styles.outOfStock]}><Text style={styles.text}>Out of stock</Text></View>;
  }
  if (stock <= 3) {
    return <View style={[styles.badge, styles.low]}><Text style={styles.text}>Only {stock} left</Text></View>;
  }
  return <View style={[styles.badge, styles.inStock]}><Text style={styles.text}>In stock</Text></View>;
}

const styles = StyleSheet.create({
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, alignSelf: 'flex-start' },
  text: { fontSize: 12, fontWeight: '600', color: '#fff' },
  inStock: { backgroundColor: '#16A34A' },
  low: { backgroundColor: '#D97706' },
  outOfStock: { backgroundColor: '#DC2626' },
});
