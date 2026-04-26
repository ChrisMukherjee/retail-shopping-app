import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Product } from '../../types';
import { StockBadge } from '../shared/StockBadge';

interface Props {
  product: Product;
  onPress: () => void;
}

export function ProductCard({ product, onPress }: Props) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.row}>
        <Text style={styles.name} numberOfLines={2}>{product.name}</Text>
        <Text style={styles.price}>£{product.price.toFixed(2)}</Text>
      </View>
      <View style={styles.footer}>
        <Text style={styles.category}>{product.category}</Text>
        <StockBadge stock={product.stockAvailable} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 10, padding: 16, marginHorizontal: 16, marginVertical: 6, elevation: 2, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  name: { flex: 1, fontSize: 15, fontWeight: '600', color: '#111827', marginRight: 8 },
  price: { fontSize: 16, fontWeight: '700', color: '#1D4ED8' },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  category: { fontSize: 12, color: '#6B7280' },
});
