import admin from "./config/firebaseAdmin.js";
import fs from "fs";

const db = admin.firestore();

async function exportCollection() {
  try {
    console.log("Fetching data from /products...");
    const snapshot = await db.collection("products").get();

    if (snapshot.empty) {
      console.log("No products found.");
      return;
    }

    const products = [];
    snapshot.forEach((doc) => {
      // Include the document ID and all its data
      products.push({ id: doc.id, ...doc.data() });
    });

    // 2. Convert to JSON and save
    const jsonContent = JSON.stringify(products, null, 2);
    fs.writeFileSync("products_export.json", jsonContent, "utf8");

    console.log(
      `Successfully exported ${products.length} products to products_export.json`,
    );
  } catch (error) {
    console.error("Error exporting collection:", error);
  } finally {
    process.exit();
  }
}

exportCollection();
