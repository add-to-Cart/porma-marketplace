import { collection, getDocs } from "firebase/firestore";
import { db } from "@/firebase";

export const getProducts = async () => {
  try {
    const snapshot = await getDocs(collection(db, "products"));
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (err) {
    console.error("Error fetching products:", err);
    return [];
  }
};
