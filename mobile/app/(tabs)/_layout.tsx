import React from 'react';
import { Tabs } from 'expo-router';
import { Home, Grid, ShoppingCart, User } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useCart } from '../../src/context/CartContext';
import { View, Text } from 'react-native';

export default function TabLayout() {
  const { t } = useTranslation();
  const { totalCount: cartCount } = useCart();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#2874f0',
        tabBarInactiveTintColor: '#6b7280',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: '#e5e7eb',
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('home'),
          tabBarIcon: ({ color, size }) => <Home size={size || 22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="categories"
        options={{
          title: t('categories'),
          tabBarIcon: ({ color, size }) => <Grid size={size || 22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: t('cart'),
          tabBarIcon: ({ color, size }) => (
            <View className="relative">
              <ShoppingCart size={size || 22} color={color} />
              {cartCount > 0 && (
                <View
                  style={{
                    position: 'absolute',
                    top: -4,
                    right: -10,
                    backgroundColor: '#ffe500',
                    borderRadius: 10,
                    width: 18,
                    height: 18,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ fontSize: 10, fontWeight: '900', color: '#2874f0' }}>{cartCount}</Text>
                </View>
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: t('account'),
          tabBarIcon: ({ color, size }) => <User size={size || 22} color={color} />,
        }}
      />
    </Tabs>
  );
}
