import admin from "firebase-admin";
import dotenv from "dotenv";

dotenv.config();

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    }),
  });
}

const db = admin.firestore();

async function migrateSellers() {
  console.log("Starting seller migration...");

  try {
    // Get all users with seller data
    const usersRef = db.collection("users");
    const snapshot = await usersRef.where("role", "==", "seller").get();

    if (snapshot.empty) {
      console.log("No sellers found to migrate.");
      return;
    }

    const batch = db.batch();
    let migratedCount = 0;

    snapshot.forEach((doc) => {
      const userData = doc.data();
      const userId = doc.id;

      if (userData.seller) {
        // Create seller document in sellers collection
        const sellerRef = db.collection("sellers").doc(userId);

        const sellerData = {
          userId: userId,
          storeName:
            userData.seller.storeName ||
            userData.displayName ||
            "Unknown Store",
          ownerName:
            userData.seller.ownerName ||
            userData.displayName ||
            "Unknown Owner",
          avatarUrl: userData.seller.avatarUrl || null,
          qrCodeUrl: userData.seller.qrCodeUrl || null,
          paymentDetails: userData.seller.paymentDetails || null,
          createdAt:
            userData.seller.createdAt ||
            admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        batch.set(sellerRef, sellerData);
        migratedCount++;

        console.log(`Migrating seller: ${userId} - ${sellerData.storeName}`);
      }
    });

    // Commit the batch
    await batch.commit();

    console.log(`Migration completed! Migrated ${migratedCount} sellers.`);

    // Optional: Remove seller data from users collection (uncomment if desired)
    // console.log('Removing seller data from users collection...');
    // const removeBatch = db.batch();
    // snapshot.forEach((doc) => {
    //   const userRef = usersRef.doc(doc.id);
    //   removeBatch.update(userRef, {
    //     seller: admin.firestore.FieldValue.delete(),
    //     updatedAt: admin.firestore.FieldValue.serverTimestamp()
    //   });
    // });
    // await removeBatch.commit();
    // console.log('Seller data removed from users collection.');
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    // Close the Firebase app
    admin.app().delete();
  }
}

// Run the migration
migrateSellers();
