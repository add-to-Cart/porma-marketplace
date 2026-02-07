# Database Migration Guide

## Overview

This guide helps you prepare your Firebase Firestore database for the new admin features.

---

## 1. Users Collection Updates

### Add New Fields to Existing Users

Run this in Firebase Admin SDK or Cloud Functions:

```javascript
const admin = require("firebase-admin");
const db = admin.firestore();

async function migrateUsersCollection() {
  try {
    const usersSnap = await db.collection("users").get();
    const batch = db.batch();
    let count = 0;

    usersSnap.forEach((doc) => {
      batch.update(doc.ref, {
        status: "active", // Default status
        isActive: true,
        isRestricted: false,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      count++;

      // Firestore batch limit is 500
      if (count % 500 === 0) {
        batch.commit();
      }
    });

    await batch.commit();
    console.log(`✅ Migrated ${count} users`);
  } catch (err) {
    console.error("❌ Migration failed:", err);
  }
}

// Run migration
migrateUsersCollection();
```

### Expected Users Schema After Migration

```javascript
{
  uid: string,
  email: string,
  username: string,
  displayName: string,
  // NEW FIELDS
  status: 'active',           // Default: 'active'
  isActive: true,             // Default: true
  isRestricted: false,        // Default: false
  // Optional fields (only set when status changes)
  deactivationReason?: string,
  restrictionReason?: string,
  deactivatedAt?: timestamp,
  restrictedAt?: timestamp,
  activatedAt?: timestamp,
  // Existing fields
  createdAt: timestamp,
  updatedAt: timestamp,
}
```

---

## 2. Sellers Collection Updates

### Add/Update Seller Metrics

Run this to ensure all sellers have the required metrics fields:

```javascript
async function migrateSellerMetrics() {
  try {
    const sellersSnap = await db.collection("sellers").get();
    const batch = db.batch();
    let count = 0;

    for (const sellerDoc of sellersSnap.docs) {
      const sellerId = sellerDoc.id;

      // Calculate metrics from products
      const productsSnap = await db
        .collection("products")
        .where("sellerId", "==", sellerId)
        .get();

      let totalSales = 0;
      let totalRevenue = 0;
      const totalProducts = productsSnap.size;

      productsSnap.forEach((productDoc) => {
        const product = productDoc.data();
        const soldCount = product.soldCount || 0;
        const price = product.price || 0;

        totalSales += soldCount;
        totalRevenue += price * soldCount;
      });

      // Update seller with calculated metrics
      batch.update(sellerDoc.ref, {
        totalSales: totalSales,
        totalRevenue: totalRevenue,
        totalProducts: totalProducts,
        status: "active", // Default status
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      count++;

      if (count % 100 === 0) {
        console.log(`Processing seller ${count}...`);
      }
    }

    await batch.commit();
    console.log(`✅ Migrated ${count} sellers with metrics`);
  } catch (err) {
    console.error("❌ Migration failed:", err);
  }
}

// Run migration
migrateSellerMetrics();
```

### Expected Sellers Schema After Migration

```javascript
{
  id: string,
  userId: string,
  storeName: string,
  ownerName: string,
  avatarUrl?: string,
  description?: string,
  // UPDATED FIELDS
  totalSales: number,         // Sum of all product soldCounts
  totalRevenue: number,       // Sum of (price × soldCount)
  totalProducts: number,      // Count of products
  status: 'active',           // Default: 'active'
  // Optional
  lastMetricsSync?: timestamp,
  // Existing fields
  createdAt: timestamp,
  updatedAt: timestamp,
  paymentDetails: {...},
  // etc.
}
```

---

## 3. Products Collection (No Changes Required)

### Verify Existing Structure

Your products should already have these fields:

```javascript
{
  id: string,
  name: string,
  price: number,
  stock: number,
  // These will be auto-updated by the system
  reservedStock: number,      // Updated on order creation
  soldCount: number,          // Updated on order completion
  sellerId: string,
  // Existing fields
  imageUrl?: string,
  images?: string[],
  description?: string,
  ratingAverage?: number,
  updatedAt: timestamp,
  // etc.
}
```

No migration needed - fields exist and will be managed by the order system.

---

## 4. Orders Collection (No Changes Required)

Your orders structure should support the existing fields. No migration needed.

---

## 5. Complete Migration Script

### Run All Migrations

```javascript
async function runAllMigrations() {
  console.log("🚀 Starting database migrations...\n");

  try {
    // Step 1: Migrate Users
    console.log("Step 1: Migrating Users Collection...");
    await migrateUsersCollection();
    console.log("✅ Users migration complete\n");

    // Step 2: Migrate Sellers
    console.log("Step 2: Migrating Sellers Collection...");
    await migrateSellerMetrics();
    console.log("✅ Sellers migration complete\n");

    // Step 3: Verify
    console.log("Step 3: Verifying migrations...");
    const consistency = await verifyDataConsistency();
    console.log("Data Consistency Report:", consistency);

    console.log("\n✅ All migrations completed successfully!");
  } catch (err) {
    console.error("❌ Migration failed:", err);
    process.exit(1);
  }
}

// Run all migrations
runAllMigrations();
```

---

## 6. Using Firebase CLI

### Option A: Firestore Emulator (Testing)

```bash
# Start emulator
firebase emulators:start

# Run migrations against emulator
node migrate.js
```

