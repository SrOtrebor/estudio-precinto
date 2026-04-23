# Social Live Feed - Estudio Precinto 📸

Módulo comercial para proyecciones interactivas en vivo en eventos (bodas, 15 años, corporativos). Los invitados suben fotos sin necesidad de instalar apps, y estas se proyectan en tiempo real en la pantalla del salón.

## 🚀 Arquitectura

*   **Frontend:** React + Vite (Alojado en Firebase Hosting o Vercel)
*   **Base de Datos:** Firebase Realtime Database (Tiempo real ultrarrápido y aislamiento de eventos)
*   **Almacenamiento:** Firebase Storage (Almacena fotos originales, banners y videos)
*   **Procesamiento:** Canvas API (Compresión de imágenes y marcas de agua **100% en el lado del cliente** para reducir costos de servidor y ancho de banda).

## 💻 Entorno de Desarrollo (Setup en otra PC)

Para continuar desarrollando o ejecutar el proyecto en una nueva computadora, seguí estos pasos:

### 1. Requisitos Previos
*   Tener **Node.js** instalado (versión 18 o superior).
*   Tener Git instalado.

### 2. Instalación
1. Clona el repositorio si aún no lo tenés.
2. Abrí la terminal y navegá hasta la carpeta del proyecto:
   ```bash
   cd "Estudio Precinto/live-feed"
   ```
3. Instalá las dependencias:
   ```bash
   npm install
   ```

### 3. Configuración de Variables de Entorno
Crea un archivo llamado `.env` en la raíz de la carpeta `live-feed` (junto al package.json) con las variables secretas necesarias.
*Nota: El archivo `.env` está excluido del control de versiones por seguridad.*

El archivo `.env` debe contener:
```env
# Contraseña maestra para acceder al Dashboard de Creación de Eventos
VITE_MASTER_PASSWORD=tu_contraseña_maestra_aqui
```

### 4. Ejecutar Localmente
Inicia el servidor de desarrollo Vite:
```bash
npm run dev
```
La aplicación se abrirá en `http://localhost:5173/`.

## 📌 Estructura de Rutas y Componentes

La aplicación funciona bajo el concepto de **Aislamiento Multi-Evento**. Cada ruta recibe un `:eventId` que encapsula su información.

*   `/#/admin-maestro` -> **Dashboard Maestro:** Creación de nuevos eventos y selección de Packs (Base, Premium, Corporativo). Protegido por `VITE_MASTER_PASSWORD`.
*   `/#/invitacion/:eventId` -> **Landing de Invitación:** Pantalla pública, contador regresivo y formulario de confirmación de asistencia (RSVP).
*   `/#/foto/:eventId` -> **App del Invitado:** Captura de fotos desde el navegador, procesamiento con marca de agua (según el Pack) y subida con soporte para cortes de internet (Cola Offline).
*   `/#/monitor/:eventId` -> **Pantalla del Salón:** Fullscreen para proyector. Escucha en tiempo real. Soporta proyección de banners de imágenes y videos `.mp4` para el Pack Corporativo.
*   `/#/moderar/:eventId` -> **Panel de Control:** Pantalla protegida por contraseña para el fotógrafo/DJ. Permite aprobar/borrar fotos, ver los RSVP y habilitar/pausar la cámara de los invitados mediante un Kill-Switch en tiempo real.
*   `/#/galeria/:eventId` -> **Galería Post-Evento:** Grilla de fotos descargable en ZIP.

## ☁️ Firebase Config

Las credenciales de Firebase están embebidas en `src/firebase.js`. Asegúrate de que el proyecto `live-feed-precinto` tenga activos:
1.  **Realtime Database:** Modo prueba / configurado para desarrollo.
2.  **Storage:** Plan Blaze activado (requerido para subir archivos).

*Hecho con ♥ por el equipo de ingeniería.*
