# 📦 Estudio Precinto — Repositorio Principal

Repositorio monorepo que contiene el sitio web oficial, la landing page con pasarela de pagos y los módulos de herramientas de software de **Estudio Precinto**.

🌐 **[estudioprecinto.com](https://estudioprecinto.com/nueva_version/)**

---

## Submódulos

| Carpeta | Descripción | Tecnología |
|---|---|---|
| `nueva_version/` | Landing page principal con reservas y Mercado Pago | HTML + Firebase |
| `sorteo/` | Plataforma de sorteos en vivo | React + Vite |
| `subasta-silenciosa/` | Sistema de subasta silenciosa para eventos | React + Firebase RTDB |
| `live-feed/` | Live feed e invitaciones digitales para eventos | React + Firebase RTDB |
| `curso-maleki/` | Sitio de Academia Maleki | HTML estático |

## Despliegue

El despliegue es automático al hacer push a `main` usando GitHub Actions.
Ver `.github/workflows/deploy.yml` para detalles.

## Documentación técnica

Ver `nueva_version/README.md` para la documentación completa del proyecto principal:
arquitectura, endpoints de API, seguridad, SEO/GEO y guía de deploy.
