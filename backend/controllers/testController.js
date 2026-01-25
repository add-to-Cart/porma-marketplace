// testController.js
import admin from "../config/firebaseAdmin.js";
const db = admin.firestore();

export const getUsers = async (req, res) => {
  try {
    const usersRef = db.collection("users");
    const snapshot = await usersRef.get();

    const users = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.status(200).json(users);
  } catch (err) {
    console.error("Fetch Error:", err);
    res
      .status(500)
      .json({ message: "Failed to fetch users", error: err.message });
  }
};

export const getSellers = async (req, res) => {
  try {
    const usersRef = db.collection("sellers");
    const snapshot = await usersRef.get();

    const users = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.status(200).json(users);
  } catch (err) {
    console.error("Fetch Error:", err);
    res
      .status(500)
      .json({ message: "Failed to fetch users", error: err.message });
  }
};

export const getReviews = async (req, res) => {
  try {
    const reviewsRef = db.collection("reviews");
    const snapshot = await reviewsRef.get();

    const users = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.status(200).json(users);
  } catch (err) {
    console.error("Fetch Error:", err);
    res
      .status(500)
      .json({ message: "Failed to fetch users", error: err.message });
  }
};
