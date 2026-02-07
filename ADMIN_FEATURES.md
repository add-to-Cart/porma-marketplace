# Admin Features & Data Synchronization Documentation

## Overview

This document outlines the new admin features and data synchronization capabilities added to the Porma Marketplace platform.

---

## 1. Admin Dashboard Features

### 1.1 Sales Analytics Dashboard

**Endpoint:** `GET /admin/analytics/sales`

Returns comprehensive sales metrics and insights:

```json
{
  "totals": {
    "totalOrders": 150,
    "completedOrders": 120,
    "pendingOrders": 30,
    "totalOrderValue": 50000,
    "completedOrderValue": 45000,
    "totalItemsSold": 800,
    "totalProducts": 250,
    "totalSellers": 15
  },
  "topProducts": [
    {
      "id": "prod123",
      "name": "Motorcycle Chain",
      "soldCount": 120,
      "price": 500,
      "revenue": 60000,
      "sellerId": "seller1"
    }
  ],
  "topEarningSellers": [
    {
      "sellerId": "seller1",
      "storeName": "Masterstroke Auto",
      "revenue": 150000,
      "soldCount": 300
    }
  ],
  "chartData": {
    "orders": [...]
  }
}
```

### 1.2 Sellers with Products & Sales

**Endpoint:** `GET /admin/sellers-with-products`

Returns all sellers with their products and sales data:

```json
[
  {
    "id": "seller1",
    "storeName": "Masterstroke Auto",
    "ownerName": "Jeremy",
    "status": "active",
    "totalProducts": 25,
    "totalSoldCount": 450,
    "totalRevenue": 225000,
    "averageRating": 4.5,
    "products": [
      {
        "id": "prod1",
        "name": "Engine Parts",
        "price": 1500,
        "stock": 50,
        "soldCount": 200,
        "totalRevenue": 300000
      }
    ]
  }
]
```

### 1.3 Seller Details & Analytics

**Endpoint:** `GET /admin/sellers/:sellerId`

Returns detailed seller information including:

- Seller profile data
- All products with metrics
- All orders involving the seller
- Analytics: total revenue, sold count, rating

