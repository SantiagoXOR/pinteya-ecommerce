# Sistema Unificado de Lazy Loading

Este documento describe el sistema unificado de lazy loading implementado en el proyecto.

## Arquitectura

El sistema unificado de lazy loading consolida múltiples estrategias de carga diferida en una arquitectura coherente y mantenible.

### Componentes Principales

1. **Configuración Centralizada** (`src/config/lazy-loading.config.ts`)
   - Define todas las configuraciones de lazy loading
   - Centraliza rootMargin, minHeight, delays y estrategias

2. **Hook Unificado** (`src/hooks/useUnifiedLazyLoading.ts`)
   - Combina múltiples estrategias de lazy loading
   - Soporta: viewport, delay, lcp, immediate, adaptive

3. **Componentes Genéricos** (`src/components/lazy/`)
   - `LazySection`: Lazy loading basado en viewport
   - `LazyDeferred`: Lazy loading con delay
   - `LazyViewport`: Alias de LazySection
   - `LazyPromoBanner`: Componente especializado para PromoBanner

## Estrategias de Lazy Loading

### 1. Viewport (`viewport`)
Carga el contenido cuando el elemento entra al viewport usando IntersectionObserver.

```tsx
<LazySection 
  configKey="newArrivals"
  skeleton={<NewArrivalsSkeleton />}
>
  <NewArrivals />
</LazySection>
```

### 2. Delay (`delay`)
Carga el contenido después de un delay fijo.

```tsx
<LazyDeferred 
  configKey="categoryToggle"
  delayOverride={2000}
  skeleton={<CategoryPillsSkeleton />}
>
  <CategoryTogglePillsWithSearch />
</LazyDeferred>
```

### 3. LCP (`lcp`)
Carga el contenido después de detectar LCP (Largest Contentful Paint).

```tsx
const { isVisible } = useUnifiedLazyLoading({
  strategy: 'lcp',
  delay: 1000,
})
```

### 4. Immediate (`immediate`)
Carga el contenido inmediatamente (sin lazy loading).

```tsx
const { isVisible } = useUnifiedLazyLoading({
  strategy: 'immediate',
})
```

### 5. Adaptive (`adaptive`)
Carga el contenido basado en el rendimiento del dispositivo.

```tsx
<LazyDeferred 
  configKey="bestSeller"
  delayKey="bestSeller"
  skeleton={<BestSellerSkeleton />}
>
  <BestSeller />
</LazyDeferred>
```

## Uso

### Componente LazySection

Para secciones que deben cargarse cuando entran al viewport:

```tsx
import { LazySection } from '@/components/lazy'

<LazySection 
  configKey="trendingSearches"
  skeleton={<TrendingSearchesSkeleton />}
  className="mt-6 sm:mt-8"
>
  <TrendingSearches />
</LazySection>
```

### Componente LazyDeferred

Para componentes que deben cargarse después de un delay:

```tsx
import { LazyDeferred } from '@/components/lazy'

<LazyDeferred 
  configKey="categoryToggle"
  delayKey="categoryToggle"
  skeleton={<CategoryPillsSkeleton />}
>
  <CategoryTogglePillsWithSearch />
</LazyDeferred>
```

### Hook useUnifiedLazyLoading

Para casos avanzados donde necesitas más control:

```tsx
import { useUnifiedLazyLoading } from '@/hooks/useUnifiedLazyLoading'

const MyComponent = () => {
  const { ref, isVisible } = useUnifiedLazyLoading({
    strategy: 'viewport',
    rootMargin: '200px',
    threshold: 0.01,
  })
  
  return (
    <div ref={ref}>
      {isVisible ? <Content /> : <Skeleton />}
    </div>
  )
}
```

## Configuración

Todas las configuraciones se centralizan en `src/config/lazy-loading.config.ts`:

```typescript
export const LAZY_SECTIONS = {
  newArrivals: {
    strategy: 'viewport',
    rootMargin: '300px',
    minHeight: '500px',
    threshold: 0.01,
  },
  // ...
} as const
```

### Agregar Nueva Configuración

1. Agregar la configuración en `LAZY_SECTIONS`:

```typescript
export const LAZY_SECTIONS = {
  myNewSection: {
    strategy: 'viewport',
    rootMargin: '200px',
    minHeight: '300px',
    threshold: 0.01,
  },
} as const
```

2. Usar en el componente:

```tsx
<LazySection 
  configKey="myNewSection"
  skeleton={<MySectionSkeleton />}
>
  <MySection />
</LazySection>
```

## Mejores Prácticas

1. **Usar configuraciones centralizadas**: Siempre usa `configKey` en lugar de pasar opciones inline
2. **Proporcionar skeletons**: Siempre proporciona un skeleton para mejor UX
3. **minHeight para CLS**: Las configuraciones incluyen minHeight para prevenir Cumulative Layout Shift
4. **Estrategia apropiada**: 
   - `viewport` para contenido below-the-fold
   - `delay` para componentes no críticos
   - `adaptive` para optimizaciones basadas en rendimiento
   - `immediate` solo para contenido crítico

## Migración

Para migrar código existente:

### Antes (wrapper manual)
```tsx
const LazyMyComponent = React.memo(() => {
  const { ref, isVisible } = useProgressiveLoading({
    rootMargin: '200px',
    threshold: 0.01,
  })
  
  return (
    <div ref={ref} style={{ minHeight: isVisible ? 'auto' : '300px' }}>
      {isVisible ? <MyComponent /> : <MyComponentSkeleton />}
    </div>
  )
})
```

### Después (usando LazySection)
```tsx
// 1. Agregar configuración en lazy-loading.config.ts
myComponent: {
  strategy: 'viewport',
  rootMargin: '200px',
  minHeight: '300px',
  threshold: 0.01,
}

// 2. Usar en el componente
<LazySection 
  configKey="myComponent"
  skeleton={<MyComponentSkeleton />}
>
  <MyComponent />
</LazySection>
```

## Beneficios

1. **Mantenibilidad**: Configuración centralizada facilita cambios globales
2. **Consistencia**: Todas las secciones usan la misma API
3. **Reducción de código**: Elimina wrappers repetitivos
4. **Escalabilidad**: Fácil agregar nuevas secciones con lazy loading
5. **Performance**: Optimizaciones adaptativas basadas en rendimiento del dispositivo
