# Subasta Silenciosa Digital - Fundación Nordelta

Sistema de subasta silenciosa en tiempo real desarrollado con React y Firebase Realtime Database.

## User Review Required

**Autenticación / Seguridad**: El requerimiento indica "No necesitamos contraseña. La sesión debe mantenerse activa vía LocalStorage". Esto significa que cualquier persona que conozca la URL podrá registrarse y pujar. Es importante considerar que si un usuario borra su LocalStorage o usa modo incógnito, podrá registrarse de nuevo como un usuario distinto.

**Exportación a CSV**: Para el Dashboard de Administración, implementaré la exportación a CSV directamente en el frontend, recopilando los datos de los usuarios y sus pujas más altas. Esto requiere descargar los nodos de `users` y `bids`.

## Open Questions

1. **Moneda y formato**: ¿El formato de la moneda debe llevar el símbolo de peso (AR$) y separadores de miles (ej: $ 100.000)?
2. **Monto Inicial**: ¿Existe un monto inicial base para la subasta antes de que alguien puje, o empieza desde cero?
3. **Múltiples Artículos**: Entiendo por la descripción ("El Módulo de Subasta", "Monto actual") que se subasta **un solo artículo o experiencia** (o una bolsa en general). ¿Es correcto, o necesitan soportar múltiples lotes/ítems a la vez?

## Proposed Changes

### Firebase Schema & Logic
Estructura propuesta para la base de datos (Realtime Database):
- `/auction/status`: 'open' o 'closed'
- `/auction/currentBid`: Número entero (ej: 100000)
- `/auction/highestBidder`: ID del usuario que va ganando
- `/bids/{bidId}`: `{ userId, amount, timestamp, status }` (Historial de pujas)
- `/users/{userId}`: `{ name, phone, email, registeredAt }` (Datos de registro)

### Routing (React Router)
- `/`: Pantalla de registro. Si el usuario ya está en LocalStorage, redirige a `/pujar`.
- `/pujar`: Interfaz del Cliente (Celular).
- `/monitor`: Interfaz del Monitor (Vista Pública / Salón).
- `/admin`: Dashboard de Administración.

---

### src/components/Register.jsx
Formulario de registro inicial:
- Captura Nombre, Teléfono (valida que solo contenga números o símbolos básicos de WhatsApp) y Correo Electrónico.
- Guarda los datos en `localStorage` (ej: `silent_auction_user`).
- Registra el usuario en el nodo `/users` de Firebase con un ID único.

### src/components/BidClient.jsx
Interfaz 100% responsiva para el donante:
- Muestra el estado de la subasta y el monto actual en tiempo real.
- Calcula el monto mínimo sugerido (`Monto Actual * 1.10`).
- Botón gigante de "Pujar".
- Usa `runTransaction` de Firebase para evitar condiciones de carrera (concurrencia). Si la transacción falla porque alguien más pujó en el mismo milisegundo, muestra el error: "¡Monto actualizado! La nueva base es [Monto_Actual + 10%]".
- Muestra un mensaje de éxito si va ganando.

### src/components/Monitor.jsx
Pantalla para el salón (TV/Proyector):
- Diseño Dark Mode.
- Número GIGANTE con el `currentBid`.
- Efecto de "Flash" visual cada vez que cambia el `currentBid`.
- Historial dinámico de las últimas 3 pujas (leyendo el nodo `/bids` ordenado por timestamp).

### src/components/Admin.jsx
Dashboard para el staff:
- Botón "Cerrar Subasta" que actualiza `/auction/status` a 'closed' (bloquea nuevas pujas en el cliente).
- Botón "Exportar Datos" que genera un archivo CSV cruzando la tabla de `/users` con `/bids` o determinando el ganador final.

### src/App.jsx
- Reemplazar el contenido actual de Vite por la configuración de `<Router>` y las rutas a los nuevos componentes.
- Configurar layout global básico.

### src/index.css
- Agregar variables y estilos base para el Dark Mode del monitor.
- Ajustar clases de utilidad para tipografía responsiva y animaciones (el 'flash' del monitor).

## Verification Plan

### Manual Verification
1. **Registro**: Entrar a `/`, registrar un usuario y verificar que se guarde en Firebase y LocalStorage.
2. **Pujas Simultáneas**: Abrir `/pujar` en dos pestañas/navegadores distintos y enviar una puja exactamente al mismo tiempo o por debajo del mínimo para comprobar que la transacción rechaza el intento inválido.
3. **Monitor en Vivo**: Abrir `/monitor` y confirmar que las actualizaciones lleguen inmediatamente (vía WebSocket) con la animación de flash y la lista de historial actualizada.
4. **Cierre de Subasta**: Desde `/admin`, cerrar la subasta y comprobar que el cliente `/pujar` ya no permite enviar nuevas ofertas.
5. **Exportación**: Probar la descarga del archivo CSV para asegurar que los datos estén correctamente formateados.
