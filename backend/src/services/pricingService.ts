import { prisma } from '../prisma';

export interface CalculatedCartResult {
  items: Array<{
    cartItemId?: string;
    productId: string;
    variantId?: string | null;
    productTitle: string;
    variantSnapshot?: any;
    sellerId: string;
    quantity: number;
    unitPrice: number;
    originalPrice: number;
    subtotal: number;
    isFlashSaleActive: boolean;
    image: string;
  }>;
  itemsSubtotal: number;
  originalSubtotal: number;
  totalSavings: number;
  couponDiscount: number;
  shippingFee: number;
  totalPayable: number;
  couponCode?: string | null;
  pincodeChecked?: string | null;
  estimatedDeliveryDays: number;
  isServiceable: boolean;
  codAvailable: boolean;
}

export async function calculateCartTotals(
  cartItemsList: Array<{ productId: string; variantId?: string | null; quantity: number; id?: string }>,
  couponCode?: string | null,
  pincode?: string | null
): Promise<CalculatedCartResult> {
  const siteConfig = (await prisma.siteConfig.findUnique({ where: { id: 'default' } })) || {
    shipping_fee: 40.0,
    free_shipping_threshold: 499.0,
    allow_unlisted_pincodes: true,
    default_delivery_days: 5,
    cod_enabled: true,
  };

  const now = new Date();
  const allFlashSales = await prisma.flashSale.findMany({ where: { is_active: true } });
  const activeFlashSale = allFlashSales.find((fs) => new Date(fs.starts_at) <= now && new Date(fs.ends_at) >= now);

  let flashItems: any[] = [];
  if (activeFlashSale) {
    flashItems = await prisma.flashSaleItem.findMany({ where: { flash_sale_id: activeFlashSale.id } });
  }

  const calculatedItems = [];
  let itemsSubtotal = 0;
  let originalSubtotal = 0;

  for (const item of cartItemsList) {
    const product = await prisma.product.findUnique({ where: { id: item.productId } });
    if (!product || !product.is_active) continue;

    let variant = null;
    if (item.variantId) {
      variant = await prisma.productVariant.findUnique({ where: { id: item.variantId } });
    }

    let regularPrice = variant ? variant.price : product.price;
    let sellingPrice = variant ? variant.discount_price : product.discount_price;
    let isFlash = false;

    if (activeFlashSale) {
      const matchedFlash = flashItems.find(
        (fi) => fi.product_id === product.id && (!fi.variant_id || fi.variant_id === item.variantId)
      );
      if (matchedFlash && matchedFlash.sold_count < matchedFlash.flash_stock_limit) {
        sellingPrice = matchedFlash.flash_price;
        isFlash = true;
      }
    }

    const itemSubtotal = sellingPrice * item.quantity;
    const itemOriginal = regularPrice * item.quantity;

    itemsSubtotal += itemSubtotal;
    originalSubtotal += itemOriginal;

    calculatedItems.push({
      cartItemId: item.id,
      productId: product.id,
      variantId: variant?.id || null,
      productTitle: product.title,
      variantSnapshot: variant ? variant.attributes : null,
      sellerId: product.seller_id,
      quantity: item.quantity,
      unitPrice: sellingPrice,
      originalPrice: regularPrice,
      subtotal: itemSubtotal,
      isFlashSaleActive: isFlash,
      image: variant?.image_url || product.images[0] || '',
    });
  }

  // Coupon validation
  let couponDiscount = 0;
  let validatedCouponCode: string | null = null;

  if (couponCode) {
    const coupon = await prisma.coupon.findUnique({ where: { code: couponCode.trim().toUpperCase() } });
    if (coupon && coupon.is_active) {
      const validFrom = new Date(coupon.valid_from);
      const validUntil = new Date(coupon.valid_until);

      if (now >= validFrom && now <= validUntil && itemsSubtotal >= coupon.min_order_amount) {
        if (coupon.discount_type === 'PERCENTAGE') {
          let calculated = (itemsSubtotal * coupon.discount_value) / 100;
          if (coupon.max_discount_cap && calculated > coupon.max_discount_cap) {
            calculated = coupon.max_discount_cap;
          }
          couponDiscount = calculated;
        } else {
          couponDiscount = Math.min(coupon.discount_value, itemsSubtotal);
        }
        validatedCouponCode = coupon.code;
      }
    }
  }

  // Logistics & Pincode check
  let estimatedDeliveryDays = siteConfig.default_delivery_days || 5;
  let isServiceable = true;
  let codAvailable = siteConfig.cod_enabled;
  let extraShipping = 0;

  if (pincode && pincode.trim().length === 6) {
    const pinRecord = await prisma.serviceablePincode.findUnique({ where: { pincode: pincode.trim() } });
    if (pinRecord) {
      isServiceable = pinRecord.is_serviceable;
      estimatedDeliveryDays = pinRecord.estimated_days;
      codAvailable = pinRecord.cod_available && siteConfig.cod_enabled;
      extraShipping = pinRecord.extra_shipping_fee || 0;
    } else {
      isServiceable = siteConfig.allow_unlisted_pincodes;
    }
  }

  let baseShipping = 0;
  if (itemsSubtotal > 0 && itemsSubtotal < siteConfig.free_shipping_threshold) {
    baseShipping = siteConfig.shipping_fee;
  }
  const totalShipping = itemsSubtotal > 0 ? baseShipping + extraShipping : 0;
  const totalPayable = Math.max(0, itemsSubtotal - couponDiscount + totalShipping);
  const totalSavings = originalSubtotal - itemsSubtotal + couponDiscount;

  return {
    items: calculatedItems,
    itemsSubtotal: Number(itemsSubtotal.toFixed(2)),
    originalSubtotal: Number(originalSubtotal.toFixed(2)),
    totalSavings: Number(totalSavings.toFixed(2)),
    couponDiscount: Number(couponDiscount.toFixed(2)),
    shippingFee: Number(totalShipping.toFixed(2)),
    totalPayable: Number(totalPayable.toFixed(2)),
    couponCode: validatedCouponCode,
    pincodeChecked: pincode || null,
    estimatedDeliveryDays,
    isServiceable,
    codAvailable,
  };
}
