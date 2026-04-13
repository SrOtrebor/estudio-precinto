
const PROJECT_ID = "sorteo-camino-emprendedor";
const DB_URL = `https://${PROJECT_ID}-default-rtdb.firebaseio.com/`;

async function getParticipants() {
    const res = await fetch(`${DB_URL}participants.json`);
    const data = await res.json();
    return data ? Object.values(data) : [];
}

async function getStock() {
    const nfcRes = await fetch(`${DB_URL}nfc_stock.json`);
    const aseRes = await fetch(`${DB_URL}asesoria_stock.json`);
    const candyRes = await fetch(`${DB_URL}candy_stock.json`);
    return {
        nfc: (await nfcRes.json()) || 0,
        ase: (await aseRes.json()) || 0,
        candy: (await candyRes.json()) || 0
    };
}

async function playRoulette(participantId, participantsCount, stock) {
    const pendingParticipants = Math.max(participantsCount, 1);
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
        // En el test, si ganás caramelo, también bajamos stock
        if (stock.candy > 0) {
            stock.candy--;
        }
    }

    await fetch(`${DB_URL}participants/${participantId}.json`, {
        method: 'PATCH',
        body: JSON.stringify({
            ya_jugo_ruleta: true,
            roulette_win: winType
        })
    });

    if (winType === 'TAG_NFC') {
        await fetch(`${DB_URL}nfc_stock.json`, { method: 'PUT', body: JSON.stringify(stock.nfc) });
    } else if (winType === 'ASESORIA') {
        await fetch(`${DB_URL}asesoria_stock.json`, { method: 'PUT', body: JSON.stringify(stock.ase) });
    } else if (winType === 'CARAMELOS') {
        await fetch(`${DB_URL}candy_stock.json`, { method: 'PUT', body: JSON.stringify(stock.candy) });
    }

    return winType;
}

async function runRouletteTest(quantity = 100) {
    console.log(`🎰 Iniciando simulación de ${quantity} jugadas de ruleta...`);
    
    let participants = await getParticipants();
    let stock = await getStock();
    
    let eligible = participants.filter(p => p && !p.ya_jugo_ruleta);
    
    if (eligible.length === 0) {
        console.log("❌ No hay participantes elegibles para jugar.");
        return;
    }

    console.log(`📊 Stock Inicial: NFC: ${stock.nfc}, Asesorias: ${stock.ase}, Caramelos: ${stock.candy}`);
    console.log(`👥 Participantes listos: ${eligible.length}`);

    const iterations = Math.min(quantity, eligible.length);
    const winners = { TAG_NFC: 0, ASESORIA: 0, CARAMELOS: 0 };

    for (let i = 0; i < iterations; i++) {
        const p = eligible[i];
        const win = await playRoulette(p.id, eligible.length - i, stock);
        winners[win]++;
        
        if ((i + 1) % 50 === 0) {
            console.log(`✅ ${i + 1} jugadas procesadas... (Actual: NFC: ${stock.nfc}, ASE: ${stock.ase}, CANDY: ${stock.candy})`);
        }
    }

    console.log(`\n✨ SIMULACIÓN COMPLETADA ✨`);
    console.log(`🎁 Premios entregados en este lote:`);
    console.log(`- Tags NFC: ${winners.TAG_NFC}`);
    console.log(`- Asesorias: ${winners.ASESORIA}`);
    console.log(`- Caramelos: ${winners.CARAMELOS}`);
    console.log(`\n📊 Stock Final en DB: NFC: ${stock.nfc}, Asesorias: ${stock.ase}, Caramelos: ${stock.candy}`);
}

const qty = process.argv[2] ? parseInt(process.argv[2]) : 100;
runRouletteTest(qty).catch(console.error);
