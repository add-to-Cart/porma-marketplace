// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyD2Ew5_pJqxqVDyMMxoQznLc-20-zQoKGA",
  authDomain: "porma-online-marketplace.firebaseapp.com",
  projectId: "porma-online-marketplace",
  storageBucket: "porma-online-marketplace.firebasestorage.app",
  messagingSenderId: "267007126500",
  appId: "1:267007126500:web:fcb649cf7b1debb7cf75f1",
  measurementId: "G-10ZWSWFGMN",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
