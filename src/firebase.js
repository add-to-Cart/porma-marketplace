import { initializeApp } from "firebase/app";

import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD2Ew5_pJqxqVDyMMxoQznLc-20-zQoKGA",
  authDomain: "porma-online-marketplace.firebaseapp.com",
  projectId: "porma-online-marketplace",
  storageBucket: "porma-online-marketplace.firebasestorage.app",
  messagingSenderId: "267007126500",
  appId: "1:267007126500:web:fcb649cf7b1debb7cf75f1",
  measurementId: "G-10ZWSWFGMN",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
