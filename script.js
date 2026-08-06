// ============================================
// ESTUDIO PRECINTO - INTERACTIVIDAD
// ============================================

// === VARIABLES GLOBALES ===
let currentTestimonial = 0;
const testimonials = document.querySelectorAll('.testimonial-card');
const testimonialsTrack = document.getElementById('testimonialsTrack');
const carouselDots = document.getElementById('carouselDots');
let autoplayInterval;

// === INICIALIZACIÓN ===
document.addEventListener('DOMContentLoaded', () => {
  initHeader();
  initMobileMenu();
  initScrollAnimations();
  initTestimonialsCarousel();
  initPortfolioCarousel();
  initSmoothScroll();
  updateYear();
});

// === HEADER STICKY CON BLUR ===
function initHeader() {
  const header = document.getElementById('header');

  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });
}

// === MOBILE MENU TOGGLE ===
function initMobileMenu() {
  const menuToggle = document.getElementById('menuToggle');
  const nav = document.getElementById('nav');
  const navLinks = document.querySelectorAll('.nav-link');

  menuToggle.addEventListener('click', () => {
    nav.classList.toggle('active');
    menuToggle.classList.toggle('active');
  });

  // Cerrar menú al hacer click en un link
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      nav.classList.remove('active');
      menuToggle.classList.remove('active');
    });
  });

  // Cerrar menú al hacer click fuera
  document.addEventListener('click', (e) => {
    if (!nav.contains(e.target) && !menuToggle.contains(e.target)) {
      nav.classList.remove('active');
      menuToggle.classList.remove('active');
    }
  });
}

// === ANIMACIONES ON SCROLL (INTERSECTION OBSERVER) ===
function initScrollAnimations() {
  const revealElements = document.querySelectorAll('.reveal');

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
        revealObserver.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  });

  revealElements.forEach(element => {
    revealObserver.observe(element);
  });
}

// === CAROUSEL DE TESTIMONIOS ===
function initTestimonialsCarousel() {
  if (!testimonialsTrack || testimonials.length === 0) return;

  // Crear dots
  createCarouselDots();

  // Botones de navegación
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      navigateTestimonial('prev');
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      navigateTestimonial('next');
    });
  }

  // Autoplay
  startAutoplay();

  // Pausar autoplay en hover
  testimonialsTrack.addEventListener('mouseenter', stopAutoplay);
  testimonialsTrack.addEventListener('mouseleave', startAutoplay);

  // Touch/swipe support
  let touchStartX = 0;
  let touchEndX = 0;

  testimonialsTrack.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
  });

  testimonialsTrack.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
  });

  function handleSwipe() {
    if (touchEndX < touchStartX - 50) {
      navigateTestimonial('next');
    }
    if (touchEndX > touchStartX + 50) {
      navigateTestimonial('prev');
    }
  }
}

function createCarouselDots() {
  if (!carouselDots) return;

  testimonials.forEach((_, index) => {
    const dot = document.createElement('button');
    dot.classList.add('carousel-dot');
    if (index === 0) dot.classList.add('active');
    dot.setAttribute('aria-label', `Ir a testimonio ${index + 1}`);
    dot.addEventListener('click', () => {
      currentTestimonial = index;
      updateTestimonialPosition();
    });
    carouselDots.appendChild(dot);
  });
}

function navigateTestimonial(direction) {
  if (direction === 'next') {
    currentTestimonial = (currentTestimonial + 1) % testimonials.length;
  } else {
    currentTestimonial = (currentTestimonial - 1 + testimonials.length) % testimonials.length;
  }
  updateTestimonialPosition();
}

function updateTestimonialPosition() {
  const offset = -currentTestimonial * 100;
  testimonialsTrack.style.transform = `translateX(${offset}%)`;

  // Actualizar dots
  const dots = carouselDots.querySelectorAll('.carousel-dot');
  dots.forEach((dot, index) => {
    if (index === currentTestimonial) {
      dot.classList.add('active');
    } else {
      dot.classList.remove('active');
    }
  });
}

function startAutoplay() {
  stopAutoplay();
  autoplayInterval = setInterval(() => {
    navigateTestimonial('next');
  }, 5000); // Cambiar cada 5 segundos
}

function stopAutoplay() {
  if (autoplayInterval) {
    clearInterval(autoplayInterval);
  }
}

// === PORTFOLIO CAROUSEL ===
let currentPortfolioIndex = 0;
let portfolioItemsPerView = 3; // Default para desktop
const portfolioItems = document.querySelectorAll('.portfolio-item');
const portfolioTrack = document.getElementById('portfolioTrack');
const portfolioDots = document.getElementById('portfolioDots');

function initPortfolioCarousel() {
  if (!portfolioTrack || portfolioItems.length === 0) return;

  // Calcular items por vista según viewport
  updatePortfolioItemsPerView();

  // Crear dots
  createPortfolioDots();

  // Botones de navegación
  const prevBtn = document.getElementById('portfolioPrevBtn');
  const nextBtn = document.getElementById('portfolioNextBtn');

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      navigatePortfolio('prev');
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      navigatePortfolio('next');
    });
  }

  // Touch/swipe support
  let touchStartX = 0;
  let touchEndX = 0;

  portfolioTrack.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
  });

  portfolioTrack.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    handlePortfolioSwipe();
  });

  function handlePortfolioSwipe() {
    if (touchEndX < touchStartX - 50) {
      navigatePortfolio('next');
    }
    if (touchEndX > touchStartX + 50) {
      navigatePortfolio('prev');
    }
  }

  // Navegación con teclado
  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') {
      navigatePortfolio('prev');
    } else if (e.key === 'ArrowRight') {
      navigatePortfolio('next');
    }
  });

  // Actualizar en resize
  window.addEventListener('resize', debounce(() => {
    updatePortfolioItemsPerView();
    updatePortfolioPosition();
  }, 250));
}

