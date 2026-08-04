# Integración de Sorteo y Live-Feed (Documentación)

**Fecha:** 30 de Julio, 2026

## Resumen del Proyecto
Se llevó a cabo la integración del módulo independiente de sorteos (anteriormente en la carpeta `sorteo/`) directamente dentro de la aplicación principal `live-feed`. El objetivo principal fue centralizar la experiencia del evento, usando la misma pantalla gigante (`LiveMonitor`) tanto para mostrar fotos (Live Feed), anuncios publicitarios rotativos, y el Sorteo Final. 

Se realizaron copias de seguridad de las carpetas originales (`live-feed_backup_original` y `sorteo_backup_original`) antes de comenzar.

## Fases Implementadas

### Fase 1: Consolidación de Panel de Control (ModerationPanel.jsx)
Se actualizó el panel del administrador (`/moderar/:eventId`) para manejar no solo la aprobación de fotos, sino también:
- **Control de Modo de Pantalla:** Se integró el nodo `monitorState` (modos: `feed`, `ad`, `sorteo`).
- **Gestión de Publicidad:** Interfaz para subir, visualizar y eliminar anuncios.
- **Lanzador de Sorteo:** Botones para cambiar la pantalla a "Modo Sorteo", lanzar el sorteo animado, e interactuar con Firebase (`drawStatus` pasa de `waiting` -> `drawing` -> `finished`).

### Fase 2: Control de Pantalla y Publicidad (LiveMonitor.jsx)
La pantalla grande ahora reacciona en tiempo real a Firebase:
- Si el administrador lanza un anuncio (modo `ad`), las fotos se pausan y se muestra el banner o video a pantalla completa.
- Se programó un temporizador de rotación que muestra el anuncio y al finalizar, actualiza automáticamente la base de datos para regresar al modo `feed`.

### Fase 3: Registro Presencial con DNI (Ingreso.jsx)
Se construyó la nueva ruta `/ingreso/:eventId` enfocada a mobile, destinada al escaneo de códigos QR en la entrada del salón:
1. **Paso 1 (DNI):** El invitado ingresa su DNI. El sistema lo busca en la base de datos de RSVP.
2. **Paso 2 (Validación):**
   - **Camino A (Ya registrado):** Se confirma su asistencia, se le asigna un número de sorteo único de forma atómica y se le da la bienvenida.
   - **Camino B (Nuevo):** Si el DNI no está, se le pide rellenar Nombre, DNI, Teléfono, Correo, y Emprendimiento (opcional). Al enviar, se guarda su RSVP y se le asigna el número de sorteo.
3. Se integraron transacciones de Firebase (`runTransaction`) sobre un nodo contador (`counters/raffleNumber`) para asegurar que los números de sorteo (IDs) sean 100% secuenciales y únicos.

### Fase 4: Integración Visual del Sorteo (LiveMonitor.jsx)
Se migró la lógica de la ruleta visual de números:
- Se añadió la dependencia `canvas-confetti`.
- Cuando la pantalla entra en modo `sorteo` y el status es `drawing`, los números y nombres de los participantes corren a alta velocidad (suspenso).
- Cuando el panel define un `winnerId` y cambia el estado a `finished`, la pantalla se detiene en el ganador y dispara el efecto de lluvia de confetti de colores.

## Dependencias Instaladas
- `canvas-confetti` (en la carpeta `live-feed/`)

## Siguientes Pasos (Para mañana)
1. Probar el flujo completo subiendo el entorno de desarrollo local (`npm run dev`).
2. Validar estéticamente los colores y fuentes del ingreso presencial y el panel de ganador para que coincidan perfectamente con la línea visual solicitada.
3. Hacer testeos de concurrencia en la carga de anuncios.

---
*Documentación generada y actualizada por IA. ¡Buenas noches!*
