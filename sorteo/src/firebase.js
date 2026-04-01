import { initializeApp } from "firebase/app";
import * as realDatabase from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyCnMHXRveIjKKSKdPSq9fRvfTk3vd7iU4Q",
  authDomain: "sorteo-camino-emprendedor.firebaseapp.com",
  databaseURL: "https://sorteo-camino-emprendedor-default-rtdb.firebaseio.com/",
  projectId: "sorteo-camino-emprendedor",
  storageBucket: "sorteo-camino-emprendedor.firebasestorage.app",
  messagingSenderId: "216513630830",
  appId: "1:216513630830:web:be5ece8badf2fb33544c7f"
};

// Inicializamos la App
const app = initializeApp(firebaseConfig);
const realDb = realDatabase.getDatabase(app);

// Exportamos las funciones reales
export const db = realDb;
export const ref = realDatabase.ref;
export const onValue = realDatabase.onValue;
export const push = realDatabase.push;
export const set = realDatabase.set;
export const update = realDatabase.update;
export const runTransaction = realDatabase.runTransaction;
