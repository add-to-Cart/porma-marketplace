import admin from "./config/firebaseAdmin.js";
import dotenv from "dotenv";

dotenv.config();

const db = admin.firestore();

async function migrateGoogleUsers() {
  console.log("Starting Google users avatar migration...");

  try {
    // Get all users with Google provider
    const usersRef = db.collection("users");
    const snapshot = await usersRef.where("provider", "==", "google").get();

    if (snapshot.empty) {
      console.log("No Google users found to migrate.");
      return;
    }

    let migratedCount = 0;

    for (const doc of snapshot.docs) {
      const userData = doc.data();
      const userId = doc.id;

      // If user has photoURL but no googlePhotoURL, set googlePhotoURL
      if (userData.photoURL && !userData.googlePhotoURL) {
        await usersRef.doc(userId).update({
          googlePhotoURL: userData.photoURL,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        migratedCount++;
        console.log(`Migrated user: ${userId}`);
      }
    }

    console.log(`Migration completed! Migrated ${migratedCount} Google users.`);
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    process.exit(0);
  }
}

// Run the migration
migrateGoogleUsers();
