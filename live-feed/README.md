# Social Live Feed - Estudio Precinto 📸

Módulo comercial para proyecciones interactivas en vivo en eventos (bodas, 15 años, corporativos). Los invitados suben fotos sin necesidad de instalar apps, y estas se proyectan en tiempo real en la pantalla del salón.

## 🚀 Arquitectura y Tecnologías

*   **Frontend:** React + Vite
*   **Base de Datos:** Firebase Realtime Database
*   **Almacenamiento:** Firebase Storage
*   **Procesamiento:** Canvas API (Compresión de imágenes en el cliente a 1200px máx).

## 💻 Entorno de Desarrollo (Setup en otra PC)

Para continuar desarrollando o ejecutar el proyecto en una nueva computadora:

### 1. Requisitos Previos
*   **Node.js** (v18+) e **npm**.
*   **Git**.

### 2. Instalación
```bash
git clone https://github.com/SrOtrebor/estudio-precinto.git
cd estudio-precinto/live-feed
npm install
```

### 3. Configuración (.env)
Crea un archivo `.env` en la raíz de la carpeta `live-feed`:
```env
VITE_MASTER_PASSWORD=tu_contraseña_maestra
```

### 4. Ejecución
```bash
npm run dev
```

## 📌 Funcionalidades Principales

*   **Dashboard Maestro:** Creación de eventos, gestión de Packs y contraseñas.
*   **Monitor en Vivo:** Diseño moderno con fondo desenfocado, **Modo Collage Automático** cada 8 fotos y branding de Estudio Precinto.
*   **Invitación Interactiva:** Mapa dinámico (Iframe o dirección), RSVP y **Wishlist (Lista de Regalos)** con reserva en tiempo real.
*   **Panel de Moderación:** Control total de fotos, exportación de asistentes y regalos en CSV.
*   **Generador de Álbum PDF:** Exportación de fotolibro digital listo para entregar al cliente.

## ☁️ Notas de Firebase
El proyecto utiliza Firebase en modo cliente. Asegúrate de que las reglas de seguridad permitan la escritura en `livefeed/` y que el plan de Storage sea Blaze si esperas mucho tráfico de imágenes.

---
*Mantenido por Estudio Precinto*
