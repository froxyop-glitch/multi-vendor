'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Star,
  ShoppingCart,
  Zap,
  MapPin,
  ShieldCheck,
  RotateCcw,
  Truck,
  Heart,
  CheckCircle,
  HelpCircle,
  MessageCircle,
  Share2,
} from 'lucide-react';
import { apiRequest } from '../../../lib/api';
import { useCart } from '../../../context/CartContext';
import { useWishlist } from '../../../context/WishlistContext';
import { useAuth } from '../../../context/AuthContext';
import ProductCard from '../../../components/ProductCard';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const idOrSlug = params.id as string;

  const { addToCart } = useCart();
  const { wishlistIds, toggleWishlist } = useWishlist();
  const { user } = useAuth();

  const [product, setProduct] = useState<any>(null);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({});
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  // Logistics Pincode Checker State
  const [pincodeInput, setPincodeInput] = useState('736123');
  const [pincodeResult, setPincodeResult] = useState<any>(null);
  const [isCheckingPin, setIsCheckingPin] = useState(false);

  // Recommendations State
  const [similarProducts, setSimilarProducts] = useState<any[]>([]);
  const [fbtBundle, setFbtBundle] = useState<any[]>([]);
  const [bundleSummary, setBundleSummary] = useState<any>(null);

  // Reviews & Q&A Modals State
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const [questionInput, setQuestionInput] = useState('');
  const [isSubmittingQuestion, setIsSubmittingQuestion] = useState(false);

  useEffect(() => {
    async function loadProduct() {
      setIsLoading(true);
      const res = await apiRequest(`/products/${idOrSlug}`);
      if (res.success && res.product) {
        const prod = res.product;
        setProduct(prod);
        setSelectedImage(prod.images?.[0] || '');

        // Initialize variant attributes
        if (prod.has_variants && prod.variants?.length > 0) {
          const firstVar = prod.variants[0];
          setSelectedVariant(firstVar);
          setSelectedAttributes(firstVar.attributes || {});
          if (firstVar.image_url) {
            setSelectedImage(firstVar.image_url);
          }
        }

        // Fetch recommendations & FBT bundle
        const recRes = await apiRequest(`/discovery/recommendations/${prod.id}`);
        if (recRes.success) {
          setSimilarProducts(recRes.similarProducts || []);
          setFbtBundle(recRes.frequentlyBoughtTogether || []);
          setBundleSummary(recRes.bundleSummary || null);
        }

        // Log to recently viewed
        apiRequest('/discovery/recently-viewed', {
          method: 'POST',
          body: JSON.stringify({ productId: prod.id }),
        });

        // Auto-check default pincode
        checkPincode('736123', prod.id);
      }
      setIsLoading(false);
    }

    if (idOrSlug) {
      loadProduct();
    }
  }, [idOrSlug]);

  const checkPincode = async (pin: string, prodId?: string) => {
    if (!pin || pin.length !== 6) return;
    setIsCheckingPin(true);
    const res = await apiRequest(`/logistics/check-pincode?pincode=${pin}&productId=${prodId || product?.id}`);
    if (res.success) {
      setPincodeResult(res);
    }
    setIsCheckingPin(false);
  };

  const handleAttributeSelect = (name: string, value: string) => {
    if (!product || !product.variants) return;
    const newAttrs = { ...selectedAttributes, [name]: value };
    setSelectedAttributes(newAttrs);

    // Find matching variant
    const matched = product.variants.find((v: any) => {
      return Object.entries(newAttrs).every(([k, val]) => v.attributes[k] === val);
    });

    if (matched) {
      setSelectedVariant(matched);
      if (matched.image_url) {
        setSelectedImage(matched.image_url);
      }
    }
  };

  const handleAddToCart = async () => {
    if (!product) return;
    const ok = await addToCart(product.id, selectedVariant?.id, 1);
    if (ok) {
      alert('Product added to your cart!');
    }
  };

  const handleBuyNow = async () => {
    if (!product) return;
    await addToCart(product.id, selectedVariant?.id, 1);
    router.push('/checkout');
  };

  const handleAddBundleToCart = async () => {
    if (!product) return;
    await addToCart(product.id, selectedVariant?.id, 1);
    for (const b of fbtBundle) {
      await addToCart(b.id, null, 1);
    }
    alert('Complete bundle added to your cart with extra 5% savings!');
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert('Please log in to submit a review.');
      return;
    }
    setIsSubmittingReview(true);
    const res = await apiRequest(`/products/${product.id}/reviews`, {
      method: 'POST',
      body: JSON.stringify({
        rating: reviewRating,
        title: reviewTitle,
        comment: reviewComment,
      }),
    });
    setIsSubmittingReview(false);
    if (res.success) {
      alert('Review submitted successfully!');
      setShowReviewModal(false);
      setReviewTitle('');
      setReviewComment('');
      // Reload product
      const reload = await apiRequest(`/products/${product.id}`);
      if (reload.success) setProduct(reload.product);
    } else {
      alert(res.message || 'Could not submit review.');
    }
  };

  const handleQuestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert('Please log in to ask a question.');
      return;
    }
    if (!questionInput.trim()) return;
    setIsSubmittingQuestion(true);
    const res = await apiRequest(`/products/${product.id}/questions`, {
      method: 'POST',
      body: JSON.stringify({ questionText: questionInput }),
    });
    setIsSubmittingQuestion(false);
    if (res.success) {
      alert('Question posted! Seller will answer shortly.');
      setQuestionInput('');
      const reload = await apiRequest(`/products/${product.id}`);
      if (reload.success) setProduct(reload.product);
    }
  };

  if (isLoading || !product) {
    return <div className="max-w-7xl mx-auto p-12 text-center text-gray-500 font-semibold">Loading product details...</div>;
  }

  const currentPrice = selectedVariant ? selectedVariant.price : product.price;
  const currentDiscountPrice = selectedVariant ? selectedVariant.discount_price : product.discount_price;
  const currentStock = selectedVariant ? selectedVariant.stock_quantity : product.stock_quantity;
  const discountPercent = Math.round(((currentPrice - currentDiscountPrice) / currentPrice) * 100);
  const isWishlisted = wishlistIds.has(product.id);

  // Technical SEO Schema.org JSON-LD
  const jsonLdProduct = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    image: product.images,
    description: product.description,
    sku: selectedVariant?.sku || product.slug,
    offers: {
      '@type': 'Offer',
      priceCurrency: 'INR',
      price: currentDiscountPrice,
      availability: currentStock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: product.seller?.storeName || 'ShopEzy Seller',
      },
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: product.rating,
      reviewCount: Math.max(1, product.review_count),
    },
  };

  const jsonLdBreadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://shopezy.com' },
      { '@type': 'ListItem', position: 2, name: product.category?.name || 'Category', item: `https://shopezy.com/products?category=${product.category?.slug}` },
      { '@type': 'ListItem', position: 3, name: product.title, item: `https://shopezy.com/product/${product.slug}` },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdProduct) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdBreadcrumb) }}
      />

      <div className="max-w-7xl mx-auto px-2 sm:px-4 py-4 space-y-4">
        {/* Breadcrumb Navigation */}
        <nav className="text-xs text-gray-500 flex items-center gap-1.5 flex-wrap">
          <Link href="/" className="hover:text-fkblue">Home</Link>
          <span>›</span>
          <Link href={`/products?category=${product.category?.slug}`} className="hover:text-fkblue">
            {product.category?.name}
          </Link>
          <span>›</span>
          <span className="text-gray-800 font-semibold truncate max-w-sm">{product.title}</span>
        </nav>

        {/* Product Master Section */}
        <div className="bg-white rounded border border-gray-200 shadow-sm p-4 sm:p-6 grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Left Column: Image Gallery & Sticky Action Buttons */}
          <div className="md:col-span-5 flex flex-col gap-4">
            <div className="relative aspect-square w-full rounded border border-gray-100 bg-white flex items-center justify-center p-4 overflow-hidden group">
              <img
                src={selectedImage}
                alt={product.title}
                className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
              />
              <button
                onClick={() => toggleWishlist(product.id)}
                className="absolute top-3 right-3 p-2 rounded-full bg-white shadow-md hover:bg-gray-50 active:scale-90 transition-transform"
                title="Wishlist"
              >
                <Heart
                  className={`w-5 h-5 ${
                    isWishlisted ? 'text-red-500 fill-red-500' : 'text-gray-400 hover:text-red-500'
                  }`}
                />
              </button>
            </div>

            {/* Thumbnail Row */}
            {product.images && product.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {product.images.map((img: string, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(img)}
                    className={`w-16 h-16 rounded border p-1 shrink-0 transition-all ${
                      selectedImage === img ? 'border-fkblue ring-2 ring-blue-100' : 'border-gray-200 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="Thumb" className="w-full h-full object-contain" />
                  </button>
                ))}
              </div>
            )}

            {/* Flipkart-Style Action Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={handleAddToCart}
                disabled={currentStock <= 0}
                className="h-12 bg-fkyellow hover:bg-yellow-400 text-gray-900 font-black rounded-sm flex items-center justify-center gap-2 shadow-sm transition-colors text-sm uppercase tracking-wide disabled:opacity-50"
              >
                <ShoppingCart className="w-4 h-4 fill-gray-900" />
                <span>{currentStock > 0 ? 'ADD TO CART' : 'OUT OF STOCK'}</span>
              </button>

              <button
                onClick={handleBuyNow}
                disabled={currentStock <= 0}
                className="h-12 bg-fkyellow-dark hover:bg-orange-600 text-white font-black rounded-sm flex items-center justify-center gap-2 shadow-sm transition-colors text-sm uppercase tracking-wide disabled:opacity-50"
              >
                <Zap className="w-4 h-4 fill-white" />
                <span>BUY NOW</span>
              </button>
            </div>
          </div>

          {/* Right Column: Title, Ratings, Pricing, Variants, Pincode EDD */}
          <div className="md:col-span-7 flex flex-col justify-between space-y-4">
            <div>
              <h1 className="text-lg sm:text-2xl font-bold text-gray-900 leading-snug">
                {product.title}
              </h1>

              {/* Rating & Review Counter */}
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                <span className="inline-flex items-center gap-1 bg-green-700 text-white text-xs font-bold px-2 py-0.5 rounded">
                  <span>{product.rating.toFixed(1)}</span>
                  <Star className="w-3 h-3 fill-white" />
                </span>
                <span className="text-xs font-semibold text-gray-500">
                  {product.review_count.toLocaleString('en-IN')} Ratings & Verified Reviews
                </span>
                <span className="text-xs font-bold text-fkblue italic">
                  ShopEzy Assured ★
                </span>
              </div>

              {/* Special Price Tag */}
              <div className="mt-4 p-3 bg-green-50 rounded border border-green-100 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-green-800 uppercase tracking-wider block">
                    Special Price
                  </span>
                  <div className="flex items-baseline gap-3 mt-0.5">
                    <span className="text-2xl sm:text-3xl font-black text-gray-900">
                      ₹{currentDiscountPrice.toLocaleString('en-IN')}
                    </span>
                    <span className="text-sm text-gray-400 line-through">
                      ₹{currentPrice.toLocaleString('en-IN')}
                    </span>
                    <span className="text-sm font-bold text-green-700">
                      {discountPercent}% off
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[11px] font-semibold text-gray-500 block">Stock Status</span>
                  <span className={`text-xs font-bold ${currentStock > 5 ? 'text-green-700' : currentStock > 0 ? 'text-amber-600' : 'text-red-600'}`}>
                    {currentStock > 5 ? 'In Stock' : currentStock > 0 ? `Only ${currentStock} left!` : 'Currently Unavailable'}
                  </span>
                </div>
              </div>

              {/* Dynamic Variant Selectors */}
              {product.has_variants && product.variant_options && (
                <div className="mt-5 space-y-4 border-t border-b border-gray-100 py-4">
                  {product.variant_options.map((opt: any) => (
                    <div key={opt.name}>
                      <span className="text-xs font-bold text-gray-700 block mb-2">
                        Select {opt.name}: <span className="text-fkblue font-bold">{selectedAttributes[opt.name]}</span>
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {opt.values.map((val: string) => {
                          const isSelected = selectedAttributes[opt.name] === val;
                          return (
                            <button
                              key={val}
                              onClick={() => handleAttributeSelect(opt.name, val)}
                              className={`px-3 py-1.5 rounded text-xs font-bold transition-all border ${
                                isSelected
                                  ? 'border-fkblue bg-blue-50 text-fkblue ring-1 ring-fkblue'
                                  : 'border-gray-200 text-gray-700 hover:border-gray-400 bg-white'
                              }`}
                            >
                              {val}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                  {selectedVariant && (
                    <p className="text-[11px] text-gray-400 font-mono">
                      SKU: {selectedVariant.sku}
                    </p>
                  )}
                </div>
              )}

              {/* Pincode EDD & Logistics Checker */}
              <div className="mt-5 p-3.5 bg-gray-50 rounded border border-gray-200">
                <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5 mb-2">
                  <MapPin className="w-4 h-4 text-fkblue" />
                  <span>Check Delivery & COD Availability</span>
                </span>
                <div className="flex gap-2 max-w-sm">
                  <input
                    type="text"
                    value={pincodeInput}
                    onChange={(e) => setPincodeInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="Enter 6-digit PIN"
                    className="flex-1 px-3 py-1.5 text-xs bg-white border border-gray-300 rounded focus:outline-none focus:border-fkblue font-mono"
                  />
                  <button
                    onClick={() => checkPincode(pincodeInput)}
                    disabled={isCheckingPin || pincodeInput.length !== 6}
                    className="px-4 py-1.5 bg-fkblue text-white text-xs font-bold rounded hover:bg-fkblue-dark disabled:opacity-50"
                  >
                    {isCheckingPin ? 'Checking...' : 'Check'}
                  </button>
                </div>

                {pincodeResult && (
                  <div className="mt-2.5 text-xs space-y-1">
                    <p className="font-semibold text-gray-800 flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5 text-green-700" />
                      <span>
                        Estimated Delivery by <span className="font-bold text-green-800">{pincodeResult.estimatedDeliveryDate}</span>
                      </span>
                    </p>
                    <p className="text-gray-600">
                      Zone: <span className="font-bold">{pincodeResult.zone}</span> ({pincodeResult.city}, {pincodeResult.state})
                    </p>
                    <p className="text-gray-600">
                      Cash on Delivery:{' '}
                      <span className={pincodeResult.codAvailable ? 'text-green-700 font-bold' : 'text-red-600 font-bold'}>
                        {pincodeResult.codAvailable ? 'Available' : 'Not Available for this area'}
                      </span>
                    </p>
                  </div>
                )}
              </div>

              {/* Seller Information */}
              {product.seller && (
                <div className="mt-4 flex items-center justify-between text-xs text-gray-600 bg-white p-2.5 rounded border border-gray-100">
                  <div>
                    <span className="text-gray-400">Sold by: </span>
                    <span className="font-bold text-gray-900">{product.seller.storeName}</span>
                    <span className="text-gray-400"> ({product.seller.registeredState})</span>
                  </div>
                  <span className="text-green-700 font-semibold flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Verified Partner
                  </span>
                </div>
              )}

              {/* Highlights / Specifications */}
              <div className="mt-5">
                <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-2">
                  Product Specifications
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {Object.entries(product.specifications || {}).map(([key, val]) => (
                    <div key={key} className="flex gap-2 p-1.5 bg-gray-50 rounded">
                      <span className="text-gray-500 font-medium w-28 shrink-0">{key}:</span>
                      <span className="text-gray-900 font-semibold">{String(val)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div className="mt-4 text-xs text-gray-600 leading-relaxed border-t pt-3">
                <p>{product.description}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Frequently Bought Together Bundle */}
        {fbtBundle.length > 0 && bundleSummary && (
          <section className="bg-white rounded border border-indigo-100 shadow-sm p-4 sm:p-6">
            <h3 className="text-sm sm:text-base font-bold text-gray-900 flex items-center gap-2">
              <Zap className="w-4 h-4 text-indigo-600 fill-indigo-600" />
              <span>Frequently Bought Together</span>
              <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                Save Extra 5% Bundle Bonus
              </span>
            </h3>

            <div className="mt-4 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-3 overflow-x-auto w-full md:w-auto">
                <div className="flex flex-col items-center text-center w-28 shrink-0">
                  <img src={selectedImage} alt={product.title} className="w-20 h-20 object-contain p-1 border rounded" />
                  <span className="text-[11px] font-bold mt-1 text-gray-900 line-clamp-1">{product.title}</span>
                  <span className="text-xs font-bold text-gray-800">₹{currentDiscountPrice}</span>
                </div>

                {fbtBundle.map((b) => (
                  <React.Fragment key={b.id}>
                    <span className="text-gray-400 font-bold text-lg">+</span>
                    <div className="flex flex-col items-center text-center w-28 shrink-0">
                      <img src={b.images[0]} alt={b.title} className="w-20 h-20 object-contain p-1 border rounded" />
                      <span className="text-[11px] font-bold mt-1 text-gray-900 line-clamp-1">{b.title}</span>
                      <span className="text-xs font-bold text-gray-800">₹{b.discount_price}</span>
                    </div>
                  </React.Fragment>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto bg-indigo-50 p-4 rounded border border-indigo-100">
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs text-gray-500 line-through">₹{bundleSummary.rawTotal}</span>
                    <span className="text-lg font-black text-gray-900">₹{bundleSummary.bundleFinalPrice}</span>
                  </div>
                  <span className="text-[11px] text-green-700 font-bold block">
                    You save ₹{bundleSummary.bundleDiscount} on this bundle!
                  </span>
                </div>
                <button
                  onClick={handleAddBundleToCart}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-sm text-xs whitespace-nowrap shadow"
                >
                  Add All to Cart
                </button>
              </div>
            </div>
          </section>
        )}

        {/* Customer Reviews & Star Distribution */}
        <section className="bg-white rounded border border-gray-200 shadow-sm p-4 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4 mb-4">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-gray-900">Ratings & Reviews</h3>
              <p className="text-xs text-gray-500">Verified authentic buyer ratings and experiences</p>
            </div>
            <button
              onClick={() => setShowReviewModal(true)}
              className="px-4 py-2 border border-fkblue text-fkblue hover:bg-blue-50 rounded text-xs font-bold transition-colors"
            >
              Rate Product
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Star Distribution Column */}
            <div className="md:col-span-4 bg-gray-50 p-4 rounded flex flex-col justify-center items-center text-center">
              <span className="text-4xl font-black text-gray-900 flex items-center gap-1">
                {product.rating.toFixed(1)} <Star className="w-6 h-6 text-green-600 fill-green-600" />
              </span>
              <p className="text-xs text-gray-500 font-semibold mt-1">
                {product.review_count} verified ratings
              </p>

              {/* Bars */}
              <div className="w-full space-y-1.5 mt-4 text-xs">
                {[5, 4, 3, 2, 1].map((stars) => {
                  const count = product.starDistribution?.[stars] || 0;
                  const pct = product.review_count > 0 ? (count / product.review_count) * 100 : 0;
                  return (
                    <div key={stars} className="flex items-center gap-2">
                      <span className="w-6 text-gray-600 font-bold">{stars}★</span>
                      <div className="flex-1 bg-gray-200 h-2 rounded-full overflow-hidden">
                        <div className="bg-green-600 h-full rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="w-6 text-gray-400 font-medium text-right">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Reviews List */}
            <div className="md:col-span-8 space-y-4">
              {product.reviews && product.reviews.length > 0 ? (
                product.reviews.map((rev: any) => (
                  <div key={rev.id} className="border-b pb-3 last:border-b-0 space-y-1 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="bg-green-700 text-white text-[10px] font-bold px-1.5 py-0.2 rounded flex items-center gap-0.5">
                        {rev.rating}★
                      </span>
                      <span className="font-bold text-gray-900">{rev.title}</span>
                    </div>
                    <p className="text-gray-700 leading-relaxed">{rev.comment}</p>
                    <div className="flex items-center gap-3 text-[11px] text-gray-400 pt-1">
                      <span className="font-semibold text-gray-600">{rev.userName}</span>
                      <span>•</span>
                      <span className="text-green-700 font-medium flex items-center gap-0.5">
                        <CheckCircle className="w-3 h-3" /> Certified Buyer
                      </span>
                      <span>•</span>
                      <span>{new Date(rev.created_at).toLocaleDateString('en-IN')}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-500 py-6 text-center">No reviews submitted yet. Be the first to review!</p>
              )}
            </div>
          </div>
        </section>

        {/* Product Q&A Section */}
        <section className="bg-white rounded border border-gray-200 shadow-sm p-4 sm:p-6">
          <div className="border-b pb-3 mb-4 flex items-center justify-between">
            <h3 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-fkblue" />
              <span>Questions & Answers</span>
            </h3>
          </div>

          {/* Ask question form */}
          <form onSubmit={handleQuestionSubmit} className="flex gap-2 mb-4">
            <input
              type="text"
              value={questionInput}
              onChange={(e) => setQuestionInput(e.target.value)}
              placeholder="Have a question about this product? Ask the seller..."
              className="flex-1 px-3 py-2 text-xs border rounded bg-gray-50 focus:bg-white focus:outline-none focus:border-fkblue"
            />
            <button
              type="submit"
              disabled={isSubmittingQuestion || !questionInput.trim()}
              className="px-4 py-2 bg-fkblue text-white text-xs font-bold rounded hover:bg-fkblue-dark disabled:opacity-50"
            >
              Ask
            </button>
          </form>

          {/* Questions List */}
          <div className="space-y-3">
            {product.questions && product.questions.length > 0 ? (
              product.questions.map((q: any) => (
                <div key={q.id} className="p-3 bg-gray-50 rounded border border-gray-100 text-xs space-y-1.5">
                  <p className="font-bold text-gray-900 flex items-start gap-1.5">
                    <span className="text-fkblue font-black">Q:</span>
                    <span>{q.question_text}</span>
                  </p>
                  {q.answer_text ? (
                    <p className="text-gray-700 flex items-start gap-1.5 pl-3">
                      <span className="text-green-700 font-black">A:</span>
                      <span>{q.answer_text}</span>
                    </p>
                  ) : (
                    <p className="text-gray-400 italic pl-3">Pending answer from verified seller...</p>
                  )}
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-500 py-3 text-center">No questions asked yet.</p>
            )}
          </div>
        </section>

        {/* Similar Products Rail */}
        {similarProducts.length > 0 && (
          <section className="bg-white rounded border border-gray-200 shadow-sm p-4">
            <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-3">
              Similar Products You May Like
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {similarProducts.slice(0, 4).map((p) => (
                <ProductCard
                  key={p.id}
                  id={p.id}
                  title={p.title}
                  slug={p.slug}
                  images={p.images}
                  price={p.price}
                  discount_price={p.discount_price}
                  rating={p.rating}
                  review_count={p.review_count}
                />
              ))}
            </div>
          </section>
        )}

        {/* Review Modal */}
        {showReviewModal && (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-2xl space-y-4">
              <h3 className="text-base font-bold text-gray-900">Write a Review</h3>

              <form onSubmit={handleReviewSubmit} className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Your Rating:</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewRating(star)}
                        className={`p-2 rounded border text-sm font-bold ${
                          reviewRating >= star ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {star}★
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">Review Title</label>
                  <input
                    type="text"
                    required
                    value={reviewTitle}
                    onChange={(e) => setReviewTitle(e.target.value)}
                    placeholder="e.g. Great quality and prompt delivery!"
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">Detailed Feedback</label>
                  <textarea
                    rows={4}
                    required
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Share what you liked or disliked about this product..."
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowReviewModal(false)}
                    className="px-4 py-2 border rounded text-gray-700 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingReview}
                    className="px-5 py-2 bg-fkblue text-white rounded font-bold hover:bg-fkblue-dark"
                  >
                    {isSubmittingReview ? 'Submitting...' : 'Submit Review'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
