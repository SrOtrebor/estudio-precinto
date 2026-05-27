# 🚀 Estudio Precinto — Sitio Web Principal

**Sitio oficial de [Estudio Precinto](https://estudioprecinto.com)** — Estudio de ingeniería de software especializado en landing pages de alta conversión entregadas en 24 horas y automatización de procesos para PyMEs de Argentina.

---

## 📁 Estructura del Repositorio

```
estudio-precinto/
│
├── nueva_version/          ← Landing page principal (producción)
│   ├── index.html          ← Página principal con SEO/Schema.org
│   ├── css/style.css       ← Estilos (glassmorphism, animaciones)
│   ├── js/main.js          ← Animaciones GSAP, cursor magnético
│   ├── modulo_reserva_pago/
│   │   └── reservas.js     ← Lógica de reservas + Mercado Pago
│   ├── functions/          ← Backend (Firebase Cloud Functions)
│   │   ├── index.js        ← API: reservas, pagos, webhook MP
│   │   └── package.json    ← Dependencias del backend
│   ├── firebase.json       ← Configuración de Firebase Hosting
│   └── .firebaserc         ← Proyecto Firebase: estudio-precinto
│
├── sorteo/                 ← Módulo de Sorteos (React + Vite)
├── subasta-silenciosa/     ← Módulo de Subasta Silenciosa (React)
├── live-feed/              ← Módulo Live Feed para eventos (React)
├── curso-maleki/           ← Sitio de Academia Maleki
├── SVG/                    ← Logotipos e íconos SVG de la marca
├── assets/                 ← Imágenes del portfolio y Open Graph
│
├── robots.txt              ← Directivas para motores de búsqueda
├── sitemap.xml             ← Mapa del sitio para indexación
├── CNAME                   ← Dominio personalizado: estudioprecinto.com
├── index.html              ← Redirect hacia nueva_version/
└── .github/workflows/
    └── deploy.yml          ← CI/CD automático con GitHub Actions
```

---

## 🌐 Tecnologías del Frontend

| Tecnología | Uso |
|---|---|
| **HTML5 + CSS3 Vanilla** | Estructura y estilos (sin frameworks pesados) |
| **JavaScript ES6+** | Lógica del cliente |
| **GSAP 3 + ScrollTrigger** | Animaciones kinéticas y scroll horizontal |
| **Glassmorphism CSS** | Efectos de vidrio en tarjetas y paneles |
| **Schema.org JSON-LD** | Datos estructurados para SEO y motores de IA |

---

## ⚙️ Tecnologías del Backend (Cloud Functions)

| Tecnología | Uso |
|---|---|
| **Firebase Cloud Functions v2** | Plataforma serverless |
| **Express.js** | Router HTTP de la API |
| **Mercado Pago SDK v2** | Pasarela de cobros online |
| **Firebase Firestore** | Base de datos de reservas |
| **firebase-admin** | Acceso privilegiado a Firestore |
| **express-rate-limit** | Protección contra abuso de endpoints |
| **Firebase Secret Manager** | Almacenamiento seguro del token de MP |

---

## 🔌 Endpoints de la API

Base URL en producción:
```
https://us-central1-estudio-precinto.cloudfunctions.net/api
```

| Método | Endpoint | Descripción |
|---|---|---|
| `GET` | `/getAvailableSlots?date=YYYY-MM-DD` | Devuelve los horarios libres de una fecha |
| `POST` | `/createBooking` | Crea la reserva y devuelve el link de pago de MP |
| `POST` | `/mercadopagoWebhook` | Webhook de confirmación de pago de Mercado Pago |

### Body de `/createBooking`
```json
{
  "name": "Juan Pérez",
  "email": "juan@empresa.com",
  "phone": "1165432100",
  "date": "2026-06-10",
  "time": "10:30",
  "service": "Landing Page Express (Entrega 24h)"
}
```

---

## 🔐 Seguridad Implementada

> Auditoría realizada en Mayo 2026. Estado: **Hardened**.

| Capa | Medida |
|---|---|
| **Token de Mercado Pago** | Guardado en Firebase Secret Manager (`MP_ACCESS_TOKEN`). No está en el código fuente. |
| **CORS** | Restringido a `estudioprecinto.com` y `localhost`. Rechaza todos los demás orígenes. |
| **Rate Limiting** | 60 req/15min general. Máximo 5 intentos de reserva por IP por hora. |
| **Validación de entrada** | Fecha (regex YYYY-MM-DD + fecha futura), hora (lista blanca), email (regex RFC). |
| **Sanitización** | Todos los campos de usuario son sanitizados (límite de longitud, caracteres HTML eliminados) antes de guardarse en Firestore. |
| **GitHub Actions** | Permisos reducidos al mínimo (`contents: read`, no `write`). |
| **Payload limit** | Express configurado con `limit: '10kb'` para prevenir ataques de body overflow. |

---

## 🎯 SEO & GEO (Generative Engine Optimization)

> Optimizado para aparecer tanto en Google como en respuestas de IA (ChatGPT, Perplexity, Gemini).

| Elemento | Estado |
|---|---|
| `<title>` optimizado con keywords | ✅ |
| `<meta description>` 155 chars + CTA | ✅ |
| Open Graph (Facebook, WhatsApp, LinkedIn) | ✅ |
| Twitter / X Cards | ✅ |
| `<link rel="canonical">` | ✅ |
| Schema.org `LocalBusiness` | ✅ |
| Schema.org `Service` + `PriceSpecification` | ✅ |
| Schema.org `FAQPage` (5 preguntas) | ✅ |
| `robots.txt` | ✅ |
| `sitemap.xml` | ✅ |
| Sección FAQ visible en página | ✅ |
| Sección "Quiénes Somos" E-E-A-T | ✅ |
| Google Business Profile | ⏳ Pendiente (manual) |

---

## 🚢 Despliegue

El sitio se despliega automáticamente en **GitHub Pages** cada vez que se hace push a `main`, via GitHub Actions (`.github/workflows/deploy.yml`).

### Flujo del deploy:
1. Build de apps React (`sorteo`, `live-feed`, `subasta-silenciosa`)
2. Copia de todos los archivos estáticos a `dist_final/`
3. Copia de `robots.txt` y `sitemap.xml`
4. Deploy a GitHub Pages con dominio personalizado `estudioprecinto.com`

### Deploy manual del backend (Cloud Functions):
```bash
cd nueva_version/functions
npm install
firebase deploy --only functions
```

---

## 🔑 Configuración del Secret de Mercado Pago

El token de producción de Mercado Pago **no está en el código**. Se configura una única vez con:

```bash
cd nueva_version/functions
firebase functions:secrets:set MP_ACCESS_TOKEN
# (pegar el token cuando lo solicite → Enter)
firebase deploy --only functions
```

Para actualizar el token en el futuro, repetir el mismo comando (crea una nueva versión del secret automáticamente).

---

## 🧱 Secciones de la Landing Page

| Sección | ID | Descripción |
|---|---|---|
| Hero Kinético | `#hero` | Animación de texto de entrada, propuesta de valor |
| Pricing Cards | `#precios` | 3 paquetes con CTA directo a reserva + pago |
| Scroll Horizontal | `#horizontal-section` | Explicación de servicios con efecto pinning |
| Alianza MoreMKT | `#marketing` | Bloque de alianza estratégica con agencia de Paid Media |
| Herramientas Propias | `#herramientas` | Sorteos, Subasta Silenciosa, Live Feed |
| Portfolio | `#portfolio` | 7 casos de éxito (MentorHub, Tramando, Movaro, etc.) |
| Quiénes Somos + FAQ | `#quienes-somos` | Sección E-E-A-T y preguntas frecuentes |
| CTA Final | `#contacto` | Llamado a agendar asesoría gratuita |

---

## 🗂️ Servicios y Precios

| Servicio | Precio | Entrega |
|---|---|---|
| **Landing Page Express** | $90.000 ARS | ⚡ 24 horas garantizadas |
| **Páginas Web Institucionales** | A consultar | Variable |
| **Automatizaciones + Sistemas a Medida** | A consultar | Variable |

---

## 📞 Contacto

- **WhatsApp:** [+54 11 6448-1943](https://wa.me/541164481943)
- **Sitio:** [estudioprecinto.com](https://estudioprecinto.com/nueva_version/)
- **Alianza Marketing:** [MoreMKT](https://morehdmkt.com/)
