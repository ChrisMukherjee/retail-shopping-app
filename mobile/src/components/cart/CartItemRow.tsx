import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { CartItem } from '../../types';

interface Props {
  item: CartItem;
  onQuantityChange: (qty: number) => void;
  onRemove: () => void;
}

export function CartItemRow({ item, onQuantityChange, onRemove }: Props) {
  const [qty, setQty] = useState(item.quantity);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!debounceRef.current) setQty(item.quantity);
  }, [item.quantity]);

  const handleChange = (next: number) => {
    setQty(next);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      debounceRef.current = null;
      onQuantityChange(next);
    }, 500);
  };

  return (
    <View style={styles.row}>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.price}>£{item.unitPrice.toFixed(2)} each</Text>
      </View>
      <View style={styles.controls}>
        <TouchableOpacity style={styles.btn} onPress={() => qty > 1 ? handleChange(qty - 1) : onRemove()}>
          <Text style={styles.btnText}>−</Text>
        </TouchableOpacity>
        <Text style={styles.qty}>{qty}</Text>
        <TouchableOpacity style={styles.btn} onPress={() => handleChange(qty + 1)}>
          <Text style={styles.btnText}>+</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.right}>
        <Text style={styles.lineTotal}>£{(qty * item.unitPrice).toFixed(2)}</Text>
        <TouchableOpacity onPress={onRemove}><Text style={styles.remove}>Remove</Text></TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  info: { flex: 1, marginRight: 8 },
  name: { fontSize: 14, fontWeight: '600', color: '#111827' },
  price: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  controls: { flexDirection: 'row', alignItems: 'center' },
  btn: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center' },
  btnText: { fontSize: 16, color: '#374151', lineHeight: 20 },
  qty: { fontSize: 15, fontWeight: '600', marginHorizontal: 10, minWidth: 20, textAlign: 'center' },
  right: { alignItems: 'flex-end', marginLeft: 8 },
  lineTotal: { fontSize: 14, fontWeight: '700', color: '#111827' },
  remove: { fontSize: 12, color: '#DC2626', marginTop: 4 },
});
