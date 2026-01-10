# Refactorización: Arquitectura Modular de Productos

**Fecha**: 2025-01-XX  
**Estado**: ✅ Completado

## Resumen

Refactorización completa de la arquitectura de productos para mejorar mantenibilidad, escalabilidad y resolución de conflictos de caché. Se implementó un sistema modular basado en estrategias, factories y transformadores reutilizables.

## Problemas Resueltos

### 1. Conflicto de Caché Crítico
**Problema**: `useBestSellerProducts` compartía query key con `useFilteredProducts` cuando no había categoría, causando que cuando `DynamicProductCarousel` o `FreeShippingSection` cargaban, sobrescribían el caché del bestseller con productos incorrectos.

**Solución**: Implementación de query key única usando `productQueryKeys.bestseller(categorySlug)` que garantiza aislamiento de caché.

**Archivo afectado**: `src/hooks/useBestSellerProducts.ts` (línea 45)

### 2. Renderizado Condicional
**Problema**: Los productos se ocultaban durante refetch debido a condiciones de renderizado inadecuadas con `placeholderData`.

**Solución**: Mejora de la lógica de renderizado para mostrar productos siempre que existan, incluso durante actualizaciones en segundo plano.

**Archivo afectado**: `src/components/Home-v2/BestSeller/index.tsx` (línea 72)

### 3. Código Duplicado
**Problema**: Lógica de transformación/filtrado/ordenamiento repetida en múltiples componentes.

**Solución**: Extracción de funciones puras a `src/lib/products/transformers.ts` para reutilización.

### 4. Constantes Dispersas
**Problema**: Constantes hardcodeadas en múltiples archivos dificultando mantenimiento.

**Solución**: Centralización en `src/lib/products/constants.ts`.

### 5. Falta de Escalabilidad
**Problema**: Difícil agregar nuevos tipos de productos (NewArrivals, Trending, etc.) sin duplicar código.

**Solución**: Implementación del patrón Strategy para diferentes tipos de productos.

## Estructura Implementada

```
src/lib/products/
├── constants.ts                    # Constantes centralizadas
├── transformers.ts                 # Transformaciones puras
├── strategies/
│   ├── base-strategy.ts           # Interfaz y clase base
│   ├── bestseller-strategy.ts     # Estrategia para bestsellers
│   ├── free-shipping-strategy.ts  # Estrategia para envío gratis
│   └── index.ts                   # Exportaciones
├── factories/
│   └── query-factory.ts           # Factory para queries React Query
├── utils/
│   └── variant-utils.ts           # Utilidades para variantes
└── index.ts                       # Exportaciones principales
```

## Archivos Creados

### 1. `src/lib/products/constants.ts`
Constantes centralizadas:
- `BESTSELLER_PRODUCTS_SLUGS`: Lista de 10 productos bestseller específicos
- `DEFAULT_PRODUCT_QUERY_CONFIG`: Configuración por defecto para React Query
- `PRODUCT_LIMITS`: Límites de productos por tipo de sección
- `FREE_SHIPPING_THRESHOLD`: Precio mínimo para envío gratis (50000)
- `INSTALLMENTS_THRESHOLD`: Precio mínimo para cuotas (5000)

### 2. `src/lib/products/transformers.ts`
Funciones puras reutilizables:
- `orderProductsByPriority()`: Ordena productos según prioridad específica
- `separateByStock()`: Separa productos en stock/sin stock
- `sortByPrice()`: Ordena productos por precio
- `filterBestsellerProducts()`: Filtra productos bestseller
- `limitByPerformance()`: Limita según rendimiento del dispositivo
- `prepareBestsellerProducts()`: Preparación completa de bestsellers
- `shouldShowHelpCards()`: Calcula si mostrar cards de ayuda

### 3. `src/lib/products/strategies/base-strategy.ts`
Interfaz `IProductStrategy` y clase abstracta `BaseProductStrategy`:
- Define contrato para todas las estrategias
- Método `execute()` que combina todas las operaciones (filtrar, ordenar, limitar)

### 4. `src/lib/products/strategies/bestseller-strategy.ts`
Estrategia específica para productos bestseller:
- Sin categoría: Filtra 10 productos específicos hardcodeados
- Con categoría: Todos los productos de la categoría
- Ordena por prioridad y precio, separa por stock

