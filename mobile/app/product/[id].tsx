import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Star,
  Heart,
  Truck,
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
  MessageSquare,
  HelpCircle,
  Share2,
} from 'lucide-react-native';
import { apiClient } from '../../src/lib/api';
import { useCart } from '../../src/context/CartContext';
import { useWishlist } from '../../src/context/WishlistContext';

const { width } = Dimensions.get('window');

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { addToCart } = useCart();
  const { wishlistIds, toggleWishlist } = useWishlist();

  const [product, setProduct] = useState<any>(null);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Pincode checker state
  const [pincode, setPincode] = useState('736123');
  const [pincodeStatus, setPincodeStatus] = useState<any>(null);
  const [isCheckingPincode, setIsCheckingPincode] = useState(false);

  // Q&A state
  const [newQuestion, setNewQuestion] = useState('');
  const [isSubmittingQ, setIsSubmittingQ] = useState(false);

  useEffect(() => {
    if (id) {
      loadProduct();
    }
  }, [id]);

  const loadProduct = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get(`/products/${id}`);
      if (res.data?.success && res.data.product) {
        setProduct(res.data.product);
        if (res.data.product.variants && res.data.product.variants.length > 0) {
          setSelectedVariant(res.data.product.variants[0]);
        }
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to load product details');
    } finally {
      setIsLoading(false);
    }
  };

  const checkDeliveryPincode = async () => {
    if (!pincode || pincode.length !== 6) {
      Alert.alert('Invalid PIN', 'Please enter a valid 6-digit Indian pincode');
      return;
    }
    setIsCheckingPincode(true);
    try {
      const res = await apiClient.get(`/logistics/check-pincode?pincode=${pincode}&productId=${id}`);
      if (res.data?.success) {
        setPincodeStatus(res.data);
      }
    } catch (e) {
      setPincodeStatus({ isServiceable: false, message: 'Could not verify pincode' });
    } finally {
      setIsCheckingPincode(false);
    }
  };

  const handleAskQuestion = async () => {
    if (!newQuestion.trim()) return;
    setIsSubmittingQ(true);
    try {
      const res = await apiClient.post(`/products/${id}/questions`, {
        questionText: newQuestion,
      });
      if (res.data?.success) {
        Alert.alert('Question Submitted', 'Your question has been sent to the seller.');
        setNewQuestion('');
        loadProduct();
      }
    } catch (e) {
      Alert.alert('Authentication Required', 'Please login to ask a question.');
    } finally {
      setIsSubmittingQ(false);
    }
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#2874f0" />
        <Text style={{ marginTop: 12, color: '#878787' }}>Loading product details...</Text>
      </View>
    );
  }

  if (!product) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <Text style={{ fontSize: 16, fontWeight: 'bold' }}>Product not found</Text>
      </View>
    );
  }

  const isWishlisted = wishlistIds.has(product.id);
  const activePrice = selectedVariant
    ? selectedVariant.discountPrice || selectedVariant.price
    : product.discountPrice || product.price;
  const originalPrice = selectedVariant ? selectedVariant.price : product.price;
  const discountPercent =
    originalPrice > activePrice
      ? Math.round(((originalPrice - activePrice) / originalPrice) * 100)
      : 0;

  const images = product.images && product.images.length > 0 ? product.images : ['https://via.placeholder.com/400'];

  return (
    <View style={{ flex: 1, backgroundColor: '#f1f3f6' }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 90 }}>
        {/* Main Product Card */}
        <View style={{ backgroundColor: '#ffffff', paddingBottom: 16 }}>
          {/* Gallery View */}
          <View style={{ position: 'relative' }}>
            <Image
              source={{ uri: images[selectedImageIndex] || images[0] }}
              style={{ width: width, height: 320, backgroundColor: '#fff' }}
              resizeMode="contain"
            />
            {/* Wishlist Button */}
            <TouchableOpacity
              onPress={() => toggleWishlist(product.id)}
              style={{
                position: 'absolute',
                top: 14,
                right: 14,
                backgroundColor: '#ffffff',
                padding: 8,
                borderRadius: 20,
                shadowColor: '#000',
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 3,
              }}
            >
              <Heart
                color={isWishlisted ? '#e53935' : '#878787'}
                fill={isWishlisted ? '#e53935' : 'transparent'}
                size={22}
              />
            </TouchableOpacity>

            {/* Thumbnail selector */}
            {images.length > 1 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ flexDirection: 'row', marginTop: 10, paddingHorizontal: 16 }}
              >
                {images.map((img: string, idx: number) => (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => setSelectedImageIndex(idx)}
                    style={{
                      borderWidth: selectedImageIndex === idx ? 2 : 1,
                      borderColor: selectedImageIndex === idx ? '#2874f0' : '#e0e0e0',
                      borderRadius: 6,
                      marginRight: 8,
                      overflow: 'hidden',
                    }}
                  >
                    <Image source={{ uri: img }} style={{ width: 50, height: 50 }} resizeMode="contain" />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>

          {/* Title & Brand */}
          <View style={{ paddingHorizontal: 16, marginTop: 16 }}>
            <Text style={{ fontSize: 13, color: '#2874f0', fontWeight: 'bold', textTransform: 'uppercase' }}>
              {product.category?.name || 'Store Item'}
            </Text>
            <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#212121', marginTop: 4 }}>
              {product.title}
            </Text>

            {/* Rating badge */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: '#388e3c',
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: 4,
                }}
              >
                <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold', marginRight: 3 }}>
                  {product.rating || 4.5}
                </Text>
                <Star color="#fff" size={12} fill="#fff" />
              </View>
              <Text style={{ fontSize: 12, color: '#878787', marginLeft: 8 }}>
                {product.reviewCount || product.reviews?.length || 0} Ratings & Reviews
              </Text>
            </View>

            {/* Pricing Section */}
            <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 12 }}>
              <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#212121' }}>
                ₹{activePrice.toLocaleString('en-IN')}
              </Text>
              {discountPercent > 0 && (
                <>
                  <Text
                    style={{
                      fontSize: 14,
                      color: '#878787',
                      textDecorationLine: 'line-through',
                      marginLeft: 8,
                    }}
                  >
                    ₹{originalPrice.toLocaleString('en-IN')}
                  </Text>
                  <Text style={{ fontSize: 14, color: '#388e3c', fontWeight: 'bold', marginLeft: 8 }}>
                    {discountPercent}% off
                  </Text>
                </>
              )}
            </View>
            <Text style={{ fontSize: 11, color: '#878787', marginTop: 2 }}>
              Inclusive of all taxes ({product.gstRatePercent || 18}% GST included)
            </Text>
          </View>

          {/* Variants Selector */}
          {product.variants && product.variants.length > 0 && (
            <View style={{ paddingHorizontal: 16, marginTop: 16 }}>
              <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#212121', marginBottom: 8 }}>
                Select Variant:
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                {product.variants.map((v: any) => {
                  const isSelected = selectedVariant?.id === v.id;
                  const label =
                    typeof v.attributes === 'object'
                      ? Object.values(v.attributes).join(' / ')
                      : v.sku;
                  return (
                    <TouchableOpacity
                      key={v.id}
                      onPress={() => setSelectedVariant(v)}
                      style={{
                        paddingVertical: 8,
                        paddingHorizontal: 14,
                        borderRadius: 6,
                        borderWidth: isSelected ? 2 : 1,
                        borderColor: isSelected ? '#2874f0' : '#e0e0e0',
                        backgroundColor: isSelected ? '#eff6ff' : '#ffffff',
                        marginRight: 8,
                        marginBottom: 8,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: isSelected ? 'bold' : 'normal',
                          color: isSelected ? '#2874f0' : '#212121',
                        }}
                      >
                        {label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}
        </View>

        {/* Pincode Check & Delivery Info */}
        <View style={{ backgroundColor: '#ffffff', marginTop: 10, padding: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
            <Truck color="#2874f0" size={20} style={{ marginRight: 8 }} />
            <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#212121' }}>
              Delivery Options
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TextInput
              placeholder="Enter 6-digit Pincode"
              value={pincode}
              onChangeText={setPincode}
              keyboardType="number-pad"
              maxLength={6}
              style={{
                flex: 1,
                borderWidth: 1,
                borderColor: '#e0e0e0',
                borderRadius: 6,
                paddingHorizontal: 12,
                height: 42,
                fontSize: 14,
              }}
            />
            <TouchableOpacity
              onPress={checkDeliveryPincode}
              disabled={isCheckingPincode}
              style={{
                backgroundColor: '#2874f0',
                height: 42,
                paddingHorizontal: 16,
                justifyContent: 'center',
                borderRadius: 6,
                marginLeft: 8,
              }}
            >
              {isCheckingPincode ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 13 }}>Check</Text>
              )}
            </TouchableOpacity>
          </View>

          {pincodeStatus && (
            <View
              style={{
                marginTop: 12,
                padding: 10,
                backgroundColor: pincodeStatus.isServiceable ? '#f0fdf4' : '#fef2f2',
                borderRadius: 6,
                borderLeftWidth: 4,
                borderLeftColor: pincodeStatus.isServiceable ? '#16a34a' : '#dc2626',
              }}
            >
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: '600',
                  color: pincodeStatus.isServiceable ? '#15803d' : '#b91c1c',
                }}
              >
                {pincodeStatus.isServiceable
                  ? `Delivery in ${pincodeStatus.estimatedDays || 3} days (${pincodeStatus.city || 'Metro'}, ${pincodeStatus.state || ''})`
                  : 'Currently not serviceable to this pincode'}
              </Text>
              {pincodeStatus.isServiceable && (
                <Text style={{ fontSize: 12, color: '#4b5563', marginTop: 2 }}>
                  {pincodeStatus.codAvailable ? '✔ Cash on Delivery Available' : '✖ Pre-paid only'}
                  {'  •  '}
                  {pincodeStatus.shippingFee === 0 ? 'FREE Delivery' : `₹${pincodeStatus.shippingFee} Shipping`}
                </Text>
              )}
            </View>
          )}

          {/* Assured badge */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 14, paddingTop: 10, borderTopWidth: 1, borderColor: '#f0f0f0' }}>
            <ShieldCheck color="#388e3c" size={18} style={{ marginRight: 6 }} />
            <Text style={{ fontSize: 12, color: '#616161' }}>
              7 Days Replacement Policy • GST Invoice Included
            </Text>
          </View>
        </View>

        {/* Specifications */}
        <View style={{ backgroundColor: '#ffffff', marginTop: 10, padding: 16 }}>
          <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#212121', marginBottom: 10 }}>
            Product Specifications
          </Text>
          {product.specifications && typeof product.specifications === 'object' ? (
            Object.entries(product.specifications).map(([key, val], idx) => (
              <View
                key={idx}
                style={{
                  flexDirection: 'row',
                  paddingVertical: 8,
                  borderBottomWidth: 1,
                  borderColor: '#f0f0f0',
                }}
              >
                <Text style={{ width: 120, fontSize: 12, color: '#878787' }}>{key}</Text>
                <Text style={{ flex: 1, fontSize: 12, color: '#212121', fontWeight: '500' }}>
                  {String(val)}
                </Text>
              </View>
            ))
          ) : (
            <Text style={{ fontSize: 13, color: '#616161' }}>
              {product.description || 'Standard high quality multi-vendor product.'}
            </Text>
          )}
        </View>

        {/* Verified Reviews Section */}
        <View style={{ backgroundColor: '#ffffff', marginTop: 10, padding: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#212121' }}>
              Customer Reviews ({product.reviews?.length || 0})
            </Text>
          </View>

          {product.reviews && product.reviews.length > 0 ? (
            product.reviews.map((rev: any) => (
              <View
                key={rev.id}
                style={{
                  borderBottomWidth: 1,
                  borderColor: '#f0f0f0',
                  paddingVertical: 10,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: '#388e3c',
                      paddingHorizontal: 6,
                      paddingVertical: 2,
                      borderRadius: 3,
                      marginRight: 8,
                    }}
                  >
                    <Text style={{ color: '#fff', fontSize: 10, fontWeight: 'bold', marginRight: 2 }}>
                      {rev.rating}
                    </Text>
                    <Star color="#fff" size={8} fill="#fff" />
                  </View>
                  <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#212121' }}>
                    {rev.title || 'Great product'}
                  </Text>
                </View>
                <Text style={{ fontSize: 12, color: '#424242', lineHeight: 18 }}>
                  {rev.comment}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
                  <CheckCircle2 color="#388e3c" size={12} style={{ marginRight: 4 }} />
                  <Text style={{ fontSize: 11, color: '#878787' }}>
                    Verified Buyer • {new Date(rev.createdAt).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={{ fontSize: 12, color: '#878787' }}>No reviews yet. Be the first to review!</Text>
          )}
        </View>

        {/* Q&A Section */}
        <View style={{ backgroundColor: '#ffffff', marginTop: 10, padding: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
            <HelpCircle color="#2874f0" size={18} style={{ marginRight: 6 }} />
            <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#212121' }}>
              Questions & Answers
            </Text>
          </View>

          {product.questions && product.questions.length > 0 ? (
            product.questions.map((q: any) => (
              <View key={q.id} style={{ marginBottom: 12, borderBottomWidth: 1, borderColor: '#f0f0f0', paddingBottom: 8 }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#212121' }}>
                  Q: {q.questionText}
                </Text>
                <Text style={{ fontSize: 12, color: '#4b5563', marginTop: 3 }}>
                  A: {q.answerText || 'Awaiting response from seller.'}
                </Text>
              </View>
            ))
          ) : (
            <Text style={{ fontSize: 12, color: '#878787', marginBottom: 8 }}>
              No questions asked yet about this product.
            </Text>
          )}

          {/* Ask question input */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
            <TextInput
              placeholder="Have a question? Ask here..."
              value={newQuestion}
              onChangeText={setNewQuestion}
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
            <TouchableOpacity
              onPress={handleAskQuestion}
              disabled={isSubmittingQ}
              style={{
                backgroundColor: '#2874f0',
                height: 40,
                paddingHorizontal: 14,
                justifyContent: 'center',
                borderRadius: 6,
                marginLeft: 8,
              }}
            >
              {isSubmittingQ ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 12 }}>Post</Text>
              )}
            </TouchableOpacity>
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
          height: 60,
          backgroundColor: '#ffffff',
          flexDirection: 'row',
          borderTopWidth: 1,
          borderColor: '#e0e0e0',
          shadowColor: '#000',
          shadowOpacity: 0.1,
          shadowRadius: 5,
          elevation: 8,
        }}
      >
        <TouchableOpacity
          onPress={async () => {
            const ok = await addToCart(product.id, selectedVariant?.id);
            if (ok) {
              Alert.alert('Added to Cart', 'Item has been added to your shopping cart.');
            }
          }}
          style={{
            flex: 1,
            backgroundColor: '#ffffff',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#212121' }}>
            ADD TO CART
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={async () => {
            await addToCart(product.id, selectedVariant?.id);
            router.push('/checkout');
          }}
          style={{
            flex: 1,
            backgroundColor: '#fb641b',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#ffffff' }}>
            BUY NOW
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