```json
{
  "id": "seller1",
  "storeName": "Masterstroke Auto",
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

---

## 2. User Management Features

### 2.1 Get All Users

**Endpoint:** `GET /admin/users`

Returns all users in the system.

### 2.2 Get User Details

**Endpoint:** `GET /admin/users/:userId`

Returns detailed user information including:

- Email
- Username
- Account status
- Deactivation/restriction details if applicable

### 2.3 Update User Status

**Endpoint:** `PUT /admin/users/:userId/status`

**Request Body:**

```json
{
  "action": "deactivate|restrict|activate",
  "reason": "Optional reason for the action"
}
```

**Actions:**

1. **Deactivate**: Sets `status: "deactivated"`, `isActive: false`
   - Records deactivation reason and timestamp
   - Prevents user from accessing the platform

2. **Restrict**: Sets `status: "restricted"`, `isRestricted: true`
   - Records restriction reason and timestamp
   - Allows account to be re-enabled later

3. **Activate**: Sets `status: "active"`, removes restrictions
   - Restores full account access

**User Database Fields Updated:**

```javascript
{
  status: "active|deactivated|restricted",
  isActive: boolean,
  isRestricted: boolean,
  deactivationReason: string,
  restrictionReason: string,
  deactivatedAt: timestamp,
  restrictedAt: timestamp,
  activatedAt: timestamp,
  updatedAt: timestamp
}
```

---

## 3. Data Synchronization Features

### 3.1 Real-Time Purchase Sync

When an order is created or completed, the following data is **automatically synchronized**:

#### On Order Creation:

- Product `stock` is decremented
- Product `reservedStock` is incremented
- Seller `totalSales` is incremented by item quantity
- Seller `totalRevenue` is incremented by (price × quantity)

#### On Order Completion:

- Product `soldCount` is incremented by item quantity
- Product `reservedStock` is decremented
- Seller `totalSales` remains updated
- Seller `totalRevenue` remains updated

This ensures that:

- Sales metrics are always in sync with actual orders
- Seller revenue is calculated in real-time
- No data inconsistencies between orders, products, and sellers

### 3.2 Manual Sync Service

#### Sync All Sellers Metrics

**Endpoint:** `POST /sync/sync-all-sellers`

Rebuilds all seller metrics from product data:

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

#### Sync Single Seller Metrics

**Endpoint:** `POST /sync/sync-seller/:sellerId`

Recalculates metrics for a specific seller:

```json
{
  "message": "Metrics recalculated for seller seller1",
  "sellerId": "seller1",
  "totalSales": 450,
  "totalRevenue": 225000,
  "productCount": 25
}
```

#### Verify Data Consistency

**Endpoint:** `GET /sync/verify-consistency`

Checks for inconsistencies between orders, products, and sellers:

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

**Possible Inconsistencies:**

- `PRODUCT_SELLER_MISMATCH`: Products total sales ≠ Sellers total sales
- `ORDER_PRODUCT_MISMATCH`: Orders total sales ≠ Products total sales

#### Get Seller Sales Trend

**Endpoint:** `GET /sync/seller-trend/:sellerId?daysBack=30`

Returns daily sales breakdown for a seller:

```json
{
  "sellerId": "seller1",
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

## 4. Database Schema Updates

### Users Collection

```javascript
{
  id: string,
  email: string,
  username: string,
  status: "active" | "deactivated" | "restricted",
  isActive: boolean,
  isRestricted: boolean,
  deactivationReason?: string,
  restrictionReason?: string,
  deactivatedAt?: timestamp,
  restrictedAt?: timestamp,
  activatedAt?: timestamp,
  updatedAt: timestamp
}
```

### Products Collection

```javascript
{
  id: string,
  name: string,
  price: number,
  stock: number,
  reservedStock: number,
  soldCount: number,
  sellerId: string,
  updatedAt: timestamp
}
```

### Sellers Collection

```javascript
{
  id: string,
  storeName: string,
  ownerName: string,
  totalProducts: number,
  totalSales: number,          // Sum of all product soldCounts
  totalRevenue: number,        // Sum of (price × soldCount)
  status: "active" | "restricted",
  updatedAt: timestamp,
  lastMetricsSync?: timestamp
}
```

---

## 5. Client-Side API Helper

Use the `admin.js` API helper for frontend integration:

```javascript
import {
  getSalesAnalytics,
  getSellersWithProducts,
  getSellerDetails,
  getAllUsers,
  updateUserStatus,
  deactivateUser,
  restrictUser,
  activateUser,
  syncAllSellerMetrics,
  verifyDataConsistency,
  getSellerSalesTrend,
} from "@/api/admin";

// Sales Analytics
const analytics = await getSalesAnalytics();

// User Management
await deactivateUser(userId, "Suspicious activity");
await restrictUser(userId, "Account violation");
await activateUser(userId);

// Data Sync
const syncResult = await syncAllSellerMetrics();
const consistency = await verifyDataConsistency();
```

---

## 6. Key Features Summary

| Feature                                      | Status | Sync Type  | Auto/Manual |
| -------------------------------------------- | ------ | ---------- | ----------- |
| Sales analytics dashboard                    | ✅     | Real-time  | Auto        |
| Sellers with products listing                | ✅     | Real-time  | Auto        |
| Seller details & analytics                   | ✅     | Real-time  | Auto        |
| User deactivation                            | ✅     | Sync       | Manual      |
| User restriction                             | ✅     | Sync       | Manual      |
| User activation                              | ✅     | Sync       | Manual      |
| Purchase data sync (orders→products→sellers) | ✅     | Real-time  | Auto        |
| Manual metric recalculation                  | ✅     | Batch      | Manual      |
| Data consistency verification                | ✅     | Report     | Manual      |
| Seller sales trends                          | ✅     | Historical | Manual      |

---

## 7. Testing Instructions

### Test Sales Analytics

```bash
curl -X GET http://localhost:3000/admin/analytics/sales \
  -H "Authorization: Bearer <admin-token>"
```

### Test User Deactivation

```bash
curl -X PUT http://localhost:3000/admin/users/user123/status \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{"action": "deactivate", "reason": "Suspicious activity"}'
```

### Test Data Consistency

```bash
curl -X GET http://localhost:3000/sync/verify-consistency \
  -H "Authorization: Bearer <admin-token>"
```

### Test Manual Sync

```bash
curl -X POST http://localhost:3000/sync/sync-all-sellers \
  -H "Authorization: Bearer <admin-token>"
```

---

## 8. Notes

1. **Real-Time Sync**: Product and seller metrics are automatically updated when orders are created and completed.

2. **Manual Sync**: Use the manual sync endpoints if there are data inconsistencies or to rebuild metrics.

3. **Data Integrity**: Always run `verifyDataConsistency` after bulk operations to ensure data integrity.

4. **User Account Management**: Deactivated users cannot log in. Restricted users have their accounts flagged but can still log in (implement UI restrictions separately).

5. **Performance**: The analytics endpoints may take time with large datasets. Consider implementing pagination and filtering.
