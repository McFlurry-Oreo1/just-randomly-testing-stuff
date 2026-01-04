import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore, doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC-b0PoKwCCFg3XHojeTjLuceIe6GXIBws",
  authDomain: "portapoty-a00be.firebaseapp.com",
  projectId: "portapoty-a00be",
  storageBucket: "portapoty-a00be.firebasestorage.app",
  messagingSenderId: "950240424602",
  appId: "1:950240424602:web:c4628c2e083b1b0f8d2523",
  measurementId: "G-DNEVB4NBRY"
};

const app = initializeApp(firebaseConfig);
const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;
const db = getFirestore(app);

export { app, analytics, db, doc, getDoc, setDoc, onSnapshot };
