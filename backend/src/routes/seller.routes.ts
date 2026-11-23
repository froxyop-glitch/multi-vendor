import { Router, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../prisma';
import { authMiddleware, rbacGuard, AuthenticatedRequest } from '../middleware/auth';
import { recordAuditLog } from '../services/auditService';
import { sendPushNotification } from '../services/notificationService';

const router = Router();

// Middleware ensuring seller is approved
async function sellerApprovedGuard(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const seller = await prisma.sellerProfile.findUnique({ where: { user_id: userId } });
    if (!seller) {
      return res.status(403).json({ success: false, message: 'Seller profile not found.' });
    }
    if (seller.approval_status !== 'APPROVED') {
      return res.status(403).json({
        success: false,
        message: `Your seller account is currently ${seller.approval_status}. Please contact support.`,
        approvalStatus: seller.approval_status,
      });
    }
    req.user!.sellerId = seller.id;
    next();
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

router.use(authMiddleware);
router.use(rbacGuard(['SELLER', 'ADMIN']));
router.use(sellerApprovedGuard);

// GET /api/v1/seller/profile
router.get('/profile', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const seller = await prisma.sellerProfile.findUnique({ where: { id: req.user!.sellerId! } });
    const payoutMethods = await prisma.sellerPayoutMethod.findMany({ where: { seller_id: req.user!.sellerId! } });
    return res.json({ success: true, seller, payoutMethods });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/v1/seller/profile
router.put('/profile', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { storeName, gstinOrTaxId, registeredState, registeredAddress, pickupPincode, handlingDays } = req.body;
    const updated = await prisma.sellerProfile.update({
      where: { id: req.user!.sellerId! },
      data: {
        store_name: storeName,
        gstin_or_tax_id: gstinOrTaxId,
        registered_state: registeredState,
        registered_address: registeredAddress,
        pickup_pincode: pickupPincode,
        handling_days: handlingDays ? parseInt(handlingDays, 10) : 1,
      },
    });

    await recordAuditLog({
      actorId: req.user!.userId,
      actorEmail: req.user!.email,
      actorRole: 'SELLER',
      action: 'SELLER_PROFILE_UPDATE',
      targetType: 'SellerProfile',
      targetId: updated.id,
      summary: `Updated seller profile for ${updated.store_name}`,
      req,
    });

    return res.json({ success: true, seller: updated });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/v1/seller/analytics
router.get('/analytics', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const sellerId = req.user!.sellerId!;
    const seller = await prisma.sellerProfile.findUnique({ where: { id: sellerId } });
    const orderItems = await prisma.orderItem.findMany({ where: { seller_id: sellerId } });

    let totalRevenue = 0;
    let deliveredCount = 0;
    let processingCount = 0;
    let shippedCount = 0;

    for (const item of orderItems) {
      if (item.item_status === 'DELIVERED') {
        totalRevenue += item.seller_net_earning;
        deliveredCount++;
      } else if (item.item_status === 'SHIPPED') {
        shippedCount++;
      } else if (item.item_status === 'PROCESSING' || item.item_status === 'PACKED') {
        processingCount++;
      }
    }

    const products = await prisma.product.findMany({ where: { seller_id: sellerId } });

    return res.json({
      success: true,
      stats: {
        totalRevenue: Number(totalRevenue.toFixed(2)),
        availableBalance: seller?.available_balance || 0,
        pendingClearanceBalance: seller?.pending_clearance_balance || 0,
        totalWithdrawn: seller?.total_withdrawn || 0,
        totalOrders: orderItems.length,
        deliveredCount,
        processingCount,
        shippedCount,
        activeProductsCount: products.filter((p) => p.is_active).length,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/v1/seller/products
router.get('/products', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const sellerId = req.user!.sellerId!;
    const products = await prisma.product.findMany({
      where: { seller_id: sellerId },
      orderBy: { created_at: 'desc' },
    });

    const enriched = [];
    for (const p of products) {
      const variants = await prisma.productVariant.findMany({ where: { product_id: p.id } });
      const cat = await prisma.category.findUnique({ where: { id: p.category_id } });
      enriched.push({
        ...p,
        variants,
        categoryName: cat?.name || '',
      });
    }

    return res.json({ success: true, products: enriched });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/v1/seller/products
router.post('/products', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const sellerId = req.user!.sellerId!;
    const {
      categoryId,
      title,
      description,
      price,
      discountPrice,
      stockQuantity = 0,
      images = [],
      specifications = {},
      hasVariants = false,
      variantOptions = [],
      variants = [],
      hsnCode = '8517',
      gstRatePercent = 18.0,
      metaTitle,
      metaDescription,
    } = req.body;

    if (!categoryId || !title || !price) {
      return res.status(400).json({ success: false, message: 'Category, title, and price are required.' });
    }

    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '') + `-${Date.now().toString().slice(-4)}`;

    const product = await prisma.product.create({
      data: {
        seller_id: sellerId,
        category_id: categoryId,
        title,
        slug,
        description: description || '',
        price: parseFloat(price),
        discount_price: discountPrice ? parseFloat(discountPrice) : parseFloat(price),
        stock_quantity: parseInt(stockQuantity, 10) || 0,
        images: images.length > 0 ? images : ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800'],
        specifications,
        has_variants: Boolean(hasVariants),
        variant_options: variantOptions,
        hsn_code: hsnCode,
        gst_rate_percent: parseFloat(gstRatePercent),
        is_featured: false,
        is_active: true,
        meta_title: metaTitle || title,
        meta_description: metaDescription || description?.slice(0, 160),
      },
    });

    const createdVariants = [];
    if (hasVariants && Array.isArray(variants)) {
      for (const v of variants) {
        const variant = await prisma.productVariant.create({
          data: {
            product_id: product.id,
            sku: v.sku || `${product.slug}-${uuidv4().slice(0, 6)}`.toUpperCase(),
            attributes: v.attributes || {},
            price: parseFloat(v.price) || product.price,
            discount_price: parseFloat(v.discountPrice) || product.discount_price,
            stock_quantity: parseInt(v.stockQuantity, 10) || 0,
            image_url: v.imageUrl || product.images[0] || '',
            is_active: true,
          },
        });
        createdVariants.push(variant);
      }
    }

    await recordAuditLog({
      actorId: req.user!.userId,
      actorEmail: req.user!.email,
      actorRole: 'SELLER',
      action: 'PRODUCT_CREATE',
      targetType: 'Product',
      targetId: product.id,
      summary: `Created new product: ${product.title}`,
      req,
    });

    return res.status(201).json({
      success: true,
      product: { ...product, variants: createdVariants },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/v1/seller/products/:id
router.put('/products/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const sellerId = req.user!.sellerId!;
    const product = await prisma.product.findUnique({ where: { id } });

    if (!product || product.seller_id !== sellerId) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const { title, description, price, discountPrice, stockQuantity, images, specifications, hsnCode, gstRatePercent } = req.body;

    const updated = await prisma.product.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description && { description }),
        ...(price !== undefined && { price: parseFloat(price) }),
        ...(discountPrice !== undefined && { discount_price: parseFloat(discountPrice) }),
        ...(stockQuantity !== undefined && { stock_quantity: parseInt(stockQuantity, 10) }),
        ...(images && { images }),
        ...(specifications && { specifications }),
        ...(hsnCode && { hsn_code: hsnCode }),
        ...(gstRatePercent !== undefined && { gst_rate_percent: parseFloat(gstRatePercent) }),
      },
    });

    return res.json({ success: true, product: updated });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/v1/seller/products/:id/stock
router.patch('/products/:id/stock', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { stockQuantity, variantId } = req.body;
    const sellerId = req.user!.sellerId!;

    const product = await prisma.product.findUnique({ where: { id } });
    if (!product || product.seller_id !== sellerId) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    if (variantId) {
      const updatedVariant = await prisma.productVariant.update({
        where: { id: variantId },
        data: { stock_quantity: Math.max(0, parseInt(stockQuantity, 10)) },
      });
      return res.json({ success: true, variant: updatedVariant });
    }

    const updated = await prisma.product.update({
      where: { id },
      data: { stock_quantity: Math.max(0, parseInt(stockQuantity, 10)) },
    });

    return res.json({ success: true, product: updated });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/v1/seller/orders
router.get('/orders', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const sellerId = req.user!.sellerId!;
    const items = await prisma.orderItem.findMany({
      where: { seller_id: sellerId },
      orderBy: { id: 'desc' },
    });

    const enriched = [];
    for (const it of items) {
      const order = await prisma.order.findUnique({ where: { id: it.order_id } });
      const product = await prisma.product.findUnique({ where: { id: it.product_id } });
      const customer = order ? await prisma.user.findUnique({ where: { id: order.user_id } }) : null;
      enriched.push({
        ...it,
        orderDate: order?.created_at,
        shippingAddress: order?.shipping_address,
        paymentMethod: order?.payment_method,
        paymentStatus: order?.payment_status,
        productTitle: product?.title || 'Product',
        productImage: product?.images[0] || '',
        customerName: customer?.name || 'Customer',
        customerPhone: customer?.phone || '',
      });
    }

    return res.json({ success: true, orders: enriched });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/v1/seller/orders/:orderItemId/dispatch
router.post('/orders/:orderItemId/dispatch', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { orderItemId } = req.params;
    const { courierName, awbTrackingNumber, estimatedDays = 3 } = req.body;
    const sellerId = req.user!.sellerId!;

    const item = await prisma.orderItem.findUnique({ where: { id: orderItemId } });
    if (!item || item.seller_id !== sellerId) {
      return res.status(404).json({ success: false, message: 'Order item not found.' });
    }

    const edd = new Date();
    edd.setDate(edd.getDate() + parseInt(estimatedDays, 10));

    const updated = await prisma.orderItem.update({
      where: { id: item.id },
      data: {
        item_status: 'SHIPPED',
        courier_name: courierName || 'BlueDart Air Express',
        awb_tracking_number: awbTrackingNumber || `AWB-${Math.floor(10000000 + Math.random() * 90000000)}`,
        tracking_url: 'https://track.shopezy.com',
        estimated_delivery_date: edd.toISOString(),
      },
    });

    await prisma.shipmentTrackingEvent.create({
      data: {
        order_item_id: item.id,
        status_title: 'Dispatched from Warehouse',
        location: 'Seller Facility',
        remarks: `Handed over to ${updated.courier_name} with AWB #${updated.awb_tracking_number}.`,
        event_time: new Date().toISOString(),
      },
    });

    const order = await prisma.order.findUnique({ where: { id: item.order_id } });
    if (order) {
      sendPushNotification(
        order.user_id,
        'Your Order Has Shipped! 🚚',
        `Item has been dispatched via ${updated.courier_name} (AWB: ${updated.awb_tracking_number}).`,
        { orderId: order.id, eventType: 'ORDER_SHIPPED' }
      );
    }

    return res.json({ success: true, message: 'Order dispatched successfully!', item: updated });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/v1/seller/orders/:orderItemId/deliver
router.post('/orders/:orderItemId/deliver', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { orderItemId } = req.params;
    const sellerId = req.user!.sellerId!;

    const item = await prisma.orderItem.findUnique({ where: { id: orderItemId } });
    if (!item || item.seller_id !== sellerId) {
      return res.status(404).json({ success: false, message: 'Order item not found.' });
    }

    if (item.item_status === 'DELIVERED') {
      return res.status(400).json({ success: false, message: 'Item already delivered.' });
    }

    const updated = await prisma.orderItem.update({
      where: { id: item.id },
      data: {
        item_status: 'DELIVERED',
        delivered_at: new Date().toISOString(),
      },
    });

    // Move earnings from pending_clearance_balance to available_balance
    const seller = await prisma.sellerProfile.findUnique({ where: { id: sellerId } });
    if (seller) {
      const newPending = Math.max(0, seller.pending_clearance_balance - item.seller_net_earning);
      const newAvailable = seller.available_balance + item.seller_net_earning;

      await prisma.sellerProfile.update({
        where: { id: seller.id },
        data: {
          pending_clearance_balance: Number(newPending.toFixed(2)),
          available_balance: Number(newAvailable.toFixed(2)),
        },
      });

      await prisma.walletTransaction.create({
        data: {
          seller_id: seller.id,
          order_item_id: item.id,
          type: 'CREDIT_ORDER_EARNING',
          amount: item.seller_net_earning,
          balance_after: Number(newAvailable.toFixed(2)),
          description: `Delivered Earning for Item #${item.id}`,
        },
      });
    }

    await prisma.shipmentTrackingEvent.create({
      data: {
        order_item_id: item.id,
        status_title: 'Delivered',
        location: 'Customer Address',
        remarks: 'Package delivered to recipient. E-signature / OTP verified.',
        event_time: new Date().toISOString(),
      },
    });

    const order = await prisma.order.findUnique({ where: { id: item.order_id } });
    if (order) {
      sendPushNotification(
        order.user_id,
        'Delivered! 📦',
        `Your package has been successfully delivered. We hope you love it!`,
        { orderId: order.id, eventType: 'ORDER_DELIVERED' }
      );
    }

    return res.json({ success: true, message: 'Delivery confirmed and funds moved to available balance.', item: updated });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/v1/seller/returns
router.get('/returns', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const sellerId = req.user!.sellerId!;
    const returns = await prisma.returnRequest.findMany({
      where: { seller_id: sellerId },
      orderBy: { created_at: 'desc' },
    });

    const enriched = [];
    for (const ret of returns) {
      const item = await prisma.orderItem.findUnique({ where: { id: ret.order_item_id } });
      const product = item ? await prisma.product.findUnique({ where: { id: item.product_id } }) : null;
      const user = await prisma.user.findUnique({ where: { id: ret.user_id } });
      enriched.push({
        ...ret,
        productTitle: product?.title || 'Product',
        customerName: user?.name || 'Customer',
        customerEmail: user?.email || '',
      });
    }

    return res.json({ success: true, returns: enriched });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/v1/seller/returns/:returnRequestId/action
router.post('/returns/:returnRequestId/action', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { returnRequestId } = req.params;
    const { action, sellerNote } = req.body; // action: 'APPROVE' | 'REJECT'
    const sellerId = req.user!.sellerId!;

    const returnReq = await prisma.returnRequest.findUnique({ where: { id: returnRequestId } });
    if (!returnReq || returnReq.seller_id !== sellerId) {
      return res.status(404).json({ success: false, message: 'Return request not found.' });
    }

    if (action === 'APPROVE') {
      await prisma.returnRequest.update({
        where: { id: returnReq.id },
        data: {
          status: 'REFUNDED',
          seller_note: sellerNote || 'Approved by seller. Refund processed.',
        },
      });

      await prisma.orderItem.update({
        where: { id: returnReq.order_item_id },
        data: { item_status: 'REFUNDED' },
      });

      // Deduct earnings from seller available balance
      const item = await prisma.orderItem.findUnique({ where: { id: returnReq.order_item_id } });
      const seller = await prisma.sellerProfile.findUnique({ where: { id: sellerId } });
      if (item && seller) {
        const newBalance = Math.max(0, seller.available_balance - item.seller_net_earning);
        await prisma.sellerProfile.update({
          where: { id: seller.id },
          data: { available_balance: Number(newBalance.toFixed(2)) },
        });

        await prisma.walletTransaction.create({
          data: {
            seller_id: seller.id,
            order_item_id: item.id,
            type: 'DEBIT_REFUND_REVERSAL',
            amount: item.seller_net_earning,
            balance_after: Number(newBalance.toFixed(2)),
            description: `Refund reversal for Return Request #${returnReq.id}`,
          },
        });

        // Restock inventory
        if (returnReq.restock_inventory) {
          await prisma.product.update({
            where: { id: item.product_id },
            data: { stock_quantity: { increment: item.quantity } as any },
          });
        }
      }

      // Record refund transaction
      await prisma.refundTransaction.create({
        data: {
          order_id: item?.order_id || 'unknown',
          return_request_id: returnReq.id,
          payment_method: 'RAZORPAY',
          razorpay_payment_id: 'pay_simulated',
          razorpay_refund_id: `rfnd_${uuidv4().slice(0, 10)}`,
          amount_in_inr: returnReq.refund_amount,
          status: 'PROCESSED',
          processed_at: new Date().toISOString(),
        },
      });

      return res.json({ success: true, message: 'Return approved and refund processed.' });
    } else {
      await prisma.returnRequest.update({
        where: { id: returnReq.id },
        data: {
          status: 'REJECTED',
          seller_note: sellerNote || 'Return request rejected.',
        },
      });

      return res.json({ success: true, message: 'Return request rejected.' });
    }
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/v1/seller/wallet
router.get('/wallet', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const sellerId = req.user!.sellerId!;
    const seller = await prisma.sellerProfile.findUnique({ where: { id: sellerId } });
    const transactions = await prisma.walletTransaction.findMany({
      where: { seller_id: sellerId },
      orderBy: { created_at: 'desc' },
    });
    const payouts = await prisma.payoutRequest.findMany({
      where: { seller_id: sellerId },
      orderBy: { requested_at: 'desc' },
    });
    const payoutMethods = await prisma.sellerPayoutMethod.findMany({
      where: { seller_id: sellerId },
    });

    return res.json({
      success: true,
      wallet: {
        availableBalance: seller?.available_balance || 0,
        pendingClearanceBalance: seller?.pending_clearance_balance || 0,
        totalWithdrawn: seller?.total_withdrawn || 0,
      },
      transactions,
      payouts,
      payoutMethods,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/v1/seller/wallet/withdraw
router.post('/wallet/withdraw', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const sellerId = req.user!.sellerId!;
    const { amount, payoutMethodId } = req.body;

    const withdrawAmount = parseFloat(amount);
    if (!withdrawAmount || isNaN(withdrawAmount) || withdrawAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid withdrawal amount.' });
    }

    const siteConfig = (await prisma.siteConfig.findUnique({ where: { id: 'default' } })) || {
      min_payout_amount: 500,
      payout_tds_percent: 1.0,
    };

    if (withdrawAmount < siteConfig.min_payout_amount) {
      return res.status(400).json({
        success: false,
        message: `Minimum payout request amount is ₹${siteConfig.min_payout_amount}.`,
      });
    }

    const seller = await prisma.sellerProfile.findUnique({ where: { id: sellerId } });
    if (!seller || seller.available_balance < withdrawAmount) {
      return res.status(400).json({
        success: false,
        message: `Insufficient available balance. Available: ₹${seller?.available_balance.toFixed(2)}`,
      });
    }

    let method = null;
    if (payoutMethodId) {
      method = await prisma.sellerPayoutMethod.findUnique({ where: { id: payoutMethodId } });
    } else {
      method = await prisma.sellerPayoutMethod.findFirst({ where: { seller_id: sellerId, is_primary: true } });
    }

    if (!method) {
      return res.status(400).json({ success: false, message: 'Please add a valid Bank or UPI payout method first.' });
    }

    const tdsAmount = Number(((withdrawAmount * siteConfig.payout_tds_percent) / 100).toFixed(2));
    const netPayable = Number((withdrawAmount - tdsAmount).toFixed(2));

    const payoutRequest = await prisma.payoutRequest.create({
      data: {
        seller_id: sellerId,
        payout_method_id: method.id,
        amount_requested: withdrawAmount,
        tds_or_fee_deducted: tdsAmount,
        net_payable_amount: netPayable,
        status: 'PENDING',
        requested_at: new Date().toISOString(),
      },
    });

    const newAvailable = Number((seller.available_balance - withdrawAmount).toFixed(2));
    await prisma.sellerProfile.update({
      where: { id: seller.id },
      data: {
        available_balance: newAvailable,
        on_hold_payout_balance: Number((seller.on_hold_payout_balance + withdrawAmount).toFixed(2)),
      },
    });

    await prisma.walletTransaction.create({
      data: {
        seller_id: seller.id,
        payout_request_id: payoutRequest.id,
        type: 'DEBIT_PAYOUT_HOLD',
        amount: withdrawAmount,
        balance_after: newAvailable,
        description: `Payout Request #${payoutRequest.id.slice(0, 8)} (TDS 1% Deducted: ₹${tdsAmount})`,
      },
    });

    await recordAuditLog({
      actorId: req.user!.userId,
      actorEmail: req.user!.email,
      actorRole: 'SELLER',
      action: 'PAYOUT_REQUEST',
      targetType: 'PayoutRequest',
      targetId: payoutRequest.id,
      summary: `Requested withdrawal of ₹${withdrawAmount} (Net: ₹${netPayable})`,
      req,
    });

    return res.status(201).json({
      success: true,
      message: 'Payout request submitted successfully. Finance team will process within 24-48 business hours.',
      payoutRequest,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/v1/seller/invoices
router.get('/invoices', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const sellerId = req.user!.sellerId!;
    const invoices = await prisma.taxInvoice.findMany({
      where: { seller_id: sellerId },
      orderBy: { invoice_date: 'desc' },
    });
    return res.json({ success: true, invoices });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/v1/seller/invoices/csv
router.get('/invoices/csv', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const sellerId = req.user!.sellerId!;
    const invoices = await prisma.taxInvoice.findMany({
      where: { seller_id: sellerId },
      orderBy: { invoice_date: 'desc' },
    });

    const headers = 'Invoice Number,Date,Order ID,Customer State,HSN Code,Taxable Value (INR),GST Rate (%),CGST (INR),SGST (INR),IGST (INR),Total Invoice Value (INR)\n';
    const rows = invoices.map((inv) =>
      `"${inv.invoice_number}","${new Date(inv.invoice_date).toISOString().split('T')[0]}","${inv.order_id}","${inv.billing_state}","${inv.hsn_code}",${inv.taxable_amount.toFixed(2)},${inv.gst_rate_percent},${inv.cgst_amount.toFixed(2)},${inv.sgst_amount.toFixed(2)},${inv.igst_amount.toFixed(2)},${inv.total_invoice_amount.toFixed(2)}`
    ).join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="gst_sales_register.csv"');
    return res.send(headers + rows);
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/v1/seller/qna
router.get('/qna', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const sellerId = req.user!.sellerId!;
    const sellerProducts = await prisma.product.findMany({ where: { seller_id: sellerId } });
    const productIds = sellerProducts.map((p) => p.id);

    const questions = await prisma.productQuestion.findMany({
      where: { product_id: { in: productIds } },
      orderBy: { created_at: 'desc' },
    });

    const enriched = [];
    for (const q of questions) {
      const prod = sellerProducts.find((p) => p.id === q.product_id);
      enriched.push({
        ...q,
        productTitle: prod?.title || 'Product',
      });
    }

    return res.json({ success: true, questions: enriched });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/v1/seller/qna/:questionId/reply
router.post('/qna/:questionId/reply', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { questionId } = req.params;
    const { answerText } = req.body;

    if (!answerText) {
      return res.status(400).json({ success: false, message: 'Answer text is required.' });
    }

    const updated = await prisma.productQuestion.update({
      where: { id: questionId },
      data: {
        answer_text: answerText,
        answered_by_id: req.user!.userId,
        answered_by_role: 'SELLER',
        answered_at: new Date().toISOString(),
      },
    });

    return res.json({ success: true, question: updated });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
