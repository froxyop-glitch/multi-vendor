import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Send, User, Headphones, Shield } from 'lucide-react-native';
import { io, Socket } from 'socket.io-client';
import { apiClient, SOCKET_URL } from '../../src/lib/api';
import { useAuth } from '../../src/context/AuthContext';

export default function TicketChatScreen() {
  const { ticketId } = useLocalSearchParams<{ ticketId: string }>();
  const { user } = useAuth();

  const [ticket, setTicket] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const socketRef = useRef<Socket | null>(null);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (ticketId) {
      loadTicket();
      initSocket();
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [ticketId]);

  const loadTicket = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get(`/support/tickets/${ticketId}`);
      if (res.data?.success) {
        setTicket(res.data.ticket);
        setMessages(res.data.ticket.messages || []);
      }
    } catch (e) {
    } finally {
      setIsLoading(false);
    }
  };

  const initSocket = () => {
    const socket = io(SOCKET_URL, {
      transports: ['websocket'],
    });

    socket.on('connect', () => {
      socket.emit('join_ticket', ticketId);
    });

    socket.on('ticket_message', (newMsg: any) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === newMsg.id)) return prev;
        return [...prev, newMsg];
      });
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    });

    socketRef.current = socket;
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;
    const msgText = inputText;
    setInputText('');
    setIsSending(true);

    try {
      const res = await apiClient.post(`/support/tickets/${ticketId}/messages`, {
        messageText: msgText,
      });

      if (res.data?.success && res.data.message) {
        setMessages((prev) => [...prev, res.data.message]);
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    } catch (e) {
      setInputText(msgText); // restore on error
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#2874f0" />
        <Text style={{ marginTop: 12, color: '#878787' }}>Connecting to support desk...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f1f3f6' }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Ticket Header Card */}
        {ticket && (
          <View
            style={{
              backgroundColor: '#ffffff',
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderBottomWidth: 1,
              borderColor: '#e0e0e0',
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#212121' }}>
                {ticket.ticketNumber} • {ticket.category}
              </Text>
              <View
                style={{
                  backgroundColor: ticket.status === 'RESOLVED' ? '#dcfce7' : '#eff6ff',
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: 4,
                }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: 'bold',
                    color: ticket.status === 'RESOLVED' ? '#15803d' : '#2874f0',
                  }}
                >
                  {ticket.status}
                </Text>
              </View>
            </View>
            <Text style={{ fontSize: 12, color: '#616161', marginTop: 4 }}>
              {ticket.subject}
            </Text>
          </View>
        )}

        {/* Message Thread */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 14, gap: 10 }}
          renderItem={({ item }) => {
            const isMe = item.senderId === user?.id;
            const isAgent = item.senderRole === 'ADMIN' || item.senderRole === 'SUPPORT_AGENT';

            return (
              <View
                style={{
                  alignSelf: isMe ? 'flex-end' : 'flex-start',
                  maxWidth: '82%',
                }}
              >
                {/* Sender badge */}
                {!isMe && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                    {isAgent ? (
                      <Headphones color="#2874f0" size={12} style={{ marginRight: 4 }} />
                    ) : (
                      <User color="#878787" size={12} style={{ marginRight: 4 }} />
                    )}
                    <Text style={{ fontSize: 10, color: '#878787', fontWeight: 'bold' }}>
                      {isAgent ? 'Support Executive' : 'Customer'}
                    </Text>
                  </View>
                )}

                <View
                  style={{
                    backgroundColor: isMe ? '#2874f0' : '#ffffff',
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    borderRadius: 14,
                    borderBottomRightRadius: isMe ? 2 : 14,
                    borderBottomLeftRadius: isMe ? 14 : 2,
                    shadowColor: '#000',
                    shadowOpacity: 0.05,
                    shadowRadius: 2,
                    elevation: 1,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      color: isMe ? '#ffffff' : '#212121',
                      lineHeight: 20,
                    }}
                  >
                    {item.messageText}
                  </Text>
                  <Text
                    style={{
                      fontSize: 10,
                      color: isMe ? 'rgba(255,255,255,0.7)' : '#9e9e9e',
                      alignSelf: 'flex-end',
                      marginTop: 4,
                    }}
                  >
                    {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
              </View>
            );
          }}
        />

        {/* Message Input Bar */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: '#ffffff',
            paddingHorizontal: 12,
            paddingVertical: 10,
            borderTopWidth: 1,
            borderColor: '#e0e0e0',
          }}
        >
          <TextInput
            placeholder="Type your message..."
            value={inputText}
            onChangeText={setInputText}
            style={{
              flex: 1,
              backgroundColor: '#f1f3f6',
              borderRadius: 20,
              paddingHorizontal: 14,
              paddingVertical: 8,
              fontSize: 14,
              maxHeight: 100,
            }}
            multiline
          />
          <TouchableOpacity
            onPress={handleSendMessage}
            disabled={isSending || !inputText.trim()}
            style={{
              backgroundColor: inputText.trim() ? '#2874f0' : '#e0e0e0',
              width: 40,
              height: 40,
              borderRadius: 20,
              justifyContent: 'center',
              alignItems: 'center',
              marginLeft: 8,
            }}
          >
            {isSending ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Send color="#ffffff" size={18} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
