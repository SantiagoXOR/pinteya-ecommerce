# Reporte Performance Optimizer — Post-deploy 05/02/2026

**Invocación:** Post-deploy, auditoría contra **https://www.pintemas.com**  
**Fecha:** 5 de febrero de 2026

---

## 1. Análisis inicial (métricas actuales)

### Lighthouse móvil — www.pintemas.com (post-deploy hero en servidor)

| Categoría | Score | Estado |
|-----------|--------|--------|
| Performance | 67/100 | 🟡 |
| Accessibility | 82/100 | 🟡 |
| Best Practices | 96/100 | 🟢 |
| SEO | 100/100 | 🟢 |

### Core Web Vitals

| Métrica | Valor | Score | Objetivo | Estado |
|---------|--------|--------|----------|--------|
| LCP | 7.48 s | 4/100 | < 2.5 s | 🔴 Crítico |
| FCP | 1.26 s | 98/100 | < 1.8 s | 🟢 |
| CLS | 0.000 | 100/100 | < 0.1 | 🟢 |
| TBT | 297 ms | 79/100 | < 300 ms | 🟡 |
| SI | 4.18 s | 78/100 | < 3.4 s | 🟡 |

*Mejora tras hero en servidor: FCP 1.63s → 1.26s, SI 5.74s → 4.18s.*

### Oportunidades principales (Lighthouse)

1. **Reduce unused CSS** — ~150 ms de ahorro  
2. **Initial server response time** — ~43 ms de ahorro  
3. Minimize main-thread work / Reduce JavaScript execution time  

### Problemas críticos reportados

- Minimize main-thread work (Score 0/100)  
- Reduce JavaScript execution time (Score 0/100)  
- Largest Contentful Paint element (Score 0/100)  
- `[aria-*]` attributes do not match their roles (Score 0/100)  
- Buttons do not have an accessible name (Score 0/100)  

---

## 2. Estado de optimizaciones ya aplicadas

- **Hero LCP:** Hero en servidor (`HeroImageServer`) en HTML inicial; preload en `layout.tsx`; carousel diferido 3 s. FCP y SI mejoraron (1.26 s, 4.18 s).  
- **JS inicial:** RecentlyViewd con `dynamic()`, SuggestedProductsCarousel con IntersectionObserver, `console.log` solo en desarrollo.  
- **Imágenes:** `loading="lazy"`, `sizes`, `fetchPriority="low"` en ProductCardImage y galerías.  
- **Bundle:** splitChunks y `optimizePackageImports` en `next.config.js`, Recharts/Framer/Swiper en chunks async.

---

## 3. Cuellos de botella identificados

1. **LCP 7.18 s**  
   - Posibles causas: tiempo de respuesta del CDN/origen del hero (Supabase), tamaño de imagen, bloqueo del main thread antes del paint.  
   - El preload apunta a `/_next/image?url=...`; si la imagen real viene de Supabase, el preload podría no coincidir con el recurso que pinta el LCP.  

2. **Main-thread / JS execution time**  
   - Reducir trabajo síncrono en carga: más lazy loading, diferir scripts no críticos, revisar third-party (analytics, ads).  

3. **Unused CSS/JS (~150 ms cada uno)**  
   - Revisar purge de Tailwind y CSS por ruta.  
   - Revisar imports y code-splitting para evitar módulos no usados en la ruta crítica.  

4. **Legacy JavaScript (~150 ms)**  
   - Confirmar `.browserslistrc` y que no se incluyan polyfills innecesarios para el target.  

5. **Accessibility (82)**  
   - Corregir botones sin nombre accesible y atributos ARIA que no coinciden con el rol.  

---

## 4. Recomendaciones priorizadas

### Alta prioridad

