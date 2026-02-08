import admin from "firebase-admin";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.join(__dirname, "../.env");

dotenv.config({ path: envPath });

if (!admin.apps.length) {
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  if (!privateKey) {
    console.warn("[WARNING] FIREBASE_PRIVATE_KEY not set in .env file. Skipping Firebase initialization for dev mode.");
  } else {
    try {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: privateKey.replace(/\\n/g, "\n"),
        }),
      });
      console.log("[SUCCESS] Firebase Admin SDK initialized");
    } catch (error) {
      console.warn("[WARNING] Failed to initialize Firebase Admin SDK:", error.message);
    }
  }
}

export default admin;