### 5. `src/lib/products/strategies/free-shipping-strategy.ts`
Estrategia para productos con envío gratis:
- Filtra productos con precio > FREE_SHIPPING_THRESHOLD
- Ordena por precio descendente
- Fallback a productos más caros si no hay productos con envío gratis

### 6. `src/lib/products/factories/query-factory.ts`
Factory para crear queries de React Query:
- Función `createProductQueryOptions()` que acepta una estrategia
- Centraliza lógica de fetch, manejo de errores y configuración
- Retorna opciones de configuración listas para usar con `useQuery`

### 7. `src/lib/products/utils/variant-utils.ts`
Utilidades para trabajar con variantes de productos:
- `getVariantEffectivePrice()`: Obtiene precio efectivo de una variante
- `getMostExpensiveVariant()`: Encuentra la variante más costosa
- `updateProductWithMostExpensiveVariant()`: Actualiza producto con variante más costosa

## Archivos Modificados

### 1. `src/hooks/useBestSellerProducts.ts`
**Cambios principales**:
- ✅ FIX CRÍTICO: Query key única usando `productQueryKeys.bestseller(categorySlug)`
- Eliminada constante `BESTSELLER_PRODUCTS_SLUGS` (movida a constants.ts)
- Eliminada función `orderProductsByPriority` (movida a transformers.ts)
- Refactorizado para usar `BestsellerStrategy` y `createProductQueryOptions`
- Código reducido de ~185 líneas a ~74 líneas (60% reducción)

**Antes**:
```typescript
const queryKey = categorySlug 
  ? ['products', 'bestsellers', normalizedFilters] as const
  : ['filtered-products', normalizedFilters] as const  // ❌ CONFLICTO
```

**Después**:
```typescript
const queryKey = productQueryKeys.bestseller(categorySlug)  // ✅ Query key única
```

### 2. `src/components/Home-v2/BestSeller/index.tsx`
**Cambios principales**:
- Usa transformadores `limitByPerformance()` y `shouldShowHelpCards()`
- Renderizado condicional mejorado para evitar ocultar productos durante refetch
- Código simplificado y más legible

**Antes**:
```typescript
const sortedByPrice = [...adaptedProducts].sort((a, b) => b.price - a.price)
const inStock = sortedByPrice.filter(p => (p.stock ?? 0) > 0)
const outOfStock = sortedByPrice.filter(p => (p.stock ?? 0) <= 0)
const allProducts = [...inStock, ...outOfStock]
return isLowPerformance ? allProducts.slice(0, initialProductCount) : allProducts
```

**Después**:
```typescript
return limitByPerformance(adaptedProducts, isLowPerformance, limit)
```

### 3. `src/components/Home-v2/DynamicProductCarousel/index.tsx`
**Cambios principales**:
- Helpers de variantes extraídos a `variant-utils.ts`
- Usa `FREE_SHIPPING_THRESHOLD` desde constants.ts
- Código más limpio y mantenible

## Beneficios de la Refactorización

### Mantenibilidad
- ✅ Código organizado por responsabilidades
- ✅ Funciones puras fáciles de entender y modificar
- ✅ Separación clara entre lógica de negocio y UI

### Escalabilidad
- ✅ Fácil agregar nuevas estrategias (NewArrivalsStrategy, TrendingStrategy, etc.)
- ✅ Factory pattern permite crear nuevos tipos de queries fácilmente
- ✅ Transformadores reutilizables en cualquier contexto

### Testabilidad
- ✅ Funciones puras sin efectos secundarios
- ✅ Estrategias fácilmente testeables de forma aislada
- ✅ Transformadores con entradas/salidas predecibles

### Performance
- ✅ Query keys únicas resuelven conflictos de caché
- ✅ `placeholderData` mejora UX durante refetch
- ✅ Memoización adecuada previene re-renders innecesarios

### Consistencia
- ✅ Configuraciones centralizadas evitan inconsistencias
- ✅ Mismo patrón para todos los tipos de productos
- ✅ Constantes compartidas garantizan valores uniformes

## Ejemplos de Uso

