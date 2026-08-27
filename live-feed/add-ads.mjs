import { initializeApp } from "firebase/app";
import { getDatabase, ref, set } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyBTG6GS4_e1XCM7rSkRwpPc16Pw5FPhrwM",
  authDomain: "live-feed-precinto.firebaseapp.com",
  databaseURL: "https://live-feed-precinto-default-rtdb.firebaseio.com/",
  projectId: "live-feed-precinto",
  storageBucket: "live-feed-precinto.firebasestorage.app",
  messagingSenderId: "1043656710407",
  appId: "1:1043656710407:web:cd4691fb9bba3c9bbe0da2",
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const EVENT_ID = "troncal";

const ads = [
  {
    id: "ad-video-1",
    imageUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
    isTest: true
  },
  {
    id: "ad-image-1",
    imageUrl: "https://picsum.photos/seed/sponsor1/1920/1080",
    isTest: true
  },
  {
    id: "ad-image-2",
    imageUrl: "https://picsum.photos/seed/sponsor2/1920/1080",
    isTest: true
  }
];

async function addAds() {
  console.log(`Cargando publicidades falsas al evento ${EVENT_ID}...`);
  for (const ad of ads) {
    await set(ref(db, `livefeed/${EVENT_ID}/ads/${ad.id}`), ad);
    console.log(`- Cargado: ${ad.id} (${ad.imageUrl})`);
  }
  console.log("¡Publicidades cargadas!");
  process.exit(0);
}

addAds();
