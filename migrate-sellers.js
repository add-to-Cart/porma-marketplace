import admin from "firebase-admin";
import dotenv from "dotenv";

dotenv.config();

// Initialize Firebase Admin
const serviceAccount = {
  type: "service_account",
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL
};

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

async function migrateSellersToSeparateCollection() {
  console.log("Starting seller migration...");

  try {
    // Get all users with seller data
    const usersSnapshot = await db.collection("users").get();
    const batch = db.batch();
    let migratedCount = 0;

    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      const userId = userDoc.id;

      // Check if user has seller data (approved or pending)
      if (userData.role === "seller" && userData.seller) {
        // Approved seller
        const sellerData = {
          id: userId,
          sellerId: userId,
          storeName: userData.seller.storeName,
          storeDescription: userData.seller.storeDescription,
          avatarUrl: userData.seller.avatarUrl || null,
          avatarPublicId: userData.seller.avatarPublicId || null,
          paymentDetails: userData.seller.paymentDetails || {},
          followers: userData.seller.followers || [],
          followersCount: userData.seller.followersCount || 0,
          createdAt: userData.seller.createdAt || userData.createdAt,
          approvedAt: userData.seller.approvedAt || userData.createdAt,
          updatedAt: userData.seller.updatedAt || admin.firestore.FieldValue.serverTimestamp(),
          status: "approved",
          ownerId: userId,
          ownerName: userData.displayName || userData.name || "Unknown",
          ownerEmail: userData.email,
          ownerContact: userData.contact,
          ownerAddress: {
            addressLine: userData.addressLine,
            barangay: userData.barangay,
            city: userData.city,
            province: userData.province,
            zipCode: userData.zipCode
          }
        };

        // Create seller document
        const sellerRef = db.collection("sellers").doc(userId);
        batch.set(sellerRef, sellerData);

        // Update user document to remove seller data (keep only basic user info)
        const updatedUserData = { ...userData };
        delete updatedUserData.seller;
        delete updatedUserData.isSeller;
        if (updatedUserData.sellerApplication) {
          delete updatedUserData.sellerApplication;
        }
        updatedUserData.role = "buyer"; // Reset to buyer since seller data moved
        updatedUserData.updatedAt = admin.firestore.FieldValue.serverTimestamp();

        batch.update(db.collection("users").doc(userId), updatedUserData);

        migratedCount++;
        console.log(`Migrated approved seller: ${userData.seller.storeName} (${userId})`);

      } else if (userData.sellerApplication && userData.sellerApplication.status === "approved") {
        // Pending application that was approved
        const sellerData = {
          id: userId,
          sellerId: userId,
          storeName: userData.sellerApplication.storeName,
          storeDescription: userData.sellerApplication.storeDescription,
          avatarUrl: userData.sellerApplication.avatarUrl || null,
          avatarPublicId: userData.sellerApplication.avatarPublicId || null,
          paymentDetails: userData.sellerApplication.paymentDetails || {},
          followers: [],
          followersCount: 0,
          createdAt: userData.sellerApplication.appliedAt || userData.createdAt,
          approvedAt: userData.sellerApplication.approvedAt || userData.createdAt,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          status: "approved",
          ownerId: userId,
          ownerName: userData.displayName || userData.name || "Unknown",
          ownerEmail: userData.email,
          ownerContact: userData.contact,
          ownerAddress: {
            addressLine: userData.addressLine,
            barangay: userData.barangay,
            city: userData.city,
            province: userData.province,
            zipCode: userData.zipCode
          }
        };

        // Create seller document
        const sellerRef = db.collection("sellers").doc(userId);
        batch.set(sellerRef, sellerData);

        // Update user document
        const updatedUserData = { ...userData };
        delete updatedUserData.sellerApplication;
        delete updatedUserData.isSeller;
        updatedUserData.role = "buyer";
        updatedUserData.updatedAt = admin.firestore.FieldValue.serverTimestamp();

        batch.update(db.collection("users").doc(userId), updatedUserData);

        migratedCount++;
        console.log(`Migrated approved application: ${userData.sellerApplication.storeName} (${userId})`);

      } else if (userData.sellerApplication && userData.sellerApplication.status === "pending") {
        // Pending applications - keep in users for now, but could move to separate collection later
        console.log(`Skipping pending application: ${userData.sellerApplication.storeName} (${userId})`);
      }
    }

    // Commit all changes
    await batch.commit();
    console.log(`Migration completed! Migrated ${migratedCount} sellers.`);

    // Update products to reference sellers collection
    console.log("Updating product references...");
    const productsSnapshot = await db.collection("products").get();
    const productBatch = db.batch();
    let updatedProducts = 0;

    for (const productDoc of productsSnapshot.docs) {
      const productData = productDoc.data();
      if (productData.sellerId) {
        // Check if seller exists in sellers collection
        const sellerDoc = await db.collection("sellers").doc(productData.sellerId).get();
        if (sellerDoc.exists) {
          // Product is good, no changes needed
          console.log(`Product ${productDoc.id} references valid seller ${productData.sellerId}`);
        } else {
          console.log(`Product ${productDoc.id} references non-existent seller ${productData.sellerId}`);
        }
      }
      updatedProducts++;
    }

    console.log(`Checked ${updatedProducts} products.`);

  } catch (error) {
    console.error("Migration failed:", error);
  }
}

// Run the migration
migrateSellersToSeparateCollection()
  .then(() => {
    console.log("Migration script completed.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Migration script failed:", error);
    process.exit(1);
  });</content>
<parameter name="filePath">c:\Users\Melvin\Documents\porma-marketplace\migrate-sellers.js