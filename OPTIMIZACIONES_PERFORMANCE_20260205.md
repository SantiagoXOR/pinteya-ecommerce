# Optimizaciones de Performance - 5 de Febrero 2026

## Resumen

Optimizaciones aplicadas para reducir JavaScript inicial, mejorar TBT (Total Blocking Time) y mantener métricas de Lighthouse. Incluye carga diferida de componentes con Swiper, condicional de logs en producción y carga del carrusel de sugeridos solo cuando la sección es visible.

---

## 1. Carga diferida de RecentlyViewd (ShopDetails)

**Archivo:** `src/components/ShopDetails/index.tsx`

**Cambio:**
- `RecentlyViewdItems` se importa con `next/dynamic` y `ssr: false`.
- Placeholder de skeleton mientras carga el chunk (Swiper + componente).

**Motivación:**
- La página de detalle (ShopDetails) incluía Swiper en el bundle inicial.
- Al cargar RecentlyViewd de forma diferida, el chunk de Swiper se descarga solo cuando hace falta.

**Impacto esperado:**
- Menos JS en la carga inicial de la página de detalle.
- Mejor TBT y tiempo hasta interactivo en esa ruta.

---

## 2. Console.log solo en desarrollo

**Archivos modificados:**
- `src/components/ShopDetails/ShopDetailModal/index.tsx`
- `src/components/ShopDetails/SuggestedProductsCarousel.tsx`
- `src/components/ShopDetails/ShopDetailModal/components/RelatedProducts.tsx`
- `src/components/ui/product-card-commercial/index.tsx`

**Cambio:**
- Todos los `console.log` de depuración envueltos en `process.env.NODE_ENV === 'development'`.
- Los `console.error` se mantienen para diagnóstico en producción.
- Eliminado el `console.log` dentro del callback `onInteractOutside` del modal.

**Motivación:**
- Evitar trabajo y ruido en producción.
- El compilador ya puede eliminar logs, pero el guardado explícito deja claro el uso solo en desarrollo.

---

## 3. Carga del carrusel de sugeridos al entrar en vista (IntersectionObserver)

**Archivo:** `src/components/ShopDetails/ShopDetailModal/components/RelatedProducts.tsx`

**Cambio:**
- Uso de **IntersectionObserver** para cargar `SuggestedProductsCarousel` (y con él Swiper) solo cuando la sección “Productos relacionados” entra en el viewport.
- Opciones: `rootMargin: '120px'`, `threshold: 0`.
- Si `IntersectionObserver` no está disponible, se carga de inmediato (fallback).
- El contenedor (skeleton o contenido) usa `ref` para ser observado.

**Motivación:**
- Al abrir el modal de producto, no siempre el usuario hace scroll hasta “Productos relacionados”.
- Evitar descargar y ejecutar Swiper hasta que la sección sea visible reduce TBT en la apertura del modal.

**Impacto esperado:**
- Menor TBT al abrir el modal cuando el usuario no hace scroll hasta la sección.
- Swiper se carga solo cuando la sección está visible o cerca.

---

## Resumen de impacto

| Optimización                         | Efecto principal                          |
|--------------------------------------|-------------------------------------------|
| RecentlyViewd con dynamic()          | Menos JS inicial en ruta ShopDetails      |
| Console.log condicional               | Menos trabajo en producción               |
| IntersectionObserver en RelatedProducts | Swiper del modal solo al entrar en vista |

---

## Verificación

- **Build:** `npm run build` — compilación correcta (21.3s).
- **Lighthouse:** Los scripts del proyecto apuntan a producción (`https://www.pintemas.com`). Ejecutar tras el deploy:
  - `npm run lighthouse` (móvil, abre reporte).
  - `npm run lighthouse:json` y `npm run lighthouse:analyze` para análisis automatizado.

---

## Resultados Lighthouse post-deploy (05/02/2026)

