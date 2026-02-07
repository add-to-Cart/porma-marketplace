# Quick Reference: Admin Features API Testing

## Prerequisites

- Admin user with `isAdmin: true`
- Bearer token from authentication
- Base URL: `http://localhost:3000`

---

## 1. Sales Analytics

### Get Sales Analytics

```bash
curl -X GET http://localhost:3000/admin/analytics/sales \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json"
```

**Response**: Dashboard metrics, top products, top sellers

---

## 2. Sellers Management

### Get All Sellers

```bash
curl -X GET http://localhost:3000/admin/sellers \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Get Sellers with Products & Sales

```bash
curl -X GET http://localhost:3000/admin/sellers-with-products \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Get Seller Details

```bash
curl -X GET http://localhost:3000/admin/sellers/SELLER_ID \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**Response**: Seller info, products, orders, analytics

### Get Top Sellers

```bash
curl -X GET "http://localhost:3000/admin/analytics/top-sellers?limit=10" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

---

## 3. User Management

### Get All Users

```bash
curl -X GET http://localhost:3000/admin/users \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Get User Details

```bash
curl -X GET http://localhost:3000/admin/users/USER_ID \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Deactivate User

```bash
curl -X PUT http://localhost:3000/admin/users/USER_ID/status \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "deactivate",
    "reason": "Account violation or suspicious activity"
  }'
```

### Restrict User

```bash
curl -X PUT http://localhost:3000/admin/users/USER_ID/status \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "restrict",
    "reason": "Temporary account restriction - pending review"
  }'
```

### Activate User

```bash
curl -X PUT http://localhost:3000/admin/users/USER_ID/status \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "activate",
    "reason": ""
  }'
```

---

## 4. Data Synchronization

### Verify Data Consistency

```bash
curl -X GET http://localhost:3000/sync/verify-consistency \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**Success Response**:

```json
{
  "message": "Data consistency check completed",
  "totalOrders": 150,
  "ordersTotalSales": 800,
  "productsTotalSales": 800,
  "sellersTotalSales": 800,
  "inconsistencies": [],
  "isConsistent": true
}
```

**Error Response** (if inconsistencies found):

```json
{
  "message": "Data consistency check completed",
  "inconsistencies": [
    {
      "type": "PRODUCT_SELLER_MISMATCH",
      "message": "Products totalSales (800) != Sellers totalSales (750)"
    }
  ],
  "isConsistent": false
}
```

### Sync All Sellers Metrics

```bash
curl -X POST http://localhost:3000/sync/sync-all-sellers \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json"
```

### Sync Single Seller Metrics

```bash
curl -X POST http://localhost:3000/sync/sync-seller/SELLER_ID \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json"
```

### Get Seller Sales Trend

```bash
curl -X GET "http://localhost:3000/sync/seller-trend/SELLER_ID?daysBack=30" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**Response**: Daily sales breakdown

```json
{
  "sellerId": "seller123",
  "daysBack": 30,
  "trend": {
    "2025-01-15": {
      "sales": 45,
      "revenue": 22500
    },
    "2025-01-16": {
      "sales": 30,
      "revenue": 15000
    }
  }
}
```

---

## JavaScript/Node.js Testing

### Using the Admin API Helper

```javascript
import {
  getSalesAnalytics,
  getSellersWithProducts,
  getSellerDetails,
  getAllUsers,
  getUserById,
  updateUserStatus,
  deactivateUser,
  restrictUser,
  activateUser,
  verifyDataConsistency,
  syncAllSellerMetrics,
  recalculateSellerMetrics,
  getSellerSalesTrend,
} from "./api/admin";

// Sales Analytics
const analytics = await getSalesAnalytics();
console.log("Top Products:", analytics.topProducts);
console.log("Top Sellers:", analytics.topEarningSellers);

// Sellers with Products
const sellers = await getSellersWithProducts();
sellers.forEach((seller) => {
  console.log(`${seller.storeName}: ₱${seller.totalRevenue}`);
});

// User Management
await deactivateUser("user123", "Account violation");
await restrictUser("user456", "Suspicious activity");
await activateUser("user789");

// Data Sync
const consistency = await verifyDataConsistency();
if (!consistency.isConsistent) {
  console.warn("Found inconsistencies:", consistency.inconsistencies);
  await syncAllSellerMetrics();
}

// Seller Trends
const trend = await getSellerSalesTrend("seller123", 30);
console.log("Sales trend:", trend.trend);
```

---

## Common Scenarios

### Scenario 1: Check Platform Health

```javascript
const consistency = await verifyDataConsistency();
if (consistency.isConsistent) {
  console.log("✅ Platform data is healthy");
} else {
  console.warn("⚠️ Found issues, running sync...");
  await syncAllSellerMetrics();
}
```

### Scenario 2: Monitor Sales Performance

```javascript
const analytics = await getSalesAnalytics();
const totalRevenue = analytics.topEarningSellers.reduce(
  (sum, seller) => sum + seller.revenue,
  0,
);
console.log(`Total Revenue: ₱${totalRevenue.toLocaleString()}`);
```

### Scenario 3: Handle User Violations

```javascript
// Deactivate suspicious account
await deactivateUser(
  userId,
  "Multiple payment failures and suspicious transaction patterns",
);

// Later, after review - reactivate if innocent
await activateUser(userId);
```

### Scenario 4: Seller Performance Dashboard

```javascript
const sellers = await getSellersWithProducts();
const topPerformers = sellers
  .sort((a, b) => b.totalRevenue - a.totalRevenue)
  .slice(0, 5);

topPerformers.forEach((seller) => {
  console.log(`
    Store: ${seller.storeName}
    Revenue: ₱${seller.totalRevenue.toLocaleString()}
    Sold: ${seller.totalSoldCount} items
    Rating: ${seller.averageRating.toFixed(1)}⭐
  `);
});
```

---

## Error Handling

All endpoints return consistent error format:

```javascript
try {
  const data = await getSalesAnalytics();
} catch (error) {
  // error.response.status: HTTP status code
  // error.response.data.message: Error message
  // error.response.data.error: Detailed error

  console.error(`Error: ${error.response.data.message}`);
}
```

---

## Rate Limiting & Performance

- No rate limiting implemented (add if needed)
- Analytics queries may be slow with large datasets
- Consider implementing:
  - Request caching
  - Pagination
  - Data aggregation (hourly/daily summaries)

---

## Troubleshooting

### Data Inconsistencies

1. Run `verifyDataConsistency()` to check
2. If inconsistencies found, run `syncAllSellerMetrics()`
3. Verify again to confirm fix

### Missing Seller Metrics

- Run `recalculateSellerMetrics(sellerId)` for specific seller
- Or `syncAllSellerMetrics()` for all sellers

### Stale Data

- Metrics update automatically on purchase
- If manual changes made to database, run sync endpoints

---

## Support

For issues or questions:

1. Check the data consistency report
2. Review the sync service logs
3. Run manual sync operations
4. Check user account status fields

---

**Last Updated**: February 3, 2026
**Version**: 1.0
