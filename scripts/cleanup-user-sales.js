import admin from "../backend/config/firebaseAdmin.js";

(async function cleanup() {
  try {
    await admin.initializeApp();
  } catch (e) {
    // already initialized in some envs
  }
  const db = admin.firestore();
  console.log("Scanning user documents for sales fields...");
  const snapshot = await db.collection("users").get();
  let changed = 0;
  for (const doc of snapshot.docs) {
    const data = doc.data();
    const updates = {};
    if ("totalSales" in data)
      updates["totalSales"] = admin.firestore.FieldValue.delete();
    if ("sales" in data) updates["sales"] = admin.firestore.FieldValue.delete();
    if ("totalRevenue" in data)
      updates["totalRevenue"] = admin.firestore.FieldValue.delete();
    if (Object.keys(updates).length > 0) {
      updates.updatedAt = admin.firestore.FieldValue.serverTimestamp();
      await db.collection("users").doc(doc.id).update(updates);
      changed += 1;
      console.log(`Cleaned ${doc.id}`);
    }
  }
  console.log(`Done. Cleared sales fields on ${changed} user docs.`);
  process.exit(0);
})();
