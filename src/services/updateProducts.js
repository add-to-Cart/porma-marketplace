import { createRequire } from "module";
import admin from "firebase-admin";

const require = createRequire(import.meta.url);
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

const COMPAT_TEMPLATES = {
  MOTORCYCLE: [
    {
      makes: ["Yamaha"],
      models: ["NMAX 155", "Aerox 155"],
      yearRange: { from: 2020, to: 2026 },
    },
    {
      makes: ["Honda"],
      models: ["Click 125i", "Click 160", "ADV 160", "PCX 160"],
      yearRange: { from: 2021, to: 2026 },
    },
    {
      makes: ["Suzuki"],
      models: ["Raider R150 Fi", "Burgman Street"],
      yearRange: { from: 2019, to: 2025 },
    },
    {
      makes: ["Kawasaki"],
      models: ["Ninja 400", "Z400", "Dominar 400"],
      yearRange: { from: 2018, to: 2025 },
    },
  ],
  CAR: [
    {
      makes: ["Toyota"],
      models: ["Vios", "Hilux", "Fortuner"],
      yearRange: { from: 2016, to: 2024 },
    },
    {
      makes: ["Mitsubishi"],
      models: ["Montero Sport", "Xpander", "Strada"],
      yearRange: { from: 2019, to: 2026 },
    },
    {
      makes: ["Nissan"],
      models: ["Navara", "Terra", "Almera"],
      yearRange: { from: 2020, to: 2025 },
    },
    {
      makes: ["Ford"],
      models: ["Ranger", "Everest"],
      yearRange: { from: 2022, to: 2026 },
    },
  ],
};

async function masterUpdate() {
  console.log("🚀 Starting Master Update for Spare Parts Marketplace...");
  const snapshot = await db.collection("products").get();
  const batch = db.batch();

  snapshot.forEach((doc) => {
    const data = doc.data();
    const type = data.vehicleType;
    let selected;

    // Pick Template
    if (type === "Motorcycle") {
      selected = COMPAT_TEMPLATES.MOTORCYCLE[Math.floor(Math.random() * 4)];
    } else if (type === "Car") {
      selected = COMPAT_TEMPLATES.CAR[Math.floor(Math.random() * 4)];
    } else {
      selected = {
        isUniversalFit: true,
        makes: [],
        models: [],
        yearRange: null,
      };
    }

    // Prepare Tags (Combine existing tags with new vehicle info)
    const existingTags = data.tags || [];
    const vehicleTags = [...selected.makes, ...selected.models].map((t) =>
      t.toLowerCase()
    );
    const combinedTags = [...new Set([...existingTags, ...vehicleTags])]; // Set removes duplicates

    const docRef = db.collection("products").doc(doc.id);

    batch.update(docRef, {
      vehicleCompatibility: {
        type: type || "Universal",
        isUniversalFit: selected.isUniversalFit || false,
        makes: selected.makes,
        models: selected.models,
        yearRange: selected.yearRange,
      },
      tags: combinedTags, // This makes searching for "Vios" or "NMAX" work instantly
    });
  });

  await batch.commit();
  console.log(
    `✅ SUCCESS: ${snapshot.size} products are now fully professional!`
  );
}

masterUpdate().catch(console.error);
