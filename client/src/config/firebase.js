// Firebase client configuration
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { initializeFirestore, persistentLocalCache } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD2Ew5_pJqxqVDyMMxoQznLc-20-zQoKGA",
  authDomain: "porma-online-marketplace.firebaseapp.com",
  projectId: "porma-online-marketplace",
  storageBucket: "porma-online-marketplace.firebasestorage.app",
  messagingSenderId: "267007126500",
  appId: "1:267007126500:web:fcb649cf7b1debb7cf75f1",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore with offline persistence
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache(),
});

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: "select_account",
});

export default app;
