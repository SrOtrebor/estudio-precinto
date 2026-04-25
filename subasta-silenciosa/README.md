# 🏆 Sistema de Subasta Silenciosa - Fundación Nordelta

Sistema profesional de subastas en tiempo real diseñado para la **Noche Solidaria 2026**. Esta plataforma permite gestionar múltiples lotes de subasta, patrocinadores y pujas simultáneas con una estética premium y editorial.

## 🚀 Características Principales

### 📱 Cliente de Puja (Bidders)
- **Registro Simplificado**: Acceso rápido para invitados con validación local.
- **Pujas en Tiempo Real**: Sistema de transacciones atómicas que garantiza que no se pisen las ofertas.
- **Lógica de Incremento**: Cálculo automático del 5% mínimo sobre la oferta actual para agilizar la dinámica.
- **Feedback Visual**: Alertas instantáneas de éxito o "superado" (outbid).

### 🖥️ Monitor de Evento (Gala View)
- **Modo Dual Inteligente**: Intercambio dinámico entre banners de patrocinadores y alertas de pujas.
- **Animación de Impacto**: Cuando entra una puja, el precio "vuela" al centro de la pantalla y se agranda, mientras el banner pasa a un plano secundario.
- **Sidebar Permanente**: Lista lateral con todos los lotes y sus precios actuales siempre visibles.
- **Estética Premium**: Fondo animado de estrellas ("Night Gala"), tipografía Montserrat y paleta institucional (Azul #0c162d y Oro #E09F3E).

### 🛠️ Dashboard Administrativo
- **Gestión de Artículos**: CRUD completo con carga directa de imágenes a Firebase Storage.
- **Control de Sponsors**: Gestión de logos y videos promocionales.
- **Exportación de Datos**: Generación de reportes CSV con el historial de pujas y leads de usuarios.
- **Control de Subasta**: Posibilidad de abrir/cerrar lotes en tiempo real.

## 🛠️ Tecnologías Utilizadas

- **Frontend**: React 19 + Vite (Rápido y eficiente).
- **Estilos**: CSS3 Puro con variables personalizadas y diseño responsivo.
- **Animaciones**: Framer Motion (Transiciones de layout y micro-interacciones).
- **Backend**: 
  - **Firebase Realtime Database**: Sincronización instantánea de datos.
  - **Firebase Storage**: Almacenamiento optimizado de imágenes y videos.
- **Iconografía**: Lucide React.

## 📁 Estructura del Proyecto

```text
/src
  /assets         # Logos e imágenes institucionales
  /components
    - Monitor.jsx     # La "pieza maestra" para proyectar en el evento
    - BidClient.jsx   # Interfaz para los celulares de los invitados
    - Dashboard.jsx  # Panel de control administrativo
    - Register.jsx   # Pantalla de ingreso para usuarios
  - firebase.js      # Configuración y conexión con la nube
  - index.css        # Sistema de diseño y tokens de color
```

## ⚙️ Configuración y Despliegue

El proyecto está configurado para desplegarse automáticamente vía **GitHub Actions** en la URL principal del estudio. Utiliza un sistema de `HashRouter` para garantizar la compatibilidad con rutas en servidores estáticos.

---
Desarrollado con ❤️ por **Estudio Precinto** para la **Fundación Nordelta**.
