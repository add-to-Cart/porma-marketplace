import { createRequire } from "module";
import admin from "firebase-admin";

const require = createRequire(import.meta.url);
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

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

async function previewUpdates() {
  console.log("🚀 Starting DRY RUN (No data will be changed)...\n");

  const snapshot = await db.collection("products").get();

  snapshot.forEach((doc) => {
    const data = doc.data();
    const type = data.vehicleType;
    let selected;

    // Logic to pick a template based on your existing vehicleType field
    if (type === "Motorcycle") {
      selected =
        COMPAT_TEMPLATES.MOTORCYCLE[
          Math.floor(Math.random() * COMPAT_TEMPLATES.MOTORCYCLE.length)
        ];
    } else if (type === "Car") {
      selected =
        COMPAT_TEMPLATES.CAR[
          Math.floor(Math.random() * COMPAT_TEMPLATES.CAR.length)
        ];
    } else {
      selected = {
        isUniversalFit: true,
        makes: ["Universal"],
        models: ["All"],
      };
    }

    // This prints the preview to your terminal
    console.log(`[PREVIEW] Product: ${data.name}`);
    console.log(`      Type: ${type}`);
    console.log(
      `      Will Fit: ${selected.makes.join(", ")} (${selected.models.join(
        ", "
      )})`
    );
    console.log(
      `      Years: ${
        selected.yearRange
          ? selected.yearRange.from + "-" + selected.yearRange.to
          : "N/A"
      }`
    );
    console.log("--------------------------------------------------");
  });

  console.log(`\n✅ Dry run complete for ${snapshot.size} products.`);
  console.log(
    "If the above looks good, let me know and I'll give you the 'Commit' command!"
  );
}

previewUpdates().catch(console.error);
