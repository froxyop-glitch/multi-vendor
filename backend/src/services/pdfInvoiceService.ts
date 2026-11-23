import PDFDocument from 'pdfkit';
import { TaxInvoice, OrderItem, Product, User, SellerProfile, SiteConfig } from '../types';

export function generateInvoicePDF(
  invoice: TaxInvoice,
  item: OrderItem,
  product: Product,
  customer: User,
  seller: SellerProfile,
  siteConfig: SiteConfig
): any {
  const doc = new PDFDocument({ margin: 40, size: 'A4' });

  // Header
  doc
    .fontSize(18)
    .font('Helvetica-Bold')
    .fillColor('#2874f0')
    .text(siteConfig.site_name, 40, 40)
    .fontSize(9)
    .font('Helvetica')
    .fillColor('#555555')
    .text(siteConfig.platform_legal_name, 40, 62)
    .text(`Platform GSTIN: ${siteConfig.platform_gstin}`, 40, 74)
    .text(`Support: ${siteConfig.support_email}`, 40, 86);

  doc
    .fontSize(16)
    .font('Helvetica-Bold')
    .fillColor('#111827')
    .text('TAX INVOICE', 400, 40, { align: 'right' })
    .fontSize(9)
    .font('Helvetica')
    .fillColor('#4b5563')
    .text(`Invoice No: ${invoice.invoice_number}`, 400, 62, { align: 'right' })
    .text(`Invoice Date: ${new Date(invoice.invoice_date).toLocaleDateString('en-IN')}`, 400, 74, { align: 'right' })
    .text(`Order ID: #${invoice.order_id}`, 400, 86, { align: 'right' });

  doc.strokeColor('#e5e7eb').lineWidth(1).moveTo(40, 105).lineTo(555, 105).stroke();

  // Seller & Buyer Details Columns
  doc
    .fontSize(10)
    .font('Helvetica-Bold')
    .fillColor('#111827')
    .text('Sold By (Supplier):', 40, 115)
    .font('Helvetica')
    .fontSize(9)
    .fillColor('#374151')
    .text(seller.store_name, 40, 128)
    .text(seller.registered_address, 40, 140, { width: 220 })
    .text(`State: ${invoice.seller_state}`, 40, 164)
    .text(`GSTIN: ${invoice.seller_gstin}`, 40, 176);

  doc
    .fontSize(10)
    .font('Helvetica-Bold')
    .fillColor('#111827')
    .text('Billing & Shipping Address:', 320, 115)
    .font('Helvetica')
    .fontSize(9)
    .fillColor('#374151')
    .text(customer.name, 320, 128)
    .text(customer.address || 'Address provided at checkout', 320, 140, { width: 220 })
    .text(`State: ${invoice.billing_state}`, 320, 164)
    .text(`Contact: ${customer.phone || customer.email}`, 320, 176);

  doc.strokeColor('#e5e7eb').lineWidth(1).moveTo(40, 195).lineTo(555, 195).stroke();

  // Item Table Header
  const tableTop = 205;
  doc
    .rect(40, tableTop, 515, 22)
    .fillColor('#f3f4f6')
    .fill();

  doc
    .fontSize(8)
    .font('Helvetica-Bold')
    .fillColor('#374151')
    .text('DESCRIPTION', 45, tableTop + 6)
    .text('HSN', 230, tableTop + 6)
    .text('QTY', 270, tableTop + 6)
    .text('TAXABLE', 305, tableTop + 6)
    .text('GST RATE', 360, tableTop + 6)
    .text('TAX (CGST/SGST/IGST)', 415, tableTop + 6)
    .text('TOTAL (INR)', 485, tableTop + 6, { align: 'right' });

  // Item Row
  const rowTop = tableTop + 26;
  const isIntraState = invoice.seller_state.toLowerCase() === invoice.billing_state.toLowerCase();
  const taxBreakdown = isIntraState
    ? `CGST: ₹${invoice.cgst_amount.toFixed(2)}\nSGST: ₹${invoice.sgst_amount.toFixed(2)}`
    : `IGST: ₹${invoice.igst_amount.toFixed(2)}`;

  doc
    .fontSize(8)
    .font('Helvetica-Bold')
    .fillColor('#111827')
    .text(product.title, 45, rowTop, { width: 180 })
    .font('Helvetica')
    .fillColor('#4b5563')
    .text(invoice.hsn_code, 230, rowTop)
    .text(String(item.quantity), 270, rowTop)
    .text(`₹${invoice.taxable_amount.toFixed(2)}`, 305, rowTop)
    .text(`${invoice.gst_rate_percent}%`, 360, rowTop)
    .text(taxBreakdown, 415, rowTop, { width: 90 })
    .font('Helvetica-Bold')
    .fillColor('#111827')
    .text(`₹${invoice.total_invoice_amount.toFixed(2)}`, 485, rowTop, { align: 'right' });

  const summaryTop = rowTop + 50;
  doc.strokeColor('#e5e7eb').lineWidth(1).moveTo(40, summaryTop).lineTo(555, summaryTop).stroke();

  // Summary & Totals
  doc
    .fontSize(9)
    .font('Helvetica')
    .fillColor('#4b5563')
    .text('Taxable Value:', 350, summaryTop + 10)
    .text(`₹${invoice.taxable_amount.toFixed(2)}`, 485, summaryTop + 10, { align: 'right' });

  if (isIntraState) {
    doc
      .text(`Central GST (CGST ${(invoice.gst_rate_percent / 2).toFixed(1)}%):`, 350, summaryTop + 24)
      .text(`₹${invoice.cgst_amount.toFixed(2)}`, 485, summaryTop + 24, { align: 'right' })
      .text(`State GST (SGST ${(invoice.gst_rate_percent / 2).toFixed(1)}%):`, 350, summaryTop + 38)
      .text(`₹${invoice.sgst_amount.toFixed(2)}`, 485, summaryTop + 38, { align: 'right' });
  } else {
    doc
      .text(`Integrated GST (IGST ${invoice.gst_rate_percent}%):`, 350, summaryTop + 24)
      .text(`₹${invoice.igst_amount.toFixed(2)}`, 485, summaryTop + 24, { align: 'right' });
  }

  const grandTotalTop = summaryTop + (isIntraState ? 54 : 40);
  doc.strokeColor('#111827').lineWidth(1).moveTo(350, grandTotalTop).lineTo(555, grandTotalTop).stroke();

  doc
    .fontSize(11)
    .font('Helvetica-Bold')
    .fillColor('#111827')
    .text('Total Invoice Value:', 350, grandTotalTop + 6)
    .text(`₹${invoice.total_invoice_amount.toFixed(2)}`, 485, grandTotalTop + 6, { align: 'right' });

  // Amount in words
  doc
    .fontSize(9)
    .font('Helvetica-Bold')
    .fillColor('#374151')
    .text('Amount in Words:', 40, summaryTop + 10)
    .font('Helvetica')
    .text(invoice.amount_in_words, 40, summaryTop + 24, { width: 280 });

  // Footer Note
  const footerTop = 730;
  doc.strokeColor('#e5e7eb').lineWidth(1).moveTo(40, footerTop).lineTo(555, footerTop).stroke();

  doc
    .fontSize(8)
    .font('Helvetica')
    .fillColor('#6b7280')
    .text(siteConfig.invoice_footer_note, 40, footerTop + 8, { align: 'center', width: 515 })
    .text('Thank you for shopping on ' + siteConfig.site_name, 40, footerTop + 20, { align: 'center', width: 515 });

  doc.end();
  return doc;
}
