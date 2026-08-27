# 🚀 Manual del Evento: Live Feed & Sorteo

Este documento detalla el flujo de funcionamiento, la arquitectura final y las instrucciones de uso para el lanzamiento oficial de los eventos de Estudio Precinto (ej. La Troncal).

## 🌍 Arquitectura y Despliegue (Actualizado)

Debido a problemas de latencia y bloqueos con GitHub Pages, **toda la plataforma web (landing, live-feed, sorteos) ha sido migrada a Firebase Hosting**.

- **Dominio Oficial:** `https://estudioprecinto.com` (Redirigido vía DNS desde Donweb hacia Firebase).
- **Hosting Frontend:** Firebase Hosting (Tiempos de respuesta de milisegundos, candado SSL automático).
- **Base de Datos:** Firebase Realtime Database (Escalado testeado para +500 usuarios concurrentes sin demoras).

### ¿Cómo actualizar la página en el futuro?
Para subir cambios de código a producción, simplemente debés ejecutar el script de despliegue desde la consola:
```powershell
.\build_and_deploy.ps1
```
*Este comando compilará todas las carpetas y las subirá instantáneamente a Firebase.*

---

## 📱 Flujo del Usuario (El Invitado)

1. **Recepción de Invitación:** El usuario entra al link del evento (ej: `estudioprecinto.com/live-feed/#/invitacion/ID_DEL_EVENTO`).
2. **RSVP:** Completa sus datos (DNI, Nombre, Teléfono, Emprendimiento). Su cámara permanece bloqueada.
3. **Día del Evento (Check-In):** El usuario escanea el código QR físico en la puerta del salón.
   - Si ya hizo RSVP: El sistema lo detecta por su DNI, le da la bienvenida y le asigna un número de sorteo.
   - Si no hizo RSVP (Walk-in): Llena el formulario ahí mismo y se le asigna el número de sorteo.
4. **Interacción:** Una vez hecho el check-in, se habilita la cámara en su celular. Puede sacar fotos, las cuales se envían al Panel de Moderación.

---

## 👨‍💻 Flujo del Moderador (El Staff)

El moderador controla todo lo que sucede en la pantalla gigante desde el Panel de Moderación: `estudioprecinto.com/live-feed/admin`

### 1. Pestañas de Control
- **Todas / Pendientes / En Pantalla:** Permite aprobar o rechazar (ocultar/borrar) las fotos que sacan los invitados en tiempo real.
- **Asistencia (RSVPs):** Lista en vivo de quiénes van llenando el formulario de invitación.
- **Ganadores:** Una pestaña exclusiva (`🏆 Ganadores del Sorteo`) que filtra y muestra **únicamente** a las personas que ganaron algún premio durante la noche.

### 2. Control de Pantalla (Monitor)
Desde la pestaña **Pantalla & Sorteo (📺)**, el moderador puede forzar qué se muestra en la pantalla gigante (`estudioprecinto.com/live-feed/monitor`):
- **📸 Modo Feed:** Muestra el carrusel animado de las fotos aprobadas de los invitados.
- **💸 Modo Publicidad:** Interrumpe las fotos y muestra a pantalla completa los videos/imágenes de los sponsors cargados.
- **🎰 Modo Sorteo:** Lanza la animación de ruleta en vivo para elegir un ganador entre los que hicieron check-in en la puerta.

### 3. Reportes y Exportación
En cualquier momento de la noche, o al día siguiente, el moderador puede:
- **Descargar Excel:** Desde la pestaña *Ganadores* o *Asistencia*, presionando el botón "Exportar Excel". El archivo descargado incluye:
  - Formato premium y colores de marca.
  - **Filtros de búsqueda automáticos (Auto-Filters)** en la fila de encabezados para buscar rápidamente por DNI, Nombre o Estado de Sorteo.
- **Descargar Fotos:** Permite bajar un archivo `.zip` con todas las fotos en alta calidad que sacó la gente durante la fiesta.

---

## 🧪 Pruebas de Carga Realizadas
Se ejecutó un script de simulación masiva (`load-test.mjs`) inyectando **500 usuarios concurrentes** realizando acciones en simultáneo (Check-ins, RSVPs y subida de fotos).
- **Resultado:** 100% Aprobado. 0 Errores.
- **Tiempos de respuesta:** < 200ms por acción. La base de datos Firebase Realtime Database no sufrió cuellos de botella.

> [!TIP]
> **Recomendación para el evento:** Tené siempre una computadora con buena conexión a internet dedicada exclusivamente a proyectar el **Monitor** a pantalla completa (`F11`), y usá un dispositivo distinto (celular, tablet u otra PC) para manejar el **Panel de Moderación**.