Auditoría móvil: la URL por defecto del proyecto es **https://www.pintemas.com**. La tabla incluye resultados contra pinteya.com y pintemas.com (05/02/2026).

### Comparativa (baseline 23/01 vs post-deploy)

| Métrica        | Baseline (23/01) | Pintemas (05/02) | Pintemas post hero servidor |
|----------------|------------------|------------------|------------------------------|
| **Performance**| 38/100           | 66/100           | **67/100**                   |
| **LCP**        | 17.3 s           | 7.18 s           | 7.48 s                      |
| **FCP**        | 3.2 s            | 1.63 s           | **1.26 s**                   |
| **TBT**        | 1,210 ms         | 243.5 ms         | 297 ms                      |
| **SI**         | 7.9 s            | 5.74 s           | **4.18 s**                   |
| **CLS**        | 0                | 0                | 0                            |

*URL de auditoría: **https://www.pintemas.com**. La columna "post hero servidor" es tras el deploy de HeroImageServer (hero en HTML inicial).*

### Scores por categoría (post-deploy — pintemas.com, tras hero en servidor)

- **Performance:** 67/100 🟡  
- **Accessibility:** 82/100 🟡  
- **Best Practices:** 96/100 🟢  
- **SEO:** 100/100 🟢  

### Core Web Vitals (post hero en servidor)

- **LCP:** 7.48 s (Score 4/100) 🔴 — sigue siendo foco (reducir latencia/CDN, recurso LCP)  
- **FCP:** 1.26 s (Score 98/100) 🟢 — mejora con hero en servidor  
- **CLS:** 0.000 (Score 100/100) 🟢  
- **TBT:** 297 ms (Score 79/100) 🟡  
- **SI:** 4.18 s (Score 78/100) 🟡 — mejora con hero en servidor  

### Oportunidades principales (actual)

1. Reduce unused CSS: ~150 ms de ahorro  
2. Initial server response time: ~43 ms de ahorro  

### Próximos pasos sugeridos

- Reducir unused CSS (purge Tailwind, CSS por ruta).  
- Minimize main-thread work y JavaScript execution time.  
- Seguir optimizando LCP (recurso que marca Lighthouse, CDN).

---

## 4. Mejoras adicionales (05/02/2026 — continuación)

### 4.1 Página de productos con carga diferida

**Archivos:** `src/app/products/page.tsx`, `src/components/ShopWithSidebar/LazyShopWithSidebar.tsx`

- La ruta `/products` importa `LazyShopWithSidebar` con `next/dynamic` (ssr: true, con loading spinner).
- El chunk de `ShopWithSidebar` (filtros, `ImprovedFilters`, hooks) se descarga solo al visitar `/products`.
- **Impacto:** Menor JavaScript inicial al cargar la app; la ruta de productos no incluye su bundle en el first load de la home.

### 4.2 Corrección en LazyShopWithSidebar

- En el skeleton del modo grid se usaba el ícono `Grid` sin importar; reemplazado por `Grid3X3` (ya importado desde `@/lib/optimized-imports`).

### 4.3 CSS no utilizado (hallazgo)

- `PriceDropdown` (`src/components/ShopWithSidebar/PriceDropdown.tsx`) importa `react-range-slider-input/dist/style.css` pero **no es importado por ningún componente** (los filtros usan `ImprovedFilters` + pills). Ese CSS queda fuera del árbol de uso. Opciones: cargar `PriceDropdown` (y su CSS) de forma dinámica si se reutiliza, o eliminar el import si el componente no se usa.

---

## Documentación relacionada

- `OPTIMIZACIONES_PERFORMANCE_20260123.md` — optimizaciones anteriores (hero, imágenes, índices, Framer Motion).
- `.cursor/skills/lighthouse-audit/SKILL.md` — uso de Lighthouse.
- `.cursor/skills/bundle-optimization/SKILL.md` — análisis de bundle.
- `.cursor/rules/performance-rules.md` — reglas de performance del proyecto.
