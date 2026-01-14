import admin from "./config/firebaseAdmin.js";
const db = admin.firestore();

// 1. Pool of names to cycle through
const storeNamesPool = [
  "Vanguard Auto Parts",
  "Midnight Moto",
  "Zenith Performance",
  "Alpha Drive Gear",
  "Titanium Tracks",
  "Elite Rider Supply",
  "Street Vision Lights",
  "Piston & Polish",
  "Apex Offroad",
  "Velocity Customs",
  "Nomad Moto Gear",
  "Iron Horse Hub",
  "Circuit Spark Electronics",
  "Shield Pro Protection",
  "Grand Prix Garage",
  "Urban Commuter Tools",
  "HyperDrive Accessories",
  "Fortress Body Parts",
  "ShiftLine Performance",
  "Nova Vehicle Tech",
];

async function fillMissingStoreNames() {
  const collectionRef = db.collection("products"); // Change 'products' to your actual collection name
  const snapshot = await collectionRef.get();

  const batch = db.batch();
  let namesIndex = 0;
  let updateCount = 0;

  snapshot.forEach((doc) => {
    const data = doc.data();

    // Check if storeName is missing or empty
    if (!data.storeName || data.storeName.trim() === "") {
      const randomName = storeNamesPool[namesIndex % storeNamesPool.length];

      batch.update(doc.ref, { storeName: randomName });

      namesIndex++;
      updateCount++;
    }
  });

  if (updateCount > 0) {
    await batch.commit();
    console.log(`Successfully updated ${updateCount} documents in Firestore!`);
  } else {
    console.log("No missing storeNames found.");
  }
}

fillMissingStoreNames().catch(console.error);
