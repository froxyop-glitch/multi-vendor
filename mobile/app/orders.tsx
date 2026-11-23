import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Alert,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Package,
  Truck,
  CheckCircle2,
  Clock,
  XCircle,
  FileText,
  MessageSquare,
  X,
  ChevronRight,
  RotateCcw,
} from 'lucide-react-native';
import * as Linking from 'expo-linking';
import { apiClient, API_BASE_URL } from '../src/lib/api';
import { useAuth } from '../src/context/AuthContext';

export default function OrdersScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Tracking Modal State
  const [trackingModalVisible, setTrackingModalVisible] = useState(false);
  const [trackingData, setTrackingData] = useState<any>(null);
  const [loadingTracking, setLoadingTracking] = useState(false);

  useEffect(() => {
    loadOrders();
  }, [user]);

  const loadOrders = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const res = await apiClient.get('/orders/my-orders');
      if (res.data?.success) {
        setOrders(res.data.orders || []);
      }
    } catch (e) {
      Alert.alert('Error', 'Could not load your orders');
    } finally {
      setIsLoading(false);
    }
  };

  const openTracking = async (orderItemId: string) => {
    setTrackingModalVisible(true);
    setLoadingTracking(true);
    try {
      const res = await apiClient.get(`/orders/items/${orderItemId}/tracking`);
      if (res.data?.success) {
        setTrackingData(res.data);
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to retrieve tracking updates');
    } finally {
      setLoadingTracking(false);
    }
  };

  const cancelOrderItem = async (orderItemId: string) => {
    Alert.alert(
      'Cancel Item',
      'Are you sure you want to cancel this item? Any online payment will be refunded immediately.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await apiClient.post(`/orders/items/${orderItemId}/cancel`, {
                reason: 'Customer cancelled from mobile app',
              });
              if (res.data?.success) {
                Alert.alert('Item Cancelled', 'Your item has been cancelled and refund initiated.');
                loadOrders();
              }
            } catch (e: any) {
              Alert.alert('Cancellation Failed', e.response?.data?.message || 'Could not cancel item');
            }
          },
        },
      ]
    );
  };

  const returnOrderItem = async (orderItemId: string) => {
    Alert.alert(
      'Return Item',
      'Do you wish to initiate a return under the 7-day replacement policy?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Request Return',
          onPress: async () => {
            try {
              const res = await apiClient.post(`/orders/items/${orderItemId}/return`, {
                reason: 'Item defective or not as described',
                comments: 'Customer requested return via mobile app.',
              });
              if (res.data?.success) {
                Alert.alert('Return Requested', 'Seller has received your return request.');
                loadOrders();
              }
            } catch (e: any) {
              Alert.alert('Return Error', e.response?.data?.message || 'Could not request return');
            }
          },
        },
      ]
    );
  };

  const openInvoicePdf = (orderItemId: string) => {
    const invoiceUrl = `${API_BASE_URL}/invoices/item/${orderItemId}/pdf`;
    Linking.openURL(invoiceUrl).catch(() => {
      Alert.alert('Invoice', `Download invoice at: ${invoiceUrl}`);
    });
  };

  const startSupportChat = async (orderItemId: string) => {
    try {
      const res = await apiClient.post('/support/tickets', {
        subject: `Assistance with Order Item #${orderItemId.slice(0, 8)}`,
        category: 'ORDER_HELP',
        priority: 'MEDIUM',
        orderItemId,
        message: 'Hello, I need assistance with this order item.',
      });
      if (res.data?.success && res.data.ticket) {
        router.push(`/support/${res.data.ticket.id}`);
      }
    } catch (e) {
      Alert.alert('Error', 'Could not open support ticket');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DELIVERED':
        return '#388e3c';
      case 'SHIPPED':
        return '#2874f0';
      case 'CANCELLED':
      case 'RETURNED':
        return '#dc2626';
      case 'RETURN_REQUESTED':
        return '#ea580c';
      default:
        return '#f59e0b';
    }
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#2874f0" />
        <Text style={{ marginTop: 12, color: '#878787' }}>Fetching orders...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#f1f3f6' }}>
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 12 }}
        ListEmptyComponent={
          <View style={{ padding: 40, alignItems: 'center' }}>
            <Package color="#878787" size={48} />
            <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#212121', marginTop: 12 }}>
              No Orders Placed Yet
            </Text>
            <Text style={{ fontSize: 13, color: '#878787', marginTop: 4, textAlign: 'center' }}>
              Your order history, delivery milestones, and GST invoices will appear here.
            </Text>
          </View>
        }
        renderItem={({ item: order }) => (
          <View
            style={{
              backgroundColor: '#ffffff',
              borderRadius: 8,
              padding: 14,
              marginBottom: 12,
              shadowColor: '#000',
              shadowOpacity: 0.05,
              shadowRadius: 3,
              elevation: 2,
            }}
          >
            {/* Order Header */}
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                borderBottomWidth: 1,
                borderColor: '#f0f0f0',
                paddingBottom: 10,
              }}
            >
              <View>
                <Text style={{ fontSize: 12, color: '#878787' }}>
                  ORDER ID: #{order.id?.slice(0, 10).toUpperCase()}
                </Text>
                <Text style={{ fontSize: 11, color: '#9e9e9e', marginTop: 2 }}>
                  Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#212121' }}>
                  ₹{order.totalAmount?.toLocaleString('en-IN')}
                </Text>
                <Text style={{ fontSize: 11, color: '#2874f0', fontWeight: '600' }}>
                  {order.paymentMethod} • {order.paymentStatus}
                </Text>
              </View>
            </View>

            {/* Order Items */}
            {order.items?.map((item: any) => {
              const statusColor = getStatusColor(item.itemStatus);
              return (
                <View
                  key={item.id}
                  style={{
                    paddingTop: 12,
                    borderBottomWidth: 1,
                    borderColor: '#f0f0f0',
                    paddingBottom: 12,
                  }}
                >
                  <View style={{ flexDirection: 'row' }}>
                    <Image
                      source={{
                        uri:
                          item.product?.images?.[0] ||
                          'https://via.placeholder.com/80',
                      }}
                      style={{ width: 64, height: 64, borderRadius: 6, marginRight: 12 }}
                      resizeMode="contain"
                    />
                    <View style={{ flex: 1, justifyContent: 'space-between' }}>
                      <View>
                        <Text numberOfLines={2} style={{ fontSize: 13, fontWeight: '600', color: '#212121' }}>
                          {item.product?.title || 'Product'}
                        </Text>
                        <Text style={{ fontSize: 12, color: '#878787', marginTop: 2 }}>
                          Qty: {item.quantity} • ₹{item.priceAtPurchase?.toLocaleString('en-IN')}
                        </Text>
                      </View>

                      {/* Status pill */}
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          backgroundColor: `${statusColor}15`,
                          paddingHorizontal: 8,
                          paddingVertical: 2,
                          borderRadius: 4,
                          alignSelf: 'flex-start',
                          marginTop: 4,
                        }}
                      >
                        <View
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: 3,
                            backgroundColor: statusColor,
                            marginRight: 6,
                          }}
                        />
                        <Text style={{ fontSize: 11, fontWeight: 'bold', color: statusColor }}>
                          {item.itemStatus}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Actions for Item */}
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                    <TouchableOpacity
                      onPress={() => openTracking(item.id)}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: '#eff6ff',
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                        borderRadius: 4,
                      }}
                    >
                      <Truck color="#2874f0" size={14} style={{ marginRight: 4 }} />
                      <Text style={{ color: '#2874f0', fontSize: 12, fontWeight: '600' }}>
                        Track
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => openInvoicePdf(item.id)}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: '#f1f5f9',
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                        borderRadius: 4,
                      }}
                    >
                      <FileText color="#475569" size={14} style={{ marginRight: 4 }} />
                      <Text style={{ color: '#475569', fontSize: 12, fontWeight: '600' }}>
                        GST Invoice
                      </Text>
                    </TouchableOpacity>

                    {['PROCESSING', 'PACKED'].includes(item.itemStatus) && (
                      <TouchableOpacity
                        onPress={() => cancelOrderItem(item.id)}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          backgroundColor: '#fef2f2',
                          paddingHorizontal: 10,
                          paddingVertical: 6,
                          borderRadius: 4,
                        }}
                      >
                        <XCircle color="#dc2626" size={14} style={{ marginRight: 4 }} />
                        <Text style={{ color: '#dc2626', fontSize: 12, fontWeight: '600' }}>
                          Cancel
                        </Text>
                      </TouchableOpacity>
                    )}

                    {item.itemStatus === 'DELIVERED' && (
                      <TouchableOpacity
                        onPress={() => returnOrderItem(item.id)}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          backgroundColor: '#fffbeb',
                          paddingHorizontal: 10,
                          paddingVertical: 6,
                          borderRadius: 4,
                        }}
                      >
                        <RotateCcw color="#d97706" size={14} style={{ marginRight: 4 }} />
                        <Text style={{ color: '#d97706', fontSize: 12, fontWeight: '600' }}>
                          Return
                        </Text>
                      </TouchableOpacity>
                    )}

                    <TouchableOpacity
                      onPress={() => startSupportChat(item.id)}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: '#f3e8ff',
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                        borderRadius: 4,
                      }}
                    >
                      <MessageSquare color="#9333ea" size={14} style={{ marginRight: 4 }} />
                      <Text style={{ color: '#9333ea', fontSize: 12, fontWeight: '600' }}>
                        Help
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      />

      {/* Shipment Tracking Timeline Modal */}
      <Modal
        visible={trackingModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setTrackingModalVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View
            style={{
              backgroundColor: '#ffffff',
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              padding: 20,
              maxHeight: '75%',
            }}
          >
            {/* Modal Header */}
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottomWidth: 1,
                borderColor: '#f0f0f0',
                paddingBottom: 12,
              }}
            >
              <View>
                <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#212121' }}>
                  Shipment Tracking
                </Text>
                {trackingData?.courierName && (
                  <Text style={{ fontSize: 12, color: '#878787', marginTop: 2 }}>
                    Courier: {trackingData.courierName} • AWB: {trackingData.awbTrackingNumber}
                  </Text>
                )}
              </View>
              <TouchableOpacity onPress={() => setTrackingModalVisible(false)}>
                <X color="#212121" size={22} />
              </TouchableOpacity>
            </View>

            {loadingTracking ? (
              <View style={{ padding: 40, alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#2874f0" />
                <Text style={{ marginTop: 10, color: '#878787' }}>Fetching live timeline...</Text>
              </View>
            ) : (
              <ScrollView style={{ marginTop: 14 }}>
                {trackingData?.events && trackingData.events.length > 0 ? (
                  trackingData.events.map((evt: any, idx: number) => (
                    <View key={idx} style={{ flexDirection: 'row', marginBottom: 18 }}>
                      <View style={{ alignItems: 'center', marginRight: 12 }}>
                        <View
                          style={{
                            width: 14,
                            height: 14,
                            borderRadius: 7,
                            backgroundColor: idx === 0 ? '#388e3c' : '#2874f0',
                          }}
                        />
                        {idx !== trackingData.events.length - 1 && (
                          <View style={{ width: 2, flex: 1, backgroundColor: '#e0e0e0', marginTop: 2 }} />
                        )}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 14, fontWeight: '600', color: '#212121' }}>
                          {evt.statusTitle}
                        </Text>
                        <Text style={{ fontSize: 12, color: '#616161', marginTop: 2 }}>
                          {evt.remarks || 'Standard transit update'}
                        </Text>
                        <Text style={{ fontSize: 11, color: '#9e9e9e', marginTop: 2 }}>
                          {evt.location} • {new Date(evt.eventTime).toLocaleString()}
                        </Text>
                      </View>
                    </View>
                  ))
                ) : (
                  <View style={{ padding: 20, alignItems: 'center' }}>
                    <Clock color="#878787" size={32} />
                    <Text style={{ fontSize: 13, color: '#878787', marginTop: 8 }}>
                      Tracking events will appear once the seller dispatches the package.
                    </Text>
                  </View>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}
