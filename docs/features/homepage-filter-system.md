# Sistema de Filtros Integrado en Homepage - Documentación Técnica

## 📋 Resumen Ejecutivo

El Sistema de Filtros Integrado en Homepage es una implementación completa que permite a los usuarios filtrar productos directamente desde la página principal de Pinteya e-commerce, proporcionando una experiencia de usuario fluida y moderna con diseño mobile-first.

### 🎯 Objetivos Alcanzados

- ✅ **Filtros Visuales Interactivos**: Implementación de filtros por categoría, marca, precio y búsqueda
- ✅ **Sistema de Categorías 100% Funcional**: Píldoras interactivas con navegación URL y selección múltiple
- ✅ **Diseño Mobile-First**: Experiencia optimizada para dispositivos móviles con componentes adaptativos
- ✅ **Renderizado Condicional**: Homepage dinámico que cambia entre contenido normal y productos filtrados
- ✅ **Analytics Integrado**: Tracking completo de eventos de filtros para métricas de uso
- ✅ **Accesibilidad WCAG 2.1 AA**: Cumplimiento de estándares de accesibilidad web
- ✅ **Performance Optimizado**: Lazy loading, debouncing y optimizaciones de rendimiento
- ✅ **Production-Ready**: Código limpio sin logs de debugging, completamente operativo

## 🏗️ Arquitectura del Sistema

### Componentes Principales

```
Homepage
├── ConditionalContent (Renderizado Condicional)
│   ├── Homepage Normal (Sin filtros)
│   │   ├── Hero
│   │   ├── Categories (✅ 100% Funcional - Navegación URL)
│   │   ├── BestSeller
│   │   ├── NewArrivals
│   │   ├── PromoBanner
│   │   ├── Testimonials
│   │   ├── TrustSection
│   │   └── PinteyaRaffle
│   └── FilteredProductsSection (Con filtros)
│       ├── Header de Resultados
│       ├── Filtros Activos
│       ├── Grid de Productos
│       └── Paginación
├── FloatingFilterActions (Móvil)
├── DetailedFilterSheet (Móvil)
└── SortSheet (Móvil)
```

### 🎯 Componente Categories - Estado Actual

**✅ COMPLETAMENTE RESUELTO (Enero 2025)**

El componente Categories ha sido completamente implementado y está 100% funcional:

- **Navegación URL**: Sincronización bidireccional con parámetros `?categories=categoria1,categoria2`
- **Selección Múltiple**: Soporte para múltiples categorías simultáneas
- **Estados Visuales**: Indicadores claros de categorías seleccionadas/no seleccionadas
- **Toggle Functionality**: Selección/deselección individual de categorías
- **Production-Ready**: Código limpio sin logs de debugging

**Documentación específica**: [Categories Filter System](../components/categories-filter-system.md)

### Hooks Personalizados

1. **`useProductFilters`**: Gestión de estado de filtros con sincronización URL
2. **`useFilterAnalytics`**: Tracking de eventos de filtros para analytics
3. **`useFilterMetadata`**: Obtención de metadatos de filtros (categorías, marcas)
4. **`useProducts`**: Gestión de productos con filtros aplicados

### APIs Integradas

- **`/api/products`**: Endpoint principal para obtener productos filtrados
- **`/api/filters/metadata`**: Metadatos de filtros (categorías, marcas, rangos)
- **`/api/analytics/events`**: Tracking de eventos de filtros

## 🔧 Implementación Técnica

### 1. Renderizado Condicional

**Archivo**: `src/components/Home/ConditionalContent/index.tsx`

```typescript
// Detecta filtros activos en URL
const hasActiveFilters = useMemo(() => {
  if (!searchParams) return false;

  const filterParams = ['categories', 'brands', 'priceMin', 'priceMax', 'search', 'sortBy', 'page'];
  return filterParams.some(param => {
    const value = searchParams.get(param);
    return value && value.trim() !== '';
  });
}, [searchParams]);

// Renderizado condicional
return hasActiveFilters ? <FilteredProductsSection /> : <HomepageNormal />;
```

