import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { apiClient } from '../../src/lib/api';

export default function CategoriesScreen() {
  const router = useRouter();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await apiClient.get('/store/config');
        if (res.data?.success) {
          setCategories(res.data.categories || []);
        }
      } catch (e) {}
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2874f0" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#ffffff', paddingTop: 45 }}>
      <View style={{ paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderColor: '#f3f4f6' }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#111827' }}>All Categories</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 12 }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
          {categories.map((c) => (
            <TouchableOpacity
              key={c.id}
              onPress={() => router.push(`/search?category=${c.slug}`)}
              style={{
                width: '48%',
                backgroundColor: '#f9fafb',
                borderRadius: 8,
                padding: 12,
                marginBottom: 12,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: '#e5e7eb',
              }}
            >
              <Image source={{ uri: c.iconOrImageUrl }} style={{ width: 80, height: 80, borderRadius: 40 }} />
              <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#1f2937', marginTop: 8, textAlign: 'center' }}>
                {c.name}
              </Text>
              <Text style={{ fontSize: 11, color: '#2874f0', fontWeight: '600', marginTop: 4 }}>Explore →</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
