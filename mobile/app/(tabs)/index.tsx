import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Search, Flame, Star, Sparkles, Heart } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { apiClient } from '../../src/lib/api';
import { useWishlist } from '../../src/context/WishlistContext';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { wishlistIds, toggleWishlist } = useWishlist();

  const [config, setConfig] = useState<any>(null);
  const [banners, setBanners] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [flashSale, setFlashSale] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [cfgRes, prodRes] = await Promise.all([
          apiClient.get(`/store/config?lang=${i18n.language}`),
          apiClient.get('/products?limit=12'),
        ]);

        if (cfgRes.data?.success) {
          setConfig(cfgRes.data.config);
          setBanners(cfgRes.data.banners || []);
          setCategories(cfgRes.data.categories || []);
          setFlashSale(cfgRes.data.activeFlashSale || null);
        }

        if (prodRes.data?.success) {
          setProducts(prodRes.data.products || []);
        }
      } catch (e) {
        console.error('Failed to load store data', e);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [i18n.language]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f1f3f6' }}>
        <ActivityIndicator size="large" color="#2874f0" />
      </View>
    );
  }

  const heroBanners = banners.filter((b) => b.position === 'HERO_CAROUSEL');

  return (
    <View style={{ flex: 1, backgroundColor: '#f1f3f6' }}>
      {/* Flipkart Brand Top Header */}
      <View style={{ backgroundColor: '#2874f0', paddingTop: 45, paddingBottom: 12, paddingHorizontal: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <View>
            <Text style={{ fontSize: 20, fontWeight: '900', color: '#ffffff', fontStyle: 'italic' }}>
              ShopEzy <Text style={{ color: '#ffe500' }}>★</Text>
            </Text>
            <Text style={{ fontSize: 10, color: '#e5e7eb', fontStyle: 'italic', fontWeight: 'bold' }}>
              Explore <Text style={{ color: '#ffe500' }}>Plus</Text>
            </Text>
          </View>
        </View>

        {/* Search Bar Touchable */}
        <TouchableOpacity
          onPress={() => router.push('/search')}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: '#ffffff',
            borderRadius: 4,
            height: 40,
            paddingHorizontal: 12,
          }}
        >
          <Search size={18} color="#2874f0" />
          <Text style={{ marginLeft: 8, fontSize: 13, color: '#6b7280' }}>
            {t('searchPlaceholder')}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Announcement Strip */}
        {config?.announcement_bar_text && (
          <View style={{ backgroundColor: '#1d4ed8', paddingVertical: 6, paddingHorizontal: 12 }}>
            <Text style={{ color: '#ffffff', fontSize: 11, fontWeight: 'bold', textAlign: 'center' }}>
              ✨ {config.announcement_bar_text}
            </Text>
          </View>
        )}

        {/* Categories Strip */}
        {categories.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ backgroundColor: '#ffffff', paddingVertical: 12 }}
            contentContainerStyle={{ paddingHorizontal: 10 }}
          >
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                onPress={() => router.push(`/search?category=${cat.slug}`)}
                style={{ alignItems: 'center', marginRight: 16, width: 65 }}
              >
                <View
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 26,
                    backgroundColor: '#f3f4f6',
                    overflow: 'hidden',
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: '#e5e7eb',
                  }}
                >
                  <Image source={{ uri: cat.iconOrImageUrl }} style={{ width: 52, height: 52 }} resizeMode="cover" />
                </View>
                <Text
                  style={{ fontSize: 10, fontWeight: '600', color: '#374151', marginTop: 4, textAlign: 'center' }}
                  numberOfLines={1}
                >
                  {cat.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Hero Banners Slider */}
        {heroBanners.length > 0 && (
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            style={{ marginVertical: 8 }}
          >
            {heroBanners.map((banner) => (
              <TouchableOpacity
                key={banner.id}
                onPress={() => router.push('/search')}
                style={{ width, height: 180, paddingHorizontal: 8 }}
              >
                <Image
                  source={{ uri: banner.imageUrl }}
                  style={{ width: '100%', height: '100%', borderRadius: 6 }}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Flash Sale Strip */}
        {flashSale && flashSale.items?.length > 0 && (
          <View style={{ backgroundColor: '#ffffff', marginVertical: 6, padding: 12, borderWidth: 1, borderColor: '#fecdd3' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Flame size={18} color="#e11d48" />
                <Text style={{ fontSize: 14, fontWeight: '900', color: '#e11d48', marginLeft: 6 }}>
                  {flashSale.title}
                </Text>
              </View>
              <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#4b5563' }}>
                ⚡ {t('endsIn')} 24h
              </Text>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {flashSale.items.map((item: any) => (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => router.push(`/product/${item.slug || item.productId}`)}
                  style={{
                    width: 130,
                    marginRight: 10,
                    backgroundColor: '#ffffff',
                    borderWidth: 1,
                    borderColor: '#f3f4f6',
                    borderRadius: 6,
                    padding: 8,
                  }}
                >
                  <Image source={{ uri: item.image }} style={{ width: '100%', height: 100 }} resizeMode="contain" />
                  <Text style={{ fontSize: 11, fontWeight: '600', color: '#1f2937', marginTop: 6 }} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#e11d48', marginTop: 2 }}>
                    ₹{item.flashPrice}
                  </Text>
                  <Text style={{ fontSize: 10, color: '#9ca3af', textDecorationLine: 'line-through' }}>
                    ₹{item.regularPrice}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Featured Products Grid */}
        <View style={{ backgroundColor: '#ffffff', marginVertical: 6, padding: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Sparkles size={16} color="#2874f0" />
              <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#111827', marginLeft: 6 }}>
                Featured Deals & Mobiles
              </Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/search')}>
              <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#2874f0' }}>View All</Text>
            </TouchableOpacity>
          </View>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
            {products.map((p) => {
              const isWish = wishlistIds.has(p.id);
              return (
                <TouchableOpacity
                  key={p.id}
                  onPress={() => router.push(`/product/${p.slug || p.id}`)}
                  style={{
                    width: '48%',
                    backgroundColor: '#ffffff',
                    borderWidth: 1,
                    borderColor: '#f3f4f6',
                    borderRadius: 6,
                    padding: 10,
                    marginBottom: 12,
                    position: 'relative',
                  }}
                >
                  <TouchableOpacity
                    onPress={() => toggleWishlist(p.id)}
                    style={{ position: 'absolute', top: 8, right: 8, zIndex: 10 }}
                  >
                    <Heart size={16} color={isWish ? '#ef4444' : '#9ca3af'} fill={isWish ? '#ef4444' : 'transparent'} />
                  </TouchableOpacity>

                  <Image source={{ uri: p.images[0] }} style={{ width: '100%', height: 130 }} resizeMode="contain" />

                  <Text style={{ fontSize: 12, fontWeight: '600', color: '#1f2937', marginTop: 8 }} numberOfLines={2}>
                    {p.title}
                  </Text>

                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#15803d', paddingHorizontal: 4, paddingVertical: 1, borderRadius: 3 }}>
                      <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#ffffff', marginRight: 2 }}>{p.rating.toFixed(1)}</Text>
                      <Star size={8} color="#ffffff" fill="#ffffff" />
                    </View>
                    <Text style={{ fontSize: 10, color: '#9ca3af', marginLeft: 4 }}>({p.review_count})</Text>
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 4 }}>
                    <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#111827' }}>₹{p.discount_price}</Text>
                    {p.price > p.discount_price && (
                      <Text style={{ fontSize: 11, color: '#9ca3af', textDecorationLine: 'line-through', marginLeft: 4 }}>
                        ₹{p.price}
                      </Text>
                    )}
                  </View>

                  <Text style={{ fontSize: 10, color: '#16a34a', fontWeight: 'bold', marginTop: 2 }}>
                    Free Delivery
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
