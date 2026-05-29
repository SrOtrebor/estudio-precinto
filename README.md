# 📦 Estudio Precinto — Repositorio Principal

Repositorio monorepo que contiene el sitio web oficial de la agencia de desarrollo, la landing page con pasarela de pagos integrada, y los módulos de herramientas de software para clientes.

🌐 **[estudioprecinto.com](https://estudioprecinto.com/)**

---

## 🚀 Última Gran Actualización (Refactorización V2)

La página principal del sitio ha sido auditada y optimizada profundamente, integrando su código base en la raíz del proyecto (reemplazando al `index.html` original, el cual fue respaldado como `index_viejo.html`).

Las mejoras implementadas incluyen:

### 1. Rendimiento y SEO Avanzado (A11Y)
- **JSON-LD Dinámico:** Implementación de metadatos estructurados para Google (LocalBusiness, OfferCatalog), incluyendo geolocalización y listado de servicios.
- **Lazy Loading y WebP:** Migración de imágenes de fondo (CSS) a etiquetas `<img>` reales con carga diferida (`loading="lazy"`) para acelerar la carga del sitio.
- **Etiquetas Semánticas:** Mejora de la estructura HTML con roles ARIA para mejorar la accesibilidad a lectores de pantalla.

### 2. Ciberseguridad y Buenas Prácticas
- **Subresource Integrity (SRI):** Añadidos hashes criptográficos a los scripts de GSAP y ScrollTrigger para prevenir inyecciones de código de terceros.
- **Seguridad en Enlaces:** Se añadió `rel="noopener noreferrer"` en todos los enlaces externos para evitar ataques de *tabnabbing*.
- **Limpieza de Código Inline:** Se extrajeron los eventos `onclick` de los botones HTML para convertirlos en _event listeners_ centralizados y seguros en `main.js`.

### 3. Automatización de Precios
- **Sistema de Precios Global:** Se creó una lógica en `main.js` que extrae dinámicamente los precios desde el objeto JSON-LD principal y los inyecta en los botones de reserva y catálogo de la web. Esto permite cambiar los precios en un solo lugar y que impacten en todas las pantallas.

### 4. Portfolio y Contenido
- **Imágenes Reales:** Se reemplazaron los *mockups* genéricos del portfolio por capturas de pantalla reales de los clientes (Instalaciones SL, More HD MKT, Academia Maleki).
- **Redacción Precisada:** Ajustes finos de copy, limpieza de secciones (removidas menciones a CRM y facturación electrónica) y actualización de correo de contacto general a `roberto@estudioprecinto.com`.
- **Botones Modales:** Corrección de estilos desfasados (`btn-primary` a `btn-gold`) en los popups de las herramientas de software.

---

## 📂 Arquitectura de Submódulos

| Carpeta / Módulo | Descripción | Tecnología |
|---|---|---|
| `/` (Raíz) | Sitio principal de Estudio Precinto. | HTML + Vanilla JS + CSS |
| `nueva_version/` | Base de código que contiene los estilos (`css/`), scripts (`js/`) y lógica de Firebase (`modulo_reserva_pago/`). | Firebase, HTML, JS |
| `sorteo/` | Plataforma de sorteos en vivo. | React + Vite |
| `subasta-silenciosa/` | Sistema de subasta silenciosa para eventos. | React + Firebase RTDB |
| `live-feed/` | Live feed e invitaciones digitales para eventos. | React + Firebase RTDB |
| `curso-maleki/` | Sitio web de la Academia Maleki. | HTML estático |

## 🛠️ Despliegue

El despliegue es completamente automático al hacer *push* a la rama `main` utilizando GitHub Actions / Firebase.
Para modificar la web principal, los archivos vitales a editar son `index.html` (ubicado en la raíz) y sus dependencias en `nueva_version/css/` y `nueva_version/js/`.