1. **LCP** ✅ Implementado (05/02/2026)  
   - **Hero en servidor:** Se añadió `HeroImageServer` (Server Component) que renderiza la imagen hero en el HTML inicial, para que el LCP no espere a la hidratación del cliente.  
   - La página principal (`page.tsx`) obtiene el tenant y la URL del hero en el servidor, renderiza `<HeroImageServer heroUrl={...} alt={...} />` y lo pasa a `<Home heroImageServer={...} />`.  
   - `HeroSection` acepta `serverHeroSlot`; cuando está presente usa esa imagen (ya en el DOM) y solo monta el overlay del carousel a los 3 s.  
   - El preload del layout y esta imagen usan la misma URL (tenant + `hero/hero1.webp`).  
   - **Archivos:** `src/components/Home/sections/HeroImageServer.tsx`, `src/app/page.tsx`, `src/components/Home/index.tsx`, `src/components/Home/sections/HeroSection.tsx`.  

2. **Unused JavaScript / main-thread**  
   - Ejecutar `npm run analyze` y revisar chunks > 100 KB en la ruta principal.  
   - Diferir más componentes below-the-fold con `dynamic(..., { ssr: false })`.  
   - Revisar carga de analytics/third-party (lazyOnload, o después de FCP).  

3. **Unused CSS**  
   - Revisar que no se importen hojas globales pesadas en layout; mantener CSS crítico mínimo y el resto por ruta/componente.  

### Media prioridad

4. **Legacy JavaScript**  
   - Revisar `.browserslistrc` y configuración de SWC/Next para no transpilar de más.  

5. **Accessibility**  
   - Auditar botones (icon-only) con `aria-label` o texto visible.  
   - Revisar componentes con `[aria-*]` y roles incorrectos.  

6. **Server response (~44 ms)**  
   - Mantener índices y caché; revisar TTFB en el reporte para el documento principal.  

---

## 5. Verificación y próximos pasos

- [ ] Ejecutar `npm run lighthouse:json` y `npm run lighthouse:analyze` tras cambios.  
- [ ] Comparar LCP, TBT y Performance score antes/después.  
- [ ] Objetivo: Performance > 85, LCP < 2.5 s (según reglas del proyecto).  

**Archivos clave para próximas iteraciones:**  
`next.config.js`, `src/app/layout.tsx`, `src/components/Home/sections/HeroSection.tsx`, `.browserslistrc`, componentes above-the-fold que importen librerías pesadas.

---

## 6. Mejoras aplicadas (05/02/2026 — continuación)

### 6.1 Página de productos con carga diferida

- **Archivos:** `src/app/products/page.tsx`, `src/components/ShopWithSidebar/LazyShopWithSidebar.tsx`
- **Cambio:** La ruta `/products` usa `dynamic()` para cargar `LazyShopWithSidebar` en lugar de `ShopWithSidebar` directo. El chunk de la tienda (filtros, grid, hooks) se descarga solo al entrar en la ruta; mientras tanto se muestra un spinner de carga.
- **Impacto:** Menor JS inicial en la navegación a /products; el bundle pesado de filtros y productos no bloquea el first load de otras rutas.

### 6.2 Skeleton de LazyShopWithSidebar

- **Archivo:** `src/components/ShopWithSidebar/LazyShopWithSidebar.tsx`
- **Cambio:** Corregido uso de ícono `Grid` → `Grid3X3` (coherente con los imports existentes) para evitar errores de build.

### 6.3 CSS no utilizado

- **Hallazgo:** `PriceDropdown.tsx` importa `react-range-slider-input/dist/style.css` pero el componente **no está importado en ningún otro archivo** (la UI de filtros usa `ImprovedFilters` + pills). Ese CSS es actualmente código muerto.
- **Recomendación:** Si se vuelve a usar `PriceDropdown`, cargarlo (y su CSS) de forma dinámica; o eliminar el import de CSS si el componente se deja de usar.

---

*Generado por proceso Performance Optimizer post-deploy. Auditoría base: www.pintemas.com (móvil). Última actualización: 05/02/2026.*
