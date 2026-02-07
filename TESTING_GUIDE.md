# Comprehensive Testing Guide

## Pre-Testing Checklist

- [ ] Backend server is running (`npm start` in backend folder)
- [ ] Firebase is configured and accessible
- [ ] Admin user account exists with `isAdmin: true`
- [ ] Some test data exists (users, sellers, products, orders)
- [ ] Postman or curl is available for API testing
- [ ] Database backups are created

---

## Test Suite 1: Admin Analytics

### Test 1.1: Get Sales Analytics

**Purpose**: Verify sales metrics are calculated correctly

```bash
curl -X GET http://localhost:3000/admin/analytics/sales \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json"
```

**Expected Response**:

```json
{
  "totals": {
    "totalOrders": [number],
    "completedOrders": [number],
    "pendingOrders": [number],
    "totalOrderValue": [number],
    "completedOrderValue": [number],
    "totalItemsSold": [number],
    "totalProducts": [number],
    "totalSellers": [number]
  },
  "topProducts": [array],
  "topEarningSellers": [array],
  "chartData": {...}
}
```

**Success Criteria**:

- ✅ Response status: 200
- ✅ All metrics are numbers
- ✅ topProducts array sorted by soldCount descending
- ✅ topEarningSellers array sorted by revenue descending

**Failure Scenarios**:

- ❌ 403: Not an admin user
- ❌ 500: Database error

---

### Test 1.2: Get Top Sellers

**Purpose**: Verify top sellers are ranked by sales

```bash
curl -X GET "http://localhost:3000/admin/analytics/top-sellers?limit=5" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**Expected Response**:

```json
[
  {
    "id": "seller1",
    "storeName": "Store Name",
    "ownerName": "Owner",
    "totalSales": 100,
    "totalProducts": 10,
    "averageRating": 4.5,
    "sampleProduct": {...}
  }
]
```

**Success Criteria**:

- ✅ Response status: 200
- ✅ Array is sorted by totalSales descending
- ✅ Max length matches limit parameter
- ✅ All sellers have required fields

---

## Test Suite 2: Sellers Management

### Test 2.1: Get Sellers with Products

**Purpose**: Verify seller products and sales are displayed

```bash
curl -X GET http://localhost:3000/admin/sellers-with-products \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**Expected Response**:

```json
[
  {
    "id": "seller1",
    "storeName": "Store",
    "ownerName": "Owner",
    "totalProducts": 25,
    "totalSoldCount": 450,
    "totalRevenue": 225000,
    "products": [
      {
        "id": "prod1",
        "name": "Item",
        "price": 1500,
        "soldCount": 50,
        "totalRevenue": 75000
      }
    ]
  }
]
```

**Success Criteria**:

- ✅ Response status: 200
- ✅ Each seller has product array
- ✅ totalRevenue = sum of all product revenues
- ✅ totalSoldCount = sum of all product soldCounts
- ✅ Sorted by totalRevenue descending

### Test 2.2: Get Seller Details

**Purpose**: Verify detailed seller information

```bash
curl -X GET http://localhost:3000/admin/sellers/SELLER_ID \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**Expected Response**:

```json
{
  "id": "seller1",
  "storeName": "Store",
  "products": [...],
  "orders": [...],
  "analytics": {
    "totalProducts": 25,
    "totalRevenue": 225000,
    "totalSoldCount": 450,
    "averageRating": 4.5,
    "totalOrders": 120
  }
}
```

**Success Criteria**:

- ✅ Response status: 200
- ✅ Products array contains all seller products
- ✅ Orders array contains all orders with this seller
- ✅ Analytics match calculated values

---

## Test Suite 3: User Management

### Test 3.1: Get All Users

**Purpose**: Verify all users are retrieved

```bash
curl -X GET http://localhost:3000/admin/users \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**Expected Response**:

```json
[
  {
    "id": "user1",
    "email": "user@example.com",
    "status": "active",
    "isActive": true,
    "isRestricted": false
  }
]
```

**Success Criteria**:

- ✅ Response status: 200
- ✅ All users have status field
- ✅ isActive and isRestricted are booleans

### Test 3.2: Get User Details

**Purpose**: Verify individual user information

```bash
curl -X GET http://localhost:3000/admin/users/USER_ID \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**Success Criteria**:

- ✅ Response status: 200
- ✅ User has all expected fields
- ✅ 404 if user doesn't exist

### Test 3.3: Deactivate User

**Purpose**: Verify user deactivation works

```bash
curl -X PUT http://localhost:3000/admin/users/USER_ID/status \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "deactivate",
    "reason": "Suspicious activity"
  }'
