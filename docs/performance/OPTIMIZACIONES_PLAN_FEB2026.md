# Optimizaciones de performance (plan Feb 2026)

**Objetivo:** Mejorar puntuación Lighthouse (54 → 85+) abordando reprocesamiento forzado, JavaScript heredado, LCP, imágenes y caché.

## Cambios implementados

### 1. Reprocesamiento forzado (Forced reflow)
- **CategoryTogglePills:** Lecturas de geometría en un rAF, escrituras (`scrollTo`, `setState`) en el siguiente. Idem en `handleMouseDown`.
- **useDropdownPosition:** Throttle 120 ms en scroll/resize; solo `getBoundingClientRect` dentro de rAF.
- **testimonial-slider:** Lecturas en un rAF, `scrollTo` en un segundo rAF.
- **useHorizontalScroll:** Throttle 100 ms; lecturas en un rAF, `setState` en el siguiente.

### 2. LCP y preload
- **Preload dinámico del hero** en `layout.tsx`: `<link rel="preload" as="image" href={heroImageUrl} fetchPriority="high" />` con URL por tenant.
- Eliminado preload estático de `next.config.js` para `/`.
- **Una sola imagen con prioridad alta:** Hero estático con `priority` + `fetchPriority="high"`. Logo del header y PromoBanners con `priority={false}` y `fetchPriority="low"` o `loading="lazy"`.

### 3. Imágenes
- **SuggestedProductsWithCard:** `<img>` sustituido por `next/image` (fill, sizes, lazy, fetchPriority low).
- **price-display:** Icono envío gratis con `next/image`, loading lazy.
- **ProductCardImage:** `fetchPriority="low"` para imágenes below-the-fold.

### 4. Caché y legacy JS
- Documentación en `next.config.js`: estrategia de caché y que el aviso "legacy JavaScript" puede incluir terceros (Facebook). Bundle propio ya optimizado con `.browserslistrc` moderno.

---

## Cómo validar después del deploy

1. **Lighthouse en producción (recomendado)**  
   Tras desplegar, ejecutar:
   ```bash
   npm run lighthouse:json
   ```
   Comparar con los valores anteriores: Performance, FCP, LCP, TBT, Speed Index, CLS.

2. **Informe diagnóstico**  
   ```bash
   npm run lighthouse:diagnostic
   ```
   Genera un reporte en `lighthouse-reports/` con recomendaciones.

3. **Test del header**  
   Si falla el test que espera `priority: true` en los logos, actualizar las expectativas en `src/components/Header/__tests__/Header.logo.test.tsx`: la prioridad alta se reserva solo para la imagen LCP (hero).

---

## Métricas de referencia (antes)

- Performance: 54
- FCP: 3.0 s
- TBT: 370 ms
- Speed Index: 7.8 s
- LCP: 9.0 s
- CLS: 0

Las métricas en **localhost** (p. ej. `lighthouse-report-local.json`) no son comparables directamente con producción por diferencias de red y CDN.
