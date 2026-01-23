import admin from "./config/firebaseAdmin.js";
const db = admin.firestore();

function generateMetrics() {
  const ratingsCount = Math.floor(Math.random() * 45) + 5; // 5 to 50 ratings
  const ratings = Array.from(
    { length: ratingsCount },
    () => Math.floor(Math.random() * 5) + 1,
  );
  const ratingAverage = parseFloat(
    (ratings.reduce((a, b) => a + b, 0) / ratingsCount).toFixed(1),
  );

  const viewCount = Math.floor(Math.random() * 800) + 100; // 100 to 900 views
  const soldCount = Math.floor(Math.random() * (viewCount * 0.3)); // Realistic 30% max conversion

  return { ratings, ratingsCount, ratingAverage, viewCount, soldCount };
}

async function normalizeProducts() {
  const productsRef = db.collection("products");
  const snapshot = await productsRef.get();

  if (snapshot.empty) {
    console.log("No products found.");
    return;
  }

  const batch = db.batch();

  snapshot.forEach((doc) => {
    const data = doc.data();
    const docRef = productsRef.doc(doc.id);

    // 1. Normalization Logic
    let category = data.category || "Uncategorized";
    let isBundle = !!data.isBundle; // Ensure boolean

    // If identified by category or previous flag, standardize
    if (category === "Bundles" || isBundle) {
      category = "Bundles";
      isBundle = true;
    }

    // Convert bundleContents string to array if it exists as a string
    let bundleContents = data.bundleContents || [];
    if (typeof bundleContents === "string") {
      bundleContents = bundleContents.split(",").map((item) => item.trim());
    }

    // 2. Populate Metrics
    const metrics = generateMetrics();

    // 3. Prepare Update
    const updateData = {
      category,
      isBundle,
      bundleContents,
      ...metrics,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    batch.update(docRef, updateData);
    console.log(`Prepared update for: ${data.name || doc.id}`);
  });

  // Commit changes
  await batch.commit();
  console.log("Successfully normalized and populated all products!");
}

normalizeProducts().catch(console.error);