```

**Expected Response**:

```json
{
  "message": "User deactivated successfully",
  "user": {
    "id": "user1",
    "status": "deactivated",
    "isActive": false,
    "deactivationReason": "Suspicious activity",
    "deactivatedAt": "2025-02-03T10:30:00Z"
  }
}
```

**Success Criteria**:

- ✅ Response status: 200
- ✅ status = "deactivated"
- ✅ isActive = false
- ✅ deactivationReason is set
- ✅ deactivatedAt is timestamped

**Verification**:

- Verify user record in Firebase Console
- Try logging in with deactivated user (should fail with middleware check)

### Test 3.4: Restrict User

**Purpose**: Verify user restriction works

```bash
curl -X PUT http://localhost:3000/admin/users/USER_ID/status \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "restrict",
    "reason": "Account violation - under review"
  }'
```

**Expected Response**:

```json
{
  "message": "User restricted successfully",
  "user": {
    "id": "user1",
    "status": "restricted",
    "isRestricted": true,
    "restrictionReason": "Account violation - under review",
    "restrictedAt": "2025-02-03T10:30:00Z"
  }
}
```

**Success Criteria**:

- ✅ Response status: 200
- ✅ status = "restricted"
- ✅ isRestricted = true
- ✅ restrictionReason is set
- ✅ restrictedAt is timestamped

### Test 3.5: Activate User

**Purpose**: Verify user activation works

```bash
curl -X PUT http://localhost:3000/admin/users/USER_ID/status \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "activate",
    "reason": ""
  }'
```

**Expected Response**:

```json
{
  "message": "User activated successfully",
  "user": {
    "id": "user1",
    "status": "active",
    "isActive": true,
    "isRestricted": false,
    "activatedAt": "2025-02-03T10:30:00Z"
  }
}
```

**Success Criteria**:

- ✅ Response status: 200
- ✅ status = "active"
- ✅ isActive = true
- ✅ isRestricted = false
- ✅ activatedAt is timestamped

---

## Test Suite 4: Data Synchronization

### Test 4.1: Verify Data Consistency

**Purpose**: Check for data inconsistencies

```bash
curl -X GET http://localhost:3000/sync/verify-consistency \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**Expected Response (No Issues)**:

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

**Success Criteria**:

- ✅ Response status: 200
- ✅ All sales counts match
- ✅ inconsistencies array is empty
- ✅ isConsistent = true

**Expected Response (With Issues)**:

```json
{
  "inconsistencies": [
    {
      "type": "PRODUCT_SELLER_MISMATCH",
      "message": "Products totalSales (800) != Sellers totalSales (750)"
    }
  ],
  "isConsistent": false
}
```

**Action**:

- If inconsistencies found, run sync endpoints

### Test 4.2: Sync All Sellers

**Purpose**: Rebuild all seller metrics

```bash
curl -X POST http://localhost:3000/sync/sync-all-sellers \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**Expected Response**:

```json
{
  "message": "All seller metrics synced successfully",
  "success": true,
  "syncedSellers": 15,
  "details": [
    {
      "sellerId": "seller1",
      "totalSales": 450,
      "totalRevenue": 225000,
      "productCount": 25
    }
  ]
}
```

**Success Criteria**:

- ✅ Response status: 200
- ✅ All sellers synced
- ✅ Metrics match calculated values from products

### Test 4.3: Sync Single Seller

**Purpose**: Rebuild metrics for specific seller

```bash
curl -X POST http://localhost:3000/sync/sync-seller/SELLER_ID \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**Expected Response**:

```json
{
  "message": "Metrics recalculated for seller SELLER_ID",
  "sellerId": "SELLER_ID",
  "totalSales": 450,
  "totalRevenue": 225000,
  "productCount": 25
}
```

**Success Criteria**:

- ✅ Response status: 200
- ✅ Metrics calculated from products
- ✅ Seller document updated

### Test 4.4: Get Seller Sales Trend

**Purpose**: Verify daily sales breakdown

