import admin from "./config/firebaseAdmin.js";
const db = admin.firestore();

// Two designated seller IDs (document IDs in `sellers` collection)
const SELLER_IDS = [
  "7w3cl2PwOZaPEMz7VZQGtcLZUwR2",
  "ClCriXvcK2hqsBOrylHXJQawsjn1",
];

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function fetchSellerStoreNames(ids) {
  const map = {};
  for (const id of ids) {
    try {
      const snap = await db.collection("sellers").doc(id).get();
      if (snap.exists) {
        map[id] = snap.data().storeName || null;
      } else {
        map[id] = null;
        console.warn(`Seller doc not found for id: ${id}`);
      }
    } catch (err) {
      console.error(`Error fetching seller ${id}:`, err);
      map[id] = null;
    }
  }
  return map;
}

// Force assign when either storeName missing OR owner not one of SELLER_IDS
async function forceAssign() {
  try {
    console.log("Fetching designated sellers...");
    const sellerNames = await fetchSellerStoreNames(SELLER_IDS);

    console.log("Fetching products...");
    const productsSnap = await db.collection("products").get();

    if (productsSnap.empty) {
      console.log("No products found.");
      return;
    }

    let updates = 0;
    let batch = db.batch();
    let opCount = 0;

    for (const doc of productsSnap.docs) {
      const p = { id: doc.id, ...doc.data() };

      const hasStoreName =
        p.storeName &&
        typeof p.storeName === "string" &&
        p.storeName.trim() !== "";
      const ownerIsDesignated = SELLER_IDS.includes(p.owner);

      // Condition: missing storeName OR owner not one of the designated two
      if (hasStoreName && ownerIsDesignated) continue;

      const chosen = pickRandom(SELLER_IDS);
      const storeName = sellerNames[chosen] || `Store-${chosen.slice(0, 8)}`;

      const ref = db.collection("products").doc(p.id);
      batch.update(ref, {
        storeName,
        owner: chosen,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      opCount++;
      updates++;

      if (opCount >= 450) {
        await batch.commit();
        batch = db.batch();
        opCount = 0;
        console.log("Committed a batch of 450 updates...");
      }
    }

    if (opCount > 0) {
      await batch.commit();
      console.log("Committed final batch of updates.");
    }

    console.log(`Completed. Total products updated: ${updates}`);
  } catch (error) {
    console.error("forceAssign error:", error);
  }
}

forceAssign().catch((e) => {
  console.error(e);
  process.exit(1);
});