function updatePortfolioItemsPerView() {
  const width = window.innerWidth;
  if (width <= 768) {
    portfolioItemsPerView = 1;
  } else if (width <= 1024) {
    portfolioItemsPerView = 2;
  } else {
    portfolioItemsPerView = 3;
  }

  // Ajustar índice actual si es necesario
  const maxIndex = Math.max(0, portfolioItems.length - portfolioItemsPerView);
  if (currentPortfolioIndex > maxIndex) {
    currentPortfolioIndex = maxIndex;
  }
}

function createPortfolioDots() {
  if (!portfolioDots) return;

  portfolioDots.innerHTML = '';
  const totalDots = Math.ceil(portfolioItems.length / portfolioItemsPerView);

  for (let i = 0; i < totalDots; i++) {
    const dot = document.createElement('button');
    dot.classList.add('portfolio-dot');
    if (i === 0) dot.classList.add('active');
    dot.setAttribute('aria-label', `Ir a grupo de proyectos ${i + 1}`);
    dot.addEventListener('click', () => {
      currentPortfolioIndex = i * portfolioItemsPerView;
      updatePortfolioPosition();
    });
    portfolioDots.appendChild(dot);
  }
}

function navigatePortfolio(direction) {
  const maxIndex = Math.max(0, portfolioItems.length - portfolioItemsPerView);

  if (direction === 'next') {
    currentPortfolioIndex = Math.min(currentPortfolioIndex + portfolioItemsPerView, maxIndex);
  } else {
    currentPortfolioIndex = Math.max(currentPortfolioIndex - portfolioItemsPerView, 0);
  }

  updatePortfolioPosition();
}

function updatePortfolioPosition() {
  const itemWidth = portfolioItems[0].offsetWidth;
  const gap = 24; // var(--space-6) = 24px
  const offset = -(currentPortfolioIndex * (itemWidth + gap));

  portfolioTrack.style.transform = `translateX(${offset}px)`;

  // Actualizar dots
  const dots = portfolioDots.querySelectorAll('.portfolio-dot');
  const activeDotIndex = Math.floor(currentPortfolioIndex / portfolioItemsPerView);

  dots.forEach((dot, index) => {
    if (index === activeDotIndex) {
      dot.classList.add('active');
    } else {
      dot.classList.remove('active');
    }
  });
}


// === SMOOTH SCROLL ===
function initSmoothScroll() {
  const links = document.querySelectorAll('a[href^="#"]');

  links.forEach(link => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');

      // Ignorar links que solo son "#"
      if (href === '#') return;

      const target = document.querySelector(href);

      if (target) {
        e.preventDefault();

        const headerHeight = document.getElementById('header').offsetHeight;
        const targetPosition = target.offsetTop - headerHeight - 20;

        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
      }
    });
  });
}

// === ACTUALIZAR AÑO EN FOOTER ===
function updateYear() {
  const yearElement = document.getElementById('currentYear');
  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  }
}

// === MICROINTERACCIONES ===
// Efecto ripple en botones
document.querySelectorAll('.btn').forEach(button => {
  button.addEventListener('click', function (e) {
    const ripple = document.createElement('span');
    const rect = this.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;

    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';
    ripple.classList.add('ripple');

    this.appendChild(ripple);

    setTimeout(() => ripple.remove(), 600);
  });
});

// Efecto parallax sutil en hero
window.addEventListener('scroll', () => {
  const scrolled = window.pageYOffset;
  const hero = document.querySelector('.hero');

  if (hero && scrolled < window.innerHeight) {
    hero.style.transform = `translateY(${scrolled * 0.5}px)`;
  }
});

// === LAZY LOADING DE IMÁGENES ===
if ('IntersectionObserver' in window) {
  const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        if (img.dataset.src) {
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
          imageObserver.unobserve(img);
        }
      }
    });
  });

  document.querySelectorAll('img[data-src]').forEach(img => {
    imageObserver.observe(img);
  });
}

// === PERFORMANCE OPTIMIZATION ===
// Debounce para eventos de scroll
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Aplicar debounce a eventos de scroll pesados
const debouncedScroll = debounce(() => {
  // Aquí puedes agregar funciones de scroll que necesiten optimización
}, 100);

window.addEventListener('scroll', debouncedScroll);

// === ACCESIBILIDAD ===
// Detectar navegación por teclado
document.addEventListener('keydown', (e) => {
  if (e.key === 'Tab') {
    document.body.classList.add('keyboard-navigation');
  }
});

document.addEventListener('mousedown', () => {
  document.body.classList.remove('keyboard-navigation');
});

// === CONSOLE MESSAGE ===
console.log('%c🔧 Estudio Precinto', 'font-size: 20px; font-weight: bold; color: #a28a68;');
console.log('%cTecnología que resuelve', 'font-size: 14px; color: #e0e1dd;');
console.log('%c¿Interesado en trabajar con nosotros? Contactanos: https://wa.me/541168855834', 'font-size: 12px; color: #39506b;');
