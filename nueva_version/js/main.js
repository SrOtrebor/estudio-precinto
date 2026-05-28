document.addEventListener("DOMContentLoaded", () => {
    // Registro de plugins GSAP
    gsap.registerPlugin(ScrollTrigger);

    // 1. FOOTER YEAR
    const yearSpan = document.getElementById('year');
    if (yearSpan) yearSpan.textContent = new Date().getFullYear();

    // 2. CURSOR Y FONDO (ORB)
    const cursor = document.getElementById('cursor');
    const orb = document.getElementById('bg-orb');
    let mouseX = 0, mouseY = 0;
    let orbX = 0, orbY = 0;

    // Actualizar posición del mouse
    window.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        
        // Mover cursor directamente
        if(cursor) {
            cursor.style.left = mouseX + 'px';
            cursor.style.top = mouseY + 'px';
        }
    });

    // Animar el Orbe con un pequeño retraso (lerp) para que sea suave
    function animateOrb() {
        if(orb) {
            orbX += (mouseX - orbX) * 0.05;
            orbY += (mouseY - orbY) * 0.05;
            orb.style.left = orbX + 'px';
            orb.style.top = orbY + 'px';
        }
        requestAnimationFrame(animateOrb);
    }
    animateOrb();

    // 3. EFECTO MAGNÉTICO EN BOTONES
    const magnetics = document.querySelectorAll('.magnetic');
    
    magnetics.forEach(btn => {
        btn.addEventListener('mousemove', (e) => {
            const rect = btn.getBoundingClientRect();
            const strength = btn.dataset.strength || 20; // Fuerza del imán
            
            // Calcular posición del mouse relativa al centro del botón
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            
            gsap.to(btn, {
                x: (x / rect.width) * strength,
                y: (y / rect.height) * strength,
                duration: 0.3,
                ease: "power2.out"
            });

            // Expandir el cursor
            if(cursor) cursor.classList.add('active');
        });

        btn.addEventListener('mouseleave', () => {
            gsap.to(btn, {
                x: 0,
                y: 0,
                duration: 0.7,
                ease: "elastic.out(1, 0.3)"
            });
            // Restaurar cursor
            if(cursor) cursor.classList.remove('active');
        });
    });

    // 4. ANIMACIONES HERO (Texto subiendo)
    const tl = gsap.timeline();
    
    // Animar el subtítulo
    tl.fromTo('.hero-subtitle', 
        { opacity: 0, y: 20 }, 
        { opacity: 1, y: 0, duration: 1, ease: "power3.out" }, 
        0.5
    );

    // Animar las palabras del título
    tl.to('.hero-title .word', {
        y: "0%",
        duration: 1.2,
        stagger: 0.2,
        ease: "power4.out"
    }, 0.8);

    // Animar el texto inferior y el botón
    tl.fromTo('.hero-bottom', 
        { opacity: 0, y: 30 }, 
        { opacity: 1, y: 0, duration: 1, ease: "power3.out" }, 
        1.5
    );


    // 5. SECCIÓN SCROLL HORIZONTAL (Pinning)
    // Solo aplicarlo si estamos en escritorio para que la experiencia en móvil sea fluida en vertical
    let mm = gsap.matchMedia();

    mm.add("(min-width: 768px)", () => {
        const horizontalSection = document.querySelector('.horizontal-section');
        const container = document.querySelector('.horizontal-container');
        
        // Calculamos cuánto necesitamos desplazar
        function getScrollAmount() {
            let containerWidth = container.scrollWidth;
            return -(containerWidth - window.innerWidth);
        }

        const tween = gsap.to(container, {
            x: getScrollAmount,
            ease: "none"
        });

        ScrollTrigger.create({
            trigger: horizontalSection,
            start: "top top",
            end: () => `+=${getScrollAmount() * -1}`,
            pin: true,
            animation: tween,
            scrub: 1, // Suavidad del scroll
            invalidateOnRefresh: true
        });
    });

    // 6. FADE IN DE OTROS ELEMENTOS (Social Proof, CTA)
    const fadeElements = document.querySelectorAll('.reveal-fade');
    fadeElements.forEach(el => {
        gsap.fromTo(el, 
            { opacity: 0, y: 50 },
            {
                opacity: 1,
                y: 0,
                duration: 1,
                ease: "power3.out",
                scrollTrigger: {
                    trigger: el,
                    start: "top 85%", // Cuando el top del elemento alcanza el 85% del viewport
                }
            }
        );
    });

    // 7. LÓGICA DE MENÚ HAMBURGUESA
    const menuToggle = document.getElementById("menuToggle");
    const navLinks = document.querySelector(".nav-links");
    const navItems = document.querySelectorAll(".nav-links a");

    if (menuToggle && navLinks) {
        menuToggle.addEventListener("click", () => {
            menuToggle.classList.toggle("active");
            navLinks.classList.toggle("active");
            document.body.classList.toggle("menu-open");
        });

        // Cerrar menú al hacer click en cualquier enlace
        navItems.forEach(item => {
            item.addEventListener("click", () => {
                menuToggle.classList.remove("active");
                navLinks.classList.remove("active");
                document.body.classList.remove("menu-open");
            });
        });
    }
});