```bash
curl -X GET "http://localhost:3000/sync/seller-trend/SELLER_ID?daysBack=30" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**Expected Response**:

```json
{
  "sellerId": "SELLER_ID",
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

**Success Criteria**:

- ✅ Response status: 200
- ✅ Daily breakdown includes sales and revenue
- ✅ Data within specified daysBack range
- ✅ Only completed orders included

---

## Test Suite 5: Real-Time Purchase Sync

### Test 5.1: Create Order (Stock & Seller Metrics)

**Purpose**: Verify purchase sync works automatically

**Setup**:

1. Note current product stock
2. Note current seller totalSales and totalRevenue

**Action**:

```bash
curl -X POST http://localhost:3000/orders \
  -H "Authorization: Bearer BUYER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "buyerId": "buyer1",
    "items": [
      {
        "id": "product1",
        "name": "Test Item",
        "quantity": 5,
        "price": 1000,
        "sellerId": "seller1",
        "storeName": "Test Store"
      }
    ],
    "subtotal": 5000,
    "deliveryFee": 500,
    "total": 5500,
    "paymentMethod": "cod"
  }'
```

**Verification**:

```bash
# Check product stock decreased
curl -X GET http://localhost:3000/products/product1 \
  -H "Authorization: Bearer TOKEN"
# stock should be reduced by 5
# reservedStock should be increased by 5

# Check seller metrics increased
curl -X GET http://localhost:3000/admin/sellers/seller1 \
  -H "Authorization: Bearer ADMIN_TOKEN"
# totalSales should increase by 5
# totalRevenue should increase by 5000
```

**Success Criteria**:

- ✅ Product stock decreased by quantity ordered
- ✅ Product reservedStock increased by quantity ordered
- ✅ Seller totalSales increased
- ✅ Seller totalRevenue increased

### Test 5.2: Complete Order (SoldCount & Metrics)

**Purpose**: Verify order completion sync

**Action**:

```bash
curl -X PUT http://localhost:3000/orders/ORDER_ID/complete \
  -H "Authorization: Bearer SELLER_TOKEN"
```

**Verification**:

```bash
# Check product soldCount increased
curl -X GET http://localhost:3000/products/product1
# soldCount should be increased by 5

# Check seller metrics remain updated
curl -X GET http://localhost:3000/admin/sellers/seller1
# totalSales should still match
# totalRevenue should still match
```

**Success Criteria**:

- ✅ Product soldCount increased by quantity
- ✅ Product reservedStock decreased
- ✅ Seller metrics remained consistent

---

## Test Suite 6: Error Handling

### Test 6.1: Unauthorized Access

```bash
curl -X GET http://localhost:3000/admin/analytics/sales \
  -H "Authorization: Bearer INVALID_TOKEN"
```

**Expected**: 403 Forbidden

### Test 6.2: Invalid User ID

```bash
curl -X GET http://localhost:3000/admin/users/NONEXISTENT_ID \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

**Expected**: 404 Not Found

### Test 6.3: Missing Required Fields

```bash
curl -X PUT http://localhost:3000/admin/users/USER_ID/status \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action": "invalid_action"}'
```

**Expected**: 400 Bad Request

---

## Test Suite 7: Frontend Integration

### Test 7.1: Import and Use Admin API

```javascript
import { getSalesAnalytics, getSellersWithProducts } from "@/api/admin";

async function testFrontend() {
  try {
    const analytics = await getSalesAnalytics();
    console.log("Analytics:", analytics);

    const sellers = await getSellersWithProducts();
    console.log("Sellers:", sellers);

    console.log("✅ Frontend integration works!");
  } catch (err) {
    console.error("❌ Error:", err);
  }
}

testFrontend();
```

**Success Criteria**:

- ✅ No CORS errors
- ✅ Data received successfully
- ✅ Can display in UI

---

## Performance Tests

### Test: Analytics Query Performance

```bash
time curl -X GET http://localhost:3000/admin/analytics/sales \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

**Target**: < 2 seconds for typical dataset

### Test: Sellers with Products Performance

```bash
time curl -X GET http://localhost:3000/admin/sellers-with-products \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

**Target**: < 3 seconds for 100+ sellers

---

## Regression Tests

After each change, verify:

- ✅ Normal purchases still work
- ✅ Sales analytics still accurate
- ✅ User management still functional
- ✅ Data consistency maintained

---

## Final Verification Checklist

- [ ] All admin endpoints return correct data
- [ ] All user management actions work
- [ ] Purchase sync works automatically
- [ ] Manual sync endpoints work
- [ ] No data inconsistencies reported
- [ ] Error handling returns correct status codes
- [ ] Frontend can use all admin API functions
- [ ] Performance is acceptable
- [ ] No console errors or warnings
- [ ] Database backups are created post-testing

---

**Test Suite Version**: 1.0
**Last Updated**: February 3, 2026
**Estimated Duration**: 1-2 hours for full test suite
