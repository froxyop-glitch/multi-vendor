import { Router, Request, Response } from 'express';
import { prisma } from '../prisma';
import { optionalAuthMiddleware, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// GET /api/v1/discovery/autocomplete?q=...
router.get('/autocomplete', async (req: Request, res: Response) => {
  try {
    const q = ((req.query.q as string) || '').toLowerCase().trim();
    if (!q || q.length < 2) {
      return res.json({ success: true, suggestions: [], products: [] });
    }

    // 1. Search logs
    const queryLogs = await prisma.searchQueryLog.findMany({
      where: { query_normalized: { contains: q } },
      orderBy: { search_count: 'desc' },
      take: 5,
    });
    const suggestions = queryLogs.map((l) => l.query_normalized);

    // 2. Matching Products with thumbnails
    const allProducts = await prisma.product.findMany({ where: { is_active: true } });
    const matchingProducts = allProducts
      .filter((p) => p.title.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q))
      .slice(0, 5)
      .map((p) => ({
        id: p.id,
        title: p.title,
        slug: p.slug,
        price: p.discount_price,
        image: p.images[0] || '',
      }));

    return res.json({
      success: true,
      suggestions,
      products: matchingProducts,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/v1/discovery/log-search
router.post('/log-search', async (req: Request, res: Response) => {
  try {
    const { query } = req.body;
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ success: false, message: 'Search query is required.' });
    }

    const normalized = query.toLowerCase().trim();
    if (normalized.length >= 2) {
      const existing = await prisma.searchQueryLog.findUnique({ where: { query_normalized: normalized } });
      if (existing) {
        await prisma.searchQueryLog.update({
          where: { id: existing.id },
          data: { search_count: existing.search_count + 1 },
        });
      } else {
        await prisma.searchQueryLog.create({
          data: {
            query_normalized: normalized,
            search_count: 1,
          },
        });
      }
    }

    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/v1/discovery/recommendations/:productId
router.get('/recommendations/:productId', async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    const currentProduct = await prisma.product.findUnique({ where: { id: productId } });

    if (!currentProduct) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    // Similar Products: Same category
    const categoryProducts = await prisma.product.findMany({
      where: {
        category_id: currentProduct.category_id,
        is_active: true,
      },
      take: 6,
    });
    const similarProducts = categoryProducts.filter((p) => p.id !== currentProduct.id);

    // Frequently Bought Together: complementary items (or high-rated items from other categories)
    const otherProducts = await prisma.product.findMany({
      where: {
        is_active: true,
      },
      take: 8,
    });
    const fbtCandidates = otherProducts.filter((p) => p.id !== currentProduct.id && p.category_id !== currentProduct.category_id);
    const frequentlyBoughtTogether = fbtCandidates.slice(0, 2);

    // Compute bundle price
    let bundleTotal = currentProduct.discount_price;
    for (const b of frequentlyBoughtTogether) {
      bundleTotal += b.discount_price;
    }
    const bundleDiscount = Number((bundleTotal * 0.05).toFixed(2)); // 5% bundle bonus
    const bundleFinalPrice = Number((bundleTotal - bundleDiscount).toFixed(2));

    return res.json({
      success: true,
      similarProducts,
      frequentlyBoughtTogether,
      bundleSummary: {
        rawTotal: bundleTotal,
        bundleDiscount,
        bundleFinalPrice,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/v1/discovery/recently-viewed
router.get('/recently-viewed', optionalAuthMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.json({ success: true, products: [] });
    }

    const items = await prisma.recentlyViewedItem.findMany({
      where: { user_id: userId },
      orderBy: { viewed_at: 'desc' },
      take: 8,
    });

    const products = [];
    for (const item of items) {
      const prod = await prisma.product.findUnique({ where: { id: item.product_id } });
      if (prod && prod.is_active) {
        products.push(prod);
      }
    }

    return res.json({ success: true, products });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/v1/discovery/recently-viewed
router.post('/recently-viewed', optionalAuthMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { productId } = req.body;
    if (!userId || !productId) {
      return res.json({ success: true });
    }

    const existing = await prisma.recentlyViewedItem.findFirst({
      where: { user_id: userId, product_id: productId },
    });

    if (existing) {
      await prisma.recentlyViewedItem.update({
        where: { id: existing.id },
        data: { viewed_at: new Date().toISOString() },
      });
    } else {
      await prisma.recentlyViewedItem.create({
        data: {
          user_id: userId,
          product_id: productId,
          viewed_at: new Date().toISOString(),
        },
      });
    }

    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
