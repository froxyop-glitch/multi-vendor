import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../prisma';
import { generateToken, authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import { recordAuditLog } from '../services/auditService';

const router = Router();

// POST /api/v1/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role = 'CUSTOMER', phone, address, preferredLanguage = 'en', storeName, gstin, state } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
    }

    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (existing) {
      return res.status(400).json({ success: false, message: 'User with this email already exists.' });
    }

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);

    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase().trim(),
        password_hash: passwordHash,
        role: role === 'SELLER' ? 'SELLER' : 'CUSTOMER',
        phone: phone || null,
        address: address || null,
        preferred_language: preferredLanguage,
        is_active: true,
      },
    });

    let sellerProfile = null;
    if (role === 'SELLER') {
      sellerProfile = await prisma.sellerProfile.create({
        data: {
          user_id: user.id,
          store_name: storeName || `${name}'s Store`,
          gstin_or_tax_id: gstin || 'PENDING_VERIFICATION',
          registered_state: state || 'West Bengal',
          registered_address: address || 'Registered Address',
          pickup_pincode: '736123',
          handling_days: 1,
          approval_status: 'PENDING',
          commission_rate: null,
          available_balance: 0,
          pending_clearance_balance: 0,
          total_withdrawn: 0,
        },
      });

      await recordAuditLog({
        actorId: user.id,
        actorEmail: user.email,
        actorRole: 'SELLER',
        action: 'SELLER_REGISTRATION',
        targetType: 'SellerProfile',
        targetId: sellerProfile.id,
        summary: `New seller registered: ${sellerProfile.store_name} (Pending Approval)`,
      });
    }

    // Auto-create cart for customer
    await prisma.cart.create({
      data: {
        user_id: user.id,
      },
    });

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      adminSubRole: user.admin_sub_role,
      sellerId: sellerProfile?.id || null,
      name: user.name,
    });

    return res.status(201).json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        adminSubRole: user.admin_sub_role,
        phone: user.phone,
        preferredLanguage: user.preferred_language,
        sellerProfile,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/v1/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (!user || !user.is_active) {
      return res.status(401).json({ success: false, message: 'Invalid credentials or inactive account.' });
    }

    const match = bcrypt.compareSync(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    let sellerProfile = null;
    if (user.role === 'SELLER') {
      sellerProfile = await prisma.sellerProfile.findUnique({ where: { user_id: user.id } });
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      adminSubRole: user.admin_sub_role,
      sellerId: sellerProfile?.id || null,
      name: user.name,
    });

    return res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        adminSubRole: user.admin_sub_role,
        phone: user.phone,
        address: user.address,
        preferredLanguage: user.preferred_language,
        sellerProfile,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/v1/auth/me
router.get('/me', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user?.userId } });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    let sellerProfile = null;
    if (user.role === 'SELLER') {
      sellerProfile = await prisma.sellerProfile.findUnique({ where: { user_id: user.id } });
    }

    return res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        adminSubRole: user.admin_sub_role,
        phone: user.phone,
        address: user.address,
        preferredLanguage: user.preferred_language,
        sellerProfile,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/v1/auth/push-token
router.post('/push-token', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { expoPushToken, platform = 'expo' } = req.body;
    if (!expoPushToken) {
      return res.status(400).json({ success: false, message: 'Expo push token is required.' });
    }

    const existing = await prisma.devicePushToken.findUnique({ where: { expo_push_token: expoPushToken } });
    if (existing) {
      await prisma.devicePushToken.update({
        where: { id: existing.id },
        data: {
          user_id: req.user!.userId,
          device_platform: platform,
          is_active: true,
        },
      });
    } else {
      await prisma.devicePushToken.create({
        data: {
          user_id: req.user!.userId,
          expo_push_token: expoPushToken,
          device_platform: platform,
          is_active: true,
        },
      });
    }

    return res.json({ success: true, message: 'Push token registered successfully.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
