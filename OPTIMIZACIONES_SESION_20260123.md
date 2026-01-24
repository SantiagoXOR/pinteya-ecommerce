# Optimizaciones y documentación – Sesión 23/01/2026

**Estado**: Hero cargando correctamente. Plan de optimizaciones documentado y hero excluido de cambios futuros.

---

## 1. Hero banner – Fix y “no tocar”

### Problema

- Tras optimizaciones previas, el hero dejaba de cargar.
- Causas: style conflictivo (`position: relative` en div con `absolute inset-0`) y `fetchPriority="low"` en carousel.

### Cambios realizados

1. **`HeroSection.tsx`**
   - Eliminado `style={{ width: '100%', height: '100%', position: 'relative' }}` del contenedor de la imagen estática.
   - Contenedor solo con `absolute inset-0` (sin style conflictivo).

2. **`SimpleHeroCarousel.tsx`**
   - `fetchPriority`: `'low'` → `'auto'` para imágenes no-LCP.

3. **`HeroCarousel/index.tsx`** y **`PromoBanners`**
   - `fetchPriority` fijado en `'auto'` (no usar `'low'`) para evitar problemas de carga.

### Documentación creada

- **`HERO_BANNER_NO_MODIFICAR.md`**: archivos y reglas que no deben modificarse.
- **`FIX_HERO_BANNER.md`**: detalle del fix y aviso de no volver a tocar.

**No modificar** `HeroSection.tsx` ni `SimpleHeroCarousel.tsx` (contenedor, `fetchPriority`) sin revisar esa documentación.

---

## 2. Plan de optimizaciones – Exclusiones

### Actualizado

- **`PLAN_ACCION_OPTIMIZACIONES.md`**: Hero excluido; sección “Hero banner – NO MODIFICAR” y referencia a `HERO_BANNER_NO_MODIFICAR.md`.
- **`RESUMEN_PLAN_OPTIMIZACIONES.md`**: Fase 2 imágenes actualizada; hero no debe tocarse.
- **`INICIO_RAPIDO_OPTIMIZACIONES.md`**: aviso de no modificar hero al inicio.

### Regla para optimizaciones de imágenes

- Excluir siempre hero y carousel hero de cambios.
- No usar `fetchPriority="low"` en hero/carousel; usar `'auto'` para no-LCP.

---

## 3. Otras optimizaciones aplicadas (sin tocar hero)

### Caché

- **`next.config.js`**: headers de caché para `/tenants/:path*` (hero, logos, etc.):
  - `Cache-Control: public, max-age=2592000, s-maxage=31536000, immutable`

### Code splitting (ya aplicado antes)

- `vendor` maxSize: 50KB.
- `pages` / `homeV3` maxSize: 80KB.

### Imágenes (fuera del hero)

- PromoBanners y HeroCarousel: `fetchPriority="auto"`, `decoding="async"` donde aplica.

---

## 4. Verificación

- `npm run build`: correcto.
- Hero carga bien en la aplicación.

---

## 5. Próximos pasos (sin tocar hero)

1. **Fase 1 – Bundle**: ejecutar `ANALYZE=true npm run build`, analizar chunk 670 KB y aplicar optimizaciones según plan.
2. **Fase 2 – Imágenes**: auditoría y mejoras en **resto** de imágenes (ProductCardImage, PromoBanners, etc.), sin modificar hero.
3. **Fase 3 – Caché**: comprobar en producción que los headers (incl. `/tenants/*`) se aplican bien.

---

## 6. Referencia rápida

| Documento | Uso |
|-----------|-----|
| `HERO_BANNER_NO_MODIFICAR.md` | Reglas para no tocar hero. |
| `FIX_HERO_BANNER.md` | Qué se rompió y cómo se corrigió. |
| `PLAN_ACCION_OPTIMIZACIONES.md` | Plan completo; hero excluido. |

**No volver a modificar hero sin leer `HERO_BANNER_NO_MODIFICAR.md` y `FIX_HERO_BANNER.md`.**
