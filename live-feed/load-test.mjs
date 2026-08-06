/**
 * load-test.mjs — Prueba de carga Live Feed
 * Simula 500 usuarios concurrentes con acciones mixtas realistas.
 * 
 * Uso:
 *   node load-test.mjs [--event EVENT_ID] [--users 500] [--clean]
 * 
 * Flags:
 *   --event   ID del evento en Firebase (default: latroncal)
 *   --users   Cantidad de usuarios simulados (default: 500)
 *   --clean   Elimina todos los datos [TEST] del evento al finalizar
 */

import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, push, get, remove } from "firebase/database";

// ── Config ─────────────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyBTG6GS4_e1XCM7rSkRwpPc16Pw5FPhrwM",
  authDomain: "live-feed-precinto.firebaseapp.com",
  databaseURL: "https://live-feed-precinto-default-rtdb.firebaseio.com/",
  projectId: "live-feed-precinto",
  storageBucket: "live-feed-precinto.firebasestorage.app",
  messagingSenderId: "1043656710407",
  appId: "1:1043656710407:web:cd4691fb9bba3c9bbe0da2",
};

// ── Argumentos CLI ──────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const getArg = (flag, def) => {
  const i = args.indexOf(flag);
  return i !== -1 && args[i + 1] ? args[i + 1] : def;
};
const EVENT_ID    = getArg("--event", "latroncal");
const TOTAL_USERS = parseInt(getArg("--users", "500"), 10);
const CLEAN_AFTER = args.includes("--clean");

// ── Constantes de carga ─────────────────────────────────────────────────────
const BATCH_SIZE     = 25;   // usuarios por tanda
const BATCH_DELAY_MS = 300;  // ms entre tandas (simula llegada gradual)
const THINK_TIME_MS  = 800;  // pausa entre acciones por usuario

// ── Datos ficticios ─────────────────────────────────────────────────────────
const NOMBRES   = ["Valentina","Martina","Camila","Lucía","Sofía","Florencia",
  "Agustina","Rocío","Jimena","Micaela","Santiago","Matías","Nicolás","Facundo",
  "Gonzalo","Tomás","Ignacio","Leandro","Rodrigo","Federico","Pablo","Sebastián"];
const APELLIDOS = ["García","González","Rodríguez","López","Martínez","Pérez",
  "Sánchez","Romero","Fernández","Torres","Álvarez","Ruiz","Díaz","Morales",
  "Herrera","Medina","Muñoz","Castro","Reyes","Vargas","Ramos","Acosta"];

const randItem = arr => arr[Math.floor(Math.random() * arr.length)];
const sleep    = ms  => new Promise(r => setTimeout(r, ms));

function generateUser(index) {
  const nombre   = randItem(NOMBRES);
  const apellido = randItem(APELLIDOS);
  return {
    id:     `test-user-${index}`,
    name:   `[TEST] ${nombre} ${apellido}`,
    dni:    String(Math.floor(20_000_000 + Math.random() * 20_000_000)),
    phone:  `1155${String(Math.floor(100000 + Math.random() * 900000))}`,
    email:  `test.user.${index}@loadtest.precinto.ar`,
    emprendimiento: `[TEST] Emprendimiento ${Math.ceil(Math.random() * 50)}`,
  };
}

// ── Métricas ─────────────────────────────────────────────────────────────────
const metrics = {
  rsvp:    { ok: 0, err: 0, times: [] },
  checkin: { ok: 0, err: 0, times: [] },
  photo:   { ok: 0, err: 0, times: [] },
  read:    { ok: 0, err: 0, times: [] },
};

async function measure(category, fn) {
  const t0 = Date.now();
  try {
    await fn();
    metrics[category].ok++;
    metrics[category].times.push(Date.now() - t0);
  } catch {
    metrics[category].err++;
  }
}

// ── Acciones ─────────────────────────────────────────────────────────────────
async function simulateRSVP(db, user) {
  await measure("rsvp", () =>
    set(ref(db, `livefeed/${EVENT_ID}/rsvps/${user.id}`), {
      name: user.name, dni: user.dni, phone: user.phone,
      email: user.email, emprendimiento: user.emprendimiento,
      attending: true, guests: Math.ceil(Math.random() * 3),
      timestamp: Date.now(), isTest: true,
    })
  );
}

async function simulateCheckIn(db, user) {
  await measure("checkin", () =>
    set(ref(db, `livefeed/${EVENT_ID}/participants/${user.id}`), {
      name: user.name, dni: user.dni, phone: user.phone,
      email: user.email, emprendimiento: user.emprendimiento,
      checkedIn: true, checkInAt: Date.now(),
      raffleNumber: Math.floor(1000 + Math.random() * 8000),
      isWinner: false, isTest: true,
    })
  );
}

async function simulatePhotoUpload(db, user) {
  const photoId = `test-photo-${user.id}-${Date.now()}`;
  await measure("photo", () =>
    set(ref(db, `livefeed/${EVENT_ID}/photos/${photoId}`), {
      authorName: user.name, authorDni: user.dni,
      imageUrl: `https://picsum.photos/seed/${Math.floor(Math.random()*1000)}/800/600`,
      uploadedAt: Date.now(), status: "approved",
      hidden: false, isTest: true,
    })
  );
}

async function simulateRead(db) {
  await measure("read", () => get(ref(db, `livefeed/${EVENT_ID}/config`)));
}

// ── Flujo completo de un usuario ─────────────────────────────────────────────
async function simulateUser(db, index) {
  const user = generateUser(index);
  await simulateRead(db);
  await sleep(THINK_TIME_MS * Math.random());
  if (Math.random() < 0.8) { await simulateRSVP(db, user); await sleep(THINK_TIME_MS * Math.random()); }
  if (Math.random() < 0.7) { await simulateCheckIn(db, user); await sleep(THINK_TIME_MS * Math.random()); }
  if (Math.random() < 0.6) { await simulatePhotoUpload(db, user); }
}

