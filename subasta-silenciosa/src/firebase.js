import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, set, update, get, runTransaction, query, limitToLast, orderByKey } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyD6BmFPUdE_trSnWve8P6g-lRQ8YdjqWM8",
  authDomain: "subasta-silenciosa-1b5ac.firebaseapp.com",
  projectId: "subasta-silenciosa-1b5ac",
  storageBucket: "subasta-silenciosa-1b5ac.firebasestorage.app",
  messagingSenderId: "60216359524",
  appId: "1:60216359524:web:bc45ae340a39dbe0e23d71"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export { db, ref, onValue, set, update, get, runTransaction, query, limitToLast, orderByKey };
