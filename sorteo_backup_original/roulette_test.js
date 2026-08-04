// =====================================================
//  SIMULACIÓN OFFLINE DE RULETA — sin tocar la DB real
//  Uso: node roulette_test.js [cantidad]
// =====================================================

const TOTAL_TIRADAS = parseInt(process.argv[2]) || 138;

// ── Stocks iniciales (cambiá estos valores si es necesario) ──
const STOCK_INICIAL = {
  nfc:   9,
  ase:   35,
  candy: 100,
};

// ══════════════════════════════════════════════════════════════
function simularTirada(tiradaNum, totalRestantes, stock) {
  const pendingParticipants = Math.max(totalRestantes, 1);
  const pTagLimit = (stock.nfc / pendingParticipants) * 100;
  const pAseLimit = pTagLimit + ((stock.ase / pendingParticipants) * 100);

  const rand = Math.random() * 100;
  let winType = 'CARAMELOS';

  if (rand < pTagLimit && stock.nfc > 0) {
    winType = 'TAG_NFC';
    stock.nfc--;
  } else if (rand < pAseLimit && stock.ase > 0) {
    winType = 'ASESORIA';
    stock.ase--;
  } else {
    if (stock.candy > 0) stock.candy--;
  }

  return winType;
}

function formatBar(val, max, width = 30) {
  const filled = Math.round((val / max) * width);
  return '█'.repeat(filled) + '░'.repeat(width - filled);
}

// ══════════════════════════════════════════════════════════════
function runSimulacion(totalTiradas) {
  console.log('\n══════════════════════════════════════════════');
  console.log(`  🎰  SIMULACIÓN RULETA — ${totalTiradas} TIRADAS`);
  console.log('══════════════════════════════════════════════');
  console.log(`\n  Stock inicial:`);
  console.log(`    🏷️  TAG NFC   : ${STOCK_INICIAL.nfc}`);
  console.log(`    💡 ASESORÍA  : ${STOCK_INICIAL.ase}`);
  console.log(`    🍬 CARAMELOS : ${STOCK_INICIAL.candy}`);
  console.log(`\n  Ejecutando ${totalTiradas} tiradas...\n`);

  const stock = { ...STOCK_INICIAL };
  const winners = { TAG_NFC: 0, ASESORIA: 0, CARAMELOS: 0 };
  const log = [];  // registro detallado
  let stockAgotado = [];

  for (let i = 0; i < totalTiradas; i++) {
    const restantes = totalTiradas - i;
    const antes = { ...stock };
    const win = simularTirada(i + 1, restantes, stock);
    winners[win]++;

    // Detectar si algún stock llegó a 0 en esta tirada
    if (antes.nfc > 0 && stock.nfc === 0) stockAgotado.push({ tirada: i + 1, tipo: 'TAG NFC' });
    if (antes.ase > 0 && stock.ase === 0) stockAgotado.push({ tirada: i + 1, tipo: 'ASESORÍA' });

    log.push({ tirada: i + 1, win, nfc: stock.nfc, ase: stock.ase, candy: stock.candy });

    // Progreso cada 30 tiradas
    if ((i + 1) % 30 === 0 || i + 1 === totalTiradas) {
      console.log(`  Tirada ${String(i + 1).padStart(3)}  │  NFC: ${String(stock.nfc).padStart(2)}  ASE: ${String(stock.ase).padStart(2)}  CANDY: ${String(stock.candy).padStart(3)}  │  último: ${win}`);
    }
  }

  // ── RESULTADOS FINALES ──────────────────────────────────────
  console.log('\n══════════════════════════════════════════════');
  console.log('  📊  RESULTADOS FINALES');
  console.log('══════════════════════════════════════════════\n');

  const maxW = Math.max(...Object.values(winners));
  console.log(`  🏷️  TAG NFC   : ${String(winners.TAG_NFC).padStart(3)} jugadores  ${formatBar(winners.TAG_NFC, totalTiradas)}`);
  console.log(`  💡 ASESORÍA  : ${String(winners.ASESORIA).padStart(3)} jugadores  ${formatBar(winners.ASESORIA, totalTiradas)}`);
  console.log(`  🍬 CARAMELOS : ${String(winners.CARAMELOS).padStart(3)} jugadores  ${formatBar(winners.CARAMELOS, totalTiradas)}`);

  console.log('\n  Stock restante al final:');
  console.log(`    🏷️  NFC   : ${stock.nfc} unidades`);
  console.log(`    💡 ASE   : ${stock.ase} unidades`);
  console.log(`    🍬 CANDY : ${stock.candy} unidades`);

  if (stockAgotado.length > 0) {
    console.log('\n  ⚠️  Stocks que llegaron a 0:');
    stockAgotado.forEach(s => console.log(`    · ${s.tipo} se agotó en la tirada #${s.tirada}`));
  } else {
    console.log('\n  ✅  Ningún stock llegó a cero.');
  }

  // ── PORCENTAJES ─────────────────────────────────────────────
  console.log('\n  📈 Distribución porcentual:');
  console.log(`    🏷️  NFC      : ${((winners.TAG_NFC   / totalTiradas) * 100).toFixed(1)}%  (objetivo: ~${((STOCK_INICIAL.nfc / totalTiradas) * 100).toFixed(1)}%)`);
  console.log(`    💡 ASESORÍA : ${((winners.ASESORIA  / totalTiradas) * 100).toFixed(1)}%  (objetivo: ~${((STOCK_INICIAL.ase / totalTiradas) * 100).toFixed(1)}%)`);
  console.log(`    🍬 CARAMELOS: ${((winners.CARAMELOS / totalTiradas) * 100).toFixed(1)}%`);

  // ── ALERTAS ─────────────────────────────────────────────────
  console.log('\n══════════════════════════════════════════════');
  const nfcOk    = winners.TAG_NFC <= STOCK_INICIAL.nfc;
  const aseOk    = winners.ASESORIA <= STOCK_INICIAL.ase;
  console.log(nfcOk  ? '  ✅ NFC no superó el stock.' : `  ❌ ERROR: se entregaron ${winners.TAG_NFC} NFC pero solo había ${STOCK_INICIAL.nfc}`);
  console.log(aseOk  ? '  ✅ ASESORÍA no superó el stock.' : `  ❌ ERROR: se entregaron ${winners.ASESORIA} ASESORÍAS pero solo había ${STOCK_INICIAL.ase}`);
  console.log('══════════════════════════════════════════════\n');
}

runSimulacion(TOTAL_TIRADAS);
