# Consolidación de Componentes Home

**Fecha:** 2025-01-10  
**Commit:** `44287103`

## Resumen

Se consolidaron las tres versiones de la página principal (`Home`, `Home-v2`, `Home-v3`) en un único directorio `src/components/Home/` con todas las optimizaciones de performance.

## Problema Original

```
src/components/
├── Home/           # Versión original (obsoleta)
├── Home-v2/        # Versión refactorizada con nuevos componentes
└── Home-v3/        # Versión optimizada para LCP/performance
```

- **3 versiones** con código duplicado
- La página principal `/` usaba `Home-v3`, que importaba componentes de `Home-v2`
- Rutas redundantes: `/home-v0`, `/home-v2`, `/home-v3`
- Dificultad de mantenimiento

## Solución Implementada

### Nueva Estructura Consolidada

```
src/components/Home/
├── index.tsx                      # Componente principal (basado en Home-v3)
├── BestSeller/
│   ├── index.tsx
│   └── HelpCard.tsx
├── DynamicProductCarousel/
│   └── index.tsx
├── CategoryTogglePillsWithSearch.tsx
├── PromoBanners/
│   └── index.tsx
├── NewArrivals/
│   └── index.tsx
├── Testimonials/
│   ├── index.tsx
│   ├── CompactSlider.tsx
│   └── testimonialsData.ts
├── TrendingSearches/
│   └── index.tsx
├── CombosSection/
│   └── index.tsx
├── HeroCarousel/
│   └── index.tsx
├── Hero/                          # Carousel modular optimizado
│   ├── Carousel.tsx
│   ├── Slide.tsx
│   ├── NavigationButtons.tsx
│   ├── Indicators.tsx
│   ├── types.ts
│   └── index.ts
├── HeroOptimized.tsx              # Optimización LCP
├── CombosOptimized.tsx            # Carga diferida de combos
└── DeferredGlassmorphismCSS.tsx   # CSS no bloqueante
```

### Archivos Eliminados

- `src/components/Home-v2/` (carpeta completa - 18 archivos)
- `src/components/Home-v3/` (carpeta completa - 10 archivos)
- `src/app/home-v0/` (2 archivos)
- `src/app/home-v2/` (2 archivos)
- `src/app/home-v3/` (2 archivos)
- `src/app/(site)/HOME_VERSIONS.md`

### Referencias Actualizadas

| Archivo | Cambio |
|---------|--------|
| `src/app/page.tsx` | Import `Home-v3` → `Home` |
| `src/components/Checkout/ProductGridInfinite.tsx` | Imports `Home-v2/*` → `Home/*` |

## Optimizaciones Mantenidas

Todas las optimizaciones de `Home-v3` fueron preservadas:

1. **HeroOptimized**: Imagen estática inicial, carousel carga después del LCP
2. **CombosOptimized**: Carga diferida con `requestIdleCallback`
3. **DeferredGlassmorphismCSS**: CSS no bloqueante (deshabilitado para performance)
4. **Progressive Loading**: Componentes below-fold con IntersectionObserver
5. **Adaptive Performance**: Delays adaptativos según nivel de rendimiento del dispositivo
6. **LCP Detection**: Carga de componentes después del LCP detectado

## Impacto

| Métrica | Antes | Después |
|---------|-------|---------|
| Archivos | 46 | 27 |
| Líneas de código | ~6,800 | ~4,000 |
| Rutas de app | 4 | 1 |
| Puntos de mantenimiento | 3 | 1 |

## Cómo Usar

### Página Principal

```tsx
// src/app/page.tsx
import Home from '@/components/Home'

export default function HomePage() {
  return <Home />
}
```

### Componentes Individuales

```tsx
// Importar componentes específicos
import BestSeller from '@/components/Home/BestSeller'
import HelpCard from '@/components/Home/BestSeller/HelpCard'
import DynamicProductCarousel from '@/components/Home/DynamicProductCarousel'
import { HeroCarousel } from '@/components/Home/Hero'
```

## Notas Importantes

1. **No hay más versiones**: Solo existe `src/components/Home/`
2. **Rutas eliminadas**: `/home-v0`, `/home-v2`, `/home-v3` ya no existen
3. **Imports actualizados**: Cualquier código que importaba de `Home-v2` o `Home-v3` debe actualizarse
4. **Performance intacta**: Todas las optimizaciones de LCP/Speed Index se mantienen

## Relacionado

- [Arquitectura Modular de Productos](./productos-arquitectura-modular.md)
