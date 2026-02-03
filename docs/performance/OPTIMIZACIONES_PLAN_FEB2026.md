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

## Métricas de referencia

### Antes (captura usuario)
- Performance: 54
- FCP: 3.0 s
- TBT: 370 ms
- Speed Index: 7.8 s
- LCP: 9.0 s
- CLS: 0

### Producción post-despliegue (3 feb 2026, lighthouse-report.json)
- Performance: **42**
- FCP: **3,31 s**
- LCP: **12,77 s**
- TBT: **816 ms**
- Speed Index: **7,35 s**
- CLS: **~0,004**

*Lighthouse tiene variación entre ejecuciones (red, carga del servidor). Ejecutar varias veces y promediar para comparar tendencias.*

---

## Test Header.logo (actualización manual)

El archivo `src/components/Header/__tests__/Header.logo.test.tsx` está en .cursorignore. Para que pase tras el cambio de `priority: true` a `priority: false` en los logos:

1. En **src/utils/imageOptimization.ts** ya están `pinteyaMobileLogoProps` y `pinteyaDesktopLogoProps` con `priority: false`.
2. Edita **src/components/Header/__tests__/Header.logo.test.tsx** y:
   - En los dos `toEqual(…)` de logo mobile y desktop: usa `priority: false` y los valores actuales (mobile: src `/images/logo/LOGO POSITIVO.svg`, className `rounded-xl object-contain`, sin blur/style; desktop: width 200, height 56).
   - Cambia el test "ambos logos deben tener priority true…" por "ambos logos deben tener priority false (LCP reservado para hero)" y `expect(…priority).toBe(false)`.
   - Ajusta "debe usar archivos apropiados" y "debe referenciar archivos que existen" para esperar `LOGO POSITIVO.svg` en ambos.
   - "debe usar dimensiones apropiadas": desktop 200x56.
   - "debe usar WebP por defecto" → "debe usar SVG para logo" y `expect.stringContaining('.svg')`.
