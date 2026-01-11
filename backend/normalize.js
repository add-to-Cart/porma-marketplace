import admin from "./config/firebaseAdmin.js";
const db = admin.firestore();

async function normalizeDatabase() {
  console.log("Reading products from Firestore...");
  const snapshot = await db.collection("products").get();
  const batch = db.batch();
  let count = 0;

  snapshot.forEach((doc) => {
    const data = doc.data();
    const docRef = db.collection("products").doc(doc.id);

    // 1. CLEAN TAGS & STYLES (Removing \"quotes\" and normalization)
    const cleanArray = (arr) => {
      if (!Array.isArray(arr)) return [];
      return arr
        .map((item) => item.replace(/["\\]/g, "").trim().toLowerCase())
        .filter(Boolean);
    };

    // 2. CONSTRUCT NESTED COMPATIBILITY
    // Taking data from either the old flat fields or existing nested object
    const vc = data.vehicleCompatibility || {};
    const type = data.vehicleType || vc.type || "Universal";
    const isUniversal = vc.isUniversalFit ?? type === "Universal";

    const normalizedVC = {
      type: type,
      isUniversalFit: isUniversal,
      makes: isUniversal ? [] : vc.makes || [],
      models: isUniversal ? [] : vc.models || [],
      yearRange: isUniversal ? null : vc.yearRange || { from: null, to: null },
    };

    // 3. PREPARE CLEAN OBJECT
    const cleanData = {
      ...data,
      tags: cleanArray(data.tags),
      styles: cleanArray(data.styles),
      vehicleCompatibility: normalizedVC,
      price: Number(data.price) || 0,
      stock: Number(data.stock) || 0,
    };

    // 4. REMOVE REDUNDANT TOP-LEVEL FIELDS
    // These are now inside vehicleCompatibility or cleaned above
    delete cleanData.vehicleType;
    delete cleanData.make;
    delete cleanData.model;
    delete cleanData.year;

    batch.set(docRef, cleanData);
    count++;
  });

  await batch.commit();
  console.log(`✅ Done! Normalized ${count} products.`);
}

normalizeDatabase().catch(console.error);
