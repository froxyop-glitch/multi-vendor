import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Trash2, ShoppingBag } from 'lucide-react-native';
import { useCart } from '../../src/context/CartContext';
import { useAuth } from '../../src/context/AuthContext';

export default function CartScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { items, totalPayable, updateQuantity, removeItem } = useCart();

  if (!user) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#ffffff' }}>
        <ShoppingBag size={48} color="#9ca3af" />
        <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#1f2937', marginTop: 12 }}>Please Log In</Text>
        <Text style={{ fontSize: 12, color: '#6b7280', textAlign: 'center', marginTop: 4 }}>
          Log in to see items in your shopping cart.
        </Text>
        <TouchableOpacity
          onPress={() => router.push('/(tabs)/account')}
          style={{ marginTop: 16, backgroundColor: '#2874f0', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 4 }}
        >
          <Text style={{ color: '#ffffff', fontWeight: 'bold', fontSize: 13 }}>Go to Account</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#ffffff' }}>
        <ShoppingBag size={54} color="#d1d5db" />
        <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#1f2937', marginTop: 12 }}>Your Cart is Empty</Text>
        <TouchableOpacity
          onPress={() => router.push('/(tabs)')}
          style={{ marginTop: 16, backgroundColor: '#2874f0', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 4 }}
        >
          <Text style={{ color: '#ffffff', fontWeight: 'bold', fontSize: 13 }}>Shop Now</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#f1f3f6' }}>
      <View style={{ backgroundColor: '#2874f0', paddingTop: 45, paddingBottom: 12, paddingHorizontal: 16 }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#ffffff' }}>My Cart ({items.length})</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 12, paddingBottom: 100 }}>
        {items.map((it) => (
          <View
            key={it.cartItemId || it.productId}
            style={{
              backgroundColor: '#ffffff',
              borderRadius: 6,
              padding: 12,
              marginBottom: 10,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Image source={{ uri: it.image }} style={{ width: 65, height: 65, borderRadius: 4 }} resizeMode="contain" />

            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#111827' }} numberOfLines={2}>
                {it.productTitle}
              </Text>
              <Text style={{ fontSize: 14, fontWeight: '900', color: '#111827', marginTop: 4 }}>
                ₹{it.unitPrice}
              </Text>

              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                <TouchableOpacity
                  onPress={() => updateQuantity(it.cartItemId, it.quantity - 1)}
                  style={{ borderWidth: 1, borderColor: '#d1d5db', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 3 }}
                >
                  <Text style={{ fontWeight: 'bold', fontSize: 12 }}>-</Text>
                </TouchableOpacity>

                <Text style={{ marginHorizontal: 10, fontWeight: 'bold', fontSize: 12 }}>{it.quantity}</Text>

                <TouchableOpacity
                  onPress={() => updateQuantity(it.cartItemId, it.quantity + 1)}
                  style={{ borderWidth: 1, borderColor: '#d1d5db', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 3 }}
                >
                  <Text style={{ fontWeight: 'bold', fontSize: 12 }}>+</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => removeItem(it.cartItemId)}
                  style={{ marginLeft: 16 }}
                >
                  <Trash2 size={16} color="#ef4444" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Bottom Place Order Bar */}
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderColor: '#e5e7eb',
          paddingVertical: 12,
          paddingHorizontal: 16,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <View>
          <Text style={{ fontSize: 11, color: '#6b7280' }}>Total Amount</Text>
          <Text style={{ fontSize: 18, fontWeight: '900', color: '#111827' }}>₹{totalPayable}</Text>
        </View>

        <TouchableOpacity
          onPress={() => router.push('/checkout')}
          style={{ backgroundColor: '#fb641b', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 4 }}
        >
          <Text style={{ color: '#ffffff', fontWeight: '900', fontSize: 13 }}>PLACE ORDER</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
