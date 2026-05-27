const { onRequest } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const express = require("express");
const cors = require("cors");
const { MercadoPagoConfig, Preference, Payment } = require("mercadopago");

admin.initializeApp();
const db = admin.firestore();

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

// Token de MercadoPago (Se recomienda configurar vía Firebase Config o dejar el placeholder para tu token real)
const MP_ACCESS_TOKEN = "APP_USR-3879237058703015-052714-bb57c8ac2d27d0ea6a1abffdf821bbf7-83114702";

// --- 1. OBTENER HORARIOS DISPONIBLES (CON FILTRADO REAL DESDE FIRESTORE) ---
app.get("/getAvailableSlots", async (req, res) => {
    try {
        const { date } = req.query; // Formato: YYYY-MM-DD
        if (!date) {
            return res.status(400).json({ error: "La fecha es requerida" });
        }

        // Definimos la lista de todos los horarios posibles de atención en el día
        const allPossibleSlots = ["09:00", "10:30", "12:00", "14:30", "16:00", "17:30"];

        // Buscamos en Firestore las reservas confirmadas para esa fecha
        const bookingsSnapshot = await db.collection("bookings")
            .where("date", "==", date)
            .where("status", "==", "approved")
            .get();

        // Extraemos los horarios que ya están ocupados
        const takenSlots = [];
        bookingsSnapshot.forEach(doc => {
            takenSlots.push(doc.data().time);
        });

        // Los slots disponibles son los posibles que NO estén ocupados
        const availableSlots = allPossibleSlots.filter(slot => !takenSlots.includes(slot));

        return res.status(200).json({ slots: availableSlots });
    } catch (error) {
        console.error("Error al obtener horarios:", error);
        return res.status(500).json({ error: "Error al obtener horarios disponibles" });
    }
});

// --- 2. CREAR RESERVA Y GENERAR LINK DE MERCADO PAGO ---
app.post("/createBooking", async (req, res) => {
    try {
        const { name, email, phone, date, time, service } = req.body;
        
        if (!name || !email || !phone || !date || !time) {
            return res.status(400).json({ error: "Faltan datos obligatorios para la reserva" });
        }

        // 1. Guardar la reserva en Firestore con estado "pending_payment"
        const bookingRef = await db.collection("bookings").add({
            name,
            email,
            phone,
            date,
            time,
            service: service || "Consulta General",
            status: "pending_payment",
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        const bookingId = bookingRef.id;
        const price = 70000; // Inversión estándar de consulta

        // Si es modo demo o no hay token de MP configurado, simulamos el éxito
        if (!MP_ACCESS_TOKEN || MP_ACCESS_TOKEN.includes("TU_ACCESS_TOKEN_REAL")) {
            return res.status(200).json({ 
                bookingId,
                message: "Reserva en modo simulado creada exitosamente.",
                init_point: null 
            });
        }

        // 2. Configurar Mercado Pago
        const mpClient = new MercadoPagoConfig({ accessToken: MP_ACCESS_TOKEN });
        const preference = new Preference(mpClient);

        // Base URL para redirecciones (Asegúrate de cambiarlo por tu dominio real de GitHub Pages o Firebase Hosting)
        const baseUrl = `https://estudioprecinto.com/nueva_version`; 

        const mpResponse = await preference.create({
            body: {
                items: [{
                    id: bookingId,
                    title: `Reserva Estudio Precinto: ${service || "Consulta"}`,
                    quantity: 1,
                    unit_price: price,
                    currency_id: "ARS"
                }],
                payer: {
                    name: name,
                    email: email,
                    phone: { number: phone }
                },
                external_reference: bookingId,
                back_urls: {
                    success: `${baseUrl}/index.html?status=approved`,
                    failure: `${baseUrl}/index.html?status=failure`,
                    pending: `${baseUrl}/index.html?status=pending`
                },
                auto_return: "approved",
                notification_url: `https://us-central1-estudio-precinto.cloudfunctions.net/api/mercadopagoWebhook`
            }
        });

        return res.status(200).json({ 
            bookingId, 
            init_point: mpResponse.init_point 
        });

    } catch (error) {
        console.error("Error al crear reserva:", error);
        return res.status(500).json({ error: "Error al generar la reserva" });
    }
});

// --- 3. WEBHOOK DE CONFIRMACIÓN DE PAGO DE MERCADO PAGO ---
app.post("/mercadopagoWebhook", async (req, res) => {
    // Responder inmediatamente con 200 OK a Mercado Pago para confirmar recepción de la notificación
    res.status(200).send("OK");

    try {
        const { type, data } = req.body;

        if (type === "payment" && data && data.id && MP_ACCESS_TOKEN && !MP_ACCESS_TOKEN.includes("TU_ACCESS_TOKEN_REAL")) {
            const mpClient = new MercadoPagoConfig({ accessToken: MP_ACCESS_TOKEN });
            const paymentClient = new Payment(mpClient);
            
            // Consultar el estado real del pago a la API de Mercado Pago
            const paymentData = await paymentClient.get({ id: data.id });

            if (paymentData && paymentData.status === "approved" && paymentData.external_reference) {
                const bookingId = paymentData.external_reference;
                
                // Actualizar la reserva correspondiente en Firestore a "approved"
                await db.collection("bookings").doc(bookingId).update({
                    status: "approved",
                    paymentId: data.id,
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                });
                
                console.log(`Reserva ${bookingId} aprobada y pagada con éxito.`);
            }
        }
    } catch (error) {
        console.error("Error al procesar webhook de MercadoPago:", error);
    }
});

// Exportar la app de Express como Cloud Function de Firebase (Generación 2)
exports.api = onRequest(app);