**Características**:

- Detección automática de filtros activos en URL
- Cambio dinámico entre homepage normal y productos filtrados
- Preservación del estado de navegación

### 2. Gestión de Estado de Filtros

**Archivo**: `src/hooks/useProductFilters.ts`

```typescript
interface ProductFilterState {
  categories: string[]
  brands: string[]
  priceMin?: number
  priceMax?: number
  search: string
  sortBy: string
  page: number
  limit: number
}
```

**Funcionalidades**:

- Sincronización bidireccional con URL
- Debouncing para optimización de performance
- Callbacks para cambios de filtros
- Reset automático de página al cambiar filtros

### 3. Analytics y Tracking

**Archivo**: `src/hooks/useFilterAnalytics.ts`

```typescript
// Eventos trackados
- filter_applied: Cuando se aplica un filtro
- filter_removed: Cuando se remueve un filtro
- filter_cleared: Cuando se limpian todos los filtros
- filter_search: Cuando se realiza una búsqueda
- filter_pagination: Cuando se cambia de página
- filter_sort_changed: Cuando se cambia el ordenamiento
```

**Destinos de Analytics**:

- Google Analytics 4 (GA4)
- Supabase Analytics (base de datos propia)

### 4. Componentes Móviles

#### FloatingFilterActions

- Botón flotante para acceder a filtros en móvil
- Indicador de filtros activos
- Animaciones suaves de entrada/salida

#### DetailedFilterSheet

- Panel deslizable desde abajo
- Filtros completos por categoría, marca y precio
- Aplicación inmediata de filtros

#### SortSheet

- Panel de ordenamiento rápido
- Opciones: Relevancia, Precio (asc/desc), Más nuevos, Más vendidos

## 📱 Diseño Responsive

### Breakpoints

```css
/* Mobile First */
sm: 640px   /* Tablet pequeña */
md: 768px   /* Tablet */
lg: 1024px  /* Desktop pequeño */
xl: 1280px  /* Desktop */
2xl: 1536px /* Desktop grande */
```

### Adaptaciones por Dispositivo

**Móvil (< 640px)**:

- FloatingFilterActions visible
- Grid de productos: 1 columna
- Filtros en panel deslizable
- Paginación simplificada

**Tablet (640px - 1024px)**:

- Grid de productos: 2-3 columnas
- Filtros en sidebar colapsable
- Navegación táctil optimizada

**Desktop (> 1024px)**:

- Grid de productos: 3-4 columnas
- Filtros siempre visibles
- Hover states completos
- Navegación con teclado

## 🎨 Sistema de Diseño

### Colores Principales

```css
--blaze-orange-600: #ea5a17 /* Color principal de marca */ --yellow-400: #facc15
  /* Color de botones */ --green-600: #16a34a /* Color de éxito */ --red-600: #dc2626
  /* Color de error */;
```

### Componentes UI

- **Badge**: Indicadores de filtros activos
- **Button**: Botones de acción con variantes
- **Card**: Contenedores de productos
- **Sheet**: Paneles móviles deslizables

## 🔍 Funcionalidades Avanzadas

### 1. Búsqueda Inteligente

- Búsqueda en tiempo real con debouncing (300ms)
- Búsqueda en nombre, descripción y marca
- Autocompletado con sugerencias
- Historial de búsquedas recientes

### 2. Filtros Dinámicos

- Carga dinámica de categorías y marcas desde API
- Contadores de productos por filtro
- Filtros combinables (AND logic)
- Limpieza individual o total de filtros

### 3. Paginación Optimizada

- Paginación server-side para performance
- Navegación por teclado (flechas)
- Indicadores de página actual
- Carga lazy de páginas siguientes

### 4. Ordenamiento Avanzado

- Múltiples criterios de ordenamiento
- Ordenamiento persistente en URL
- Cambio dinámico sin recarga de página

## 📊 Métricas y Analytics

