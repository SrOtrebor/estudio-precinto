import { initializeApp, getApps, getApp } from "firebase/app";
import { getDatabase, ref, onValue, push, set, update, get, remove } from "firebase/database";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBTG6GS4_e1XCM7rSkRwpPc16Pw5FPhrwM",
  authDomain: "live-feed-precinto.firebaseapp.com",
  databaseURL: "https://live-feed-precinto-default-rtdb.firebaseio.com/",
  projectId: "live-feed-precinto",
  storageBucket: "live-feed-precinto.firebasestorage.app",
  messagingSenderId: "1043656710407",
  appId: "1:1043656710407:web:cd4691fb9bba3c9bbe0da2",
  measurementId: "G-2HB0SVZGM9"
};

// Singleton seguro para Vite HMR — evita "duplicate-app"
let app;
try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
} catch {
  app = getApp();
}

const db = getDatabase(app);
const storage = getStorage(app);

// Realtime Database
export { db, ref, onValue, push, set, update, get, remove };

// Storage
export { storage, storageRef, uploadBytes, getDownloadURL, deleteObject };
