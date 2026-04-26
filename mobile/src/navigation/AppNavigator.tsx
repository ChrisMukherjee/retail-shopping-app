import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import { ProductListScreen } from '../screens/ProductListScreen';
import { ProductDetailScreen } from '../screens/ProductDetailScreen';
import { CartScreen } from '../screens/CartScreen';
import { CheckoutResultScreen } from '../screens/CheckoutResultScreen';
import { useCartStore } from '../stores/useCartStore';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
  const initCart = useCartStore((s) => s.initCart);

  useEffect(() => {
    initCart();
  }, []);

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="ProductList"
        screenOptions={{ headerStyle: { backgroundColor: '#1D4ED8' }, headerTintColor: '#fff', headerTitleStyle: { fontWeight: '700' } }}
      >
        <Stack.Screen name="ProductList" component={ProductListScreen} options={{ title: 'Shop' }} />
        <Stack.Screen name="ProductDetail" component={ProductDetailScreen} options={{ title: 'Product Details' }} />
        <Stack.Screen name="Cart" component={CartScreen} options={{ title: 'My Cart' }} />
        <Stack.Screen name="CheckoutResult" component={CheckoutResultScreen} options={{ title: 'Order Result', headerBackVisible: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
