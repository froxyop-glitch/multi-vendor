import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../prisma';
import { authMiddleware, rbacGuard, AuthenticatedRequest } from '../middleware/auth';
import { recordAuditLog } from '../services/auditService';

const router = Router();

router.use(authMiddleware);
router.use(rbacGuard(['ADMIN']));

// GET /api/v1/admin/overview
router.get('/overview', async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const orders = await prisma.order.findMany();
    const orderItems = await prisma.orderItem.findMany();
    const sellers = await prisma.sellerProfile.findMany();
    const users = await prisma.user.findMany({ where: { role: 'CUSTOMER' } });
    const pendingPayouts = await prisma.payoutRequest.findMany({ where: { status: 'PENDING' } });

    let platformGMV = 0;
    let platformCommission = 0;

    for (const ord of orders) {
      if (ord.payment_status === 'PAID') {
        platformGMV += ord.total_amount;
      }
    }

    for (const item of orderItems) {
      if (item.item_status === 'DELIVERED') {
        platformCommission += item.platform_commission_amount;
      }
    }

    return res.json({
      success: true,
      stats: {
        platformGMV: Number(platformGMV.toFixed(2)),
        platformCommission: Number(platformCommission.toFixed(2)),
        totalOrders: orders.length,
        totalCustomers: users.length,
        totalSellers: sellers.length,
        approvedSellers: sellers.filter((s) => s.approval_status === 'APPROVED').length,
        pendingPayoutRequestsCount: pendingPayouts.length,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/v1/admin/site-config
router.get('/site-config', async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const config = await prisma.siteConfig.findUnique({ where: { id: 'default' } });
    return res.json({ success: true, config });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/v1/admin/site-config
router.put('/site-config', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const updateData = req.body;
    const existing = await prisma.siteConfig.findUnique({ where: { id: 'default' } });

    const updated = await prisma.siteConfig.update({
      where: { id: 'default' },
      data: updateData,
    });

    await recordAuditLog({
      actorId: req.user!.userId,
      actorEmail: req.user!.email,
      actorRole: 'ADMIN',
      actorSubRole: req.user!.adminSubRole,
      action: 'SITE_CONFIG_UPDATE',
      targetType: 'SiteConfig',
      targetId: 'default',
      summary: 'Updated global site configurations & policies from central control panel.',
      metadataDiff: { before: existing, after: updated },
      req,
    });

    return res.json({ success: true, message: 'Configuration saved successfully.', config: updated });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Banners CRUD
router.get('/banners', async (_req, res) => {
  const banners = await prisma.banner.findMany({ orderBy: { display_order: 'asc' } });
  return res.json({ success: true, banners });
});

router.post('/banners', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const banner = await prisma.banner.create({ data: req.body });
    await recordAuditLog({
      actorEmail: req.user!.email,
      actorRole: 'ADMIN',
      actorSubRole: req.user!.adminSubRole,
      action: 'BANNER_CREATE',
      targetType: 'Banner',
      targetId: banner.id,
      summary: `Created banner: ${banner.title}`,
      req,
    });
    return res.status(201).json({ success: true, banner });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/banners/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const banner = await prisma.banner.update({ where: { id: req.params.id }, data: req.body });
    return res.json({ success: true, banner });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/banners/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    await prisma.banner.delete({ where: { id: req.params.id } });
    return res.json({ success: true, message: 'Banner removed.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Categories CRUD
router.get('/categories', async (_req, res) => {
  const categories = await prisma.category.findMany({ orderBy: { display_order: 'asc' } });
  return res.json({ success: true, categories });
});

router.post('/categories', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const cat = await prisma.category.create({ data: req.body });
    await recordAuditLog({
      actorEmail: req.user!.email,
      actorRole: 'ADMIN',
      actorSubRole: req.user!.adminSubRole,
      action: 'CATEGORY_CREATE',
      targetType: 'Category',
      targetId: cat.id,
      summary: `Created category: ${cat.name}`,
      req,
    });
    return res.status(201).json({ success: true, category: cat });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/categories/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const cat = await prisma.category.update({ where: { id: req.params.id }, data: req.body });
    return res.json({ success: true, category: cat });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/categories/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    await prisma.category.delete({ where: { id: req.params.id } });
    return res.json({ success: true, message: 'Category removed.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Coupons CRUD
router.get('/coupons', async (_req, res) => {
  const coupons = await prisma.coupon.findMany({ orderBy: { valid_until: 'desc' } });
  return res.json({ success: true, coupons });
});

router.post('/coupons', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const coupon = await prisma.coupon.create({
      data: {
        ...req.body,
        code: req.body.code.trim().toUpperCase(),
        discount_value: parseFloat(req.body.discount_value),
        min_order_amount: parseFloat(req.body.min_order_amount || 0),
        max_discount_cap: req.body.max_discount_cap ? parseFloat(req.body.max_discount_cap) : null,
      },
    });
    await recordAuditLog({
      actorEmail: req.user!.email,
      actorRole: 'ADMIN',
      actorSubRole: req.user!.adminSubRole,
      action: 'COUPON_CREATE',
      targetType: 'Coupon',
      targetId: coupon.id,
      summary: `Created coupon code: ${coupon.code}`,
      req,
    });
    return res.status(201).json({ success: true, coupon });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/coupons/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const coupon = await prisma.coupon.update({ where: { id: req.params.id }, data: req.body });
    return res.json({ success: true, coupon });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/coupons/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    await prisma.coupon.delete({ where: { id: req.params.id } });
    return res.json({ success: true, message: 'Coupon deleted.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Flash Sales CRUD
router.get('/flash-sales', async (_req, res) => {
  const sales = await prisma.flashSale.findMany({ orderBy: { starts_at: 'desc' } });
  const detailed = [];
  for (const s of sales) {
    const items = await prisma.flashSaleItem.findMany({ where: { flash_sale_id: s.id } });
    detailed.push({ ...s, items });
  }
  return res.json({ success: true, flashSales: detailed });
});

router.post('/flash-sales', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { title, bannerColor, startsAt, endsAt, items = [] } = req.body;
    const sale = await prisma.flashSale.create({
      data: {
        title,
        banner_color: bannerColor || '#e11d48',
        starts_at: startsAt,
        ends_at: endsAt,
        is_active: true,
      },
    });

    const createdItems = [];
    for (const it of items) {
      const item = await prisma.flashSaleItem.create({
        data: {
          flash_sale_id: sale.id,
          product_id: it.productId,
          variant_id: it.variantId || null,
          flash_price: parseFloat(it.flashPrice),
          flash_stock_limit: parseInt(it.flashStockLimit, 10),
          sold_count: 0,
        },
      });
      createdItems.push(item);
    }

    await recordAuditLog({
      actorEmail: req.user!.email,
      actorRole: 'ADMIN',
      actorSubRole: req.user!.adminSubRole,
      action: 'FLASH_SALE_CREATE',
      targetType: 'FlashSale',
      targetId: sale.id,
      summary: `Created flash sale: ${sale.title}`,
      req,
    });

    return res.status(201).json({ success: true, flashSale: { ...sale, items: createdItems } });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Pincodes Logistics CRUD
router.get('/pincodes', async (_req, res) => {
  const pincodes = await prisma.serviceablePincode.findMany({ orderBy: { pincode: 'asc' } });
  return res.json({ success: true, pincodes });
});

router.post('/pincodes', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const pin = await prisma.serviceablePincode.create({ data: req.body });
    await recordAuditLog({
      actorEmail: req.user!.email,
      actorRole: 'ADMIN',
      actorSubRole: req.user!.adminSubRole,
      action: 'PINCODE_ADD',
      targetType: 'ServiceablePincode',
      targetId: pin.id,
      summary: `Added serviceable pincode ${pin.pincode} (${pin.city}, ${pin.state})`,
      req,
    });
    return res.status(201).json({ success: true, pincode: pin });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/pincodes/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const pin = await prisma.serviceablePincode.update({ where: { id: req.params.id }, data: req.body });
    return res.json({ success: true, pincode: pin });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/pincodes/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    await prisma.serviceablePincode.delete({ where: { id: req.params.id } });
    return res.json({ success: true, message: 'Pincode removed.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Sellers Management
router.get('/sellers', async (_req, res) => {
  const sellers = await prisma.sellerProfile.findMany({ orderBy: { created_at: 'desc' } });
  const enriched = [];
  for (const s of sellers) {
    const user = await prisma.user.findUnique({ where: { id: s.user_id } });
    const payoutMethods = await prisma.sellerPayoutMethod.findMany({ where: { seller_id: s.id } });
    enriched.push({
      ...s,
      ownerName: user?.name || '',
      ownerEmail: user?.email || '',
      ownerPhone: user?.phone || '',
      payoutMethods,
    });
  }
  return res.json({ success: true, sellers: enriched });
});

router.patch('/sellers/:sellerId/status', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { sellerId } = req.params;
    const { approvalStatus, commissionRate } = req.body;

    const existing = await prisma.sellerProfile.findUnique({ where: { id: sellerId } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Seller not found.' });
    }

    const updated = await prisma.sellerProfile.update({
      where: { id: sellerId },
      data: {
        ...(approvalStatus && { approval_status: approvalStatus }),
        ...(commissionRate !== undefined && { commission_rate: parseFloat(commissionRate) }),
      },
    });

    await recordAuditLog({
      actorId: req.user!.userId,
      actorEmail: req.user!.email,
      actorRole: 'ADMIN',
      actorSubRole: req.user!.adminSubRole,
      action: 'SELLER_STATUS_UPDATE',
      targetType: 'SellerProfile',
      targetId: sellerId,
      summary: `Updated seller ${existing.store_name} status to ${approvalStatus || existing.approval_status} (Commission: ${commissionRate || existing.commission_rate}%)`,
      metadataDiff: { before: existing, after: updated },
      req,
    });

    return res.json({ success: true, seller: updated });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Catalog Moderation
router.get('/catalog', async (_req, res) => {
  const products = await prisma.product.findMany({ orderBy: { created_at: 'desc' } });
  const enriched = [];
  for (const p of products) {
    const seller = await prisma.sellerProfile.findUnique({ where: { id: p.seller_id } });
    const cat = await prisma.category.findUnique({ where: { id: p.category_id } });
    enriched.push({
      ...p,
      sellerStoreName: seller?.store_name || '',
      categoryName: cat?.name || '',
    });
  }
  return res.json({ success: true, products: enriched });
});

router.patch('/catalog/:productId/toggle-active', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { productId } = req.params;
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });

    const updated = await prisma.product.update({
      where: { id: productId },
      data: { is_active: !product.is_active },
    });

    await recordAuditLog({
      actorEmail: req.user!.email,
      actorRole: 'ADMIN',
      actorSubRole: req.user!.adminSubRole,
      action: 'PRODUCT_STATUS_TOGGLE',
      targetType: 'Product',
      targetId: productId,
      summary: `${updated.is_active ? 'Activated' : 'Deactivated'} product: ${product.title}`,
      req,
    });

    return res.json({ success: true, product: updated });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.patch('/catalog/:productId/toggle-featured', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { productId } = req.params;
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });

    const updated = await prisma.product.update({
      where: { id: productId },
      data: { is_featured: !product.is_featured },
    });

    return res.json({ success: true, product: updated });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Reviews Moderation
router.get('/reviews', async (_req, res) => {
  const reviews = await prisma.productReview.findMany({ orderBy: { created_at: 'desc' } });
  const enriched = [];
  for (const r of reviews) {
    const product = await prisma.product.findUnique({ where: { id: r.product_id } });
    const user = await prisma.user.findUnique({ where: { id: r.user_id } });
    enriched.push({
      ...r,
      productTitle: product?.title || 'Product',
      reviewerName: user?.name || 'User',
    });
  }
  return res.json({ success: true, reviews: enriched });
});

router.patch('/reviews/:reviewId/toggle-approved', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { reviewId } = req.params;
    const review = await prisma.productReview.findUnique({ where: { id: reviewId } });
    if (!review) return res.status(404).json({ success: false, message: 'Review not found.' });

    const updated = await prisma.productReview.update({
      where: { id: reviewId },
      data: { is_approved: !review.is_approved },
    });

    return res.json({ success: true, review: updated });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/reviews/:reviewId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    await prisma.productReview.delete({ where: { id: req.params.reviewId } });
    return res.json({ success: true, message: 'Review deleted.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Orders & Force Refund
router.get('/orders', async (_req, res) => {
  const orders = await prisma.order.findMany({ orderBy: { created_at: 'desc' } });
  const enriched = [];
  for (const o of orders) {
    const user = await prisma.user.findUnique({ where: { id: o.user_id } });
    const items = await prisma.orderItem.findMany({ where: { order_id: o.id } });
    enriched.push({
      ...o,
      customerName: user?.name || 'Customer',
      customerEmail: user?.email || '',
      itemsCount: items.length,
    });
  }
  return res.json({ success: true, orders: enriched });
});

router.post('/orders/items/:orderItemId/force-refund', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { orderItemId } = req.params;
    const { reason = 'Admin executive force-refund' } = req.body;

    const item = await prisma.orderItem.findUnique({ where: { id: orderItemId } });
    if (!item) return res.status(404).json({ success: false, message: 'Item not found.' });

    const order = await prisma.order.findUnique({ where: { id: item.order_id } });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });

    await prisma.orderItem.update({
      where: { id: item.id },
      data: { item_status: 'REFUNDED' },
    });

    const refund = await prisma.refundTransaction.create({
      data: {
        order_id: order.id,
        return_request_id: `force_${item.id}`,
        payment_method: order.payment_method,
        razorpay_payment_id: order.razorpay_payment_id,
        razorpay_refund_id: `rfnd_force_${uuidv4().slice(0, 8)}`,
        amount_in_inr: item.price_at_purchase * item.quantity,
        status: 'PROCESSED',
        processed_at: new Date().toISOString(),
      },
    });

    await recordAuditLog({
      actorId: req.user!.userId,
      actorEmail: req.user!.email,
      actorRole: 'ADMIN',
      actorSubRole: req.user!.adminSubRole,
      action: 'ADMIN_FORCE_REFUND',
      targetType: 'OrderItem',
      targetId: item.id,
      summary: `Force refunded item #${item.id} (Amount: ₹${refund.amount_in_inr}). Reason: ${reason}`,
      req,
    });

    return res.json({ success: true, message: 'Item force-refunded successfully.', refund });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Seller Payout Settlements
router.get('/payouts', async (_req, res) => {
  const payouts = await prisma.payoutRequest.findMany({ orderBy: { requested_at: 'desc' } });
  const enriched = [];
  for (const p of payouts) {
    const seller = await prisma.sellerProfile.findUnique({ where: { id: p.seller_id } });
    const method = await prisma.sellerPayoutMethod.findUnique({ where: { id: p.payout_method_id } });
    enriched.push({
      ...p,
      sellerStoreName: seller?.store_name || '',
      methodDetails: method,
    });
  }
  return res.json({ success: true, payouts: enriched });
});

router.post('/payouts/:payoutId/action', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { payoutId } = req.params;
    const { action, utrReferenceNumber, adminNote } = req.body; // action: 'SETTLE' | 'REJECT'

    const payout = await prisma.payoutRequest.findUnique({ where: { id: payoutId } });
    if (!payout || payout.status !== 'PENDING') {
      return res.status(400).json({ success: false, message: 'Invalid or already processed payout request.' });
    }

    const seller = await prisma.sellerProfile.findUnique({ where: { id: payout.seller_id } });
    if (!seller) return res.status(404).json({ success: false, message: 'Seller not found.' });

    if (action === 'SETTLE') {
      if (!utrReferenceNumber) {
        return res.status(400).json({ success: false, message: 'UTR Reference number is required for settlement.' });
      }

      const updated = await prisma.payoutRequest.update({
        where: { id: payout.id },
        data: {
          status: 'SETTLED',
          utr_reference_number: utrReferenceNumber,
          admin_note: adminNote || 'Disbursed via banking portal.',
          settled_at: new Date().toISOString(),
        },
      });

      await prisma.sellerProfile.update({
        where: { id: seller.id },
        data: {
          on_hold_payout_balance: Math.max(0, seller.on_hold_payout_balance - payout.amount_requested),
          total_withdrawn: Number((seller.total_withdrawn + payout.net_payable_amount).toFixed(2)),
        },
      });

      await prisma.walletTransaction.create({
        data: {
          seller_id: seller.id,
          payout_request_id: payout.id,
          type: 'DEBIT_PAYOUT_SETTLED',
          amount: payout.net_payable_amount,
          balance_after: seller.available_balance,
          description: `Payout Settled (UTR: ${utrReferenceNumber})`,
        },
      });

      await recordAuditLog({
        actorId: req.user!.userId,
        actorEmail: req.user!.email,
        actorRole: 'ADMIN',
        actorSubRole: req.user!.adminSubRole,
        action: 'PAYOUT_SETTLED',
        targetType: 'PayoutRequest',
        targetId: payout.id,
        summary: `Settled payout ₹${payout.net_payable_amount} for ${seller.store_name} (UTR: ${utrReferenceNumber})`,
        req,
      });

      return res.json({ success: true, message: 'Payout marked as SETTLED.', payout: updated });
    } else {
      // REJECT -> Restore balance to seller
      const updated = await prisma.payoutRequest.update({
        where: { id: payout.id },
        data: {
          status: 'REJECTED',
          admin_note: adminNote || 'Payout rejected by finance desk.',
          settled_at: new Date().toISOString(),
        },
      });

      const newAvailable = Number((seller.available_balance + payout.amount_requested).toFixed(2));
      await prisma.sellerProfile.update({
        where: { id: seller.id },
        data: {
          available_balance: newAvailable,
          on_hold_payout_balance: Math.max(0, seller.on_hold_payout_balance - payout.amount_requested),
        },
      });

      await prisma.walletTransaction.create({
        data: {
          seller_id: seller.id,
          payout_request_id: payout.id,
          type: 'CREDIT_PAYOUT_REJECTED_RESTORE',
          amount: payout.amount_requested,
          balance_after: newAvailable,
          description: `Payout Rejected & Funds Restored (#${payout.id.slice(0, 8)})`,
        },
      });

      await recordAuditLog({
        actorId: req.user!.userId,
        actorEmail: req.user!.email,
        actorRole: 'ADMIN',
        actorSubRole: req.user!.adminSubRole,
        action: 'PAYOUT_REJECTED',
        targetType: 'PayoutRequest',
        targetId: payout.id,
        summary: `Rejected payout request of ₹${payout.amount_requested} for ${seller.store_name}`,
        req,
      });

      return res.json({ success: true, message: 'Payout rejected and balance restored to seller.', payout: updated });
    }
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Staff RBAC Sub-Role Management
router.get('/staff', async (_req, res) => {
  const staff = await prisma.user.findMany({ where: { role: 'ADMIN' } });
  return res.json({
    success: true,
    staff: staff.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      adminSubRole: u.admin_sub_role,
      phone: u.phone,
      isActive: u.is_active,
      createdAt: u.created_at,
    })),
  });
});

router.post('/staff', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, email, password, adminSubRole } = req.body;
    if (!name || !email || !password || !adminSubRole) {
      return res.status(400).json({ success: false, message: 'Name, email, password, and sub-role required.' });
    }

    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(password, salt);

    const newUser = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase().trim(),
        password_hash: hash,
        role: 'ADMIN',
        admin_sub_role: adminSubRole,
        preferred_language: 'en',
        is_active: true,
      },
    });

    await recordAuditLog({
      actorId: req.user!.userId,
      actorEmail: req.user!.email,
      actorRole: 'ADMIN',
      actorSubRole: req.user!.adminSubRole,
      action: 'STAFF_MEMBER_CREATE',
      targetType: 'User',
      targetId: newUser.id,
      summary: `Created staff member ${newUser.name} with sub-role ${adminSubRole}`,
      req,
    });

    return res.status(201).json({ success: true, staff: newUser });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.patch('/staff/:userId/sub-role', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const { adminSubRole } = req.body;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.role !== 'ADMIN') {
      return res.status(404).json({ success: false, message: 'Staff member not found.' });
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { admin_sub_role: adminSubRole },
    });

    await recordAuditLog({
      actorId: req.user!.userId,
      actorEmail: req.user!.email,
      actorRole: 'ADMIN',
      actorSubRole: req.user!.adminSubRole,
      action: 'STAFF_ROLE_ASSIGN',
      targetType: 'User',
      targetId: userId,
      summary: `Assigned sub-role ${adminSubRole} to staff member ${user.name}`,
      metadataDiff: { before: user.admin_sub_role, after: adminSubRole },
      req,
    });

    return res.json({ success: true, staff: updated });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Security Audit Logs
router.get('/audit-logs', async (_req, res) => {
  const logs = await prisma.auditLog.findMany({ orderBy: { created_at: 'desc' }, take: 100 });
  return res.json({ success: true, logs });
});

export default router;
