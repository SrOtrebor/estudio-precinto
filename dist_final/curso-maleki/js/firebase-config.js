// CONFIGURACIÓN REAL DE FIREBASE (Academia Maleki)
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyBbNuZA3YeWK-1f5tKhZNCcOs38cq6WzIA",
  authDomain: "academia-maleki.firebaseapp.com",
  databaseURL: "https://academia-maleki-default-rtdb.firebaseio.com",
  projectId: "academia-maleki",
  storageBucket: "academia-maleki.firebasestorage.app",
  messagingSenderId: "1013762450283",
  appId: "1:1013762450283:web:3f03b5eaa6032ac01da22e"
};

// Discord OAuth2 — Registra tu app en https://discord.com/developers/applications
const DISCORD_CONFIG = {
  clientId: "1501427642254233650",
  redirectUri: window.location.origin + window.location.pathname.replace(/\/[^\/]*$/, "/dashboard.html"),
  scope: "identify email",
  guildId: "1487916867980103793",
  roles: {
    iniciado: "1501431642332598353",
    erudito:  "1501432472678830091",
    maestro:  "1501432697502044171"
  },
  // Webhook de Make/Zapier (rellena solo si NO usas bot directo)
  webhookUrl: ""
};
