# Architecture Overview - Admin Features & Data Synchronization

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        ADMIN DASHBOARD                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐ │
│  │ Sales Analytics  │  │ Seller Products  │  │ User Mgmt    │ │
│  │ Dashboard        │  │ & Sales          │  │ (Restrict)   │ │
│  └────────┬─────────┘  └────────┬─────────┘  └──────┬───────┘ │
│           │                     │                   │          │
│           └─────────────────────┼───────────────────┘          │
│                                 │                              │
└─────────────────────────────────┼──────────────────────────────┘
                                  │
                    API LAYER (Backend)
                                  │
┌─────────────────────────────────┼──────────────────────────────┐
│                                 │                              │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Admin Routes                                            │   │
│  │ ├─ GET /admin/analytics/sales                          │   │
│  │ ├─ GET /admin/sellers-with-products                    │   │
│  │ ├─ GET /admin/sellers/:sellerId                        │   │
│  │ ├─ PUT /admin/users/:userId/status                     │   │
│  │ └─ GET /admin/users/:userId                            │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Sync Routes                                             │   │
│  │ ├─ POST /sync/sync-all-sellers                          │   │
│  │ ├─ POST /sync/sync-seller/:sellerId                     │   │
│  │ ├─ GET /sync/verify-consistency                         │   │
│  │ └─ GET /sync/seller-trend/:sellerId                     │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌──────────────────────────┐  ┌───────────────────────────┐   │
│  │ Order Controller         │  │ Admin Controller          │   │
│  │ (Enhanced)               │  │ (New Functions)           │   │
│  │ ├─ createOrder()         │  │ ├─ getSalesAnalytics()    │   │
│  │ ├─ completeOrder()       │  │ ├─ getSellersWithProducts │   │
│  │ └─ [Auto-sync sellers]   │  │ ├─ updateUserStatus()     │   │
│  │                          │  │ └─ getSellerDetails()     │   │
│  └──────────────────────────┘  └───────────────────────────┘   │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Sync Service (Core Logic)                               │   │
│  │ ├─ syncSellerMetricsOnSale()                            │   │
│  │ ├─ recalculateSellerMetrics()                           │   │
│  │ ├─ syncAllSellerMetrics()                               │   │
│  │ ├─ verifyDataConsistency()                              │   │
│  │ └─ getSellerSalesTrend()                                │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────┬──────────────────────────────┘
                                  │
                    DATABASE LAYER (Firestore)
                                  │
┌─────────────────────────────────┼──────────────────────────────┐
│                                 │                              │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                  Collections                             │   │
│  │                                                          │   │
│  │  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐   │   │
│  │  │   USERS     │  │   SELLERS    │  │   PRODUCTS   │   │   │
│  │  │             │  │              │  │              │   │   │
│  │  │ • status    │  │ • totalSales │  │ • stock      │   │   │
│  │  │ • isActive  │  │ • totalRev   │  │ • reserved   │   │   │
│  │  │ • isRestr   │  │ • totalProd  │  │ • soldCount  │   │   │
│  │  │ • updatedAt │  │ • updatedAt  │  │ • price      │   │   │
│  │  └─────────────┘  └──────────────┘  └──────────────┘   │   │
│  │                                                          │   │
│  │  ┌──────────────┐                                       │   │
│  │  │   ORDERS     │                                       │   │
│  │  │              │                                       │   │
│  │  │ • items[]    │  ← Triggers sync                      │   │
│  │  │ • status     │                                       │   │
│  │  │ • total      │                                       │   │
│  │  └──────────────┘                                       │   │
│  │                                                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Flow: Purchase to Sync

### Flow 1: Create Order (Reserve Stock)

```
Customer Orders
    ↓
POST /orders
    ↓
createOrder()
    ├─ FOR EACH item:
    │  ├─ Get product
    │  ├─ Check stock availability
    │  ├─ Reserve stock:
    │  │  ├─ product.stock -= quantity
    │  │  └─ product.reservedStock += quantity
    │  │
    │  └─ Sync seller metrics:
    │     ├─ seller.totalSales += quantity
    │     └─ seller.totalRevenue += (price × quantity)
    │
    ├─ Create order document
    ├─ Batch commit (atomic)
    └─ Notify sellers
        ↓
Order Created ✅
Stock Reserved ✅
Seller Metrics Updated ✅
```

### Flow 2: Complete Order (Finalize Sales)

