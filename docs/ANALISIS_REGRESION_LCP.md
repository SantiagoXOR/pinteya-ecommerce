# Análisis de Regresión LCP - 5 Dic 2025

## Problema Identificado

Después del primer fix del LCP, las métricas **empeoraron significativamente**:

| Métrica | Antes Fix | Después Fix | Cambio |
|---------|-----------|-------------|--------|
| **Performance Score** | 33 | **15** | 🔴 **-55%** |
| **LCP** | 82.5s | **97.9s** | 🔴 **+19%** (peor) |
| **CLS** | 0 | **0.371** | 🔴 **Crítico** |
| **FCP** | 2.9s | 2.9s | = |
| **TBT** | 1,920ms | 2,080ms | 🔴 +8% |
| **Speed Index** | 12.5s | 9.8s | ✅ -22% |

## Causa Raíz de la Regresión

### Problema con la Solución Anterior

La solución implementada tenía **dos imágenes superpuestas**:

1. **Imagen estática** con `priority={true}` que se mostraba primero
2. **Carrusel lazy-loaded** que se superponía después con fade-in

**Problemas causados:**

1. **Layout Shift (CLS: 0.371)**
   - La transición de opacity entre las dos imágenes causaba cambios de layout
   - El carrusel lazy-loaded puede tener dimensiones ligeramente diferentes
   - El skeleton del carrusel puede estar causando shifts

2. **LCP Empeorado (97.9s)**
   - El navegador puede estar detectando el carrusel lazy-loaded en lugar de la imagen estática
   - El timeout de 100ms puede estar retrasando la detección del LCP
   - El carrusel puede estar bloqueando la carga de la imagen estática

3. **Performance Score Empeorado (15)**
   - CLS alto afecta significativamente el score
   - LCP alto también afecta el score
   - Combinación de ambos problemas críticos

## Solución Implementada

### Cambio de Estrategia

**Antes:** Dos imágenes superpuestas con transición
**Ahora:** HeroCarousel carga inmediatamente sin lazy loading

### Cambios Realizados

1. **Removido lazy loading de HeroCarousel**
   - HeroCarousel ahora se carga inmediatamente
   - Primera imagen tiene `priority={true}` y `fetchPriority='high'`
   - No hay transiciones ni superposiciones

2. **Optimizaciones en HeroCarousel**
   - Primera imagen usa `fetchPriority='high'`
   - Dimensiones exactas para evitar CLS
   - `object-contain` para mantener proporciones

### Código Actualizado

```typescript
// src/components/Home-v2/Hero/index.tsx
// Antes: HeroCarousel lazy-loaded con imagen estática superpuesta
// Ahora: HeroCarousel carga inmediatamente

import HeroCarousel from '@/components/Common/HeroCarousel' // Sin .lazy

<HeroCarousel
  images={heroImagesMobile}
  autoplayDelay={5000}
  showNavigation={false}
  showPagination={false}
  className='w-full h-full mobile-carousel'
/>
```

```typescript
// src/components/Common/HeroCarousel.tsx
// Primera imagen con fetchPriority='high'
<Image
  src={image.src}
  alt={image.alt}
  fill
  priority={image.priority || index === 0}
  fetchPriority={index === 0 ? 'high' : 'auto'} // ⚡ CRITICAL
  ...
/>
```

## Impacto Esperado

| Métrica | Actual | Esperado | Mejora |
|---------|--------|----------|--------|
| **LCP** | 97.9s | < 3s | **-97%** |
| **CLS** | 0.371 | < 0.1 | **-73%** |
| **Performance Score** | 15 | > 60 | **+300%** |

## Lecciones Aprendidas

1. **Evitar superposiciones complejas** - Pueden causar layout shifts
2. **Lazy loading no siempre es mejor** - Para elementos críticos como LCP, carga inmediata es mejor
3. **CLS es crítico** - Un CLS alto puede destruir el Performance Score
4. **Probar cambios incrementalmente** - Cada cambio debe ser probado antes de continuar

## Próximos Pasos

1. ✅ Removido lazy loading de HeroCarousel
2. ✅ Agregado fetchPriority='high' a primera imagen
3. ⏳ Desplegar y probar
4. ⏳ Ejecutar nuevo análisis PageSpeed Insights
5. ⏳ Verificar que LCP y CLS mejoren

## Notas Adicionales

- Swiper se carga inmediatamente ahora, pero el beneficio de tener LCP correcto compensa el costo
- La primera imagen se carga con máxima prioridad
- No hay transiciones ni superposiciones que causen layout shifts