### Crear Nueva Estrategia

```typescript
// src/lib/products/strategies/new-arrivals-strategy.ts
import { BaseProductStrategy } from './base-strategy'
import { ProductFilters } from '@/hooks/useFilteredProducts'
import { Product } from '@/types/product'
import { sortByPrice } from '../transformers'
import { PRODUCT_LIMITS } from '../constants'

export class NewArrivalsStrategy extends BaseProductStrategy {
  constructor(maxProducts: number = PRODUCT_LIMITS.NEW_ARRIVALS) {
    super(maxProducts)
  }
  
  filter(products: Product[]): Product[] {
    // Lógica de filtrado específica
    return products.filter(p => p.isNew)
  }
  
  sort(products: Product[]): Product[] {
    // Ordenar por fecha de creación descendente
    return [...products].sort((a, b) => {
      const dateA = new Date(a.createdAt || 0).getTime()
      const dateB = new Date(b.createdAt || 0).getTime()
      return dateB - dateA
    })
  }
  
  getApiFilters(): ProductFilters {
    return {
      limit: PRODUCT_LIMITS.NEW_ARRIVALS,
      sortBy: 'created_at',
      sortOrder: 'desc',
    }
  }
}
```

### Usar Nueva Estrategia en Hook

```typescript
// src/hooks/useNewArrivals.ts
import { useQuery } from '@tanstack/react-query'
import { productQueryKeys } from './queries/productQueryKeys'
import { NewArrivalsStrategy } from '@/lib/products/strategies'
import { createProductQueryOptions } from '@/lib/products/factories/query-factory'

export const useNewArrivals = () => {
  const strategy = new NewArrivalsStrategy()
  const queryKey = productQueryKeys.newArrivals()
  const queryOptions = createProductQueryOptions({
    strategy,
    queryKey,
    enabled: true,
  })
  
  const { data, isLoading, error } = useQuery(queryOptions)
  
  return {
    products: Array.isArray(data) ? data : [],
    isLoading,
    error: error?.message || null,
  }
}
```

## Migración de Código Existente

Para migrar componentes existentes a usar la nueva arquitectura:

1. **Extraer constantes**: Mover constantes hardcodeadas a `constants.ts`
2. **Crear transformadores**: Extraer funciones de transformación a `transformers.ts`
3. **Crear estrategia**: Implementar nueva estrategia extendiendo `BaseProductStrategy`
4. **Refactorizar hook**: Usar estrategia y factory en lugar de lógica inline
5. **Simplificar componente**: Usar transformadores en lugar de lógica inline

## Testing

Las funciones puras en `transformers.ts` son ideales para testing unitario:

```typescript
// Ejemplo de test para orderProductsByPriority
describe('orderProductsByPriority', () => {
  it('debería ordenar productos según prioridad', () => {
    const products = [
      { id: 1, slug: 'producto-c' },
      { id: 2, slug: 'producto-a' },
      { id: 3, slug: 'producto-b' },
    ]
    const priorityOrder = ['producto-a', 'producto-b', 'producto-c'] as const
    
    const result = orderProductsByPriority(products, priorityOrder)
    
    expect(result[0].slug).toBe('producto-a')
    expect(result[1].slug).toBe('producto-b')
    expect(result[2].slug).toBe('producto-c')
  })
})
```

## Próximos Pasos (Opcional)

1. **Refactorizar `FreeShippingSection`**: Usar `FreeShippingStrategy` y factory
2. **Crear `NewArrivalsStrategy`**: Para la sección de nuevos productos
3. **Crear `TrendingStrategy`**: Para productos trending
4. **Tests unitarios**: Agregar tests para transformadores y estrategias
5. **Documentación JSDoc**: Expandir documentación inline

## Breaking Changes

⚠️ **Ninguno**: Todos los cambios son internos. Las interfaces públicas de los hooks se mantienen igual, garantizando compatibilidad hacia atrás.

## Notas Técnicas

- Las estrategias deben implementar todos los métodos de `IProductStrategy`
- El factory maneja automáticamente errores y retries
- `placeholderData` asegura que los productos se muestren durante refetch
- Las query keys únicas previenen conflictos de caché entre componentes
