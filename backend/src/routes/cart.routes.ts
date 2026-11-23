import { Router, Response } from 'express';
import { prisma } from '../prisma';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import { calculateCartTotals } from '../services/pricingService';

const router = Router();

// GET /api/v1/cart
router.get('/', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { couponCode, pincode } = req.query;

    let cart = await prisma.cart.findUnique({ where: { user_id: userId } });
    if (!cart) {
      cart = await prisma.cart.create({ data: { user_id: userId } });
    }

    const cartItems = await prisma.cartItem.findMany({ where: { cart_id: cart.id } });

    const calculated = await calculateCartTotals(
      cartItems.map((ci) => ({
        id: ci.id,
        productId: ci.product_id,
        variantId: ci.variant_id,
        quantity: ci.quantity,
      })),
      (couponCode as string) || null,
      (pincode as string) || null
    );

    return res.json({
      success: true,
      cartId: cart.id,
      ...calculated,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/v1/cart
router.post('/', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { productId, variantId, quantity = 1 } = req.body;

    if (!productId) {
      return res.status(400).json({ success: false, message: 'Product ID is required.' });
    }

    let cart = await prisma.cart.findUnique({ where: { user_id: userId } });
    if (!cart) {
      cart = await prisma.cart.create({ data: { user_id: userId } });
    }

    const existingItem = await prisma.cartItem.findFirst({
      where: {
        cart_id: cart.id,
        product_id: productId,
        variant_id: variantId || null,
      },
    });

    if (existingItem) {
      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + quantity },
      });
    } else {
      await prisma.cartItem.create({
        data: {
          cart_id: cart.id,
          product_id: productId,
          variant_id: variantId || null,
          quantity: Math.max(1, quantity),
        },
      });
    }

    const updatedItems = await prisma.cartItem.findMany({ where: { cart_id: cart.id } });
    const calculated = await calculateCartTotals(
      updatedItems.map((ci) => ({
        id: ci.id,
        productId: ci.product_id,
        variantId: ci.variant_id,
        quantity: ci.quantity,
      }))
    );

    return res.json({
      success: true,
      message: 'Item added to cart.',
      ...calculated,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/v1/cart/:itemId
router.put('/:itemId', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { itemId } = req.params;
    const { quantity } = req.body;
    const userId = req.user!.userId;

    const cart = await prisma.cart.findUnique({ where: { user_id: userId } });
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found.' });
    }

    if (quantity <= 0) {
      await prisma.cartItem.delete({ where: { id: itemId } });
    } else {
      await prisma.cartItem.update({
        where: { id: itemId },
        data: { quantity },
      });
    }

    const updatedItems = await prisma.cartItem.findMany({ where: { cart_id: cart.id } });
    const calculated = await calculateCartTotals(
      updatedItems.map((ci) => ({
        id: ci.id,
        productId: ci.product_id,
        variantId: ci.variant_id,
        quantity: ci.quantity,
      }))
    );

    return res.json({
      success: true,
      message: 'Cart updated.',
      ...calculated,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/v1/cart/:itemId
router.delete('/:itemId', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { itemId } = req.params;
    const userId = req.user!.userId;

    const cart = await prisma.cart.findUnique({ where: { user_id: userId } });
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found.' });
    }

    await prisma.cartItem.delete({ where: { id: itemId } });

    const updatedItems = await prisma.cartItem.findMany({ where: { cart_id: cart.id } });
    const calculated = await calculateCartTotals(
      updatedItems.map((ci) => ({
        id: ci.id,
        productId: ci.product_id,
        variantId: ci.variant_id,
        quantity: ci.quantity,
      }))
    );

    return res.json({
      success: true,
      message: 'Item removed from cart.',
      ...calculated,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/v1/coupons/validate
router.post('/validate-coupon', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { code, cartAmount = 0 } = req.body;
    if (!code) {
      return res.status(400).json({ success: false, message: 'Coupon code is required.' });
    }

    const coupon = await prisma.coupon.findUnique({ where: { code: code.trim().toUpperCase() } });
    if (!coupon || !coupon.is_active) {
      return res.status(400).json({ success: false, message: 'Invalid or inactive coupon code.' });
    }

    const now = new Date();
    if (now < new Date(coupon.valid_from) || now > new Date(coupon.valid_until)) {
      return res.status(400).json({ success: false, message: 'This coupon has expired.' });
    }

    if (cartAmount < coupon.min_order_amount) {
      return res.status(400).json({
        success: false,
        message: `Minimum order amount of ₹${coupon.min_order_amount} required to apply ${coupon.code}.`,
      });
    }

    let discount = 0;
    if (coupon.discount_type === 'PERCENTAGE') {
      discount = (cartAmount * coupon.discount_value) / 100;
      if (coupon.max_discount_cap && discount > coupon.max_discount_cap) {
        discount = coupon.max_discount_cap;
      }
    } else {
      discount = Math.min(coupon.discount_value, cartAmount);
    }

    return res.json({
      success: true,
      message: `Coupon applied! You saved ₹${discount.toFixed(2)}.`,
      coupon: {
        code: coupon.code,
        discountAmount: Number(discount.toFixed(2)),
        discountType: coupon.discount_type,
        discountValue: coupon.discount_value,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
