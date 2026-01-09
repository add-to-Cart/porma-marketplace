import { collection, getDocs } from "firebase/firestore";
import { db } from "@/firebase";

export const countProducts = async () => {
  const snapshot = await getDocs(collection(db, "products"));
  return snapshot.size;
};
