export type Role = 'CUSTOMER' | 'SELLER' | 'ADMIN';
export type AdminSubRole = 'SUPER_ADMIN' | 'MANAGER' | 'SUPPORT_AGENT' | 'FINANCE';
export type PincodeZone = 'METRO' | 'TIER_1' | 'TIER_2_3' | 'REMOTE';
export type BannerPosition = 'HERO_CAROUSEL' | 'MID_PROMO';
export type SellerApprovalStatus = 'PENDING' | 'APPROVED' | 'SUSPENDED';
export type PayoutMethodType = 'BANK_TRANSFER' | 'UPI';
export type WalletTransactionType =
  | 'CREDIT_ORDER_EARNING'
  | 'DEBIT_REFUND_REVERSAL'
  | 'DEBIT_PAYOUT_HOLD'
  | 'CREDIT_PAYOUT_REJECTED_RESTORE'
  | 'DEBIT_PAYOUT_SETTLED';
export type PayoutRequestStatus = 'PENDING' | 'APPROVED_PROCESSING' | 'SETTLED' | 'REJECTED';
export type DiscountType = 'PERCENTAGE' | 'FLAT_AMOUNT';
export type PaymentMethod = 'RAZORPAY' | 'COD';
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
export type OrderItemStatus =
  | 'PROCESSING'
  | 'PACKED'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'RETURN_REQUESTED'
  | 'RETURN_APPROVED'
  | 'RETURNED'
  | 'REFUNDED';
export type ReturnRequestType = 'CANCELLATION' | 'RETURN';
export type ReturnRequestStatus = 'REQUESTED' | 'APPROVED' | 'REJECTED' | 'REFUND_INITIATED' | 'REFUNDED';
export type RefundTransactionStatus = 'PENDING' | 'PROCESSED' | 'FAILED';
export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
export type NotificationChannel = 'EMAIL' | 'PUSH';

export interface User {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  role: Role;
  admin_sub_role?: AdminSubRole | null;
  phone?: string | null;
  address?: string | null;
  preferred_language: string;
  is_active: boolean;
  created_at: string | Date;
}

export interface AuditLog {
  id: string;
  actor_id?: string | null;
  actor_email: string;
  actor_role: Role;
  actor_sub_role?: AdminSubRole | null;
  action: string;
  target_type: string;
  target_id: string;
  summary: string;
  metadata_diff?: any;
  ip_address?: string | null;
  user_agent?: string | null;
  created_at: string | Date;
}

export interface DevicePushToken {
  id: string;
  user_id: string;
  expo_push_token: string;
  device_platform: string;
  is_active: boolean;
  updated_at: string | Date;
}

export interface SiteConfig {
  id: string;
  site_name: string;
  logo_url: string;
  primary_color: string;
  announcement_bar_text: string;
  announcement_bar_hi: string;
  announcement_bar_bn: string;
  global_commission_percent: number;
  shipping_fee: number;
  free_shipping_threshold: number;
  cod_enabled: boolean;
  razorpay_enabled: boolean;
  maintenance_mode: boolean;
  return_window_days: number;
  min_payout_amount: number;
  payout_tds_percent: number;
  allow_unlisted_pincodes: boolean;
  default_delivery_days: number;
  platform_legal_name: string;
  platform_gstin: string;
  invoice_footer_note: string;
  email_notifications_enabled: boolean;
  push_notifications_enabled: boolean;
  support_email: string;
  default_language: string;
  enabled_languages: string[];
  meta_title: string;
  meta_description: string;
  meta_keywords: string;
  default_og_image_url: string;
  canonical_base_url: string;
}

export interface Banner {
  id: string;
  title: string;
  title_hi?: string;
  title_bn?: string;
  subtitle?: string;
  subtitle_hi?: string;
  subtitle_bn?: string;
  image_url: string;
  redirect_link: string;
  position: BannerPosition;
  display_order: number;
  is_active: boolean;
}

export interface Category {
  id: string;
  name: string;
  name_hi?: string;
  name_bn?: string;
  slug: string;
  icon_or_image_url: string;
  is_featured: boolean;
  display_order: number;
}

export interface ServiceablePincode {
  id: string;
  pincode: string;
  city: string;
  state: string;
  zone: PincodeZone;
  estimated_days: number;
  cod_available: boolean;
  extra_shipping_fee: number;
  is_serviceable: boolean;
}

export interface SellerProfile {
  id: string;
  user_id: string;
  store_name: string;
  gstin_or_tax_id: string;
  registered_state: string;
  registered_address: string;
  pickup_pincode: string;
  handling_days: number;
  approval_status: SellerApprovalStatus;
  commission_rate?: number | null;
  pending_clearance_balance: number;
  available_balance: number;
  on_hold_payout_balance: number;
  total_withdrawn: number;
  created_at: string | Date;
}

export interface SellerPayoutMethod {
  id: string;
  seller_id: string;
  method_type: PayoutMethodType;
  account_holder_name: string;
  bank_name?: string;
  account_number_masked: string;
  account_number_full: string;
  ifsc_code?: string;
  upi_id?: string;
  is_primary: boolean;
}

export interface WalletTransaction {
  id: string;
  seller_id: string;
  order_item_id?: string | null;
  payout_request_id?: string | null;
  type: WalletTransactionType;
  amount: number;
  balance_after: number;
  description: string;
  created_at: string | Date;
}

export interface PayoutRequest {
  id: string;
  seller_id: string;
  payout_method_id: string;
  amount_requested: number;
  tds_or_fee_deducted: number;
  net_payable_amount: number;
  status: PayoutRequestStatus;
  utr_reference_number?: string | null;
  admin_note?: string | null;
  requested_at: string | Date;
  settled_at?: string | Date | null;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  sku: string;
  attributes: Record<string, string>;
  price: number;
  discount_price: number;
  stock_quantity: number;
  image_url?: string;
  is_active: boolean;
}