// ── Limpieza ─────────────────────────────────────────────────────────────────
async function cleanTestData(db) {
  console.log("\n🧹 Limpiando datos de prueba...");
  let deleted = 0;
  for (const path of ["rsvps", "participants", "photos"]) {
    const snap = await get(ref(db, `livefeed/${EVENT_ID}/${path}`));
    if (!snap.exists()) continue;
    for (const [key, val] of Object.entries(snap.val())) {
      if (val.isTest === true) {
        await remove(ref(db, `livefeed/${EVENT_ID}/${path}/${key}`));
        deleted++;
      }
    }
  }
  console.log(`✅ Eliminados ${deleted} registros de prueba.\n`);
}

// ── Reporte ───────────────────────────────────────────────────────────────────
function printReport(startTime) {
  const total = Date.now() - startTime;
  const avg = arr => arr.length ? Math.round(arr.reduce((a,b)=>a+b,0)/arr.length) : 0;
  const p95 = arr => { if (!arr.length) return 0; const s = [...arr].sort((a,b)=>a-b); return s[Math.floor(s.length*0.95)]; };
  const max = arr => arr.length ? Math.max(...arr) : 0;

  console.log("\n═══════════════════════════════════════════════════════════");
  console.log("                  📊 REPORTE DE CARGA");
  console.log("═══════════════════════════════════════════════════════════");
  console.log(`  Evento:         ${EVENT_ID}`);
  console.log(`  Usuarios:       ${TOTAL_USERS}`);
  console.log(`  Duración total: ${(total/1000).toFixed(1)}s`);
  console.log("───────────────────────────────────────────────────────────");
  console.log("  Acción         OK     ERR    Avg(ms)  P95(ms)  Max(ms)");
  console.log("───────────────────────────────────────────────────────────");
  for (const [name, m] of Object.entries(metrics)) {
    const errMark = m.err > 0 ? " ⚠️" : " ✅";
    console.log(`  ${name.padEnd(14)} ${String(m.ok).padEnd(6)} ${String(m.err).padEnd(6)} ${String(avg(m.times)).padEnd(8)} ${String(p95(m.times)).padEnd(8)} ${max(m.times)}${errMark}`);
  }
  const totalOk  = Object.values(metrics).reduce((s,m)=>s+m.ok, 0);
  const totalErr = Object.values(metrics).reduce((s,m)=>s+m.err, 0);
  console.log("───────────────────────────────────────────────────────────");
  console.log(`  Total OK:      ${totalOk}   |   Total errores: ${totalErr}`);
  console.log(`  Throughput:    ${((totalOk+totalErr)/(total/1000)).toFixed(1)} ops/seg`);
  console.log("═══════════════════════════════════════════════════════════");
  const pctErr = totalErr / (totalOk + totalErr);
  if (pctErr === 0)      console.log("\n  🟢 APROBADO — Sin errores bajo carga de " + TOTAL_USERS + " usuarios.");
  else if (pctErr < 0.05) console.log("\n  🟡 ACEPTABLE — Tasa de error < 5%.");
  else                    console.log("\n  🔴 FALLO — Tasa de error > 5%. Revisar Firebase y reglas.");
  console.log();
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log("═══════════════════════════════════════════════════════════");
  console.log("      🚀 LIVE FEED — PRUEBA DE CARGA CONCURRENTE");
  console.log("═══════════════════════════════════════════════════════════");
  console.log(`  Evento:   ${EVENT_ID}   |   Usuarios: ${TOTAL_USERS}`);
  console.log(`  Tandas:   ${Math.ceil(TOTAL_USERS/BATCH_SIZE)} x ${BATCH_SIZE} usuarios`);
  console.log(`  Limpieza: ${CLEAN_AFTER ? "Sí (al finalizar)" : "No — datos quedan con isTest: true"}`);
  console.log("═══════════════════════════════════════════════════════════\n");

  const app = initializeApp(firebaseConfig);
  const db  = getDatabase(app);

  const configSnap = await get(ref(db, `livefeed/${EVENT_ID}/config`));
  if (!configSnap.exists()) {
    console.error(`❌ No existe el evento "${EVENT_ID}" en Firebase.`);
    console.error(`   Usá --event <id> para especificar el ID correcto.\n`);
    process.exit(1);
  }
  console.log(`✅ Evento: "${configSnap.val().eventName}"\n`);

  const startTime = Date.now();
  let completed = 0;

  const batches = Math.ceil(TOTAL_USERS / BATCH_SIZE);
  for (let b = 0; b < batches; b++) {
    const start = b * BATCH_SIZE;
    const end   = Math.min(start + BATCH_SIZE, TOTAL_USERS);
    await Promise.all(Array.from({ length: end - start }, (_, i) => simulateUser(db, start + i)));
    completed += (end - start);
    const pct = Math.round((completed / TOTAL_USERS) * 100);
    const bar = "█".repeat(Math.floor(pct/5)) + "░".repeat(20 - Math.floor(pct/5));
    process.stdout.write(`\r  [${bar}] ${pct}% — ${completed}/${TOTAL_USERS} usuarios`);
    if (b < batches - 1) await sleep(BATCH_DELAY_MS);
  }

  console.log("\n");
  if (CLEAN_AFTER) await cleanTestData(db);
  else console.log("💡 Para limpiar los datos de prueba: node load-test.mjs --clean\n");

  printReport(startTime);
  process.exit(0);
}

main().catch(err => { console.error("\n❌ Error fatal:", err.message); process.exit(1); });
