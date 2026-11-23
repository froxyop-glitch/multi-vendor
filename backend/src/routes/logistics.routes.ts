import { Router, Request, Response } from 'express';
import { prisma } from '../prisma';

const router = Router();

// GET /api/v1/logistics/check-pincode?pincode=...&productId=...
router.get('/check-pincode', async (req: Request, res: Response) => {
  try {
    const pincode = ((req.query.pincode as string) || '').trim();
    const productId = req.query.productId as string | undefined;

    if (!pincode || !/^\d{6}$/.test(pincode)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid 6-digit Indian postal PIN code.',
      });
    }

    const siteConfig = (await prisma.siteConfig.findUnique({ where: { id: 'default' } })) || {
      allow_unlisted_pincodes: true,
      default_delivery_days: 5,
      cod_enabled: true,
    };

    let handlingDays = 1;
    if (productId) {
      const product = await prisma.product.findUnique({ where: { id: productId } });
      if (product) {
        const seller = await prisma.sellerProfile.findUnique({ where: { id: product.seller_id } });
        if (seller) {
          handlingDays = seller.handling_days || 1;
        }
      }
    }

    const pinRecord = await prisma.serviceablePincode.findUnique({ where: { pincode } });

    if (pinRecord) {
      const transitDays = pinRecord.estimated_days;
      const totalDays = transitDays + handlingDays;
      const deliveryDate = new Date();
      deliveryDate.setDate(deliveryDate.getDate() + totalDays);

      return res.json({
        success: true,
        pincode,
        isServiceable: pinRecord.is_serviceable,
        city: pinRecord.city,
        state: pinRecord.state,
        zone: pinRecord.zone,
        estimatedDays: totalDays,
        estimatedDeliveryDate: deliveryDate.toLocaleDateString('en-IN', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        }),
        codAvailable: pinRecord.cod_available && siteConfig.cod_enabled,
        extraShippingFee: pinRecord.extra_shipping_fee,
      });
    }

    // If pincode is not explicitly listed
    if (siteConfig.allow_unlisted_pincodes) {
      const totalDays = siteConfig.default_delivery_days + handlingDays;
      const deliveryDate = new Date();
      deliveryDate.setDate(deliveryDate.getDate() + totalDays);

      return res.json({
        success: true,
        pincode,
        isServiceable: true,
        city: 'Standard Delivery Area',
        state: 'India',
        zone: 'TIER_2_3',
        estimatedDays: totalDays,
        estimatedDeliveryDate: deliveryDate.toLocaleDateString('en-IN', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        }),
        codAvailable: siteConfig.cod_enabled,
        extraShippingFee: 0,
      });
    }

    return res.json({
      success: false,
      pincode,
      isServiceable: false,
      message: `Delivery is currently not available to pincode ${pincode}.`,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
