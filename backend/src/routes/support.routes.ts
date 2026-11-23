import { Router, Response } from 'express';
import { prisma } from '../prisma';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import { io } from '../server';

const router = Router();
router.use(authMiddleware);

// GET /api/v1/support/tickets
router.get('/tickets', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const role = req.user!.role;

    let tickets;
    if (role === 'ADMIN') {
      tickets = await prisma.supportTicket.findMany({ orderBy: { last_message_at: 'desc' } });
    } else if (role === 'SELLER') {
      const seller = await prisma.sellerProfile.findUnique({ where: { user_id: userId } });
      tickets = await prisma.supportTicket.findMany({
        where: { seller_id: seller?.id || '' },
        orderBy: { last_message_at: 'desc' },
      });
    } else {
      tickets = await prisma.supportTicket.findMany({
        where: { user_id: userId },
        orderBy: { last_message_at: 'desc' },
      });
    }

    const enriched = [];
    for (const t of tickets) {
      const user = await prisma.user.findUnique({ where: { id: t.user_id } });
      const lastMsg = await prisma.ticketMessage.findFirst({
        where: { ticket_id: t.id },
        orderBy: { created_at: 'desc' },
      });
      enriched.push({
        ...t,
        customerName: user?.name || 'Customer',
        lastMessagePreview: lastMsg?.message_text || '',
      });
    }

    return res.json({ success: true, tickets: enriched });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/v1/support/tickets
router.post('/tickets', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { category, subject, priority = 'MEDIUM', orderItemId, sellerId, initialMessage } = req.body;

    if (!category || !subject || !initialMessage) {
      return res.status(400).json({ success: false, message: 'Category, subject, and initial message are required.' });
    }

    const ticketNumber = `TKT-${Math.floor(10000 + Math.random() * 90000)}`;

    const ticket = await prisma.supportTicket.create({
      data: {
        ticket_number: ticketNumber,
        user_id: userId,
        order_item_id: orderItemId || null,
        seller_id: sellerId || null,
        category,
        subject,
        priority,
        status: 'OPEN',
        last_message_at: new Date().toISOString(),
      },
    });

    const msg = await prisma.ticketMessage.create({
      data: {
        ticket_id: ticket.id,
        sender_id: userId,
        sender_role: req.user!.role,
        message_text: initialMessage,
        attachment_url: null,
        is_read: false,
      },
    });

    return res.status(201).json({ success: true, ticket, message: msg });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/v1/support/tickets/:ticketId
router.get('/tickets/:ticketId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { ticketId } = req.params;
    let ticket = await prisma.supportTicket.findUnique({ where: { id: ticketId } });
    if (!ticket) {
      ticket = await prisma.supportTicket.findUnique({ where: { ticket_number: ticketId } });
    }

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found.' });
    }

    const messages = await prisma.ticketMessage.findMany({
      where: { ticket_id: ticket.id },
      orderBy: { created_at: 'asc' },
    });

    const user = await prisma.user.findUnique({ where: { id: ticket.user_id } });

    return res.json({
      success: true,
      ticket: {
        ...ticket,
        customerName: user?.name || 'Customer',
        customerEmail: user?.email || '',
      },
      messages,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/v1/support/tickets/:ticketId/messages
router.post('/tickets/:ticketId/messages', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { ticketId } = req.params;
    const { messageText, attachmentUrl } = req.body;
    const userId = req.user!.userId;

    if (!messageText) {
      return res.status(400).json({ success: false, message: 'Message text is required.' });
    }

    let ticket = await prisma.supportTicket.findUnique({ where: { id: ticketId } });
    if (!ticket) {
      ticket = await prisma.supportTicket.findUnique({ where: { ticket_number: ticketId } });
    }

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found.' });
    }

    const message = await prisma.ticketMessage.create({
      data: {
        ticket_id: ticket.id,
        sender_id: userId,
        sender_role: req.user!.role,
        message_text: messageText,
        attachment_url: attachmentUrl || null,
        is_read: false,
      },
    });

    await prisma.supportTicket.update({
      where: { id: ticket.id },
      data: {
        last_message_at: new Date().toISOString(),
        ...(ticket.status === 'CLOSED' ? { status: 'OPEN' } : {}),
      },
    });

    // Broadcast in Socket.IO room
    if (io) {
      io.to(`ticket:${ticket.id}`).emit('new_message', message);
    }

    return res.status(201).json({ success: true, message });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/v1/support/tickets/:ticketId/status
router.patch('/tickets/:ticketId/status', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { ticketId } = req.params;
    const { status } = req.body;

    const updated = await prisma.supportTicket.update({
      where: { id: ticketId },
      data: { status },
    });

    if (io) {
      io.to(`ticket:${ticketId}`).emit('ticket_status_change', { ticketId, status });
    }

    return res.json({ success: true, ticket: updated });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
