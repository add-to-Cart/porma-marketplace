import admin from "./config/firebaseAdmin.js";

const db = admin.firestore();

async function updateAllProducts() {
  const newSellerId = "fDSlXKB8YISZem0VV20EXOgrgBG3";
  const newStoreName = "CorsairPH";

  // Replace 'products' with your actual collection name if different
  const productsRef = db.collection("products");

  try {
    const snapshot = await productsRef.get();

    if (snapshot.empty) {
      console.log("No matching documents found.");
      return;
    }

    // Use a Firestore Batch to perform multiple updates efficiently
    const batch = db.batch();

    snapshot.docs.forEach((doc) => {
      const docRef = productsRef.doc(doc.id);
      batch.update(docRef, {
        sellerId: newSellerId,
        storeName: newStoreName,
      });
    });

    await batch.commit();
    console.log(`Successfully updated ${snapshot.size} products.`);
  } catch (error) {
    console.error("Error updating documents: ", error);
  }
}

updateAllProducts();
