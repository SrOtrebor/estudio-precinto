# 📦 Estudio Precinto — Repositorio Principal

Monorepo del sitio web oficial + herramientas de software para eventos y clientes.

🌐 **[estudioprecinto.com](https://estudioprecinto.com/)**  
📱 **WhatsApp:** [+54 11 6448-1943](https://wa.me/541164481943)

---

## 🗂️ Estructura del Repositorio

```
estudio-precinto/
│
├── index.html                   ← Sitio principal (producción en GitHub Pages)
├── index.css                    ← Estilos globales del sitio
├── script.js                    ← Lógica del sitio principal
│
├── nueva_version/               ← Base de código del sitio (editar acá)
│   ├── index.html               ← Landing page con SEO + Schema.org
│   ├── css/style.css            ← Glassmorphism, animaciones, cursor magnético
│   ├── js/main.js               ← GSAP, ScrollTrigger, precios dinámicos
│   ├── modulo_reserva_pago/     ← Formulario de reserva + Mercado Pago
│   ├── admin/dashboard.html     ← Panel de administración de reservas
│   ├── functions/               ← Backend (Firebase Cloud Functions v2)
│   │   ├── index.js             ← API: reservas, pagos, webhook Mercado Pago
│   │   └── package.json
│   ├── firebase.json            ← Config de Firebase Hosting
│   ├── firestore.rules          ← Reglas de seguridad de Firestore
│   └── PENDIENTES.md            ← ⚠️ Tareas pendientes (leer al retomar)
│
├── live-feed/                   ← 📸 App de eventos en vivo (React + Vite)
│   ├── src/
│   │   ├── App.jsx              ← Enrutador principal (HashRouter)
│   │   ├── firebase.js          ← Configuración de Firebase RTDB
│   │   └── pages/
│   │       ├── LiveMonitor.jsx  ← Pantalla del salón (fotos + ads + sorteo)
│   │       ├── ModerationPanel.jsx ← Panel de admin del evento
│   │       ├── Ingreso.jsx      ← ✨ NUEVO: Check-in con DNI
│   │       ├── PhotoUpload.jsx  ← App del invitado (subir fotos)
│   │       ├── Gallery.jsx      ← Galería post-evento
│   │       ├── Invitation.jsx   ← Invitación digital
│   │       ├── AlbumPrint.jsx   ← Álbum para imprimir
│   │       └── MasterDashboard.jsx ← Dashboard maestro (todos los eventos)
│   ├── DOC_INTEGRACION_SORTEO.md ← Documentación de la integración
│   └── package.json
│
├── sorteo/                      ← 🎰 Módulo de sorteos (React + Vite)
├── subasta-silenciosa/          ← 🔨 Subasta silenciosa (React + Firebase RTDB)
├── curso-maleki/                ← 🎓 Sitio de Academia Maleki (HTML estático)
│
├── live-feed_backup_original/   ← 💾 Backup del live-feed antes de la integración
├── sorteo_backup_original/      ← 💾 Backup del módulo sorteo original
│
├── SVG/                         ← Logotipos e íconos SVG de la marca
├── assets/                      ← Imágenes del portfolio y Open Graph
├── robots.txt                   ← Directivas SEO para motores de búsqueda
├── sitemap.xml                  ← Mapa del sitio para indexación
├── CNAME                        ← Dominio personalizado: estudioprecinto.com
└── .github/workflows/deploy.yml ← CI/CD automático con GitHub Actions
```

---

## 🚀 Cómo Levantar Cada Módulo en Desarrollo

### Sitio Principal
El sitio principal es HTML/CSS/JS puro, no necesita compilación. Abrí `nueva_version/index.html` directamente en el navegador, o usá Live Server en VS Code.

### Live Feed (App de Eventos) ← **TRABAJO ACTUAL**
```bash
cd live-feed
npm install
npm run dev
```
App disponible en `http://localhost:5173`

### Sorteo
```bash
cd sorteo
npm install
npm run dev
```

### Subasta Silenciosa
```bash
cd subasta-silenciosa
npm install
npm run dev
```

---

## 📸 Módulo Live Feed — Rutas de la App

| Ruta | Descripción |
|------|-------------|
| `/foto/:eventId` | App del invitado para subir fotos |
| `/monitor/:eventId` | **Pantalla del salón** (fotos + publicidad + sorteo) |
| `/moderar/:eventId` | **Panel del admin** del evento |
| `/galeria/:eventId` | Galería post-evento |
| `/ingreso/:eventId` | **Check-in presencial** por DNI (NUEVO) |
| `/invitacion/:eventId` | Invitación digital del evento |
| `/album/:eventId` | Álbum para imprimir |
| `/admin-maestro` | 👑 Dashboard maestro (todos los eventos) |

---

## 🎯 Última Funcionalidad Desarrollada: Integración Sorteo + Live Feed

**Fecha:** 3 de Agosto 2026 — Commit `c277034`

Se integraron los sorteos directamente dentro del Live Feed. Ahora la misma pantalla del salón maneja todo:

### ✅ Lo que se hizo

**1. Check-in Presencial con DNI (`/ingreso/:eventId`)**
- El invitado ingresa su DNI en un celular con QR en la entrada del salón.
- Si está en la lista → confirma asistencia y recibe número de sorteo.
- Si no está → completa formulario (Nombre, DNI, Teléfono, Email, Emprendimiento).
- Usa **transacciones atómicas de Firebase** para que los números de sorteo sean únicos y secuenciales, sin importar cuánta gente ingrese al mismo tiempo.

**2. Panel de Control Unificado (`ModerationPanel`)**
- El admin controla en tiempo real el modo de la pantalla:
  - `feed` → Carrusel de fotos
  - `ad` → Publicidad a pantalla completa (con temporizador)
  - `sorteo` → Ruleta animada con suspenso
- Gestión de publicidades: subir, previsualizar y eliminar anuncios.
- Lanzador del sorteo: controla los estados `waiting → drawing → finished`.

**3. Pantalla del Salón (`LiveMonitor`)**
- Reacciona en tiempo real a Firebase Realtime Database.
- Cuando el sorteo está en `drawing`: números y nombres corren a alta velocidad.
- Cuando el sorteo llega a `finished`: pantalla se detiene en el ganador + **lluvia de confetti** 🎊.

### ⏳ Pendientes para la próxima sesión

- [ ] **Prueba del flujo completo** — Correr `npm run dev` y probar todo de punta a punta.
- [ ] **Validación visual** del check-in (`/ingreso`) y pantalla de ganador (colores, fuentes).
- [ ] **Test de concurrencia** en la carga de anuncios publicitarios.
- [ ] **Bucle de publicidades** — Validar que el temporizador vuelve automáticamente al modo `feed`.

---

## ⚙️ Deploy Automático (GitHub Actions)

Cada `git push` a `main` dispara el workflow `.github/workflows/deploy.yml` que:

1. Compila las 3 apps React: `sorteo`, `live-feed` y `subasta-silenciosa`
2. Une todos los archivos en una carpeta `dist_final/`
3. Despliega todo a **GitHub Pages** en `estudioprecinto.com`

> El deploy tarda aprox. 2-3 minutos. Podés ver el progreso en la pestaña **Actions** del repositorio de GitHub.

**Secrets de GitHub configurados:**
| Secret | Usado en |
|--------|---------|
| `VITE_ADMIN_PASSWORD` | App de Sorteos (protege el panel de admin) |
| `VITE_MASTER_PASSWORD` | Live Feed (protege el dashboard maestro) |

---

## 🔌 API del Backend (Firebase Cloud Functions)

**Base URL:** `https://us-central1-estudio-precinto.cloudfunctions.net/api`

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/getAvailableSlots?date=YYYY-MM-DD` | Horarios libres de una fecha |
| `POST` | `/createBooking` | Crea la reserva y devuelve link de pago MP |
| `POST` | `/mercadopagoWebhook` | Webhook de confirmación de pago |

**Para desplegar el backend:**
```bash
cd nueva_version/functions
npm install
firebase deploy --only functions
```

**Para actualizar el token de Mercado Pago:**
```bash
cd nueva_version/functions
firebase functions:secrets:set MP_ACCESS_TOKEN
firebase deploy --only functions
```

---

## 🔐 Seguridad

| Capa | Medida |
|------|--------|
| **Token de Mercado Pago** | Firebase Secret Manager (`MP_ACCESS_TOKEN`) — nunca en el código |
| **CORS** | Restringido a `estudioprecinto.com` y `localhost` |
| **Rate Limiting** | 60 req/15min general · 5 reservas/IP/hora |
| **Validación** | Fecha, hora, email y todos los campos del usuario |
| **Sanitización** | Límite de longitud + stripping de HTML en Firestore |
| **GitHub Actions** | Permisos mínimos (`contents: read`) |

---

## 🧱 Stack Tecnológico

| Módulo | Tecnología |
|--------|-----------|
| Sitio principal | HTML5 + CSS3 Vanilla + JavaScript ES6+ |
| Animaciones | GSAP 3 + ScrollTrigger |
| Apps de eventos | React 18 + Vite + React Router v6 |
| Base de datos | Firebase Realtime Database + Firestore |
| Backend | Firebase Cloud Functions v2 + Express.js |
| Pagos | Mercado Pago SDK v2 |
| Hosting | GitHub Pages + Firebase Hosting |
| CI/CD | GitHub Actions |
| Fuentes | Space Grotesk + Inter (Google Fonts) |

---

## 📋 Tareas Pendientes Globales

Ver archivo [`nueva_version/PENDIENTES.md`](./nueva_version/PENDIENTES.md) para el detalle completo.

Resumen:
- [ ] **Google Analytics 4** — Crear cuenta y pegar el ID de medición en el `<head>`.
- [ ] **Pago de prueba real** — Validar el flujo completo de reserva + webhook + confirmación por mail.
- [ ] **Probar integración sorteo en Live Feed** (ver sección de arriba).

---

## 📞 Contacto

- **WhatsApp:** [+54 11 6448-1943](https://wa.me/541164481943)
- **Email:** roberto@estudioprecinto.com
- **Sitio:** [estudioprecinto.com](https://estudioprecinto.com)
- **Alianza Marketing:** [MoreMKT](https://morehdmkt.com/)

---

*Repositorio mantenido por Estudio Precinto · Última actualización: Agosto 2026*
