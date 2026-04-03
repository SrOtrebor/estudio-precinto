# Manual de Funcionamiento - La Troncal Sorteos

Este documento detalla el funcionamiento técnico de las últimas mejoras para el evento de sorteos.

## 1. Funcionamiento de Sorteos Múltiples

### Asignación de Premios
El sistema detecta automáticamente cuántos premios se han entregado antes de cada sorteo. Al elegir un ganador:
- El administrador calcula: `premios_anteriores + 1`.
- Se asigna un `prizeNumber` (ej: 1, 2, 3...) al perfil del ganador en Firebase.

### Pantalla de Ganadores (Celulares)
- **Persistencia**: Si el celular detecta que el usuario ya ganó (`isWinner: true`), mostrará **siempre** la pantalla de victoria ("¡GANASTE! PREMIO #X").
- El usuario **no verá** la ruleta ni mensajes de derrota en sorteos siguientes.

## 2. Monitor de Visualización (Pantalla LED)
- **Historial**: Se muestra una barra en la parte inferior con los últimos 10 ganadores.
- **Relatividad**: Los tamaños de fuente y logo usan unidades `vh` (vertical height). Esto asegura que en pantallas LED grandes el diseño NO se pise y mantenga las proporciones.

## 3. Seguridad y Reset
- **SessionId**: Cada vez que se hace un "Reset Total" desde el Admin, cambia el ID de sesión.
- **Auto-Limpieza**: Los celulares conectados comparan su sesión local con la de Firebase. Si no coinciden, limpian su memoria (localStorage) y vuelven al registro. Esto evita el error de "ya estoy registrado" tras un borrado de base de datos.
- **Duplicados**: El registro impide que un mismo número de WhatsApp obtenga dos números de sorteo.

## 4. Datos Técnicos
- **Base de Datos**: Firebase Realtime Database.
- **Hosting**: GitHub Pages (se actualiza automáticamente al subir cambios a la rama `main`).
- **Contraseña Admin**: `troncal2025`.
