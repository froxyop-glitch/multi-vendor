import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Search as SearchIcon, X, Star } from 'lucide-react-native';
import { apiClient } from '../src/lib/api';
import { useCart } from '../src/context/CartContext';

export default function SearchScreen() {
  const router = useRouter();
  const { addToCart } = useCart();
  const [query, setQuery] = useState('');
  const [autocompleteResults, setAutocompleteResults] = useState<{
    products: any[];
    suggestions: string[];
  }>({ products: [], suggestions: [] });
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Live autocomplete
  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setAutocompleteResults({ products: [], suggestions: [] });
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await apiClient.get(`/discovery/autocomplete?q=${encodeURIComponent(query)}`);
        if (res.data?.success) {
          setAutocompleteResults({
            products: res.data.products || [],
            suggestions: res.data.suggestions || [],
          });
        }
      } catch (e) {}
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  const executeSearch = async (searchTerm: string) => {
    if (!searchTerm.trim()) return;
    setQuery(searchTerm);
    setIsSearching(true);
    setHasSearched(true);
    setAutocompleteResults({ products: [], suggestions: [] });

    try {
      // Log search query
      apiClient.post('/discovery/log-search', { query: searchTerm }).catch(() => {});

      const res = await apiClient.get(`/products?q=${encodeURIComponent(searchTerm)}`);
      if (res.data?.success) {
        setSearchResults(res.data.products || []);
      }
    } catch (e) {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f1f3f6' }}>
      {/* Search Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: '#2874f0',
          paddingHorizontal: 12,
          paddingVertical: 10,
        }}
      >
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 10 }}>
          <ArrowLeft color="#ffffff" size={24} />
        </TouchableOpacity>
        <View
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: '#ffffff',
            borderRadius: 6,
            paddingHorizontal: 10,
            height: 40,
          }}
        >
          <SearchIcon color="#878787" size={18} style={{ marginRight: 6 }} />
          <TextInput
            placeholder="Search phones, laptops, clothes..."
            placeholderTextColor="#878787"
            value={query}
            onChangeText={(text) => {
              setQuery(text);
              if (hasSearched) setHasSearched(false);
            }}
            onSubmitEditing={() => executeSearch(query)}
            autoFocus
            returnKeyType="search"
            style={{ flex: 1, fontSize: 14, color: '#212121' }}
          />
          {query.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setQuery('');
                setAutocompleteResults({ products: [], suggestions: [] });
                setSearchResults([]);
                setHasSearched(false);
              }}
            >
              <X color="#878787" size={18} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Autocomplete Dropdown */}
      {!hasSearched && query.length >= 2 && (
        <View style={{ backgroundColor: '#ffffff', borderBottomWidth: 1, borderColor: '#e0e0e0' }}>
          {autocompleteResults.suggestions.map((sug, idx) => (
            <TouchableOpacity
              key={idx}
              onPress={() => executeSearch(sug)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 12,
                paddingHorizontal: 16,
                borderBottomWidth: 1,
                borderColor: '#f0f0f0',
              }}
            >
              <SearchIcon color="#878787" size={16} style={{ marginRight: 12 }} />
              <Text style={{ fontSize: 14, color: '#212121' }}>{sug}</Text>
            </TouchableOpacity>
          ))}

          {autocompleteResults.products.map((prod) => (
            <TouchableOpacity
              key={prod.id}
              onPress={() => router.push(`/product/${prod.id}`)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 10,
                paddingHorizontal: 16,
                borderBottomWidth: 1,
                borderColor: '#f0f0f0',
              }}
            >
              {prod.images?.[0] ? (
                <Image
                  source={{ uri: prod.images[0] }}
                  style={{ width: 36, height: 36, borderRadius: 4, marginRight: 12 }}
                  resizeMode="contain"
                />
              ) : null}
              <View style={{ flex: 1 }}>
                <Text numberOfLines={1} style={{ fontSize: 14, fontWeight: '500', color: '#212121' }}>
                  {prod.title}
                </Text>
                <Text style={{ fontSize: 12, color: '#2874f0', fontWeight: 'bold' }}>
                  ₹{(prod.discountPrice || prod.price).toLocaleString('en-IN')}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Loading */}
      {isSearching && (
        <View style={{ padding: 40, alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#2874f0" />
          <Text style={{ marginTop: 12, color: '#878787', fontSize: 14 }}>Searching catalog...</Text>
        </View>
      )}

      {/* Search Results */}
      {hasSearched && !isSearching && (
        <FlatList
          data={searchResults}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 10 }}
          ListEmptyComponent={
            <View style={{ padding: 40, alignItems: 'center' }}>
              <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#212121' }}>
                No products found
              </Text>
              <Text style={{ fontSize: 13, color: '#878787', marginTop: 4, textAlign: 'center' }}>
                Try searching with different keywords like 'iPhone', 'Kurta', or 'Sneakers'
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => router.push(`/product/${item.id}`)}
              style={{
                flexDirection: 'row',
                backgroundColor: '#ffffff',
                borderRadius: 8,
                padding: 12,
                marginBottom: 10,
                shadowColor: '#000',
                shadowOpacity: 0.05,
                shadowRadius: 3,
                elevation: 1,
              }}
            >
              <Image
                source={{
                  uri: item.images?.[0] || 'https://via.placeholder.com/150',
                }}
                style={{ width: 90, height: 90, borderRadius: 6, marginRight: 12 }}
                resizeMode="contain"
              />
              <View style={{ flex: 1, justifyContent: 'space-between' }}>
                <View>
                  <Text numberOfLines={2} style={{ fontSize: 14, fontWeight: '600', color: '#212121' }}>
                    {item.title}
                  </Text>
                  {/* Rating */}
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: '#388e3c',
                      paddingHorizontal: 6,
                      paddingVertical: 2,
                      borderRadius: 4,
                      alignSelf: 'flex-start',
                      marginTop: 4,
                    }}
                  >
                    <Text style={{ color: '#fff', fontSize: 11, fontWeight: 'bold', marginRight: 2 }}>
                      {item.rating || 4.5}
                    </Text>
                    <Star color="#fff" size={10} fill="#fff" />
                  </View>
                </View>

                {/* Price */}
                <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 6 }}>
                  <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#212121' }}>
                    ₹{(item.discountPrice || item.price).toLocaleString('en-IN')}
                  </Text>
                  {item.discountPrice && (
                    <Text
                      style={{
                        fontSize: 12,
                        color: '#878787',
                        textDecorationLine: 'line-through',
                        marginLeft: 6,
                      }}
                    >
                      ₹{item.price.toLocaleString('en-IN')}
                    </Text>
                  )}
                  {item.discountPrice && (
                    <Text style={{ fontSize: 12, color: '#388e3c', fontWeight: 'bold', marginLeft: 6 }}>
                      {Math.round(((item.price - item.discountPrice) / item.price) * 100)}% off
                    </Text>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}
