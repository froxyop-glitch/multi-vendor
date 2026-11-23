import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

dotenv.config();

import authRoutes from './routes/auth.routes';
import storeRoutes from './routes/store.routes';
import productRoutes from './routes/product.routes';
import discoveryRoutes from './routes/discovery.routes';
import logisticsRoutes from './routes/logistics.routes';
import seoRoutes from './routes/seo.routes';
import cartRoutes from './routes/cart.routes';
import paymentOrderRoutes from './routes/paymentOrder.routes';
import sellerRoutes from './routes/seller.routes';
import adminRoutes from './routes/admin.routes';
import supportRoutes from './routes/support.routes';

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// Socket.IO Server Setup
export const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

io.on('connection', (socket) => {
  console.log(`[Socket.IO] Client connected: ${socket.id}`);

  socket.on('join_ticket', (ticketId: string) => {
    socket.join(`ticket:${ticketId}`);
    console.log(`[Socket.IO] Client ${socket.id} joined ticket room ticket:${ticketId}`);
  });

  socket.on('leave_ticket', (ticketId: string) => {
    socket.leave(`ticket:${ticketId}`);
    console.log(`[Socket.IO] Client ${socket.id} left ticket room ticket:${ticketId}`);
  });

  socket.on('disconnect', () => {
    console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
  });
});

// Middlewares
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({ origin: '*', credentials: true }));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health Check
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'ShopEzy Multi-Vendor E-Commerce REST & WebSocket API',
    version: '1.0.0',
  });
});

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/store', storeRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/discovery', discoveryRoutes);
app.use('/api/v1/logistics', logisticsRoutes);
app.use('/api/v1/seo', seoRoutes);
app.use('/api/v1/cart', cartRoutes);
app.use('/api/v1/coupons', cartRoutes);
app.use('/api/v1', paymentOrderRoutes);
app.use('/api/v1/seller', sellerRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/support', supportRoutes);

// Global 404
app.use((req: Request, res: Response) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.url} not found.` });
});

// Global Error Handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[Unhandled Error]:', err);
  res.status(500).json({ success: false, message: err.message || 'Internal Server Error' });
});

if (process.env.NODE_ENV !== 'test') {
  server.listen(PORT, () => {
    console.log(`🚀 Server running in ${process.env.NODE_ENV || 'development'} on http://localhost:${PORT}`);
    console.log(`📡 Socket.IO server initialized on ws://localhost:${PORT}`);
  });
}

export { app, server };
