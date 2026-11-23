import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  (Platform.OS === 'android' ? 'http://10.0.2.2:5000/api/v1' : 'http://localhost:5000/api/v1');

export const SOCKET_URL =
  process.env.EXPO_PUBLIC_SOCKET_URL ||
  (Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000');

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(async (config) => {
  try {
    let token: string | null = null;
    if (Platform.OS !== 'web') {
      token = await SecureStore.getItemAsync('shopezy_token');
    } else if (typeof window !== 'undefined') {
      token = localStorage.getItem('shopezy_token');
    }
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (e) {
    // ignore
  }
  return config;
});

export async function saveAuthToken(token: string) {
  try {
    if (Platform.OS !== 'web') {
      await SecureStore.setItemAsync('shopezy_token', token);
    } else if (typeof window !== 'undefined') {
      localStorage.setItem('shopezy_token', token);
    }
  } catch (e) {}
}

export async function removeAuthToken() {
  try {
    if (Platform.OS !== 'web') {
      await SecureStore.deleteItemAsync('shopezy_token');
    } else if (typeof window !== 'undefined') {
      localStorage.removeItem('shopezy_token');
    }
  } catch (e) {}
}