### Option B: Production Database (Be Careful!)

```bash
# Set active project
firebase use your-project-id

# Run migrations
node migrate.js

# Verify
firebase firestore:inspect
```

---

## 7. Backup Before Migration

### Create Backup

```javascript
async function backupDatabase() {
  // This would typically be done via Firebase Console or CLI
  // Step 1: Go to Firebase Console
  // Step 2: Firestore Database > Backups
  // Step 3: Create new backup
  // Or via CLI:
  // gcloud firestore backups create --collection=users --collection=sellers --collection=products --collection=orders
}
```

---

## 8. Post-Migration Verification

### Check Users Collection

```javascript
async function verifyUsersCollection() {
  const usersSnap = await db.collection("users").limit(5).get();
  usersSnap.forEach((doc) => {
    const data = doc.data();
    console.log("User:", {
      email: data.email,
      status: data.status,
      isActive: data.isActive,
      isRestricted: data.isRestricted,
    });
  });
}

verifyUsersCollection();
```

### Check Sellers Collection

```javascript
async function verifySellersCollection() {
  const sellersSnap = await db.collection("sellers").limit(5).get();
  sellersSnap.forEach((doc) => {
    const data = doc.data();
    console.log("Seller:", {
      storeName: data.storeName,
      totalSales: data.totalSales,
      totalRevenue: data.totalRevenue,
      totalProducts: data.totalProducts,
    });
  });
}

verifySellersCollection();
```

### Run Data Consistency Check

```javascript
// After migrations, use the new sync endpoint
const consistency = await verifyDataConsistency();
console.log("Is Consistent:", consistency.isConsistent);
if (!consistency.isConsistent) {
  console.warn("Inconsistencies:", consistency.inconsistencies);
}
```

---

## 9. Rollback Plan

If migrations fail or cause issues:

### Option 1: Restore from Backup

```bash
# Restore from backup via Firebase Console
# Or use CLI:
gcloud firestore restore BACKUP_ID
```

### Option 2: Manual Cleanup

```javascript
async function rollbackUsersChanges() {
  // Remove new fields if needed
  const batch = db.batch();
  const usersSnap = await db.collection("users").get();

  usersSnap.forEach((doc) => {
    batch.update(doc.ref, {
      status: admin.firestore.FieldValue.delete(),
      isActive: admin.firestore.FieldValue.delete(),
      isRestricted: admin.firestore.FieldValue.delete(),
    });
  });

  await batch.commit();
}
```

---

## 10. Testing After Migration

### Test 1: Create Order

```bash
# Order creation should now sync seller metrics automatically
POST /orders
{
  "buyerId": "buyer123",
  "items": [
    {
      "id": "product1",
      "name": "Item",
      "quantity": 1,
      "price": 500,
      "sellerId": "seller1"
    }
  ]
}

# Check if seller metrics updated
GET /admin/sellers/seller1
# Should show updated totalSales and totalRevenue
```

### Test 2: Admin Analytics

```bash
GET /admin/analytics/sales

# Should return sales data
```

### Test 3: User Management

```bash
PUT /admin/users/user123/status
{
  "action": "deactivate",
  "reason": "Test deactivation"
}

# Verify user status updated
GET /admin/users/user123
# Should show status: "deactivated"
```

---

## 11. Performance Considerations

### Indexes to Create (Optional)

For better query performance with large datasets, create indexes:

```javascript
// In Firebase Console > Firestore > Indexes
// Create composite index:
// Collection: sellers
// Fields: status (Ascending), totalRevenue (Descending), updatedAt (Descending)

// Collection: products
// Fields: sellerId (Ascending), soldCount (Descending)

// Collection: orders
// Fields: status (Ascending), createdAt (Descending)
```

### Estimated Costs

- **Read Operations**: ~2 reads per migration (document check + update)
- **Write Operations**: 1 write per document
- For 1000 users + 100 sellers: ~1200 operations total

---

## 12. Monitoring & Maintenance

### Regular Checks

```javascript
// Run weekly
const report = await verifyDataConsistency();
if (!report.isConsistent) {
  console.warn("Data inconsistency detected!");
  await syncAllSellerMetrics();
}
```

### Metrics Health Check

```javascript
async function healthCheck() {
  const sellersSnap = await db.collection("sellers").get();
  let unhealthy = 0;

  sellersSnap.forEach((doc) => {
    const seller = doc.data();
    if (!seller.totalSales || !seller.totalRevenue) {
      console.warn("Unhealthy seller:", doc.id);
      unhealthy++;
    }
  });

  return {
    totalSellers: sellersSnap.size,
    unhealthy,
    healthy: sellersSnap.size - unhealthy,
  };
}
```

---

## Summary Checklist

- [ ] Backup database
- [ ] Run users collection migration
- [ ] Run sellers collection migration
- [ ] Verify users collection structure
- [ ] Verify sellers collection structure
- [ ] Run data consistency check
- [ ] Test order creation (metrics sync)
- [ ] Test admin analytics endpoint
- [ ] Test user management endpoints
- [ ] Create indexes for performance
- [ ] Set up monitoring/health checks
- [ ] Document any custom configurations

---

**Migration Date**: February 3, 2026
**Version**: 1.0
**Estimated Duration**: 5-15 minutes
**Downtime**: None (can run during normal operation)
