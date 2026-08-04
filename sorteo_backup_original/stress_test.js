
const PROJECT_ID = "sorteo-camino-emprendedor";
const DB_URL = `https://${PROJECT_ID}-default-rtdb.firebaseio.com/`;

const NAMES = ["Juan Perez", "Maria Garcia", "Ricardo Fort", "Elena White", "Beto Casella", "Susana Gimenez", "Mirtha Legrand", "Carlitos Balá", "Diego Maradona", "Lionel Messi", "Tini Stoessel", "Lali Esposito"];

async function addParticipant(id) {
    const name = NAMES[Math.floor(Math.random() * NAMES.length)] + " " + id;
    const whatsapp = "11" + Math.floor(10000000 + Math.random() * 90000000);
    const data = {
        name: name,
        whatsapp: whatsapp,
        whatsapp_normalized: "+" + whatsapp,
        id: id,
        timestamp: Date.now()
    };

    const response = await fetch(`${DB_URL}participants/${id}.json`, {
        method: 'PUT',
        body: JSON.stringify(data)
    });

    // También actualizamos el índice de teléfonos para el test de duplicados
    await fetch(`${DB_URL}phones/${whatsapp}.json`, {
        method: 'PUT',
        body: JSON.stringify(id)
    });

    if (!response.ok) {
        throw new Error(`Error al agregar id ${id}: ${response.statusText}`);
    }
}

async function updateCounter(count) {
    await fetch(`${DB_URL}counter.json`, {
        method: 'PUT',
        body: JSON.stringify(count)
    });
}

async function runTest(quantity = 100) {
    console.log(`🚀 Iniciando bombardeo de ${quantity} participantes...`);
    
    // Obtenemos el contador actual para no sobreescribir
    const res = await fetch(`${DB_URL}counter.json`);
    let currentId = (await res.json()) || 0;
    
    const start = Date.now();
    const promises = [];
    
    for (let i = 1; i <= quantity; i++) {
        const nextId = currentId + i;
        promises.push(addParticipant(nextId));
        
        // Enviamos en lotes de 50 para no matar la red local
        if (i % 50 === 0) {
            await Promise.all(promises);
            console.log(`✅ ${i} procesados...`);
        }
    }
    
    await Promise.all(promises);
    await updateCounter(currentId + quantity);
    
    const end = Date.now();
    console.log(`\n✨ PRUEBA COMPLETADA ✨`);
    console.log(`⏱️ Tiempo total: ${(end - start) / 1000} segundos`);
    console.log(`📊 Total hoy: ${currentId + quantity} participantes`);
    console.log(`\nSugerencia: Abrí la pantalla del Monitor para ver cómo reacciona.`);
}

// Ejecutar con: node stress_test.js [cantidad]
const qty = process.argv[2] ? parseInt(process.argv[2]) : 500;
runTest(qty).catch(console.error);
