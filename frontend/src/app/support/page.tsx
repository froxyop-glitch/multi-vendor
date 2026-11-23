'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { io, Socket } from 'socket.io-client';
import {
  MessageSquare,
  Send,
  PlusCircle,
  HelpCircle,
  Clock,
  CheckCircle,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../lib/api';

export default function SupportPage() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<any[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // New Ticket Modal State
  const [showNewModal, setShowNewModal] = useState(false);
  const [newCategory, setNewCategory] = useState('Shipping & Delivery');
  const [newSubject, setNewSubject] = useState('');
  const [newPriority, setNewPriority] = useState('MEDIUM');
  const [newInitialMsg, setNewInitialMsg] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize Socket.IO connection
    socketRef.current = io('http://localhost:5000');

    socketRef.current.on('connect', () => {
      console.log('Connected to support socket');
    });

    socketRef.current.on('new_message', (msg: any) => {
      setMessages((prev) => [...prev, msg]);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    });

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, []);

  useEffect(() => {
    async function loadTickets() {
      if (!user) return;
      setIsLoading(true);
      const res = await apiRequest('/support/tickets');
      if (res.success && res.tickets) {
        setTickets(res.tickets);
        if (res.tickets.length > 0) {
          selectTicket(res.tickets[0].id);
        }
      }
      setIsLoading(false);
    }
    loadTickets();
  }, [user]);

  const selectTicket = async (ticketId: string) => {
    if (selectedTicket && socketRef.current) {
      socketRef.current.emit('leave_ticket', selectedTicket.id);
    }

    const res = await apiRequest(`/support/tickets/${ticketId}`);
    if (res.success && res.ticket) {
      setSelectedTicket(res.ticket);
      setMessages(res.messages || []);

      if (socketRef.current) {
        socketRef.current.emit('join_ticket', res.ticket.id);
      }
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !messageInput.trim()) return;

    const text = messageInput.trim();
    setMessageInput('');

    const res = await apiRequest(`/support/tickets/${selectedTicket.id}/messages`, {
      method: 'POST',
      body: JSON.stringify({ messageText: text }),
    });

    if (!res.success) {
      alert(res.message || 'Failed to send message.');
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject.trim() || !newInitialMsg.trim()) return;

    setIsCreating(true);
    const res = await apiRequest('/support/tickets', {
      method: 'POST',
      body: JSON.stringify({
        category: newCategory,
        subject: newSubject,
        priority: newPriority,
        initialMessage: newInitialMsg,
      }),
    });
    setIsCreating(false);

    if (res.success && res.ticket) {
      setShowNewModal(false);
      setNewSubject('');
      setNewInitialMsg('');
      setTickets((prev) => [res.ticket, ...prev]);
      selectTicket(res.ticket.id);
    } else {
      alert(res.message || 'Could not create ticket.');
    }
  };

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <HelpCircle className="w-16 h-16 text-gray-300 mx-auto" />
        <h2 className="text-xl font-bold text-gray-800">Support Help Desk</h2>
        <p className="text-xs text-gray-500">Please log in to contact our 24x7 customer support representatives.</p>
        <Link href="/" className="inline-block px-6 py-2.5 bg-fkblue text-white rounded font-bold text-xs">
          Go to Home & Login
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-2 sm:px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-fkblue" />
            <span>24x7 Customer Support & Help Desk</span>
          </h1>
          <p className="text-xs text-gray-500">Real-time messaging with assigned executives</p>
        </div>

        <button
          onClick={() => setShowNewModal(true)}
          className="px-4 py-2 bg-fkblue hover:bg-fkblue-dark text-white rounded font-bold text-xs flex items-center gap-1.5 shadow"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Support Ticket</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 h-[600px] bg-white rounded border border-gray-200 shadow-sm overflow-hidden">
        {/* Left: Ticket List */}
        <div className="md:col-span-4 border-r border-gray-200 flex flex-col h-full bg-gray-50">
          <div className="p-3 border-b border-gray-200 bg-white">
            <h2 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Your Tickets ({tickets.length})</h2>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
            {tickets.map((t) => (
              <button
                key={t.id}
                onClick={() => selectTicket(t.id)}
                className={`w-full text-left p-3 transition-colors ${
                  selectedTicket?.id === t.id ? 'bg-blue-50 border-l-4 border-fkblue' : 'hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] font-bold text-fkblue">{t.ticket_number}</span>
                  <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                    t.status === 'OPEN' ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {t.status}
                  </span>
                </div>
                <p className="text-xs font-semibold text-gray-900 mt-1 line-clamp-1">{t.subject}</p>
                <p className="text-[11px] text-gray-500 mt-0.5">{t.category}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Right: Live Chat Pane */}
        <div className="md:col-span-8 flex flex-col h-full bg-white">
          {selectedTicket ? (
            <>
              {/* Chat Header */}
              <div className="p-3 border-b border-gray-200 flex items-center justify-between bg-gray-50">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-fkblue">{selectedTicket.ticket_number}</span>
                    <span className="font-bold text-sm text-gray-900">{selectedTicket.subject}</span>
                  </div>
                  <p className="text-[11px] text-gray-500">{selectedTicket.category} • Priority: {selectedTicket.priority}</p>
                </div>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-green-100 text-green-800">
                  {selectedTicket.status}
                </span>
              </div>

              {/* Messages Container */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50">
                {messages.map((m) => {
                  const isMe = m.sender_id === user.id;
                  return (
                    <div key={m.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      <div className="flex items-center gap-1.5 mb-1 text-[10px] text-gray-500 font-semibold">
                        <span>{isMe ? 'You' : m.sender_role === 'ADMIN' ? 'Support Agent' : 'Seller'}</span>
                        <span>•</span>
                        <span>{new Date(m.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div
                        className={`max-w-md px-3.5 py-2 rounded-lg text-xs leading-relaxed shadow-sm ${
                          isMe
                            ? 'bg-fkblue text-white rounded-tr-none'
                            : 'bg-white text-gray-900 border border-gray-200 rounded-tl-none'
                        }`}
                      >
                        {m.message_text}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input Bar */}
              <form onSubmit={handleSendMessage} className="p-3 border-t border-gray-200 flex gap-2 bg-white">
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder="Type your message here..."
                  className="flex-1 px-3 py-2 border rounded text-xs focus:outline-none focus:border-fkblue"
                />
                <button
                  type="submit"
                  disabled={!messageInput.trim()}
                  className="px-4 py-2 bg-fkblue hover:bg-fkblue-dark text-white rounded font-bold text-xs flex items-center gap-1 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send</span>
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-gray-400">
              <MessageSquare className="w-12 h-12 mb-2" />
              <p className="text-sm font-semibold">Select a ticket to begin chatting with support</p>
            </div>
          )}
        </div>
      </div>

      {/* New Ticket Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-gray-900">Create New Support Ticket</h3>

            <form onSubmit={handleCreateTicket} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-gray-700 block mb-1">Issue Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full px-3 py-2 border rounded bg-white"
                >
                  <option value="Shipping & Delivery">Shipping & Delivery</option>
                  <option value="Payments & Invoices">Payments & Invoices</option>
                  <option value="Cancellation & Returns">Cancellation & Returns</option>
                  <option value="Product Defect / Quality">Product Defect / Quality</option>
                  <option value="Other Inquiries">Other Inquiries</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Subject</label>
                <input
                  type="text"
                  required
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  placeholder="e.g. Tracking not updated for Order #1002"
                  className="w-full px-3 py-2 border rounded"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Priority</label>
                <select
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value)}
                  className="w-full px-3 py-2 border rounded bg-white"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Initial Message</label>
                <textarea
                  rows={3}
                  required
                  value={newInitialMsg}
                  onChange={(e) => setNewInitialMsg(e.target.value)}
                  placeholder="Describe your issue in detail..."
                  className="w-full px-3 py-2 border rounded"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 border rounded text-gray-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-5 py-2 bg-fkblue text-white rounded font-bold hover:bg-fkblue-dark"
                >
                  {isCreating ? 'Creating...' : 'Open Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
