
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCn25UBlxwIpEoZ2F1KOxx7C9oLIK-ozzo",
  authDomain: "reclaimdb.firebaseapp.com",
  projectId: "reclaimdb",
  storageBucket: "reclaimdb.firebasestorage.app",
  messagingSenderId: "354394594985",
  appId: "1:354394594985:web:89cf7eb0e4a86dbed993b8",
  measurementId: "G-6FW0PNB3PL"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };
