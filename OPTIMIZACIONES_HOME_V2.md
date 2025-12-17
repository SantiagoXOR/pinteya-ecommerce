# Plan de Optimizaciones para Home-v2

## Problema Principal Identificado

**Skeletons inconsistentes**: Cada sección de Home-v2 usa un skeleton diferente para product cards cuando deberían usar el mismo componente unificado.

## Optimizaciones Propuestas

### 1. Unificar Skeletons de Product Cards (ALTA PRIORIDAD)

**Problema actual:**
- `BestSeller` tiene skeleton personalizado (Card + CardContent)
- `DynamicProductCarousel` tiene skeleton diferente
- `NewArrivals` tiene skeleton similar a BestSeller pero ligeramente diferente
- `FreeShippingSection` tiene skeleton diferente
- Ya existe `ProductSkeleton` en `src/components/ui/product-skeleton.tsx` pero no se usa consistentemente

**Solución:**
1. Mejorar `ProductSkeleton` para que coincida exactamente con la estructura de `CommercialProductCard`
2. Crear variantes para grid y carousel
3. Reemplazar todos los skeletons personalizados con el componente unificado
4. Crear hook o componente helper para skeletons de grids/carousels

**Archivos a modificar:**
- `src/components/ui/product-skeleton.tsx` - Mejorar para que coincida con CommercialProductCard
- `src/components/Home-v2/BestSeller/index.tsx` - Reemplazar skeleton
- `src/components/Home-v2/DynamicProductCarousel/index.tsx` - Reemplazar skeleton
- `src/components/Home-v2/NewArrivals/index.tsx` - Reemplazar skeleton
- `src/components/Home-v2/FreeShippingSection/index.tsx` - Reemplazar skeleton
- `src/components/Home-v2/index.tsx` - Unificar skeletons en dynamic imports

**Beneficios:**
- UI consistente durante loading
- Menos código duplicado
- Mantenimiento más fácil
- Mejor UX (no hay cambios visuales bruscos)

---

### 2. Prefetching Inteligente (MEDIA PRIORIDAD)

**Optimización:**
- Prefetch datos de productos cuando el usuario hace hover sobre categorías
- Prefetch imágenes cuando el usuario está cerca de una sección (usando IntersectionObserver)
- Prefetch rutas relacionadas en hover

**Archivos a crear/modificar:**
- Crear hook `usePrefetchOnHover` para productos
- Crear hook `usePrefetchImages` para prefetch de imágenes próximas
- Agregar prefetch en `CategoryTogglePills` para productos de categorías
- Agregar prefetch en `BestSeller` cuando hover sobre productos

**Beneficios:**
- Carga más rápida al hacer clic
- Mejor percepción de performance
- Navegación más fluida

---

### 3. Optimización de Imágenes (ALTA PRIORIDAD)

**Problema actual:**
- Algunas imágenes usan `<img>` en lugar de `next/image`
- Falta de `priority` en imágenes críticas (above-fold)
- Falta de `loading="lazy"` en imágenes below-fold

**Solución:**
1. Auditar todas las imágenes en Home-v2
2. Reemplazar `<img>` por `next/image` donde sea posible
3. Agregar `priority` a imágenes above-fold (Hero, primeras categorías)
4. Agregar `loading="lazy"` a imágenes below-fold
5. Optimizar `sizes` para responsive

**Archivos a revisar:**
- `src/components/Home-v2/DynamicProductCarousel/index.tsx` - Verificar uso de next/image
- `src/components/Home-v2/FreeShippingSection/index.tsx` - Verificar imágenes
- `src/components/ui/product-card-commercial.tsx` - Ya usa imágenes, verificar optimización

**Beneficios:**
- Mejor LCP (Largest Contentful Paint)
- Menos ancho de banda
- Carga progresiva de imágenes

---

### 4. Memoización Adicional (BAJA PRIORIDAD)

**Optimización:**
- Revisar componentes que no están memoizados pero podrían beneficiarse
- Agregar `React.memo` donde corresponda
- Optimizar callbacks con `useCallback`

**Archivos a revisar:**
- Todos los componentes de Home-v2
- Verificar si hay re-renders innecesarios

**Beneficios:**
- Menos re-renders
- Mejor performance en scroll
- Menos cálculos innecesarios

---

### 5. Lazy Loading Mejorado (MEDIA PRIORIDAD)

**Optimización actual:**
- Ya se usa `useProgressiveLoading` para algunos componentes
- Ya se usa `dynamic` imports con loading states

**Mejoras:**
1. Ajustar `rootMargin` según la importancia de la sección
2. Agregar lazy loading a `BestSeller` si no está visible inicialmente
3. Mejorar loading states con skeletons unificados

**Archivos a modificar:**
- `src/components/Home-v2/index.tsx` - Ajustar rootMargin para cada sección
- Verificar que todas las secciones below-fold usen lazy loading

**Beneficios:**
- Menor bundle inicial
- Carga más rápida de la página
- Mejor Time to Interactive

---

### 6. Code Splitting Mejorado (BAJA PRIORIDAD)

**Optimización:**
- Agrupar componentes relacionados en chunks
- Separar componentes pesados (carousels, modals) en chunks propios
- Lazy load componentes flotantes más agresivamente

**Archivos a modificar:**
- `src/components/Home-v2/index.tsx` - Optimizar dynamic imports
- Considerar usar `next/dynamic` con `loading` más sofisticado

**Beneficios:**
- Bundle más pequeño inicialmente
- Carga progresiva más eficiente

---

## Orden de Implementación Recomendado

1. **Unificar Skeletons** (Prioridad ALTA - Impacto inmediato en UX)
2. **Optimización de Imágenes** (Prioridad ALTA - Impacto en Core Web Vitals)
3. **Prefetching Inteligente** (Prioridad MEDIA - Mejora experiencia)
4. **Lazy Loading Mejorado** (Prioridad MEDIA - Mejora performance inicial)
5. **Memoización Adicional** (Prioridad BAJA - Mejora incremental)
6. **Code Splitting Mejorado** (Prioridad BAJA - Optimización avanzada)

---

## Métricas de Éxito

Después de implementar estas optimizaciones, deberíamos ver mejoras en:

- **LCP (Largest Contentful Paint)**: < 2.5s
- **FID (First Input Delay)**: < 100ms
- **CLS (Cumulative Layout Shift)**: < 0.1
- **Time to Interactive**: Reducción del 20-30%
- **Bundle size inicial**: Reducción del 15-25%
- **Consistencia de UI**: 100% de skeletons unificados

---

## Notas Técnicas

- Mantener compatibilidad con componentes existentes
- No romper funcionalidad actual
- Testing después de cada cambio
- Monitorear métricas antes y después


































