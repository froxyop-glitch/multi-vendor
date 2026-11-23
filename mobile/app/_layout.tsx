import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '../src/context/AuthContext';
import { CartProvider } from '../src/context/CartContext';
import { WishlistProvider } from '../src/context/WishlistContext';
import '../src/i18n';

export default function RootLayout() {
  return (
    <AuthProvider>
      <CartProvider>
        <WishlistProvider>
          <StatusBar style="light" backgroundColor="#2874f0" />
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: '#2874f0' },
              headerTintColor: '#ffffff',
              headerTitleStyle: { fontWeight: 'bold' },
            }}
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="search" options={{ title: 'Search ShopEzy', headerShown: false }} />
            <Stack.Screen name="product/[id]" options={{ title: 'Product Details' }} />
            <Stack.Screen name="checkout" options={{ title: 'Secure Checkout' }} />
            <Stack.Screen name="orders" options={{ title: 'My Orders & Tracking' }} />
            <Stack.Screen name="support/[ticketId]" options={{ title: 'Live Support Chat' }} />
          </Stack>
        </WishlistProvider>
      </CartProvider>
    </AuthProvider>
  );
}
