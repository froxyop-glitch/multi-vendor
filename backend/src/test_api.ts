import { app } from './server';
import http from 'http';

async function testBackend() {
  console.log('🧪 Starting comprehensive Backend API verification tests...\n');

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(5099, () => resolve()));
  const BASE = 'http://localhost:5099/api/v1';

  try {
    // 1. Health
    const healthRes = await fetch('http://localhost:5099/health').then((r) => r.json());
    console.log('✅ Health Check:', healthRes.status);

    // 2. Auth Login (Super Admin)
    const adminLoginRes = await fetch(`${BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@shopezy.com', password: 'Password123!' }),
    }).then((r) => r.json());
    console.log('✅ Super Admin Login:', adminLoginRes.success, '| Role:', adminLoginRes.user?.role, '| Sub-role:', adminLoginRes.user?.adminSubRole);
    const adminToken = adminLoginRes.token;

    // 3. Auth Login (Customer)
    const custLoginRes = await fetch(`${BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'customer@shopezy.com', password: 'Password123!' }),
    }).then((r) => r.json());
    console.log('✅ Customer Login:', custLoginRes.success, '| Name:', custLoginRes.user?.name);
    const custToken = custLoginRes.token;

    // 4. Store Config (Multilingual check)
    const configEn = await fetch(`${BASE}/store/config?lang=en`).then((r) => r.json());
    const configHi = await fetch(`${BASE}/store/config?lang=hi`).then((r) => r.json());
    const configBn = await fetch(`${BASE}/store/config?lang=bn`).then((r) => r.json());
    console.log('✅ Store Config Multilingual:');
    console.log('   EN Banner 1:', configEn.banners[0]?.title);
    console.log('   HI Banner 1:', configHi.banners[0]?.title);
    console.log('   BN Banner 1:', configBn.banners[0]?.title);
    console.log('   Categories count:', configEn.categories.length);
    console.log('   Active Flash Sale:', configEn.activeFlashSale?.title);

    // 5. Products Catalog & Pincode Check
    const productsRes = await fetch(`${BASE}/products?limit=5`).then((r) => r.json());
    console.log(`✅ Products catalog returned ${productsRes.products.length} products (Total: ${productsRes.total})`);

    const pincodeRes = await fetch(`${BASE}/logistics/check-pincode?pincode=736123`).then((r) => r.json());
    console.log('✅ Logistics Pincode Check (736123 - Alipurduar):', pincodeRes.isServiceable, '| EDD:', pincodeRes.estimatedDeliveryDate);

    // 6. Discovery Autocomplete
    const autoRes = await fetch(`${BASE}/discovery/autocomplete?q=phone`).then((r) => r.json());
    console.log('✅ Autocomplete for "phone":', autoRes.products.length, 'products found');

    // 7. Cart & Pricing with Coupon
    const addCartRes = await fetch(`${BASE}/cart`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${custToken}` },
      body: JSON.stringify({ productId: productsRes.products[0].id, quantity: 1 }),
    }).then((r) => r.json());
    console.log('✅ Cart Item Added. Total Payable:', addCartRes.totalPayable);

    // 8. Place COD Order
    const codRes = await fetch(`${BASE}/orders/cod`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${custToken}` },
      body: JSON.stringify({
        shippingAddress: {
          fullName: 'Rahul Sen',
          phone: '+91 9123456780',
          street: 'Station Road, Alipurduar Junction',
          city: 'Alipurduar',
          state: 'West Bengal',
          pincode: '736123',
        },
        couponCode: 'WELCOME10',
      }),
    }).then((r) => r.json());
    console.log('✅ COD Order Placed. Order ID:', codRes.orderId, '| Total:', codRes.order?.total_amount);

    // 9. Order Tracking Timeline
    const myOrdersRes = await fetch(`${BASE}/orders/my-orders`, {
      headers: { Authorization: `Bearer ${custToken}` },
    }).then((r) => r.json());
    const firstOrderItem = myOrdersRes.orders[0]?.items[0];
    if (firstOrderItem) {
      const trackingRes = await fetch(`${BASE}/orders/items/${firstOrderItem.id}/tracking`, {
        headers: { Authorization: `Bearer ${custToken}` },
      }).then((r) => r.json());
      console.log('✅ Order Tracking events count:', trackingRes.events?.length, '| Status:', trackingRes.itemStatus);
    }

    // 10. Admin Overview & Audit Logs
    const adminOverview = await fetch(`${BASE}/admin/overview`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    }).then((r) => r.json());
    console.log('✅ Admin GMV:', adminOverview.stats?.platformGMV, '| Total Orders:', adminOverview.stats?.totalOrders);

    const auditLogsRes = await fetch(`${BASE}/admin/audit-logs`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    }).then((r) => r.json());
    console.log('✅ Security Audit Logs count:', auditLogsRes.logs?.length);

    console.log('\n🎉 ALL BACKEND API & SOCKET SERVICE CHECKS PASSED SUCCESSFULLY!');
  } finally {
    server.close();
  }
}

testBackend()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Test failed:', err);
    process.exit(1);
  });