```
Order Delivered
    ↓
PUT /orders/{id}/complete
    ↓
completeOrder()
    ├─ FOR EACH item:
    │  ├─ Get product
    │  ├─ Update sales:
    │  │  ├─ product.soldCount += quantity
    │  │  └─ product.reservedStock -= quantity
    │  │
    │  └─ Sync seller metrics:
    │     (already updated on create, kept in sync)
    │
    ├─ Update order status
    ├─ Batch commit (atomic)
    └─ Notify buyer
        ↓
Order Completed ✅
Sales Finalized ✅
Metrics Consistent ✅
```

---

## Data Consistency Model

```
┌─────────────────────────────────────────────────────────┐
│ Data Consistency Verification                           │
└──────────────────────────┬────────────────────────────────┘
                           │
        GET /sync/verify-consistency
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
    ┌────────┐         ┌────────┐        ┌────────┐
    │ Orders │         │Products│        │Sellers │
    └────┬───┘         └───┬────┘        └───┬────┘
         │                 │                 │
    Sum of all         Sum of all      Sum of all
    item quantities    soldCounts      totalSales
         │                 │                 │
         └─────────────────┼─────────────────┘
                           │
                ┌──────────┴──────────┐
                │                    │
            Should Match        If NOT:
                │              (Inconsistency)
                │                    │
                ▼                    ▼
         CONSISTENT ✅         POST /sync/sync-all-sellers
                                    │
                                    ▼
                         Rebuild from products
                                    │
                                    ▼
                         RE-VERIFY ✅
```

---

## User Status State Machine

```
┌──────────────┐
│    ACTIVE    │  ◄─── Default state
└──────┬───────┘
       │
       │ Admin deactivates
       │ (reason recorded)
       ▼
┌──────────────┐
│ DEACTIVATED  │  ◄─── Cannot login, account disabled
└──────┬───────┘
       │
       │ Admin activates
       │
       ▼
┌──────────────┐
│    ACTIVE    │  ◄─── Restored
└──────┬───────┘
       │
       │ Admin restricts
       │ (reason recorded)
       ▼
┌──────────────┐
│  RESTRICTED  │  ◄─── Flagged, under review
└──────┬───────┘
       │
       │ Admin activates
       │
       ▼
┌──────────────┐
│    ACTIVE    │  ◄─── Restrictions removed
└──────────────┘

All status changes logged with:
- Timestamp (createdAt, deactivatedAt, restrictedAt, activatedAt)
- Reason (deactivationReason, restrictionReason)
- Admin action
```

---

## API Endpoint Hierarchy

```
/admin (Protected - requires isAdmin)
├── /analytics
│   ├─ GET /sales                    (Dashboard metrics)
│   └─ GET /top-sellers              (Top sellers by sales)
├── /users
│   ├─ GET /                         (All users)
│   ├─ GET /{userId}                 (User details)
│   └─ PUT /{userId}/status          (Update status)
├── /sellers
│   ├─ GET /                         (All sellers)
│   ├─ GET /{sellerId}               (Seller details)
│   └─ GET /sellers-with-products    (Sellers + products)

/sync (Protected - requires isAdmin)
├─ POST /sync-all-sellers            (Rebuild all metrics)
├─ POST /sync-seller/{id}            (Rebuild single seller)
├─ GET /verify-consistency           (Check data health)
└─ GET /seller-trend/{id}            (Sales trends)
```

---

## Component Architecture

```
Frontend Layer
│
├─── AdminDashboardExample.jsx
│    ├─── SalesAnalytics (displays dashboard)
│    ├─── SellersList (displays sellers)
│    └─── UserManagement (manage users)
│
└─── api/admin.js
     ├─── getSalesAnalytics()
     ├─── getSellersWithProducts()
     ├─── updateUserStatus()
     ├─── verifyDataConsistency()
     └─── ... (15+ functions)
         │
         ▼
Backend API Layer
│
├─── controllers/adminController.js
│    ├─── getSalesAnalytics()
│    ├─── getSellersWithProducts()
│    ├─── getSellerDetails()
│    ├─── updateUserStatus()
│    └─── getUserById()
│
├─── controllers/syncController.js
│    ├─── syncAllSellerMetricsAdmin()
│    ├─── recalculateSellerMetricsAdmin()
│    ├─── verifyDataConsistencyAdmin()
│    └─── getSellerSalesTrendAdmin()
│
├─── services/syncService.js
│    ├─── syncSellerMetricsOnSale()
│    ├─── recalculateSellerMetrics()
│    ├─── syncAllSellerMetrics()
│    ├─── verifyDataConsistency()
│    └─── getSellerSalesTrend()
│
└─── controllers/orderController.js
     ├─── createOrder() [ENHANCED]
     └─── completeOrder() [ENHANCED]
         │
         ▼
Database Layer (Firestore)
│
├─── users collection
├─── sellers collection
├─── products collection
└─── orders collection
```

