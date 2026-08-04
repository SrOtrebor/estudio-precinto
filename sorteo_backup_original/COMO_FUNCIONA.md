# Manual de Funcionamiento - La Troncal Sorteos

Este documento detalla el funcionamiento técnico del sistema de sorteos en vivo.

---

## 1. Funcionamiento de Sorteos Múltiples

### Asignación de Premios
El sistema detecta automáticamente cuántos premios se han entregado antes de cada sorteo. Al elegir un ganador:
- El administrador calcula: `premios_anteriores + 1`.
- Se asigna un `prizeNumber` (ej: 1, 2, 3...) al perfil del ganador en Firebase.

### Pantalla de Ganadores (Celulares)
- **Persistencia**: Si el celular detecta que el usuario ya ganó (`isWinner: true`), mostrará **siempre** la pantalla de victoria ("¡GANASTE! PREMIO #X").
- El usuario **no verá** la ruleta ni mensajes de derrota en sorteos siguientes.

---

## 2. Monitor de Visualización (Pantalla LED)
- **Historial**: Se muestra una barra en la parte inferior con los últimos 10 ganadores.
- **Relatividad**: Los tamaños de fuente y logo usan unidades `vh` (vertical height). Esto asegura que en pantallas LED grandes el diseño NO se pise y mantenga las proporciones.

---

## 3. Seguridad y Reset
- **SessionId**: Cada vez que se hace un "Reset Total" desde el Admin, cambia el ID de sesión.
- **Auto-Limpieza**: Los celulares conectados comparan su sesión local con la de Firebase. Si no coinciden, limpian su memoria (localStorage) y vuelven al registro. Esto evita el error de "ya estoy registrado" tras un borrado de base de datos.
- **Duplicados**: El registro impide que un mismo número de WhatsApp obtenga dos números de sorteo.

---

## 4. Contraseña del Panel de Administración

La contraseña del admin **no está escrita en el código** (por seguridad).
Se gestiona en dos lugares:

| Entorno | Cómo se configura |
|---|---|
| **Local** (tu computadora) | En el archivo `sorteo/.env.local` (este archivo NO se sube a GitHub) |
| **Producción** (GitHub Pages) | Como Secret en GitHub → Settings → Secrets → `VITE_ADMIN_PASSWORD` |

> ⚠️ Si cambiás la contraseña, tenés que actualizarla en **ambos lugares**.

---

## 5. Datos Técnicos

- **Base de Datos**: Firebase Realtime Database
- **Hosting**: GitHub Pages (se actualiza automáticamente al subir cambios a la rama `main`)
- **Framework**: React + Vite
- **Validación de teléfonos**: libphonenumber-js (formato argentino)

---

## 6. Historial de Cambios

### v2.1 — Abril 2026 (Optimización y Seguridad)
- **Seguridad**: La contraseña del admin se movió a una variable de entorno (`VITE_ADMIN_PASSWORD`). Ya no está visible en el código fuente.
- **Bug fix**: Se agregó el `import` faltante de `canvas-confetti` en `Monitor.jsx`. El festejo de ganador en la pantalla grande ahora funciona de forma garantizada.
- **Rendimiento**: Se eliminó un listener duplicado de Firebase en `Monitor.jsx` que abría una segunda conexión innecesaria cada vez que se detectaba un ganador.
- **Rendimiento**: Se reemplazó una búsqueda de array repetida en `Register.jsx` por `useMemo`, evitando recálculos en cada render.
- **Calidad**: Todas las animaciones CSS (`@keyframes`) se centralizaron en `index.css` en lugar de estar duplicadas en múltiples componentes.
- **Deploy**: Se reemplazó `npm install` por `npm ci` en el pipeline de GitHub Actions para builds más rápidos y deterministas.
- **HTML**: Se corrigió el idioma de la página a `lang="es"` y se eliminó un tag de favicon duplicado.