### Dashboard de Analytics

**Archivo**: `src/components/Admin/FilterAnalyticsDashboard/index.tsx`

**Métricas Trackadas**:

- Total de eventos de filtros
- Sesiones únicas con filtros
- Filtros más utilizados
- Conversión de filtros a compras
- Tiempo promedio en página filtrada

### Eventos Personalizados

```typescript
// Estructura de evento
interface FilterAnalyticsEvent {
  event: string
  category: 'filter'
  action: string
  label?: string
  value?: number
  custom_parameters?: Record<string, any>
  timestamp: number
  session_id: string
  user_id?: string
  page_url: string
  page_title: string
}
```

## 🧪 Testing

### Cobertura de Tests

- **FilteredProductsSection**: 22 tests (renderizado, filtros, paginación, accesibilidad)
- **ConditionalContent**: 20 tests (renderizado condicional, casos edge)
- **useFilterAnalytics**: 25 tests (tracking, errores, configuración)

### Tipos de Tests

1. **Tests Unitarios**: Componentes individuales
2. **Tests de Integración**: Interacción entre componentes
3. **Tests de Accesibilidad**: Cumplimiento WCAG 2.1 AA
4. **Tests de Performance**: Tiempos de carga y renderizado

### Comandos de Testing

```bash
# Tests específicos de filtros
npm test -- --testPathPattern="FilteredProductsSection|ConditionalContent|useFilterAnalytics"

# Tests con cobertura
npm test -- --coverage --testPathPattern="Filter"

# Tests en modo watch
npm test -- --watch --testPathPattern="Filter"
```

## 🚀 Performance

### Optimizaciones Implementadas

1. **Lazy Loading**: Carga diferida de componentes pesados
2. **Debouncing**: Reducción de llamadas API en búsqueda
3. **Memoización**: React.memo y useMemo para evitar re-renders
4. **Virtualización**: Lista virtual para grandes cantidades de productos
5. **Code Splitting**: Separación de código por rutas

### Métricas de Performance

- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Cumulative Layout Shift**: < 0.1
- **First Input Delay**: < 100ms

## ♿ Accesibilidad

### Estándares Cumplidos

- **WCAG 2.1 AA**: Cumplimiento completo
- **Navegación por teclado**: Tab, Enter, Escape, Flechas
- **Screen readers**: ARIA labels y roles apropiados
- **Contraste de colores**: Ratio mínimo 4.5:1
- **Focus management**: Indicadores visuales claros

### Implementaciones Específicas

```typescript
// Ejemplo de accesibilidad
<nav
  role="navigation"
  aria-label="Navegación de páginas de productos"
>
  <Button
    aria-label={`Ir a la página anterior (página ${page - 1})`}
    className="focus:outline-none focus:ring-2 focus:ring-blaze-orange-500"
  >
    Anterior
  </Button>
</nav>
```

## 🔧 Configuración y Deployment

### Variables de Entorno

```env
# Analytics
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=xxx

# Debug
NEXT_PUBLIC_DEBUG_FILTERS=false
```

### Build y Deploy

```bash
# Build de producción
npm run build

# Verificación de tipos
npm run type-check

# Linting
npm run lint

# Deploy a Vercel
vercel --prod
```

## 📈 Roadmap Futuro

### Mejoras Planificadas

1. **Filtros Avanzados**:
   - Filtros por rango de fechas
   - Filtros por disponibilidad
   - Filtros por descuentos

2. **AI/ML Integration**:
   - Recomendaciones personalizadas
   - Filtros inteligentes basados en historial
   - Búsqueda semántica

3. **Performance**:
   - Service Workers para cache
   - Prefetching de páginas siguientes
   - Optimización de imágenes WebP/AVIF

4. **UX Enhancements**:
   - Filtros guardados por usuario
   - Comparación de productos
   - Vista de lista vs grid

## 🤝 Contribución

### Estructura de Archivos

