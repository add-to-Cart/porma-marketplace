import admin from "./config/firebaseAdmin.js";

import fs from "fs";

const db = admin.firestore();

async function exportCollection(collectionName) {
  try {
    console.log(`🚀 Starting export from collection: ${collectionName}...`);
    const snapshot = await db.collection(collectionName).get();

    if (snapshot.empty) {
      console.log("No documents found.");
      return;
    }

    const data = [];
    snapshot.forEach((doc) => {
      // We include the document ID in the object for better utility
      data.push({ id: doc.id, ...doc.data() });
    });

    // 2. Write to JSON file
    const fileName = `${collectionName}_export.json`;
    fs.writeFileSync(fileName, JSON.stringify(data, null, 2));

    console.log(`✅ Success! Exported ${data.length} documents to ${fileName}`);
  } catch (error) {
    console.error("❌ Error exporting collection:", error);
  }
}

// Replace 'users' with your specific collection name if different
exportCollection("users");
