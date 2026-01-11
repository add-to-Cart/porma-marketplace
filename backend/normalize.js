import admin from "./config/firebaseAdmin.js";
const db = admin.firestore();

// The indexer logic we built previously
const generateSearchIndex = (data) => {
  const words = new Set();
  data.name
    ?.toLowerCase()
    .split(/\s+/)
    .forEach((word) => words.add(word));
  words.add(data.category?.toLowerCase());
  data.tags?.forEach((tag) => words.add(tag.toLowerCase()));

  const comp = data.vehicleCompatibility;
  if (comp) {
    comp.makes?.forEach((make) => words.add(make.toLowerCase()));
    comp.models?.forEach((model) => words.add(model.toLowerCase()));
    if (comp.type) words.add(comp.type.toLowerCase());
  }
  return Array.from(words).filter((word) => word && word.length > 1);
};

async function cleanAndMigrateData() {
  const productsRef = db.collection("products");
  const snapshot = await productsRef.get();

  console.log(`Starting cleanup for ${snapshot.size} products...`);

  const batch = db.batch();

  snapshot.docs.forEach((doc) => {
    const data = doc.data();

    // 1. Standardize Vehicle Compatibility (Moving root make/model inside)
    const compatibility = {
      type: data.vehicleCompatibility?.type || data.vehicleType || "Universal",
      isUniversalFit: data.vehicleCompatibility?.isUniversalFit || false,
      makes: data.vehicleCompatibility?.makes || (data.make ? [data.make] : []),
      models:
        data.vehicleCompatibility?.models || (data.model ? [data.model] : []),
      yearRange: data.vehicleCompatibility?.yearRange || null,
    };

    // 2. Clean and Normalize the data
    const cleanedProduct = {
      ...data,
      price: parseFloat(data.price) || 0,
      stock: parseInt(data.stock) || 0,
      category: data.category?.trim() || "Uncategorized",
      tags: (data.tags || []).map((t) => t.toLowerCase().trim()),
      vehicleCompatibility: compatibility,

      // 3. Generate the new Search Index
      searchIndex: generateSearchIndex({
        ...data,
        vehicleCompatibility: compatibility,
      }),

      // 4. Remove Legacy Fields (Using FieldValue.delete())
      normalizedName: admin.firestore.FieldValue.delete(),
      make: admin.firestore.FieldValue.delete(),
      model: admin.firestore.FieldValue.delete(),
      vehicleType: admin.firestore.FieldValue.delete(),
    };

    batch.update(doc.ref, cleanedProduct);
  });

  await batch.commit();
  console.log("Database successfully cleaned and indexed!");
}

cleanAndMigrateData().catch(console.error);
