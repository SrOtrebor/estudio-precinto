// ============================================
// REFERENCIA DE BACKEND (Node.js / Express)
// ============================================
// Este archivo contiene la lógica necesaria para:
// 1. Obtener horarios disponibles (getAvailableSlots)
// 2. Crear la reserva y generar el link de pago (createBooking)
// 3. Recibir la confirmación de pago de MercadoPago (mercadopagoWebhook)

const express = require("express");
const { MercadoPagoConfig, Preference, Payment } = require("mercadopago");
const app = express();

app.use(express.json());

// Token de MercadoPago (Configura tus credenciales aquí o vía variables de entorno)
const MP_ACCESS_TOKEN = "TU_ACCESS_TOKEN_DE_MERCADOPAGO_AQUÍ";

// --- 1. OBTENER HORARIOS DISPONIBLES ---
app.get("/getAvailableSlots", async (req, res) => {
    try {
        const { date } = req.query;
        if (!date) return res.status(400).json({ error: "Fecha requerida" });

        // Aquí deberías consultar tu base de datos para ver qué horarios están bloqueados
        // y generar los slots disponibles.
        
        // Simulación:
        const mockSlots = ["09:00", "10:30", "12:00", "14:30", "16:00", "17:30"];
        
        return res.status(200).json({ slots: mockSlots });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Error al obtener horarios" });
    }
});

// --- 2. CREAR RESERVA Y GENERAR LINK DE PAGO ---
app.post("/createBooking", async (req, res) => {
    try {
        const { name, email, phone, date, time, service } = req.body;
        if (!name || !email || !date || !time) return res.status(400).json({ error: "Faltan datos obligatorios" });

        // 1. Guardar la reserva en tu base de datos con estado "pending_payment"
        const bookingId = "reserva-" + Date.now(); // Simulado
        const price = 70000; // Precio simulado

        // 2. Configurar MercadoPago
        if (!MP_ACCESS_TOKEN) {
            throw new Error("Falta el token de MercadoPago");
        }

        const mpClient = new MercadoPagoConfig({ accessToken: MP_ACCESS_TOKEN });
        const preference = new Preference(mpClient);

        // 3. Crear preferencia de pago
        const baseUrl = "https://tu-dominio.com"; // CAMBIAR

        const mpResponse = await preference.create({
            body: {
                items: [{
                    id: bookingId,
                    title: `Reserva - ${date} ${time}`,
                    quantity: 1,
                    unit_price: price,
                    currency_id: "ARS"
                }],
                payer: {
                    name: name,
                    email: email
                },
                external_reference: bookingId,
                back_urls: {
                    success: `${baseUrl}/index.html?status=approved`,
                    failure: `${baseUrl}/index.html?status=failure`,
                    pending: `${baseUrl}/index.html?status=pending`
                },
                auto_return: "approved",
                notification_url: `https://tu-backend.com/mercadopagoWebhook` // Endpoint público tuyo
            }
        });

        // Retornar el link de pago al frontend
        return res.status(200).json({ init_point: mpResponse.init_point });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Error al crear reserva" });
    }
});

// --- 3. WEBHOOK MERCADO PAGO ---
app.post("/mercadopagoWebhook", async (req, res) => {
    // IMPORTANTE: Responder 200 a MP inmediatamente para evitar reintentos innecesarios
    res.status(200).send("OK");

    try {
        const { type, data } = req.body;

        if (type === "payment" && data && data.id && MP_ACCESS_TOKEN) {
            // VERIFICACIÓN REAL: Consultar el pago directamente a la API de MP
            const mpClient = new MercadoPagoConfig({ accessToken: MP_ACCESS_TOKEN });
            const paymentClient = new Payment(mpClient);
            const paymentData = await paymentClient.get({ id: data.id });

            // Solo procesar si el pago fue REALMENTE aprobado por MP
            if (paymentData && paymentData.status === "approved" && paymentData.external_reference) {
                const bookingId = paymentData.external_reference;
                
                // 1. Buscar la reserva en tu base de datos con el ID `bookingId`
                // 2. Cambiar su estado a "confirmed"
                // 3. Enviar correos de confirmación al cliente y al admin
                
                console.log(`Reserva ${bookingId} pagada y confirmada con éxito.`);
            }
        }
    } catch (error) {
        console.error("Error al procesar webhook de MercadoPago");
    }
});

// Exportar tu app o arrancar el servidor
// app.listen(3000, () => console.log("Servidor corriendo en el puerto 3000"));
