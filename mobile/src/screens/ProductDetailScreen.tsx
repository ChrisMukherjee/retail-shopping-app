import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useProductStore } from '../stores/useProductStore';
import { useCartStore } from '../stores/useCartStore';
import { StockBadge } from '../components/shared/StockBadge';
import { ErrorMessage } from '../components/shared/ErrorMessage';

type Props = NativeStackScreenProps<RootStackParamList, 'ProductDetail'>;

export function ProductDetailScreen({ route, navigation }: Props) {
  const { productId } = route.params;
  const { selectedProduct, isLoading, error, fetchProduct } = useProductStore();
  const { addItem, isLoading: cartLoading, error: cartError } = useCartStore();
  const [qty, setQty] = useState(1);

  useEffect(() => {
    fetchProduct(productId);
  }, [productId]);

  const handleAddToCart = async () => {
    if (!selectedProduct) return;
    try {
      await addItem(selectedProduct.id, qty);
      Alert.alert('Added to cart', `${qty} × ${selectedProduct.name} added.`);
    } catch {
      // error already set in store
    }
  };

  if (isLoading || !selectedProduct) {
    return <View style={styles.center}><ActivityIndicator size="large" /></View>;
  }

  const canAdd = selectedProduct.stockAvailable >= qty;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {error && <ErrorMessage message={error} />}
      {cartError && <ErrorMessage message={cartError} />}

      <Text style={styles.name}>{selectedProduct.name}</Text>
      <Text style={styles.category}>{selectedProduct.category}</Text>
      <Text style={styles.price}>£{selectedProduct.price.toFixed(2)}</Text>
      <StockBadge stock={selectedProduct.stockAvailable} />
      <Text style={styles.description}>{selectedProduct.description}</Text>

      <View style={styles.qtyRow}>
        <Text style={styles.qtyLabel}>Quantity</Text>
        <View style={styles.qtyControls}>
          <TouchableOpacity style={styles.btn} onPress={() => setQty((q) => Math.max(1, q - 1))}>
            <Text style={styles.btnText}>−</Text>
          </TouchableOpacity>
          <Text style={styles.qty}>{qty}</Text>
          <TouchableOpacity
            style={styles.btn}
            onPress={() => setQty((q) => Math.min(selectedProduct.stockAvailable, q + 1))}
            disabled={qty >= selectedProduct.stockAvailable}
          >
            <Text style={styles.btnText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.addBtn, (!canAdd || cartLoading) && styles.addBtnDisabled]}
        onPress={handleAddToCart}
        disabled={!canAdd || cartLoading}
        accessibilityLabel="Add to Cart"
      >
        <Text style={styles.addBtnText}>
          {cartLoading ? 'Adding…' : canAdd ? 'Add to Cart' : 'Out of Stock'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.cartLink} onPress={() => navigation.navigate('Cart')}>
        <Text style={styles.cartLinkText}>View Cart →</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 20 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 22, fontWeight: '700', color: '#111827', marginBottom: 4 },
  category: { fontSize: 13, color: '#6B7280', marginBottom: 8 },
  price: { fontSize: 26, fontWeight: '800', color: '#1D4ED8', marginBottom: 10 },
  description: { fontSize: 15, color: '#374151', lineHeight: 22, marginVertical: 16 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  qtyLabel: { fontSize: 16, fontWeight: '600', color: '#111827' },
  qtyControls: { flexDirection: 'row', alignItems: 'center' },
  btn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center' },
  btnText: { fontSize: 20, color: '#374151', lineHeight: 24 },
  qty: { fontSize: 18, fontWeight: '600', marginHorizontal: 16, minWidth: 24, textAlign: 'center' },
  addBtn: { backgroundColor: '#1D4ED8', padding: 16, borderRadius: 10, alignItems: 'center' },
  addBtnDisabled: { backgroundColor: '#9CA3AF' },
  addBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  cartLink: { marginTop: 16, alignItems: 'center' },
  cartLinkText: { color: '#1D4ED8', fontSize: 15 },
});
