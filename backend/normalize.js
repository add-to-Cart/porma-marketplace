import admin from "./config/firebaseAdmin.js";

const db = admin.firestore();

async function redistributeProducts() {
  try {
    console.log("--- Nagsisimula na ang distribution ---");

    // 2. Kunin ang lahat ng Sellers
    const sellersSnapshot = await db.collection("sellers").get();
    const sellers = [];
    sellersSnapshot.forEach((doc) => {
      sellers.push({ id: doc.id, ...doc.data() });
    });

    if (sellers.length === 0) {
      console.error("Error: Walang nahanap na sellers sa database.");
      return;
    }
    console.log(`Nahanap: ${sellers.length} sellers.`);

    // 3. Kunin ang lahat ng Products
    const productsSnapshot = await db.collection("products").get();
    console.log(`Nahanap: ${productsSnapshot.size} products.`);

    // 4. Batch Processing (Limit ng Firestore ang 500 operations per batch)
    let batch = db.batch();
    let count = 0;
    let totalUpdated = 0;

    productsSnapshot.forEach((doc) => {
      // Pumili ng random seller
      const randomSeller = sellers[Math.floor(Math.random() * sellers.length)];

      const productRef = db.collection("products").doc(doc.id);

      // I-update ang sellerId at storeName
      batch.update(productRef, {
        sellerId: randomSeller.sellerId || randomSeller.id,
        storeName: randomSeller.storeName || "Unknown Store",
      });

      count++;
      totalUpdated++;

      // Kapag umabot ng 500, i-commit at gumawa ng bagong batch
      if (count === 500) {
        batch.commit();
        batch = db.batch();
        count = 0;
      }
    });

    // I-commit ang natitirang updates
    if (count > 0) {
      await batch.commit();
    }

    console.log(
      `✅ Tapos na! Na-distribute ang ${totalUpdated} products sa ${sellers.length} sellers.`,
    );
  } catch (error) {
    console.error("May error sa pag-distribute:", error);
  } finally {
    process.exit();
  }
}

redistributeProducts();
