# Estado Actual del Proyecto (Live Feed & Evento)

**Fecha:** 27 de Agosto de 2026

## Últimas Modificaciones Realizadas

El día de hoy se realizaron las siguientes modificaciones de urgencia de cara al evento de esta noche:

1. **Cierre de Inscripciones (Cupo Completo):**
   - Se desactivó por completo el formulario de confirmación de asistencia (RSVP) en `live-feed/src/pages/Invitation.jsx` (Link de invitación online).
   - Se desactivó el formulario de registro para personas sin invitación previa (Walk-ins) en `live-feed/src/pages/Ingreso.jsx` (Escaneo de QR en la puerta).
   - En ambos casos, se reemplazó el formulario por un mensaje amigable indicando: *"¡Wow! Se agotaron los lugares 🤩"*, junto con botones para seguir a `@caminoemprendedorar` y `@latroncaldenordelta` en Instagram.
   - **Importante:** La base de datos de Firebase NO fue modificada. Todos los invitados que ya habían hecho RSVP mantienen su estado y su acceso a la cámara.

2. **Despliegue a Producción:**
   - Todos estos cambios front-end ya fueron compilados y subidos exitosamente a Firebase Hosting. El sistema está funcionando en producción con las inscripciones cerradas.

## Cómo hacer un nuevo Despliegue (Deploy) del Live-Feed

Si vas a continuar trabajando desde otra PC y necesitás subir nuevos cambios a producción (Firebase), el proceso está totalmente automatizado a través de un script de PowerShell.

**Pasos para desplegar:**

1. Cloná o bajá este repositorio (si estás en otra PC).
2. Asegurate de tener Node.js instalado.
3. Abrí la consola (Terminal / PowerShell) en la carpeta raíz del proyecto.
4. Ejecutá el siguiente comando:
   ```powershell
   .\build_and_deploy.ps1
   ```
5. **¿Qué hace este script?** 
   - Instala todas las dependencias necesarias de los diferentes módulos (Landing, Live-Feed, Sorteos).
   - Compila la versión optimizada para producción (`npm run build`) usando `Vite`.
   - Junta todo en una carpeta unificada llamada `dist_final`.
   - Se conecta automáticamente a Firebase y sube todo el contenido de `dist_final` al hosting de producción.
6. Una vez que la consola indique `+  Deploy complete!`, los cambios ya estarán online en el dominio oficial.
