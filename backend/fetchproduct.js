const admin = require("firebase-admin");
const fs = require("fs");

admin.initializeApp();
const db = admin.firestore();

async function exportProducts() {
  const snapshot = await db.collection("products").get();
  const products = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  fs.writeFileSync("products.json", JSON.stringify(products, null, 2));

  console.log("products.json exported");
}

exportProducts();
