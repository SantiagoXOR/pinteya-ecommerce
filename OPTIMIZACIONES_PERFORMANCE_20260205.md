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

| Métrica        | Baseline (23/01) | Post-deploy pinteya (05/02) | Post-deploy pintemas (05/02) |
|----------------|------------------|-----------------------------|------------------------------|
| **Performance**| 38/100           | 58/100                      | **66/100**                   |
| **LCP**        | 17.3 s           | 7.27 s                      | **7.18 s**                   |
| **FCP**        | 3.2 s            | 1.92 s                      | **1.63 s**                   |
| **TBT**        | 1,210 ms         | 481.5 ms                    | **243.5 ms**                 |
| **SI**         | 7.9 s            | 5.92 s                      | **5.74 s**                   |
| **CLS**        | 0                | 0                           | 0                            |

*URL de auditoría por defecto: **https://www.pintemas.com**.*

### Scores por categoría (post-deploy — pintemas.com)

- **Performance:** 66/100 🟡  
- **Accessibility:** 82/100 🟡  
- **Best Practices:** 96/100 🟢  
- **SEO:** 100/100 🟢  

### Core Web Vitals (post-deploy — pintemas.com)

- **LCP:** 7.18 s (Score 5/100) 🔴 — siguiente foco de mejora  
- **FCP:** 1.63 s (Score 93/100) 🟢  
- **CLS:** 0.000 (Score 100/100) 🟢  
- **TBT:** 243.5 ms (Score 85/100) 🟢  
- **SI:** 5.74 s (Score 51/100) 🟡  

### Oportunidades principales (post-deploy — pintemas.com)

1. Reduce unused CSS: ~150 ms de ahorro  
2. Reduce unused JavaScript: ~150 ms de ahorro  
3. Avoid legacy JavaScript: ~150 ms de ahorro  
4. Initial server response time: ~44 ms de ahorro  

### Próximos pasos sugeridos

- Seguir optimizando LCP (hero, preload, tamaño/calidad de imagen).  
- Reducir TBT (más code-splitting, lazy de componentes pesados).  
- Revisar Best Practices: deprecated APIs y third-party cookies en el reporte.

---

## Documentación relacionada

- `OPTIMIZACIONES_PERFORMANCE_20260123.md` — optimizaciones anteriores (hero, imágenes, índices, Framer Motion).
- `.cursor/skills/lighthouse-audit/SKILL.md` — uso de Lighthouse.
- `.cursor/skills/bundle-optimization/SKILL.md` — análisis de bundle.
- `.cursor/rules/performance-rules.md` — reglas de performance del proyecto.
