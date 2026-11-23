import { prisma } from '../prisma';

export async function sendPushNotification(userId: string, title: string, body: string, data?: any) {
  try {
    const config = await prisma.siteConfig.findUnique({ where: { id: 'default' } });
    if (config && !config.push_notifications_enabled) {
      console.log('Push notifications disabled globally.');
      return;
    }

    const tokens = await prisma.devicePushToken.findMany({
      where: { user_id: userId, is_active: true },
    });

    for (const tokenItem of tokens) {
      console.log(`[Push Notification] To: ${tokenItem.expo_push_token} | Title: "${title}" | Body: "${body}"`);
      await prisma.notificationLog.create({
        data: {
          user_id: userId,
          order_id: data?.orderId || null,
          channel: 'PUSH',
          event_type: data?.eventType || 'GENERAL_NOTIFICATION',
          status: 'SENT',
          error_message: null,
          created_at: new Date().toISOString(),
        },
      });
    }
  } catch (err: any) {
    console.error('Error dispatching push notification:', err.message);
  }
}

export async function sendOrderReceiptEmail(userEmail: string, userId: string, orderId: string, orderDetails: any) {
  try {
    const config = await prisma.siteConfig.findUnique({ where: { id: 'default' } });
    if (config && !config.email_notifications_enabled) {
      console.log('Email notifications disabled globally.');
      return;
    }

    console.log(`[Order Receipt Email] To: ${userEmail} | Order ID: #${orderId} | Amount: ₹${orderDetails.totalAmount}`);
    await prisma.notificationLog.create({
      data: {
        user_id: userId,
        order_id: orderId,
        channel: 'EMAIL',
        event_type: 'ORDER_CONFIRMATION',
        status: 'SENT',
        error_message: null,
        created_at: new Date().toISOString(),
      },
    });
  } catch (err: any) {
    console.error('Error sending receipt email:', err.message);
  }
}
