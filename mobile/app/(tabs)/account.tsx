import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import {
  User,
  Package,
  Globe,
  HelpCircle,
  LogOut,
  ShieldAlert,
  Store,
  Sparkles,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../src/context/AuthContext';

export default function AccountScreen() {
  const router = useRouter();
  const { user, logout, quickSwitchAccount } = useAuth();
  const { t, i18n } = useTranslation();

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f1f3f6' }}>
      {/* Top Profile Header */}
      <View style={{ backgroundColor: '#2874f0', paddingTop: 45, paddingBottom: 20, paddingHorizontal: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View
            style={{
              width: 50,
              height: 50,
              borderRadius: 25,
              backgroundColor: '#ffffff',
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: 12,
            }}
          >
            <User size={28} color="#2874f0" />
          </View>
          <View>
            <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#ffffff' }}>
              {user ? user.name : 'Welcome, Guest'}
            </Text>
            <Text style={{ fontSize: 12, color: '#e0e7ff' }}>
              {user ? user.email : 'Log in to explore exclusive perks'}
            </Text>
            {user && (
              <View style={{ flexDirection: 'row', gap: 6, marginTop: 4 }}>
                <View style={{ backgroundColor: '#ffffff', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 3 }}>
                  <Text style={{ fontSize: 9, fontWeight: '900', color: '#2874f0' }}>{user.role}</Text>
                </View>
                {user.adminSubRole && (
                  <View style={{ backgroundColor: '#f3e8ff', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 3 }}>
                    <Text style={{ fontSize: 9, fontWeight: '900', color: '#7e22ce' }}>{user.adminSubRole}</Text>
                  </View>
                )}
              </View>
            )}
          </View>
        </View>
      </View>

      <View style={{ padding: 12 }}>
        {/* Quick Menu Links */}
        <View style={{ backgroundColor: '#ffffff', borderRadius: 8, padding: 4, marginBottom: 12 }}>
          <TouchableOpacity
            onPress={() => router.push('/orders')}
            style={{ flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderColor: '#f3f4f6' }}
          >
            <Package size={20} color="#2874f0" />
            <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#1f2937', marginLeft: 12 }}>
              {t('myOrders')} & Tracking
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/support/tkt_82910')}
            style={{ flexDirection: 'row', alignItems: 'center', padding: 12 }}
          >
            <HelpCircle size={20} color="#2874f0" />
            <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#1f2937', marginLeft: 12 }}>
              {t('helpDesk')} & Live Chat
            </Text>
          </TouchableOpacity>
        </View>

        {/* Multilingual Switcher */}
        <View style={{ backgroundColor: '#ffffff', borderRadius: 8, padding: 12, marginBottom: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
            <Globe size={18} color="#2874f0" />
            <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#1f2937', marginLeft: 8 }}>
              App Language / भाषा / ভাষা
            </Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {[
              { label: 'English', code: 'en' },
              { label: 'हिन्दी', code: 'hi' },
              { label: 'বাংলা', code: 'bn' },
            ].map((l) => (
              <TouchableOpacity
                key={l.code}
                onPress={() => handleLanguageChange(l.code)}
                style={{
                  flex: 1,
                  paddingVertical: 8,
                  borderRadius: 4,
                  borderWidth: 1,
                  borderColor: i18n.language === l.code ? '#2874f0' : '#d1d5db',
                  backgroundColor: i18n.language === l.code ? '#eff6ff' : '#ffffff',
                  alignItems: 'center',
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: 'bold',
                    color: i18n.language === l.code ? '#2874f0' : '#4b5563',
                  }}
                >
                  {l.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Seller / Admin Mode Switcher */}
        <View style={{ backgroundColor: '#ffffff', borderRadius: 8, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: '#fde68a' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
            <Sparkles size={16} color="#d97706" />
            <Text style={{ fontSize: 12, fontWeight: '900', color: '#b45309', marginLeft: 6, textTransform: 'uppercase' }}>
              {t('switchRole')}
            </Text>
          </View>
          <Text style={{ fontSize: 11, color: '#6b7280', marginBottom: 10 }}>
            Tap any account below to instantly switch active authentication mode:
          </Text>

          <View style={{ gap: 6 }}>
            <TouchableOpacity
              onPress={() => quickSwitchAccount('ADMIN')}
              style={{ backgroundColor: '#f3e8ff', padding: 8, borderRadius: 4, borderWidth: 1, borderColor: '#d8b4fe' }}
            >
              <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#6b21a8' }}>
                🛡️ Super Admin (admin@shopezy.com)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => quickSwitchAccount('SELLER_1')}
              style={{ backgroundColor: '#ecfdf5', padding: 8, borderRadius: 4, borderWidth: 1, borderColor: '#a7f3d0' }}
            >
              <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#047857' }}>
                🏪 Seller: TechWorld Electronics
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => quickSwitchAccount('SELLER_2')}
              style={{ backgroundColor: '#ecfdf5', padding: 8, borderRadius: 4, borderWidth: 1, borderColor: '#a7f3d0' }}
            >
              <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#047857' }}>
                🏪 Seller: UrbanStyle Apparel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => quickSwitchAccount('CUSTOMER')}
              style={{ backgroundColor: '#eff6ff', padding: 8, borderRadius: 4, borderWidth: 1, borderColor: '#bfdbfe' }}
            >
              <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#1d4ed8' }}>
                👤 Customer: Rahul Sen
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => quickSwitchAccount('FINANCE')}
              style={{ backgroundColor: '#fdf2f8', padding: 8, borderRadius: 4, borderWidth: 1, borderColor: '#fbcfe8' }}
            >
              <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#9d174d' }}>
                💼 Finance Officer
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Logout */}
        {user && (
          <TouchableOpacity
            onPress={logout}
            style={{
              backgroundColor: '#ffffff',
              borderRadius: 8,
              padding: 12,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: '#fca5a5',
            }}
          >
            <LogOut size={16} color="#ef4444" />
            <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#ef4444', marginLeft: 8 }}>
              {t('logout')}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}
