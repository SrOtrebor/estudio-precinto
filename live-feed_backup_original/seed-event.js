/**
 * seed-event.js — Crea un evento de prueba en Firebase Realtime Database
 * Uso: node seed-event.js
 */
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

const EVENT_ID = "test-event";

const eventConfig = {
  eventName: "Evento de Prueba 🎉",
  tagline: "¡Sacá fotos y aparecé en la pantalla!",
  adminPassword: "precinto2024",
  autoApprove: true,          // true = las fotos aparecen directo en pantalla
  tier: "premium",            // basic | premium | corporativo
  accentColor: "#a28a68",
  watermarkUrl: null,         // null = usa watermark por defecto
  slideIntervalSeconds: 6,
  logoUrl: null,
  bannerUrls: [],
  createdAt: Date.now(),
};

console.log(`\n📡 Conectando a Firebase...`);
console.log(`📋 Creando evento: "${eventConfig.eventName}" (ID: ${EVENT_ID})\n`);

set(ref(db, `livefeed/${EVENT_ID}/config`), eventConfig)
  .then(() => {
    console.log("✅ Evento creado exitosamente!\n");
    console.log("─────────────────────────────────────────");
    console.log("🔗 URLs para probar:");
    console.log(`   📱 Invitado:    http://localhost:5173/#/foto/${EVENT_ID}`);
    console.log(`   📺 Monitor:     http://localhost:5173/#/monitor/${EVENT_ID}`);
    console.log(`   🎛️  Moderación:  http://localhost:5173/#/moderar/${EVENT_ID}`);
    console.log(`   🖼️  Galería:     http://localhost:5173/#/galeria/${EVENT_ID}`);
    console.log("─────────────────────────────────────────");
    console.log(`\n🔑 Contraseña del panel de moderación: precinto2024`);
    console.log(`\n💡 Para cambiar a moderación MANUAL, editá autoApprove: false en este script\n`);
    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ Error al crear el evento:", err.message);
    console.error("\n💡 Asegurate de haber creado la Realtime Database en modo 'prueba'");
    process.exit(1);
  });
