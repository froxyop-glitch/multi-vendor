import { store } from '../src/lib/store';

async function main() {
  console.log('🌱 Starting database seed...');
  const data = store.resetToSeed();
  console.log(`✅ Seed complete!`);
  console.log(`- Users: ${data.users.length}`);
  console.log(`- Serviceable Pincodes: ${data.serviceablePincodes.length}`);
  console.log(`- Categories: ${data.categories.length}`);
  console.log(`- Products: ${data.products.length}`);
  console.log(`- Product Variants: ${data.productVariants.length}`);
  console.log(`- Coupons: ${data.coupons.length}`);
  console.log(`- Orders: ${data.orders.length}`);
  console.log(`- Tax Invoices: ${data.taxInvoices.length}`);
  console.log(`- Support Tickets: ${data.supportTickets.length}`);
  console.log(`- Audit Logs: ${data.auditLogs.length}`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Seed error:', err);
    process.exit(1);
  });
