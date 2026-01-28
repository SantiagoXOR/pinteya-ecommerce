# Imágenes de las cards de promoción (Products, Calculator, Help)

Las tres cards (30% OFF, Calculá tu pintura, Te ayudamos por WhatsApp) usan **solo una imagen de fondo + un botón** como UI. Todo el texto y los elementos de color deben estar dentro de la imagen.

## Tamaño recomendado para diseño responsive

| Especificación | Valor |
|----------------|--------|
| **Relación de aspecto** | **1:2** (ancho : alto) |
| **Tamaño estándar** | **400 × 800 px** |
| **Retina (2x)** | **800 × 1600 px** |
| **Formato** | WebP (recomendado) o PNG/JPG |

Cada card se muestra en un contenedor con `aspect-ratio: 1/2` y `object-fit: cover`, así que la imagen se recorta de forma uniforme en distintos anchos (móvil 1 columna, tablet 2 columnas, desktop 4 columnas).

## Archivos por tenant

- **30% OFF (Products):** `promo/30-off.webp`
- **Calculator:** `promo/calculator.webp`
- **Help (WhatsApp):** `promo/help.webp`

Rutas locales: `public/tenants/{slug}/promo/` o `public/images/promo/`. También se sirven desde Supabase bucket `tenant-assets` → `tenants/{slug}/promo/`.