```
src/
├── components/
│   ├── Home/
│   │   ├── ConditionalContent/
│   │   └── FilteredProductsSection/
│   └── ui/
│       ├── FloatingFilterActions/
│       ├── DetailedFilterSheet/
│       └── SortSheet/
├── hooks/
│   ├── useProductFilters.ts
│   ├── useFilterAnalytics.ts
│   └── useFilterMetadata.ts
├── app/api/
│   ├── products/route.ts
│   ├── filters/metadata/route.ts
│   └── analytics/events/route.ts
└── __tests__/
    ├── components/
    └── hooks/
```

### Guías de Desarrollo

1. **Naming Conventions**: camelCase para variables, PascalCase para componentes
2. **File Structure**: Un componente por archivo, index.tsx para exports
3. **Testing**: Test por cada componente y hook
4. **Documentation**: JSDoc para funciones públicas
5. **TypeScript**: Tipado estricto, interfaces explícitas

## 📚 Ejemplos de Uso

### Integración Básica

```typescript
// Uso del hook de filtros
import { useProductFilters } from '@/hooks/useProductFilters';

function MyComponent() {
  const {
    filters,
    updateCategories,
    updateBrands,
    updatePriceRange,
    updateSearch,
    clearFilters,
  } = useProductFilters({
    onFiltersChange: (newFilters) => {
      console.log('Filtros actualizados:', newFilters);
    }
  });

  return (
    <div>
      <button onClick={() => updateCategories(['Exterior'])}>
        Filtrar por Exterior
      </button>
      <button onClick={clearFilters}>
        Limpiar Filtros
      </button>
    </div>
  );
}
```

### Analytics Personalizado

```typescript
// Uso del hook de analytics
import { useFilterAnalytics } from '@/hooks/useFilterAnalytics';

function FilterComponent() {
  const analytics = useFilterAnalytics({
    enabled: true,
    debug: process.env.NODE_ENV === 'development',
    userId: user?.id,
  });

  const handleFilterApply = (type: string, value: string, results: number) => {
    analytics.trackFilterApplied(type, value, results);
  };

  return (
    // Tu componente aquí
  );
}
```

### Componente de Filtros Personalizado

```typescript
// Crear un filtro personalizado
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface CustomFilterProps {
  activeFilters: Array<{ type: string; value: string }>;
  onRemoveFilter: (type: string, value: string) => void;
  onClearAll: () => void;
}

export function CustomFilter({ activeFilters, onRemoveFilter, onClearAll }: CustomFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {activeFilters.map((filter) => (
        <Badge
          key={`${filter.type}-${filter.value}`}
          variant="secondary"
          className="cursor-pointer"
          onClick={() => onRemoveFilter(filter.type, filter.value)}
        >
          {filter.value} ×
        </Badge>
      ))}
      {activeFilters.length > 0 && (
        <Button variant="outline" size="sm" onClick={onClearAll}>
          Limpiar todo
        </Button>
      )}
    </div>
  );
}
```

## 🔍 Troubleshooting

### Problemas Comunes

**1. Filtros no se aplican**

```typescript
// Verificar que la URL se actualiza correctamente
console.log('URL actual:', window.location.search)
console.log('Filtros activos:', filters)
```

**2. Analytics no funciona**

```typescript
// Verificar configuración
const analytics = useFilterAnalytics({ debug: true })
// Revisar consola para logs de debug
```

**3. Performance lenta**

```typescript
// Verificar debouncing
const debouncedSearch = useDebounce(searchTerm, 300)
```

### Logs de Debug

```typescript
// Habilitar logs detallados
localStorage.setItem('debug-filters', 'true')

// En el componente
if (localStorage.getItem('debug-filters')) {
  console.log('Estado de filtros:', filters)
  console.log('Productos cargados:', products.length)
}
```

---

**Última actualización**: Enero 2025
**Versión**: 2.0.0
**Autor**: Equipo de Desarrollo Pinteya
**Estado**: ✅ Completado y en Producción
**Componente Categories**: ✅ 100% Funcional - Problema de navegación URL resuelto
