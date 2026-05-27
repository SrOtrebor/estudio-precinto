# Estudio Precinto - Showcase V2

Esta es la nueva versión del sitio web ("Showcase") de **Estudio Precinto**, diseñada para reflejar un alto nivel de ingeniería de software a través de una experiencia interactiva premium.

El objetivo principal de esta landing page es actuar como un embudo de ventas dinámico, demostrando capacidad técnica desde el primer segundo.

## Tecnologías Utilizadas
- **HTML5 & CSS3** (Vanilla, sin frameworks pesados para máxima velocidad).
- **JavaScript Moderno** (ES6+).
- **GSAP (GreenSock Animation Platform)**: Motor principal de las animaciones.
- **GSAP ScrollTrigger**: Plugin utilizado para la sección de desplazamiento horizontal "Efecto Pinning".

## Estructura de Secciones

El flujo de lectura de la página está optimizado para la conversión:

1. **Hero Kinetic (`#hero`)**: Pantalla inicial con animaciones de texto y presentación de marca.
2. **Pricing Cards (`#precios`)**: Oferta comercial directa con 3 paquetes (Landing Page, Webs, Automatizaciones) enlazados a WhatsApp.
3. **Scroll Horizontal (`#horizontal-section`)**: Explicación de los servicios principales mediante un efecto de "pinning" donde la pantalla se mueve hacia los costados.
4. **Alianza de Marketing (`#marketing`)**: Bloque dedicado a la alianza estratégica con la agencia de Paid Media (MoreMKT).
5. **Ecosistema de Herramientas (`#herramientas`)**: Exhibición de productos de software propios listos para usar (Sorteo, Subasta, Live Feed).
6. **Portfolio Completo (`#portfolio`)**: Grilla interactiva mostrando los 7 casos de éxito principales (MentorHub, Tramando, Movaro, etc.).
7. **CTA Final (`#contacto`)**: Llamado a la acción masivo para agendar una asesoría de 15 minutos.
8. **Footer**: Enlaces institucionales (Quiénes Somos, Contactos, Alianzas, etc.).

## Elementos Interactivos Destacados
- **Cursor Magnético Personalizado (`#cursor`)**: Oculta el cursor del sistema operativo y lo reemplaza por un orbe que se adapta y reacciona "magnéticamente" cuando se acerca a un botón, utilizando una función `lerp` basada en `requestAnimationFrame`.
- **Fondo de Orbe Reactivo (`#bg-orb`)**: Un sutil resplandor en el fondo que persigue los movimientos del ratón en la pantalla.
- **Glassmorphism**: Efectos visuales de vidrio esmerilado translúcido (`backdrop-filter`) utilizados en las tarjetas y contenedores para aportar profundidad.

## Cómo Modificar
- **Estilos (`css/style.css`)**: Las variables principales de colores y fuentes se encuentran en el `:root` al principio del documento.
- **Animaciones y Lógica (`js/main.js`)**: Cualquier botón o enlace que requiera interactividad magnética solo necesita la clase CSS `.magnetic` (opcionalmente se puede definir la fuerza con el atributo `data-strength="20"`). Los elementos que deben aparecer con fade-in solo necesitan la clase `.reveal-fade`.
