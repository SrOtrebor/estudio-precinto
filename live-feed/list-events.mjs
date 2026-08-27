import { initializeApp } from "firebase/app";
import { getDatabase, ref, get } from "firebase/database";

const app = initializeApp({
  databaseURL: "https://live-feed-precinto-default-rtdb.firebaseio.com/"
});
const db = getDatabase(app);

get(ref(db, "livefeed")).then(snap => {
  if (snap.exists()) {
    console.log("Eventos disponibles:", Object.keys(snap.val()));
  } else {
    console.log("No hay eventos en la base de datos.");
  }
  process.exit(0);
});
