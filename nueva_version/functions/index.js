const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const admin = require("firebase-admin");
const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const { MercadoPagoConfig, Preference, Payment } = require("mercadopago");

// ─── CRIT-01: Token de Mercado Pago como Secret seguro de Firebase ───────────
// Para configurarlo ejecutar una sola vez:
//   firebase secrets:set MP_ACCESS_TOKEN
// Luego pegar el token cuando lo solicite, y redesplegar:
//   firebase deploy --only functions
const mpAccessToken = defineSecret("MP_ACCESS_TOKEN");

admin.initializeApp();
const db = admin.firestore();

// ─── CRIT-02: CORS restringido solo a dominios autorizados ───────────────────
const ALLOWED_ORIGINS = [
    "https://estudioprecinto.com",
    "https://www.estudioprecinto.com",
    "http://localhost:5001",
    "http://127.0.0.1:5500",
    "http://localhost:3000"
];

const corsOptions = {
    origin: (origin, callback) => {
        // Permitir llamadas sin origin (ej: Postman, apps móviles propias)
        if (!origin) return callback(null, true);
        if (ALLOWED_ORIGINS.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error("Origen no permitido por la política CORS."));
    },
    methods: ["GET", "POST"],
    optionsSuccessStatus: 200
};

const app = express();
app.use(cors(corsOptions));
app.use(express.json({ limit: "10kb" })); // Limitar tamaño del payload

// ─── CRIT-03: Rate Limiting por IP ───────────────────────────────────────────
// Límite general: 60 peticiones cada 15 minutos
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 60,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Demasiadas solicitudes. Por favor, intentá más tarde." }
});

// Límite estricto para crear reservas: máximo 5 por hora por IP
const bookingLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Límite de reservas alcanzado. Por favor, intentá nuevamente en 1 hora." }
});

app.use(generalLimiter);

// ─── MED-02: Validador de formato de fecha ────────────────────────────────────
const isValidDate = (dateStr) => {
    if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
    const d = new Date(dateStr);
    return d instanceof Date && !isNaN(d) && d > new Date();
};

// ─── MED-03: Sanitizador de strings ──────────────────────────────────────────
const sanitizeString = (str, maxLength = 200) => {
    if (typeof str !== "string") return "";
    return str.trim().replace(/[<>"'`]/g, "").slice(0, maxLength);
};

// ─── 1. OBTENER HORARIOS DISPONIBLES ─────────────────────────────────────────
app.get("/getAvailableSlots", async (req, res) => {
    try {
        const { date } = req.query;

        // MED-02: Validación de formato y que la fecha sea futura
        if (!isValidDate(date)) {
            return res.status(400).json({ error: "La fecha es inválida o ya pasó. Usa el formato YYYY-MM-DD." });
        }

        const allPossibleSlots = ["09:00", "10:30", "12:00", "14:30", "16:00", "17:30"];

        const bookingsSnapshot = await db.collection("bookings")
            .where("date", "==", date)
            .where("status", "==", "approved")
            .get();

        const takenSlots = [];
        bookingsSnapshot.forEach(doc => {
            takenSlots.push(doc.data().time);
        });

        const availableSlots = allPossibleSlots.filter(slot => !takenSlots.includes(slot));

        return res.status(200).json({ slots: availableSlots });
    } catch (error) {
        console.error("Error al obtener horarios:", error);
        return res.status(500).json({ error: "Error al obtener horarios disponibles" });
    }
});

// ─── 2. CREAR RESERVA Y GENERAR LINK DE MERCADO PAGO ─────────────────────────
app.post("/createBooking", bookingLimiter, async (req, res) => {
    try {
        const { name, email, phone, date, time, service } = req.body;

        // Validación de presencia de campos
        if (!name || !email || !phone || !date || !time) {
            return res.status(400).json({ error: "Faltan datos obligatorios para la reserva." });
        }

        // MED-02: Validar formato de fecha
        if (!isValidDate(date)) {
            return res.status(400).json({ error: "La fecha seleccionada es inválida." });
        }

        // MED-02: Validar formato de hora
        const validTimes = ["09:00", "10:30", "12:00", "14:30", "16:00", "17:30"];
        if (!validTimes.includes(time)) {
            return res.status(400).json({ error: "El horario seleccionado no es válido." });
        }

        // MED-02: Validar formato de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: "El correo electrónico no es válido." });
        }

        // MED-03: Sanitizar todos los campos de usuario antes de guardar
        const safeName = sanitizeString(name, 100);
        const safeEmail = sanitizeString(email, 254);
        const safePhone = sanitizeString(phone, 20).replace(/[^\d\s\+\-\(\)]/g, "");
        const safeService = sanitizeString(service || "Consulta General", 100);

        // 1. Guardar la reserva en Firestore con estado "pending_payment"
        const bookingRef = await db.collection("bookings").add({
            name: safeName,
            email: safeEmail,
            phone: safePhone,
            date,
            time,
            service: safeService,
            status: "pending_payment",
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        const bookingId = bookingRef.id;
        const price = 90000;

        // CRIT-01: Obtener el token desde Firebase Secret Manager (no hardcodeado)
        const token = mpAccessToken.value();

        if (!token) {
            console.warn("Token de MP no configurado. Usando modo simulado.");
            return res.status(200).json({
                bookingId,
                message: "Reserva en modo simulado creada exitosamente.",
                init_point: null
            });
        }

        // 2. Configurar Mercado Pago con el token seguro
        const mpClient = new MercadoPagoConfig({ accessToken: token });
        const preference = new Preference(mpClient);

        const baseUrl = "https://estudioprecinto.com/nueva_version";

        const mpResponse = await preference.create({
            body: {
                items: [{
                    id: bookingId,
                    title: `Reserva Estudio Precinto: ${safeService}`,
                    quantity: 1,
                    unit_price: price,
                    currency_id: "ARS"
                }],
                payer: {
                    name: safeName,
                    email: safeEmail,
                    phone: { number: safePhone }
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
        return res.status(500).json({ error: "Error al generar la reserva." });
    }
});

// ─── 3. WEBHOOK DE CONFIRMACIÓN DE PAGO DE MERCADO PAGO ──────────────────────
app.post("/mercadopagoWebhook", async (req, res) => {
    // Responder inmediatamente 200 OK a Mercado Pago
    res.status(200).send("OK");

    try {
        const { type, data } = req.body;
        const token = mpAccessToken.value();

        if (type === "payment" && data && data.id && token) {
            const mpClient = new MercadoPagoConfig({ accessToken: token });
            const paymentClient = new Payment(mpClient);

            const paymentData = await paymentClient.get({ id: data.id });

            if (paymentData && paymentData.status === "approved" && paymentData.external_reference) {
                const bookingId = paymentData.external_reference;

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

// ─── Exportar la Cloud Function de Firebase Gen 2, declarando el Secret ──────
exports.api = onRequest({ secrets: [mpAccessToken] }, app);
