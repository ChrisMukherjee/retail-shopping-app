import React, { useEffect, useCallback } from 'react';
import { FlatList, View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';
import { useProductStore } from '../stores/useProductStore';
import { useCartStore } from '../stores/useCartStore';
import { ProductCard } from '../components/catalogue/ProductCard';
import { ErrorMessage } from '../components/shared/ErrorMessage';
import { EmptyState } from '../components/shared/EmptyState';
import { LoadingSpinner } from '../components/shared/LoadingSpinner';

type Props = NativeStackScreenProps<RootStackParamList, 'ProductList'>;

export function ProductListScreen({ navigation }: Props) {
  const { products, isLoading, error, fetchProducts } = useProductStore();
  const { cart, fetchCart } = useCartStore();
  const cartCount = cart?.items.reduce((sum, i) => sum + i.quantity, 0) ?? 0;

  useFocusEffect(
    useCallback(() => {
      fetchProducts();
      fetchCart();
    }, [fetchProducts, fetchCart])
  );

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={() => navigation.navigate('Cart')} style={styles.cartBtn}>
          <Text style={styles.cartBtnText}>🛒 {cartCount > 0 ? cartCount : ''}</Text>
        </TouchableOpacity>
      ),
    });
  }, [cartCount, navigation]);

  if (isLoading && products.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <View style={styles.container}>
      {error && <ErrorMessage message={error.message} />}
      <FlatList
        data={products}
        keyExtractor={(p) => p.id}
        renderItem={({ item }) => (
          <ProductCard
            product={item}
            onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
          />
        )}
        onRefresh={fetchProducts}
        refreshing={isLoading}
        ListEmptyComponent={<EmptyState message="No products available." />}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  list: { paddingVertical: 8 },
  cartBtn: { marginRight: 8, padding: 4 },
  cartBtnText: { fontSize: 18 },
});
