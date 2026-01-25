import admin from "./config/firebaseAdmin.js";

const db = admin.firestore();

async function migrateSellersToCollection() {
  const usersRef = db.collection("users");
  const sellersRef = db.collection("sellers");

  try {
    console.log("Fetching approved sellers...");
    const snapshot = await usersRef
      .where("role", "==", "seller")
      .where("sellerApplication.status", "==", "approved")
      .get();

    if (snapshot.empty) {
      console.log("No approved sellers found.");
      return;
    }

    let batch = db.batch();
    let count = 0;
    let totalMigrated = 0;

    console.log(`Processing ${snapshot.size} approved sellers...`);

    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      const sellerId = doc.id;
      const storeName =
        data.seller?.storeName || data.sellerApplication?.storeName;

      if (storeName) {
        const sellerDocRef = sellersRef.doc(sellerId);

        batch.set(sellerDocRef, {
          sellerId: sellerId,
          storeName: storeName,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        count++;
        totalMigrated++;
      }

      // Firestore allows up to 500 operations per batch
      if (count === 499) {
        batch.commit();
        batch = db.batch();
        count = 0;
        console.log(`...committed batch. Total migrated: ${totalMigrated}`);
      }
    });

    // Commit any remaining operations
    if (count > 0) {
      await batch.commit();
    }

    console.log(
      `✅ Success! Migrated ${totalMigrated} sellers to sellers collection.`,
    );
  } catch (error) {
    console.error("❌ Error during seller migration:", error);
  }
}

async function renameBasePriceToPrice() {
  const collectionRef = db.collection("products");

  try {
    console.log("Fetching products...");
    const snapshot = await collectionRef.get();

    if (snapshot.empty) {
      console.log("No products found.");
      return;
    }

    let batch = db.batch();
    let count = 0;
    let totalUpdated = 0;

    console.log(`Processing ${snapshot.size} documents...`);

    snapshot.docs.forEach((doc) => {
      const data = doc.data();

      // Check if basePrice exists in the document
      if (data.hasOwnProperty("basePrice")) {
        const docRef = collectionRef.doc(doc.id);

        batch.update(docRef, {
          price: data.basePrice, // Create the new 'price' field
          basePrice: admin.firestore.FieldValue.delete(), // Delete the old 'basePrice' field
        });

        count++;
        totalUpdated++;
      }

      // Firestore allows up to 500 operations per batch
      if (count === 499) {
        batch.commit();
        batch = db.batch();
        count = 0;
        console.log(`...committed batch. Total updated: ${totalUpdated}`);
      }
    });

    // Commit any remaining operations
    if (count > 0) {
      await batch.commit();
    }

    console.log(`✅ Success! Renamed fields in ${totalUpdated} products.`);
  } catch (error) {
    console.error("❌ Error during migration:", error);
  }
}

// Run the migrations
// renameBasePriceToPrice();
migrateSellersToCollection();
