import { Router, Request, Response } from 'express';
import { prisma } from '../prisma';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// GET /api/v1/products
router.get('/', async (req: Request, res: Response) => {
  try {
    const {
      q,
      search,
      category,
      minPrice,
      maxPrice,
      rating,
      sort = 'newest',
      page = '1',
      limit = '12',
    } = req.query;

    const searchTerm = ((q || search || '') as string).toLowerCase().trim();
    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const pageSize = Math.max(1, parseInt(limit as string, 10) || 12);

    let allProducts = await prisma.product.findMany({ where: { is_active: true } });

    // Filter by search
    if (searchTerm) {
      allProducts = allProducts.filter(
        (p) =>
          p.title.toLowerCase().includes(searchTerm) ||
          p.description.toLowerCase().includes(searchTerm) ||
          p.slug.toLowerCase().includes(searchTerm)
      );
    }

    // Filter by category
    if (category) {
      const catSlug = (category as string).toLowerCase();
      const matchedCat = await prisma.category.findUnique({ where: { slug: catSlug } });
      const targetCatId = matchedCat ? matchedCat.id : (category as string);
      allProducts = allProducts.filter((p) => p.category_id === targetCatId);
    }

    // Filter by price
    if (minPrice) {
      const min = parseFloat(minPrice as string);
      if (!isNaN(min)) {
        allProducts = allProducts.filter((p) => p.discount_price >= min);
      }
    }
    if (maxPrice) {
      const max = parseFloat(maxPrice as string);
      if (!isNaN(max)) {
        allProducts = allProducts.filter((p) => p.discount_price <= max);
      }
    }

    // Filter by rating
    if (rating) {
      const minRating = parseFloat(rating as string);
      if (!isNaN(minRating)) {
        allProducts = allProducts.filter((p) => p.rating >= minRating);
      }
    }

    // Sorting
    if (sort === 'price_asc') {
      allProducts.sort((a, b) => a.discount_price - b.discount_price);
    } else if (sort === 'price_desc') {
      allProducts.sort((a, b) => b.discount_price - a.discount_price);
    } else if (sort === 'rating') {
      allProducts.sort((a, b) => b.rating - a.rating);
    } else {
      // newest
      allProducts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    const total = allProducts.length;
    const startIndex = (pageNum - 1) * pageSize;
    const paginatedProducts = allProducts.slice(startIndex, startIndex + pageSize);

    // Attach category and seller store names
    const enriched = [];
    for (const prod of paginatedProducts) {
      const cat = await prisma.category.findUnique({ where: { id: prod.category_id } });
      const seller = await prisma.sellerProfile.findUnique({ where: { id: prod.seller_id } });
      enriched.push({
        ...prod,
        categoryName: cat?.name || '',
        sellerStoreName: seller?.store_name || '',
      });
    }

    return res.json({
      success: true,
      products: enriched,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/v1/products/:idOrSlug
router.get('/:idOrSlug', async (req: Request, res: Response) => {
  try {
    const { idOrSlug } = req.params;

    let product = await prisma.product.findUnique({ where: { slug: idOrSlug } });
    if (!product) {
      product = await prisma.product.findUnique({ where: { id: idOrSlug } });
    }

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    // Variants
    const variants = await prisma.productVariant.findMany({
      where: { product_id: product.id, is_active: true },
    });

    // Seller Info
    const seller = await prisma.sellerProfile.findUnique({ where: { id: product.seller_id } });

    // Category Info
    const category = await prisma.category.findUnique({ where: { id: product.category_id } });

    // Reviews & Star Distribution
    const reviews = await prisma.productReview.findMany({
      where: { product_id: product.id, is_approved: true },
      orderBy: { created_at: 'desc' },
    });

    const starDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    for (const r of reviews) {
      const star = r.rating as 1 | 2 | 3 | 4 | 5;
      if (starDistribution[star] !== undefined) {
        starDistribution[star]++;
      }
    }

    const reviewsWithUsers = [];
    for (const r of reviews) {
      const reviewer = await prisma.user.findUnique({ where: { id: r.user_id } });
      reviewsWithUsers.push({
        ...r,
        userName: reviewer?.name || 'Verified Buyer',
      });
    }

    // Questions & Answers
    const questions = await prisma.productQuestion.findMany({
      where: { product_id: product.id, is_visible: true },
      orderBy: { created_at: 'desc' },
    });

    return res.json({
      success: true,
      product: {
        ...product,
        variants,
        seller: seller
          ? {
              id: seller.id,
              storeName: seller.store_name,
              registeredState: seller.registered_state,
              handlingDays: seller.handling_days,
            }
          : null,
        category: category
          ? {
              id: category.id,
              name: category.name,
              slug: category.slug,
            }
          : null,
        reviews: reviewsWithUsers,
        starDistribution,
        questions,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/v1/products/:id/reviews
router.post('/:id/reviews', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { rating, title, comment, images = [] } = req.body;
    const userId = req.user!.userId;

    if (!rating || !title || !comment) {
      return res.status(400).json({ success: false, message: 'Rating, title, and comment are required.' });
    }

    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    // Check if user has an order item for this product that has been delivered
    const userOrders = await prisma.order.findMany({ where: { user_id: userId } });
    const userOrderIds = userOrders.map((o) => o.id);

    const deliveredItem = await prisma.orderItem.findFirst({
      where: {
        product_id: product.id,
        order_id: { in: userOrderIds },
        item_status: 'DELIVERED',
      },
    });

    const isVerifiedPurchase = Boolean(deliveredItem);

    // Check if user already reviewed
    const existingReview = await prisma.productReview.findFirst({
      where: { product_id: product.id, user_id: userId },
    });

    if (existingReview) {
      return res.status(400).json({ success: false, message: 'You have already reviewed this product.' });
    }

    const review = await prisma.productReview.create({
      data: {
        product_id: product.id,
        user_id: userId,
        order_item_id: deliveredItem ? deliveredItem.id : `manual_${Date.now()}`,
        rating: Math.max(1, Math.min(5, parseInt(rating, 10))),
        title,
        comment,
        images,
        is_verified_purchase: isVerifiedPurchase,
        helpful_count: 0,
        is_approved: true,
      },
    });

    // Update product rating and review count
    const allReviews = await prisma.productReview.findMany({
      where: { product_id: product.id, is_approved: true },
    });
    const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

    await prisma.product.update({
      where: { id: product.id },
      data: {
        rating: Number(avgRating.toFixed(1)),
        review_count: allReviews.length,
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Review submitted successfully.',
      review,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/v1/products/:id/questions
router.post('/:id/questions', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { questionText } = req.body;
    const userId = req.user!.userId;

    if (!questionText || questionText.trim().length < 5) {
      return res.status(400).json({ success: false, message: 'Question text must be at least 5 characters.' });
    }

    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const question = await prisma.productQuestion.create({
      data: {
        product_id: product.id,
        user_id: userId,
        question_text: questionText.trim(),
        answer_text: null,
        answered_by_id: null,
        answered_by_role: null,
        helpful_count: 0,
        is_visible: true,
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Your question has been posted and will be answered shortly.',
      question,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