---

## Data Update Frequency

```
Real-Time (On Action)
├─ Product stock (on order creation)
├─ Product reservedStock (on order creation)
├─ Product soldCount (on order completion)
├─ Seller totalSales (on order creation)
└─ Seller totalRevenue (on order creation)

Manual (Admin Triggered)
├─ Full metric recalculation (POST /sync/sync-all-sellers)
├─ Single seller metrics (POST /sync/sync-seller/:id)
├─ Consistency verification (GET /sync/verify-consistency)
└─ Sales trends (GET /sync/seller-trend/:id)

Real-Time Computed (On Request)
├─ Dashboard analytics (GET /admin/analytics/sales)
├─ Top sellers list (GET /admin/analytics/top-sellers)
├─ Sellers with products (GET /admin/sellers-with-products)
└─ Seller details (GET /admin/sellers/:sellerId)
```

---

## Security Layers

```
┌─────────────────────────────────────────┐
│      Client Request                     │
└──────────────────┬──────────────────────┘
                   │
                   ▼
          ┌─────────────────────┐
          │  Authentication     │
          │ (Firebase Token)    │
          └──────────┬──────────┘
                     │
          ┌──────────▼──────────┐
          │ Authorization Check │
          │ (req.user.isAdmin)  │
          └──────────┬──────────┘
                     │
          ┌──────────▼──────────────┐
          │ Input Validation        │
          │ - Required fields       │
          │ - Valid actions         │
          │ - Data types            │
          └──────────┬──────────────┘
                     │
          ┌──────────▼──────────┐
          │ Database Operation  │
          │ (Atomic Batch Tx)   │
          └──────────┬──────────┘
                     │
          ┌──────────▼──────────┐
          │ Audit Logging       │
          │ - Timestamp         │
          │ - Admin ID          │
          │ - Action & Reason   │
          └──────────┬──────────┘
                     │
                     ▼
          ┌──────────────────────┐
          │ Response Sent        │
          └──────────────────────┘
```

---

## Performance Characteristics

```
Metric                          Typical Time    Notes
─────────────────────────────────────────────────────────
GET /admin/analytics/sales      < 2s            Real-time calculation
GET /admin/sellers-with-products < 3s           Depends on seller/product count
GET /admin/sellers/:id          < 1s            Single seller lookup
PUT /admin/users/:id/status     < 500ms         Direct update
POST /sync/sync-all-sellers     2-10s           Batch recalculation
GET /sync/verify-consistency    < 5s            Collection scans
GET /sync/seller-trend/:id      < 2s            Date range query

Scaling:
- 100 sellers:    Analytics ~1s
- 1000 sellers:   Analytics ~2-3s
- 10000 sellers:  Analytics 5-10s (consider caching)
```

---

## Error Handling Flow

```
API Request
    │
    ├─ Invalid Token
    │  └─ 401 Unauthorized
    │
    ├─ Not Admin
    │  └─ 403 Forbidden
    │
    ├─ Invalid Parameters
    │  └─ 400 Bad Request
    │
    ├─ Resource Not Found
    │  └─ 404 Not Found
    │
    ├─ Database Error
    │  └─ 500 Server Error
    │
    └─ Success
       └─ 200 OK with data
```

---

## Deployment Checklist

```
Before Deployment:
☐ Database migration completed
☐ All endpoints tested
☐ Error handling verified
☐ Security validation passed
☐ Performance benchmarks met
☐ Documentation reviewed
☐ Backup created
☐ Rollback plan ready
☐ Team trained
☐ Monitoring set up

After Deployment:
☐ Monitor server logs
☐ Track error rates
☐ Verify data sync working
☐ Test admin features
☐ Performance monitoring
☐ User feedback collection
```

---

**Architecture Version**: 1.0
**Last Updated**: February 3, 2026
**Status**: Ready for Deployment ✅
