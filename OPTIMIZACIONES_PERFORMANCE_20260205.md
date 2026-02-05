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
- **Lighthouse:** Los scripts del proyecto apuntan a producción (`https://www.pinteya.com`). Ejecutar tras el deploy:
  - `npm run lighthouse` (móvil, abre reporte).
  - `npm run lighthouse:json` y `npm run lighthouse:analyze` para análisis automatizado.

---

## Documentación relacionada

- `OPTIMIZACIONES_PERFORMANCE_20260123.md` — optimizaciones anteriores (hero, imágenes, índices, Framer Motion).
- `.cursor/skills/lighthouse-audit/SKILL.md` — uso de Lighthouse.
- `.cursor/skills/bundle-optimization/SKILL.md` — análisis de bundle.
- `.cursor/rules/performance-rules.md` — reglas de performance del proyecto.
