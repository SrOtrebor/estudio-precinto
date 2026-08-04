# 🎰 App de Sorteo Real-Time: La Troncal

Esta aplicación es un sistema de sorteos en vivo desarrollado para el evento de **La Troncal** (AudioVisual & Radio) por **Estudio Precinto**. 

## 🚀 Tecnologías
*   **Frontend**: React 18 + Vite (SPA).
*   **Backend/Base de Datos**: Firebase Realtime Database.
*   **Despliegue**: GitHub Actions + GitHub Pages (Configurado para `estudioprecinto.com/sorteo`).

## 🛠️ Estructura y Vistas
1.  **Registro (`/`)**: Formulario mobile-first para capturar Nombre y WhatsApp. Asigna un ID numérico secuencial (1, 2, 3...) mediante transacciones atómicas en Firebase para garantizar que no haya números duplicados.
2.  **Monitor (`/monitor`)**: Interfaz para pantalla gigante. Cuenta con una animación de "shuffle digital" que muestra el caos de los números antes de aterrizar en el ganador final con efectos de confetti.
3.  **Admin (`/admin`)**: Dashboard privado para el control del sorteo. Permite:
    *   Iniciar sorteos con filtro automático de elegibles (nadie gana dos veces).
    *   Ver el historial de ganadores en tiempo real (marcados con 🏆).
    *   Exportar la base de datos completa a CSV.
    *   **Reset Total**: Limpia la base de datos y resetea el contador a 1 para nuevos eventos.

## ⚙️ Configuración Crítica del Proyecto

### Firebase (`src/firebase.js`)
La aplicación está conectada a la instancia real: `sorteo-camino-emprendedor`. 
*   **Database Rules**: Deben estar en `".read": true, ".write": true` durente el evento para permitir registros sin login.
*   **Modo Simulación**: El archivo contiene una lógica de Mock comentada que se puede usar para pruebas locales sin internet.

### Despliegue (`vite.config.js` y `App.jsx`)
Para que la App funcione correctamente en un subdirectorio (`/sorteo`), se configuró:
*   `base: '/sorteo/'` en Vite.
*   `basename="/sorteo"` en el BrowserRouter de React.

### Automatización
Cada "push" a la rama `main` dispara un flujo en **GitHub Actions** (`.github/workflows/deploy.yml`) que construye (`npm run build`) y publica la carpeta `dist` automáticamente.

## 📝 Notas para el Próximo Agente/Desarrollador
*   **Reset de Prueba**: Antes del evento real, se debe ejecutar el "RESET TOTAL" desde el panel de Admin para borrar los registros de prueba.
*   **Escalabilidad**: El sistema está diseñado para soportar hasta 400+ personas con latencia mínima gracias a la sincronización instantánea de Firebase.
*   **Seguridad**: Tras el evento, se recomienda actualizar las reglas de Firebase a `false` o eliminar la instancia si no se va a usar más.

---
*Desarrollado con ❤️ por **Antigravity** para **Estudio Precinto**.*
