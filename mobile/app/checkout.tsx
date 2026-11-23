import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  MapPin,
  Tag,
  CreditCard,
  Banknote,
  CheckCircle2,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react-native';
import { apiClient } from '../src/lib/api';
import { useCart } from '../src/context/CartContext';
import { useAuth } from '../src/context/AuthContext';

export default function CheckoutScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { items, refreshCart } = useCart();

  // Address fields
  const [name, setName] = useState(user?.name || 'Rahul Sen');
  const [phone, setPhone] = useState(user?.phone || '9876543210');
  const [address, setAddress] = useState(user?.address || 'Netaji Road, Ward No 4');
  const [city, setCity] = useState('Alipurduar');
  const [state, setState] = useState('West Bengal');
  const [pincode, setPincode] = useState('736123');

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [calculation, setCalculation] = useState<any>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // Payment method
  const [paymentMethod, setPaymentMethod] = useState<'RAZORPAY' | 'COD'>('COD');
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState<any>(null);

  // Calculate totals whenever pincode or coupon changes
  const calculateBill = async (codeToUse?: string | null) => {
    setIsCalculating(true);
    try {
      const res = await apiClient.post('/cart/calculate', {
        pincode,
        couponCode: codeToUse !== undefined ? codeToUse : appliedCoupon,
      });
      if (res.data?.success) {
        setCalculation(res.data.calculation);
      }
    } catch (e) {}
    setIsCalculating(false);
  };

  useEffect(() => {
    calculateBill();
  }, [pincode]);

  const handleApplyCoupon = (code: string) => {
    setCouponCode(code);
    setAppliedCoupon(code);
    calculateBill(code);
  };

  const handleRemoveCoupon = () => {
    setCouponCode('');
    setAppliedCoupon(null);
    calculateBill(null);
  };

  const handlePlaceOrder = async () => {
    if (!address.trim() || !pincode.trim() || pincode.length !== 6) {
      Alert.alert('Incomplete Address', 'Please provide a valid delivery address and 6-digit pincode.');
      return;
    }

    const fullShippingAddress = `${name}, Ph: ${phone}, ${address}, ${city}, ${state} - ${pincode}`;

    setIsPlacingOrder(true);
    try {
      if (paymentMethod === 'COD') {
        const res = await apiClient.post('/orders/cod', {
          shippingAddress: fullShippingAddress,
          pincode,
          couponCode: appliedCoupon,
        });

        if (res.data?.success) {
          setOrderPlaced(res.data.order);
          await refreshCart();
        } else {
          Alert.alert('Order Failed', res.data?.message || 'Failed to place COD order');
        }
      } else {
        // Razorpay Online simulation
        const orderRes = await apiClient.post('/payments/create-order', {
          pincode,
          couponCode: appliedCoupon,
        });

        if (orderRes.data?.success) {
          const razorpayOrderId = orderRes.data.razorpayOrderId;
          // Verify payment
          const verifyRes = await apiClient.post('/payments/verify', {
            razorpayOrderId,
            razorpayPaymentId: `pay_mock_${Date.now()}`,
            razorpaySignature: 'mock_signature_valid',
            shippingAddress: fullShippingAddress,
            pincode,
            couponCode: appliedCoupon,
          });

          if (verifyRes.data?.success) {
            setOrderPlaced(verifyRes.data.order);
            await refreshCart();
          } else {
            Alert.alert('Payment Failed', 'Verification failed.');
          }
        }
      }
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.message || 'Could not complete order');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  if (orderPlaced) {
    return (
      <View style={{ flex: 1, backgroundColor: '#ffffff', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <CheckCircle2 color="#388e3c" size={72} />
        <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#212121', marginTop: 16 }}>
          Order Confirmed!
        </Text>
        <Text style={{ fontSize: 14, color: '#616161', marginTop: 6, textAlign: 'center' }}>
          Thank you for shopping with ShopEzy. Your order #{orderPlaced.id?.slice(0, 10)} has been placed successfully.
        </Text>

        <View style={{ backgroundColor: '#f1f3f6', width: '100%', padding: 16, borderRadius: 8, marginTop: 24 }}>
          <Text style={{ fontSize: 13, color: '#878787' }}>Total Amount Paid / Payable</Text>
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#212121', marginTop: 2 }}>
            ₹{orderPlaced.totalAmount?.toLocaleString('en-IN')}
          </Text>
          <Text style={{ fontSize: 12, color: '#2874f0', marginTop: 4 }}>
            Payment: {orderPlaced.paymentMethod} ({orderPlaced.paymentStatus})
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => router.replace('/orders')}
          style={{
            backgroundColor: '#2874f0',
            width: '100%',
            paddingVertical: 14,
            borderRadius: 6,
            alignItems: 'center',
            marginTop: 24,
          }}
        >
          <Text style={{ color: '#ffffff', fontWeight: 'bold', fontSize: 15 }}>
            VIEW MY ORDERS & TRACKING
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.replace('/(tabs)')}
          style={{
            marginTop: 14,
            paddingVertical: 10,
            alignItems: 'center',
          }}
        >
          <Text style={{ color: '#2874f0', fontWeight: '600', fontSize: 14 }}>
            Continue Shopping
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const subtotal = calculation?.subtotal || 0;
  const discount = calculation?.discountAmount || 0;
  const shipping = calculation?.shippingFee || 0;
  const total = calculation?.total || subtotal - discount + shipping;

  return (
    <View style={{ flex: 1, backgroundColor: '#f1f3f6' }}>
      <ScrollView contentContainerStyle={{ padding: 12, paddingBottom: 90 }}>
        {/* Address Card */}
        <View style={{ backgroundColor: '#ffffff', borderRadius: 8, padding: 16, marginBottom: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <MapPin color="#2874f0" size={20} style={{ marginRight: 8 }} />
            <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#212121' }}>
              Delivery Address
            </Text>
          </View>

          <View style={{ gap: 10 }}>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TextInput
                placeholder="Full Name"
                value={name}
                onChangeText={setName}
                style={{
                  flex: 1,
                  borderWidth: 1,
                  borderColor: '#e0e0e0',
                  borderRadius: 6,
                  paddingHorizontal: 10,
                  height: 40,
                  fontSize: 13,
                }}
              />
              <TextInput
                placeholder="Phone Number"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                style={{
                  flex: 1,
                  borderWidth: 1,
                  borderColor: '#e0e0e0',
                  borderRadius: 6,
                  paddingHorizontal: 10,
                  height: 40,
                  fontSize: 13,
                }}
              />
            </View>

            <TextInput
              placeholder="Flat / House / Street Address"
              value={address}
              onChangeText={setAddress}
              style={{
                borderWidth: 1,
                borderColor: '#e0e0e0',
                borderRadius: 6,
                paddingHorizontal: 10,
                height: 40,
                fontSize: 13,
              }}
            />

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TextInput
                placeholder="City"
                value={city}
                onChangeText={setCity}
                style={{
                  flex: 1,
                  borderWidth: 1,
                  borderColor: '#e0e0e0',
                  borderRadius: 6,
                  paddingHorizontal: 10,
                  height: 40,
                  fontSize: 13,
                }}
              />
              <TextInput
                placeholder="6-Digit PIN"
                value={pincode}
                onChangeText={setPincode}
                keyboardType="number-pad"
                maxLength={6}
                style={{
                  width: 110,
                  borderWidth: 1,
                  borderColor: '#e0e0e0',
                  borderRadius: 6,
                  paddingHorizontal: 10,
                  height: 40,
                  fontSize: 13,
                }}
              />
            </View>
          </View>
        </View>

        {/* Coupons Card */}
        <View style={{ backgroundColor: '#ffffff', borderRadius: 8, padding: 16, marginBottom: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
            <Tag color="#2874f0" size={18} style={{ marginRight: 8 }} />
            <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#212121' }}>
              Apply Coupon
            </Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TextInput
              placeholder="Enter coupon code"
              value={couponCode}
              onChangeText={(text) => setCouponCode(text.toUpperCase())}
              autoCapitalize="characters"
              style={{
                flex: 1,
                borderWidth: 1,
                borderColor: '#e0e0e0',
                borderRadius: 6,
                paddingHorizontal: 12,
                height: 40,
                fontSize: 13,
              }}
            />
            {appliedCoupon ? (
              <TouchableOpacity
                onPress={handleRemoveCoupon}
                style={{
                  marginLeft: 8,
                  paddingHorizontal: 14,
                  height: 40,
                  backgroundColor: '#fee2e2',
                  borderRadius: 6,
                  justifyContent: 'center',
                }}
              >
                <Text style={{ color: '#dc2626', fontWeight: 'bold', fontSize: 12 }}>Remove</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={() => handleApplyCoupon(couponCode)}
                style={{
                  marginLeft: 8,
                  paddingHorizontal: 14,
                  height: 40,
                  backgroundColor: '#2874f0',
                  borderRadius: 6,
                  justifyContent: 'center',
                }}
              >
                <Text style={{ color: '#ffffff', fontWeight: 'bold', fontSize: 12 }}>Apply</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Quick Coupons */}
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
            <TouchableOpacity
              onPress={() => handleApplyCoupon('WELCOME10')}
              style={{
                borderWidth: 1,
                borderColor: '#2874f0',
                borderStyle: 'dashed',
                borderRadius: 4,
                paddingVertical: 4,
                paddingHorizontal: 8,
                backgroundColor: '#eff6ff',
              }}
            >
              <Text style={{ fontSize: 11, color: '#2874f0', fontWeight: 'bold' }}>
                WELCOME10 (10% OFF)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleApplyCoupon('FLAT200')}
              style={{
                borderWidth: 1,
                borderColor: '#2874f0',
                borderStyle: 'dashed',
                borderRadius: 4,
                paddingVertical: 4,
                paddingHorizontal: 8,
                backgroundColor: '#eff6ff',
              }}
            >
              <Text style={{ fontSize: 11, color: '#2874f0', fontWeight: 'bold' }}>
                FLAT200 (₹200 OFF)
              </Text>
            </TouchableOpacity>
          </View>

          {appliedCoupon && (
            <Text style={{ color: '#16a34a', fontSize: 12, marginTop: 8, fontWeight: '600' }}>
              ✔ Coupon '{appliedCoupon}' applied successfully!
            </Text>
          )}
        </View>

        {/* Payment Method Selector */}
        <View style={{ backgroundColor: '#ffffff', borderRadius: 8, padding: 16, marginBottom: 12 }}>
          <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#212121', marginBottom: 12 }}>
            Select Payment Method
          </Text>

          <TouchableOpacity
            onPress={() => setPaymentMethod('COD')}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              padding: 12,
              borderRadius: 6,
              borderWidth: paymentMethod === 'COD' ? 2 : 1,
              borderColor: paymentMethod === 'COD' ? '#2874f0' : '#e0e0e0',
              backgroundColor: paymentMethod === 'COD' ? '#eff6ff' : '#ffffff',
              marginBottom: 8,
            }}
          >
            <Banknote color={paymentMethod === 'COD' ? '#2874f0' : '#878787'} size={22} style={{ marginRight: 10 }} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#212121' }}>
                Cash on Delivery (COD)
              </Text>
              <Text style={{ fontSize: 11, color: '#878787' }}>
                Pay cash or UPI at your doorstep upon delivery
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setPaymentMethod('RAZORPAY')}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              padding: 12,
              borderRadius: 6,
              borderWidth: paymentMethod === 'RAZORPAY' ? 2 : 1,
              borderColor: paymentMethod === 'RAZORPAY' ? '#2874f0' : '#e0e0e0',
              backgroundColor: paymentMethod === 'RAZORPAY' ? '#eff6ff' : '#ffffff',
            }}
          >
            <CreditCard color={paymentMethod === 'RAZORPAY' ? '#2874f0' : '#878787'} size={22} style={{ marginRight: 10 }} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#212121' }}>
                Online Payment (UPI, Cards, NetBanking)
              </Text>
              <Text style={{ fontSize: 11, color: '#878787' }}>
                Instant Razorpay checkout with buyer protection
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Bill Summary */}
        <View style={{ backgroundColor: '#ffffff', borderRadius: 8, padding: 16 }}>
          <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#212121', marginBottom: 12 }}>
            Price Details ({items.length} {items.length === 1 ? 'item' : 'items'})
          </Text>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={{ fontSize: 13, color: '#616161' }}>Price</Text>
            <Text style={{ fontSize: 13, color: '#212121' }}>₹{subtotal.toLocaleString('en-IN')}</Text>
          </View>

          {discount > 0 && (
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text style={{ fontSize: 13, color: '#16a34a' }}>Coupon Discount</Text>
              <Text style={{ fontSize: 13, color: '#16a34a', fontWeight: 'bold' }}>
                -₹{discount.toLocaleString('en-IN')}
              </Text>
            </View>
          )}

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={{ fontSize: 13, color: '#616161' }}>Delivery Charges</Text>
            <Text style={{ fontSize: 13, color: shipping === 0 ? '#16a34a' : '#212121' }}>
              {shipping === 0 ? 'FREE' : `₹${shipping}`}
            </Text>
          </View>

          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              paddingTop: 10,
              marginTop: 6,
              borderTopWidth: 1,
              borderColor: '#e0e0e0',
            }}
          >
            <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#212121' }}>Total Amount</Text>
            <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#212121' }}>
              ₹{total.toLocaleString('en-IN')}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Floating Bottom Bar */}
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 64,
          backgroundColor: '#ffffff',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 16,
          borderTopWidth: 1,
          borderColor: '#e0e0e0',
          shadowColor: '#000',
          shadowOpacity: 0.1,
          shadowRadius: 5,
          elevation: 8,
        }}
      >
        <View>
          <Text style={{ fontSize: 11, color: '#878787' }}>Total Payable</Text>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#212121' }}>
            ₹{total.toLocaleString('en-IN')}
          </Text>
        </View>

        <TouchableOpacity
          onPress={handlePlaceOrder}
          disabled={isPlacingOrder || items.length === 0}
          style={{
            backgroundColor: '#fb641b',
            paddingVertical: 12,
            paddingHorizontal: 24,
            borderRadius: 6,
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          {isPlacingOrder ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <>
              <Text style={{ color: '#ffffff', fontWeight: 'bold', fontSize: 14, marginRight: 6 }}>
                CONFIRM ORDER
              </Text>
              <ArrowRight color="#ffffff" size={16} />
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
