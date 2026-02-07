import "dotenv/config";
import admin from "./config/firebaseAdmin.js";
import bcrypt from "bcryptjs";

const firestore = admin.firestore();

async function createAdmin(username, password) {
  const passwordHash = await bcrypt.hash(password, 10);
  await firestore.collection("admins").add({
    username,
    passwordHash,
    role: "admin",
  });
  console.log("Custom admin created:", username);
}

createAdmin("admin", "admin123")
  .then(() => console.log("Done"))
  .catch(console.error);
