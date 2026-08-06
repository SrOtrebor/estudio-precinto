# Plan de Implementación: Integración de Live-Feed, Sorteos y Publicidad

El objetivo es fusionar la capacidad de los sorteos y la proyección de publicidad directamente dentro del ecosistema de Live-feed.

## Fases del Proyecto

### Fase 1: Resguardo (Completado ✅)
- [x] Crear copias de seguridad de las carpetas originales.

### Fase 2: Control de Pantalla y Publicidad (En progreso)
- [x] Ampliar el estado de Firebase: `events/{eventId}/monitorState` (modos: feed, sorteo, ad).
- [x] Actualizar `ModerationPanel.jsx` con controles de pantalla, gestión de publicidad y lanzar sorteo.
- [ ] Implementar el bucle automático de publicidades en el monitor y regreso al feed.

### Fase 3: Registro Presencial con DNI (Check-in)
- [ ] Crear nueva vista o modal para el ingreso presencial (ej. `/ingreso/:eventId`).
- [ ] Lógica: Input de DNI.
    - **Camino A**: Si el DNI está en la lista de invitados (`rsvp`), confirmar asistencia y asignar número de sorteo.
    - **Camino B**: Si el DNI no está, mostrar formulario de alta.
- [ ] **Formulario de Alta**: Pedir Nombre, DNI y **Emprendimiento (Opcional)**. Al enviar, guardar en Firebase y asignar número de sorteo.

### Fase 4: Integración Visual del Sorteo
- [ ] Migrar componentes visuales del sorteo (ruleta, confetti, sonidos) a `LiveMonitor.jsx`.
- [ ] Renderizar condicionalmente según el estado de `monitorState`.
