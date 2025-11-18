import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, setPersistence, browserLocalPersistence, RecaptchaVerifier } from "firebase/auth";
import { getFirestore } from "firebase/firestore";


const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "parkpulse-844aa.firebaseapp.com",
  projectId: "parkpulse-844aa",
  storageBucket: "parkpulse-844aa.firebasestorage.app",
  messagingSenderId: "740671046406",
  appId: "1:740671046406:web:cf2a940a8505e88f405487",
  measurementId: "G-L2E0P83TZD"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Set persistence to local to keep user signed in
setPersistence(auth, browserLocalPersistence)
  .catch((error) => {
    console.error("Error setting auth persistence:", error);
  });

export const googleProvider = new GoogleAuthProvider();
export { RecaptchaVerifier };