import admin from "./config/firebaseAdmin.js";
const db = admin.firestore();

// Helper to generate comprehensive search tags with fuzzy prefixes
const generateSearchTags = (data) => {
  const tags = new Set();

  const addPrefixes = (word) => {
    if (word.length > 2) {
      // Only for words longer than 2 chars
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

  if (data.category) tags.add(data.category.toLowerCase());

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

// Script to update searchTags for all existing products
const updateAllSearchTags = async () => {
  try {
    console.log("Starting searchTags update...");

    const snapshot = await db.collection("products").get();
    const batch = db.batch();
    let count = 0;

    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      const newTags = generateSearchTags(data);

      if (JSON.stringify(newTags) !== JSON.stringify(data.searchTags || [])) {
        batch.update(doc.ref, { searchTags: newTags });
        count++;
      }
    });

    if (count > 0) {
      await batch.commit();
      console.log(`Updated searchTags for ${count} products`);
    } else {
      console.log("No products needed updating");
    }

    console.log("SearchTags update completed");
  } catch (error) {
    console.error("Error updating searchTags:", error);
  }
};

// Run the update
updateAllSearchTags().then(() => process.exit(0));
