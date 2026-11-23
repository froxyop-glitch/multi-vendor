import { Router, Request, Response } from 'express';
import { prisma } from '../prisma';

const router = Router();

// GET /api/v1/store/config?lang=en|hi|bn
router.get('/config', async (req: Request, res: Response) => {
  try {
    const lang = ((req.query.lang as string) || 'en').toLowerCase();
    const siteConfig = (await prisma.siteConfig.findUnique({ where: { id: 'default' } })) || {
      site_name: 'ShopEzy Marketplace',
      primary_color: '#2874f0',
      announcement_bar_text: 'Mega Festive Sale Live!',
      announcement_bar_hi: 'महा सेल शुरू!',
      announcement_bar_bn: 'মেগা সেল লাইভ!',
      global_commission_percent: 10,
      shipping_fee: 40,
      free_shipping_threshold: 499,
      cod_enabled: true,
      razorpay_enabled: true,
      return_window_days: 7,
      enabled_languages: ['en', 'hi', 'bn'],
    };

    let localizedAnnouncement = siteConfig.announcement_bar_text;
    if (lang === 'hi' && siteConfig.announcement_bar_hi) {
      localizedAnnouncement = siteConfig.announcement_bar_hi;
    } else if (lang === 'bn' && siteConfig.announcement_bar_bn) {
      localizedAnnouncement = siteConfig.announcement_bar_bn;
    }

    // Active Banners
    const allBanners = await prisma.banner.findMany({
      where: { is_active: true },
      orderBy: { display_order: 'asc' },
    });

    const localizedBanners = allBanners.map((b) => ({
      id: b.id,
      title: lang === 'hi' && b.title_hi ? b.title_hi : lang === 'bn' && b.title_bn ? b.title_bn : b.title,
      subtitle: lang === 'hi' && b.subtitle_hi ? b.subtitle_hi : lang === 'bn' && b.subtitle_bn ? b.subtitle_bn : b.subtitle,
      imageUrl: b.image_url,
      redirectLink: b.redirect_link,
      position: b.position,
      displayOrder: b.display_order,
    }));

    // Active Categories
    const allCategories = await prisma.category.findMany({
      orderBy: { display_order: 'asc' },
    });

    const localizedCategories = allCategories.map((c) => ({
      id: c.id,
      name: lang === 'hi' && c.name_hi ? c.name_hi : lang === 'bn' && c.name_bn ? c.name_bn : c.name,
      slug: c.slug,
      iconOrImageUrl: c.icon_or_image_url,
      isFeatured: c.is_featured,
      displayOrder: c.display_order,
    }));

    // Featured Products
    const featuredProducts = await prisma.product.findMany({
      where: { is_featured: true, is_active: true },
      take: 8,
    });

    // Active Flash Sale
    const now = new Date();
    const allFlashSales = await prisma.flashSale.findMany({ where: { is_active: true } });
    const activeFlashSale = allFlashSales.find((fs) => new Date(fs.starts_at) <= now && new Date(fs.ends_at) >= now);

    let flashSaleData = null;
    if (activeFlashSale) {
      const items = await prisma.flashSaleItem.findMany({ where: { flash_sale_id: activeFlashSale.id } });
      const enrichedItems = [];
      for (const item of items) {
        const prod = await prisma.product.findUnique({ where: { id: item.product_id } });
        if (prod) {
          enrichedItems.push({
            id: item.id,
            productId: prod.id,
            title: prod.title,
            slug: prod.slug,
            image: prod.images[0] || '',
            regularPrice: prod.price,
            discountPrice: prod.discount_price,
            flashPrice: item.flash_price,
            flashStockLimit: item.flash_stock_limit,
            soldCount: item.sold_count,
            percentSold: Math.min(100, Math.round((item.sold_count / item.flash_stock_limit) * 100)),
          });
        }
      }
      flashSaleData = {
        id: activeFlashSale.id,
        title: activeFlashSale.title,
        bannerColor: activeFlashSale.banner_color,
        startsAt: activeFlashSale.starts_at,
        endsAt: activeFlashSale.ends_at,
        items: enrichedItems,
      };
    }

    return res.json({
      success: true,
      config: {
        ...siteConfig,
        announcement_bar_text: localizedAnnouncement,
      },
      banners: localizedBanners,
      categories: localizedCategories,
      featuredProducts,
      activeFlashSale: flashSaleData,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/v1/store/flash-sales/active
router.get('/flash-sales/active', async (_req: Request, res: Response) => {
  try {
    const now = new Date();
    const allFlashSales = await prisma.flashSale.findMany({ where: { is_active: true } });
    const active = allFlashSales.filter((fs) => new Date(fs.starts_at) <= now && new Date(fs.ends_at) >= now);

    const detailedSales = [];
    for (const sale of active) {
      const items = await prisma.flashSaleItem.findMany({ where: { flash_sale_id: sale.id } });
      const detailedItems = [];
      for (const item of items) {
        const product = await prisma.product.findUnique({ where: { id: item.product_id } });
        if (product) {
          detailedItems.push({
            id: item.id,
            productId: product.id,
            title: product.title,
            slug: product.slug,
            image: product.images[0] || '',
            regularPrice: product.price,
            flashPrice: item.flash_price,
            flashStockLimit: item.flash_stock_limit,
            soldCount: item.sold_count,
            percentSold: Math.min(100, Math.round((item.sold_count / item.flash_stock_limit) * 100)),
          });
        }
      }
      detailedSales.push({
        id: sale.id,
        title: sale.title,
        bannerColor: sale.banner_color,
        startsAt: sale.starts_at,
        endsAt: sale.ends_at,
        items: detailedItems,
      });
    }

    return res.json({ success: true, flashSales: detailedSales });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