// --- LÓGICA DE DETALLES DE HERRAMIENTAS (MODAL DINÁMICO) ---
const toolDetailsData = {
    sorteos: {
        icon: "🎟️",
        tag: "Plataforma de Fidelización",
        title: "Módulo de Sorteos",
        demoUrl: "../sorteo/",
        description: "Una plataforma digital robusta diseñada para organizar sorteos transparentes y profesionales. Ideal para marcas, creadores de contenido y eventos corporativos que buscan capturar leads calificados de manera orgánica y confiable.",
        howItWorks: [
            { title: "Registro Dinámico", text: "Los participantes se inscriben ingresando sus datos (nombre, mail, teléfono o redes), permitiéndote capturar leads valiosos en tu base de datos." },
            { title: "Reglas Anti-Fraude", text: "El sistema cuenta con filtros automatizados para evitar duplicados, bots y cuentas sospechosas, garantizando transparencia absoluta." },
            { title: "Selección en Vivo", text: "Realiza el sorteo en tiempo real con una interfaz visual impactante y animada, perfecta para transmisiones en directo o pantallas gigantes." },
            { title: "Verificación Matemática", text: "Utiliza un algoritmo de generación aleatoria transparente y auditable para asegurar la confianza de tu audiencia." }
        ],
        whatsappMessage: "¡Hola! Estoy interesado en conocer más detalles sobre el Módulo de Sorteos para mi negocio/evento."
    },
    subastas: {
        icon: "🔨",
        tag: "Plataforma de Eventos & Recaudación",
        title: "Subasta Silenciosa",
        demoUrl: "../subasta-silenciosa/",
        description: "Un sistema web interactivo premium diseñado para eventos de gala, subastas benéficas o corporativas, donde los participantes ofertan de forma digital, fluida y altamente competitiva sin interrumpir la velada.",
        howItWorks: [
            { title: "Acceso QR Instantáneo", text: "Los invitados escanean un código QR en el salón y acceden de inmediato al catálogo de lotes desde sus celulares, sin instalar nada." },
            { title: "Pujas en Tiempo Real", text: "Los interesados ofertan con un toque, configurando alertas instantáneas en WhatsApp/SMS si alguien supera su oferta para motivar la competencia." },
            { title: "Tablero de Líderes (Leaderboard)", text: "Proyecta en la pantalla principal del salón el ranking de pujas actualizado al instante, impulsando el espíritu competitivo y la recaudación." },
            { title: "Cierre y Cobro Automatizado", text: "Al finalizar el evento, el sistema calcula los ganadores automáticamente y les genera un enlace de pago instantáneo para concretar el cobro." }
        ],
        whatsappMessage: "¡Hola! Estoy interesado en conocer más detalles sobre la Subasta Silenciosa para mi evento."
    },
    feed: {
        icon: "📱",
        tag: "Experiencia Social Interactiva",
        title: "Live Feed & Eventos",
        demoUrl: "../live-feed/",
        description: "Una experiencia social única para bodas, aniversarios, corporativos y festivales. Convierte a tus invitados en los fotógrafos oficiales del evento y proyecta sus momentos favoritos en vivo y al instante.",
        howItWorks: [
            { title: "Invitación Digital Premium", text: "Diseño online interactivo con confirmación de asistencia en tiempo real, cuenta regresiva, agenda del evento y ubicación GPS." },
            { title: "Carga Multimedia Directa", text: "Tus invitados escanean un QR y suben fotos o mensajes dedicados desde sus teléfonos en un segundo, sin descargas ni registros engorrosos." },
            { title: "Moderación e Interacción", text: "Un panel de control permite moderar el contenido antes de proyectarlo con transiciones espectaculares en las pantallas gigantes del salón." },
            { title: "Álbum Completo Descargable", text: "Al finalizar, los organizadores descargan el álbum digital completo con todas las fotos tomadas por los invitados en alta definición." }
        ],
        whatsappMessage: "¡Hola! Estoy interesado en el Live Feed & Eventos interactivo para un próximo evento."
    }
};

