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

## 📌 Módulos Implementados

*   **Dashboard Maestro:** Gestión centralizada de eventos, packs y contraseñas.
*   **Monitor en Vivo:** Diseño premium con fondo blur, modo collage automático y branding dinámico.
*   **Invitación Interactiva:** RSVP, Mapa y Wishlist con reserva en tiempo real.
*   **Moderación:** Control de fotos y exportación de reportes (CSV).
*   **Álbum PDF:** Generación automática de fotolibro digital optimizado para A4.

## 🛠 Tareas Pendientes (Roadmap)

### 1. Control de Acceso por RSVP (Seguridad)
Implementar una validación cruzada para que solo los invitados registrados puedan subir fotos:
- Crear una lógica que compare el número de teléfono ingresado en el acceso a la cámara con los datos almacenados en el nodo `rsvp` del evento.
- El teléfono debe actuar como ID único para la validación.
- Impedir el acceso a la cámara si el teléfono no figura como "Confirmado".

### 2. Notificaciones en Tiempo Real
- Avisar al moderador cuando ingresa una nueva foto para aprobación.

---
*Mantenido por Estudio Precinto - 2024*
