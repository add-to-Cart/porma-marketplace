#!/usr/bin/env node
import admin from "../backend/config/firebaseAdmin.js";

const db = admin.firestore();

function parseArg(name) {
  const idx = process.argv.indexOf(name);
  if (idx === -1) return null;
  return process.argv[idx + 1] && !process.argv[idx + 1].startsWith("--")
    ? process.argv[idx + 1]
    : true;
}

function hasFlag(name) {
  return process.argv.includes(name);
}

async function commitBatch(batch) {
  if (!batch._ops || batch._ops.length === 0) return;
  await batch.commit();
}

async function resetSellerData({ sellerId, dryRun = true }) {
  console.log("Reset run for seller:", sellerId || "<all sellers>");

  // Gather sellers to operate on
  const sellers = [];
  if (sellerId) {
    const doc = await db.collection("sellers").doc(sellerId).get();
    if (!doc.exists) {
      console.error("Seller not found:", sellerId);
      return;
    }
    sellers.push({ id: doc.id, data: doc.data() });
  } else {
    const snap = await db.collection("sellers").get();
    snap.forEach((d) => sellers.push({ id: d.id, data: d.data() }));
  }

  console.log(`Found ${sellers.length} seller(s)`);

  for (const s of sellers) {
    console.log(`\n--- Seller: ${s.id} (${s.data.storeName || s.data.userId || "n/a"})`);

    // Fetch products
    const productsSnap = await db
      .collection("products")
      .where("sellerId", "==", s.id)
      .get();

    const productDocs = productsSnap.docs;
    console.log(`Products found: ${productDocs.length}`);

    // Summarize changes
    let totalSoldCount = 0;
    productDocs.forEach((p) => {
      totalSoldCount += p.data().soldCount || 0;
    });

    console.log(`Current total soldCount (all products): ${totalSoldCount}`);

    if (dryRun) {
      console.log("Dry-run: would set each product soldCount=0 and reservedStock=0");
      console.log("Dry-run: would set seller.totalSales=0 and seller.totalRevenue=0");
      continue;
    }

    // Perform batched updates (commit every 400 ops to stay under Firestore limits)
    let batch = db.batch();
    let ops = 0;

    for (const pDoc of productDocs) {
      const pRef = db.collection("products").doc(pDoc.id);
      batch.update(pRef, {
        soldCount: 0,
        reservedStock: 0,
        viewCount: 0,
        ratingsCount: 0,
        ratingAverage: 0,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      ops++;

      if (ops >= 400) {
        await batch.commit();
        batch = db.batch();
        ops = 0;
      }
    }

    // Update seller doc
    const sellerRef = db.collection("sellers").doc(s.id);
    batch.update(sellerRef, {
      totalSales: 0,
      totalRevenue: 0,
      lastMetricsSync: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    ops++;

    if (ops > 0) {
      await batch.commit();
    }

    console.log(`Reset complete for seller ${s.id}`);
  }

  console.log("All requested resets finished.");
}

async function main() {
  const sellerId = parseArg("--sellerId") || parseArg("-s");
  const confirm = hasFlag("--confirm");
  const dryRun = !confirm;

  console.log("Reset Seller Data Script");
  console.log("Mode:", dryRun ? "DRY-RUN (no writes)" : "CONFIRM (will write)");
  if (sellerId) console.log("Target seller:", sellerId === true ? "<missing id>" : sellerId);

  if (dryRun) {
    console.log("Run with --confirm to apply changes.");
  }

  try {
    await resetSellerData({ sellerId: sellerId === true ? null : sellerId, dryRun });
    process.exit(0);
  } catch (err) {
    console.error("Error during reset:", err && err.message ? err.message : err);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1].endsWith("reset-seller-data.js")) {
  main();
}
