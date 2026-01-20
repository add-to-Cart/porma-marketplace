import admin from "./config/firebaseAdmin.js";
const db = admin.firestore();

async function fetchAllSellers() {
  try {
    const sellersSnapshot = await db.collection("sellers").get();
    const sellers = [];
    sellersSnapshot.forEach((doc) => {
      sellers.push({ id: doc.id, ...doc.data() });
    });
    console.log(`Fetched ${sellers.length} sellers`);
    return sellers;
  } catch (error) {
    console.error("Error fetching sellers:", error);
    throw error;
  }
}

async function fetchAllProducts() {
  try {
    const productsSnapshot = await db.collection("products").get();
    const products = [];
    productsSnapshot.forEach((doc) => {
      products.push({ id: doc.id, ...doc.data() });
    });
    console.log(`Fetched ${products.length} products`);
    return products;
  } catch (error) {
    console.error("Error fetching products:", error);
    throw error;
  }
}

async function updateProductsWithOwners(products, sellers) {
  console.log(`Found ${sellers.length} sellers`);

  if (sellers.length === 0) {
    console.log("No sellers found. Cannot assign owners.");
    return;
  }

  const batch = db.batch();
  let updateCount = 0;

  products.forEach((product, index) => {
    let ownerUid = product.sellerId || product.owner;
    let storeName = product.storeName;

    if (!ownerUid) {
      // Assign to a random seller
      const randomSeller = sellers[index % sellers.length];
      ownerUid = randomSeller.id; // sellers id is the uid
    }

    // Find the seller for this ownerUid
    const seller = sellers.find((s) => s.id === ownerUid);

    if (seller) {
      // Use the seller's storeName if available
      if (!storeName && seller.storeName) {
        storeName = seller.storeName;
      }

      // Update the product
      batch.update(db.collection("products").doc(product.id), {
        owner: ownerUid,
        storeName: storeName,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      updateCount++;
    } else {
      console.log(
        `No seller found for ownerUid: ${ownerUid} on product ${product.id}`,
      );
    }
  });

  if (updateCount > 0) {
    await batch.commit();
    console.log(
      `Successfully updated ${updateCount} products with owners and storeNames`,
    );
  } else {
    console.log("No products needed updating");
  }
}

async function main() {
  try {
    console.log("Starting data synchronization...");

    const sellers = await fetchAllSellers();
    const products = await fetchAllProducts();

    await updateProductsWithOwners(products, sellers);

    console.log("Data synchronization completed successfully!");
  } catch (error) {
    console.error("Error in main:", error);
  }
}

main().catch(console.error);
