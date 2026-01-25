import admin from "./config/firebaseAdmin.js";
const db = admin.firestore();

// Helper to generate search tags (copy from productController.js)
const generateSearchTags = (data) => {
  const tags = new Set();

  const addPrefixes = (word) => {
    if (word.length > 2) {
      for (let i = 3; i <= word.length; i++) {
        tags.add(word.substring(0, i));
      }
    } else {
      tags.add(word);
    }
  };

  if (data.name) {
    data.name
      .toLowerCase()
      .split(/\s+/)
      .forEach((word) => {
        if (word.length > 1) addPrefixes(word);
      });
  }

  if (data.categories && Array.isArray(data.categories)) {
    data.categories.forEach((cat) => tags.add(cat.toLowerCase()));
  }

  const comp = data.vehicleCompatibility;
  if (comp) {
    if (comp.isUniversalFit) {
      tags.add("universal");
    } else {
      comp.makes?.forEach((make) => tags.add(make.toLowerCase()));
      comp.models?.forEach((model) => tags.add(model.toLowerCase()));
    }
    if (comp.type && comp.type !== "Universal") {
      tags.add(comp.type.toLowerCase());
    }
  }

  if (data.isBundle) tags.add("bundle");
  if (data.isSeasonal) tags.add("seasonal");
  if (data.seasonalCategory) {
    tags.add(data.seasonalCategory.toLowerCase());
  }

  return Array.from(tags).filter((tag) => tag && tag.length > 1);
};

async function migrateCategories() {
  try {
    console.log("Starting migration...");
    const snapshot = await db.collection("products").get();
    const batch = db.batch();
    let count = 0;

    for (const doc of snapshot.docs) {
      const data = doc.data();
      let needsUpdate = false;
      const updateData = {};

      // If category exists and categories doesn't, create categories array
      if (data.category && !data.categories) {
        updateData.categories = [data.category];
        updateData.category = admin.firestore.FieldValue.delete(); // Remove old field
        needsUpdate = true;
      }

      // Regenerate searchTags if categories changed
      if (needsUpdate) {
        const fullData = { ...data, ...updateData };
        updateData.searchTags = generateSearchTags(fullData);
        batch.update(doc.ref, updateData);
        count++;
      }
    }

    if (count > 0) {
      await batch.commit();
      console.log(`Migrated ${count} products.`);
    } else {
      console.log("No products needed migration.");
    }
  } catch (err) {
    console.error("Migration error:", err);
  }
}

migrateCategories();
