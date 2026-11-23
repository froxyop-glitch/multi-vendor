import { Router, Request, Response } from 'express';
import { prisma } from '../prisma';

const router = Router();

// GET /api/v1/seo/sitemap-data
router.get('/sitemap-data', async (_req: Request, res: Response) => {
  try {
    const products = await prisma.product.findMany({
      where: { is_active: true },
    });

    const categories = await prisma.category.findMany();

    const productEntries = products.map((p) => ({
      slug: p.slug,
      updatedAt: p.created_at,
    }));

    const categoryEntries = categories.map((c) => ({
      slug: c.slug,
    }));

    return res.json({
      success: true,
      products: productEntries,
      categories: categoryEntries,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