export interface Product {
  id: string;
  seller_id: string;
  category_id: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  discount_price: number;
  stock_quantity: number;
  images: string[];
  specifications: Record<string, any>;
  has_variants: boolean;
  variant_options: { name: string; values: string[] }[];
  hsn_code: string;
  gst_rate_percent: number;
  is_featured: boolean;
  is_active: boolean;
  rating: number;
  review_count: number;
  meta_title?: string;
  meta_description?: string;
  created_at: string | Date;
}

export interface ProductReview {
  id: string;
  product_id: string;
  user_id: string;
  order_item_id: string;
  rating: number;
  title: string;
  comment: string;
  images: string[];
  is_verified_purchase: boolean;
  helpful_count: number;
  is_approved: boolean;
  created_at: string | Date;
}

export interface ProductQuestion {
  id: string;
  product_id: string;
  user_id: string;
  question_text: string;
  answer_text?: string | null;
  answered_by_id?: string | null;
  answered_by_role?: string | null;
  helpful_count: number;
  is_visible: boolean;
  created_at: string | Date;
  answered_at?: string | Date | null;
}

export interface WishlistItem {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string | Date;
}

export interface RecentlyViewedItem {
  id: string;
  user_id: string;
  product_id: string;
  viewed_at: string | Date;
}

export interface SearchQueryLog {
  id: string;
  query_normalized: string;
  search_count: number;
  updated_at: string | Date;
}

export interface Coupon {
  id: string;
  code: string;
  description: string;
  discount_type: DiscountType;
  discount_value: number;
  max_discount_cap?: number | null;
  min_order_amount: number;
  usage_limit?: number | null;
  used_count: number;
  per_user_limit: number;
  valid_from: string | Date;
  valid_until: string | Date;
  is_active: boolean;
}

export interface FlashSale {
  id: string;
  title: string;
  banner_color: string;
  starts_at: string | Date;
  ends_at: string | Date;
  is_active: boolean;
}

export interface FlashSaleItem {
  id: string;
  flash_sale_id: string;
  product_id: string;
  variant_id?: string | null;
  flash_price: number;
  flash_stock_limit: number;
  sold_count: number;
}

export interface Cart {
  id: string;
  user_id: string;
  updated_at: string | Date;
}

export interface CartItem {
  id: string;
  cart_id: string;
  product_id: string;
  variant_id?: string | null;
  quantity: number;
}

export interface Order {
  id: string;
  user_id: string;
  total_amount: number;
  shipping_fee: number;
  coupon_code?: string | null;
  coupon_discount_amount: number;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  razorpay_order_id?: string | null;
  razorpay_payment_id?: string | null;
  razorpay_signature?: string | null;
  shipping_address: {
    fullName: string;
    phone: string;
    street: string;
    city: string;
    state: string;
    pincode: string;
  };
  created_at: string | Date;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  variant_id?: string | null;
  variant_snapshot: Record<string, any>;
  seller_id: string;
  quantity: number;
  price_at_purchase: number;
  platform_commission_amount: number;
  seller_net_earning: number;
  item_status: OrderItemStatus;
  courier_name?: string | null;
  awb_tracking_number?: string | null;
  tracking_url?: string | null;
  estimated_delivery_date?: string | Date | null;
  delivered_at?: string | Date | null;
}

export interface ShipmentTrackingEvent {
  id: string;
  order_item_id: string;
  status_title: string;
  location: string;
  remarks: string;
  event_time: string | Date;
}

export interface ReturnRequest {
  id: string;
  order_item_id: string;
  user_id: string;
  seller_id: string;
  request_type: ReturnRequestType;
  reason: string;
  comments: string;
  proof_images: string[];
  status: ReturnRequestStatus;
  seller_note?: string | null;
  refund_amount: number;
  restock_inventory: boolean;
  created_at: string | Date;
}

export interface RefundTransaction {
  id: string;
  order_id: string;
  return_request_id: string;
  payment_method: PaymentMethod;
  razorpay_payment_id?: string | null;
  razorpay_refund_id?: string | null;
  amount_in_inr: number;
  status: RefundTransactionStatus;
  processed_at: string | Date;
}

export interface TaxInvoice {
  id: string;
  invoice_number: string;
  order_id: string;
  order_item_id: string;
  seller_id: string;
  user_id: string;
  seller_gstin: string;
  seller_state: string;
  billing_state: string;
  hsn_code: string;
  taxable_amount: number;
  gst_rate_percent: number;
  cgst_amount: number;
  sgst_amount: number;
  igst_amount: number;
  total_invoice_amount: number;
  amount_in_words: string;
  invoice_date: string | Date;
}

export interface SupportTicket {
  id: string;
  ticket_number: string;
  user_id: string;
  order_item_id?: string | null;
  seller_id?: string | null;
  category: string;
  subject: string;
  priority: TicketPriority;
  status: TicketStatus;
  last_message_at: string | Date;
  created_at: string | Date;
}

export interface TicketMessage {
  id: string;
  ticket_id: string;
  sender_id: string;
  sender_role: string;
  message_text: string;
  attachment_url?: string | null;
  is_read: boolean;
  created_at: string | Date;
}

export interface NotificationLog {
  id: string;
  user_id: string;
  order_id?: string | null;
  channel: NotificationChannel;
  event_type: string;
  status: string;
  error_message?: string | null;
  created_at: string | Date;
}

export interface AuthUserPayload {
  userId: string;
  email: string;
  role: Role;
  adminSubRole?: AdminSubRole | null;
  sellerId?: string | null;
  name: string;
}