function openToolModal(toolKey) {
    const data = toolDetailsData[toolKey];
    if (!data) return;

    const modalBody = document.getElementById("tool-modal-body-content");
    if (!modalBody) return;

    // Generar el HTML de las secciones "Cómo Funciona"
    const stepsHtml = data.howItWorks.map((step, idx) => `
        <li>
            <div class="tool-modal-step-num">${idx + 1}</div>
            <div>
                <strong>${step.title}:</strong> ${step.text}
            </div>
        </li>
    `).join('');

    // Pre-armar el link de WhatsApp
    const encodedMsg = encodeURIComponent(data.whatsappMessage);
    const whatsappUrl = `https://wa.me/541164481943?text=${encodedMsg}`;

    modalBody.innerHTML = `
        <div class="tool-modal-header">
            <div class="tool-modal-header-icon">${data.icon}</div>
            <div class="tool-modal-title">
                <span>${data.tag}</span>
                <h2>${data.title}</h2>
            </div>
        </div>
        <div class="tool-modal-section">
            <h3>¿Qué es?</h3>
            <p>${data.description}</p>
        </div>
        <div class="tool-modal-section">
            <h3>¿Cómo funciona?</h3>
            <ul class="tool-modal-steps">
                ${stepsHtml}
            </ul>
        </div>
        <div class="tool-modal-footer" style="display:flex; flex-direction:column; gap:12px; margin-top:40px;">
            <a href="${whatsappUrl}" target="_blank" class="btn btn-primary magnetic" data-strength="20" style="width:100%; text-align:center;">
                <span class="btn-text">📲 Consultar por WhatsApp</span>
            </a>
        </div>
    `;

    const modal = document.getElementById("toolDetailsModal");
    if (modal) {
        modal.classList.add("open");
        document.body.style.overflow = "hidden"; // Desactivar scroll de fondo
    }

    // Inicializar efecto magnético para los nuevos botones en el modal si existe GSAP
    setTimeout(() => {
        const btns = modalBody.querySelectorAll('.magnetic');
        btns.forEach(btn => {
            if (btn && typeof gsap !== 'undefined') {
                btn.addEventListener('mousemove', (e) => {
                    const rect = btn.getBoundingClientRect();
                    const strength = btn.dataset.strength || 20;
                    const x = e.clientX - rect.left - rect.width / 2;
                    const y = e.clientY - rect.top - rect.height / 2;
                    
                    gsap.to(btn, {
                        x: (x / rect.width) * strength,
                        y: (y / rect.height) * strength,
                        duration: 0.3,
                        ease: "power2.out"
                    });
                    
                    const cursor = document.getElementById('cursor');
                    if(cursor) cursor.classList.add('active');
                });

                btn.addEventListener('mouseleave', () => {
                    gsap.to(btn, {
                        x: 0,
                        y: 0,
                        duration: 0.7,
                        ease: "elastic.out(1, 0.3)"
                    });
                    const cursor = document.getElementById('cursor');
                    if(cursor) cursor.classList.remove('active');
                });
            }
        });
    }, 50);
}

function closeToolModal() {
    const modal = document.getElementById("toolDetailsModal");
    if (modal) {
        modal.classList.remove("open");
        document.body.style.overflow = ""; // Reactivar scroll
    }
}

// Cerrar si se hace click fuera del box o se presiona escape
document.addEventListener("DOMContentLoaded", () => {
    const modal = document.getElementById("toolDetailsModal");
    if (modal) {
        modal.addEventListener("click", (e) => {
            if (e.target === modal || e.target.classList.contains("tool-modal-wrapper")) {
                closeToolModal();
            }
        });
    }
});

document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
        closeToolModal();
    }
});

// Exponer globalmente para los clicks en HTML
window.openToolModal = openToolModal;
window.closeToolModal = closeToolModal;
