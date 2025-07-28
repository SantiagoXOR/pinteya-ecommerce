# 🔍 Sistema de Filtros Homepage - Guía Rápida

## ✅ Estado Actual: 100% Funcional

**Última actualización**: Enero 2025 - **Problema de Categories RESUELTO**

El sistema de filtros por categorías está completamente operativo con navegación URL y selección múltiple.

## 🚀 Inicio Rápido

### Instalación y Configuración

El sistema de filtros ya está integrado en el homepage. Para usarlo:

1. **Navega al homepage**: `http://localhost:3000`
2. **Aplica filtros**: Usa los parámetros URL o la interfaz visual
3. **Observa el cambio**: El homepage cambia automáticamente a vista filtrada

### URLs de Ejemplo

```bash
# Filtro por categoría
http://localhost:3000/?categories=Exterior

# Múltiples categorías
http://localhost:3000/?categories=Exterior,Interior

# Filtro por marca
http://localhost:3000/?brands=Sherwin Williams

# Filtro por precio
http://localhost:3000/?priceMin=1000&priceMax=5000

# Búsqueda
http://localhost:3000/?search=pintura

# Combinación de filtros
http://localhost:3000/?categories=Exterior&brands=Sherwin Williams&priceMin=2000
```

## 🎯 Funcionalidades Principales

### ✅ Renderizado Condicional
- Homepage normal cuando no hay filtros
- Vista de productos filtrados cuando hay filtros activos
- Transición suave entre estados

### ✅ Filtros Disponibles
- **Categorías**: ✅ 100% Funcional - Píldoras interactivas con navegación URL
  - Preparación, Reparación, Terminación, Decorativo, Profesional
  - Interior, Exterior, Humedad, Maderas, Techos, Sintético
  - Selección múltiple: `/?categories=preparacion,reparacion,terminacion`
- **Marcas**: Sherwin Williams, Petrilac, Sinteplast, etc.
- **Precio**: Rango mínimo y máximo
- **Búsqueda**: Texto libre en nombre, descripción y marca
- **Ordenamiento**: Relevancia, precio, fecha, popularidad

### 🎯 Componente Categories - Características Principales
- **Toggle Functionality**: Selección/deselección individual de categorías
- **Navegación URL**: Sincronización automática con parámetros de query
- **Estados Visuales**: Indicadores claros de categorías activas
- **Responsive Design**: Dos filas adaptativas (5 + 6 categorías)
- **Performance**: Optimizado con Next.js Image y transiciones CSS

### ✅ Experiencia Móvil
- Botón flotante para acceder a filtros
- Panel deslizable con todos los filtros
- Diseño optimizado para touch

### ✅ Analytics Integrado
- Tracking automático de eventos de filtros
- Métricas de uso y conversión
- Dashboard administrativo

## 🛠️ Uso para Desarrolladores

### Hook Principal: useProductFilters

```typescript
import { useProductFilters } from '@/hooks/useProductFilters';

function MyComponent() {
  const {
    filters,           // Estado actual de filtros
    updateCategories,  // Actualizar categorías
    updateBrands,      // Actualizar marcas
    updatePriceRange,  // Actualizar rango de precio
    updateSearch,      // Actualizar búsqueda
    updateSortBy,      // Actualizar ordenamiento
    updatePage,        // Actualizar página
    clearFilters,      // Limpiar todos los filtros
  } = useProductFilters();

  return (
    <div>
      <button onClick={() => updateCategories(['Exterior'])}>
        Filtrar por Exterior
      </button>
      <button onClick={() => updateBrands(['Sherwin Williams'])}>
        Filtrar por Sherwin Williams
      </button>
      <button onClick={() => updatePriceRange(1000, 5000)}>
        Filtrar por precio $1000-$5000
      </button>
      <button onClick={clearFilters}>
        Limpiar filtros
      </button>
    </div>
  );
}
```

### Hook de Analytics: useFilterAnalytics

```typescript
import { useFilterAnalytics } from '@/hooks/useFilterAnalytics';

function FilterComponent() {
  const analytics = useFilterAnalytics({
    enabled: true,
    debug: process.env.NODE_ENV === 'development',
  });

  const handleFilterApply = () => {
    analytics.trackFilterApplied('category', 'Exterior', 12);
  };

  const handleFilterRemove = () => {
    analytics.trackFilterRemoved('category', 'Exterior', 11);
  };

  const handleClearAll = () => {
    analytics.trackFiltersCleared(3, ['category', 'brand', 'price']);
  };

  return (
    // Tu componente aquí
  );
}
```

### Componente de Productos: useProducts

```typescript
import { useProducts } from '@/hooks/useProducts';

function ProductList() {
  const {
    products,      // Array de productos
    isLoading,     // Estado de carga
    error,         // Error si existe
    pagination,    // Info de paginación
    fetchProducts, // Función para cargar productos
  } = useProducts({
    autoFetch: true,
    defaultFilters: {
      page: 1,
      limit: 12,
      sortBy: 'created_at',
      sortOrder: 'desc',
    }
  });

  if (isLoading) return <div>Cargando...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {products.map(product => (
        <div key={product.id}>{product.name}</div>
      ))}
      <div>
        Página {pagination.page} de {pagination.totalPages}
      </div>
    </div>
  );
}
```

## 📱 Componentes UI

### FilteredProductsSection

Componente principal que muestra productos filtrados:

```typescript
import FilteredProductsSection from '@/components/Home/FilteredProductsSection';

// Se renderiza automáticamente cuando hay filtros activos
<FilteredProductsSection />
```

### ConditionalContent

Componente que maneja el renderizado condicional:

```typescript
import ConditionalContent from '@/components/Home/ConditionalContent';

// Renderiza homepage normal o productos filtrados según URL
<ConditionalContent />
```

### FloatingFilterActions (Móvil)

```typescript
import FloatingFilterActions from '@/components/ui/FloatingFilterActions';

<FloatingFilterActions
  activeFiltersCount={3}
  onOpenFilters={() => setShowFilters(true)}
  onOpenSort={() => setShowSort(true)}
/>
```

### DetailedFilterSheet (Móvil)

```typescript
import DetailedFilterSheet from '@/components/ui/DetailedFilterSheet';

<DetailedFilterSheet
  isOpen={showFilters}
  onClose={() => setShowFilters(false)}
  filters={filters}
  onFiltersChange={updateFilters}
/>
```

## 🎨 Personalización

### Estilos CSS

Los componentes usan Tailwind CSS con clases personalizadas:

```css
/* Colores principales */
.filter-primary { @apply bg-blaze-orange-600 text-white; }
.filter-secondary { @apply bg-yellow-400 text-gray-900; }
.filter-success { @apply bg-green-600 text-white; }

/* Animaciones */
.filter-slide-up { @apply transform translate-y-full transition-transform duration-300; }
.filter-slide-up.open { @apply translate-y-0; }
```

### Configuración de Breakpoints

```typescript
// Configuración responsive
const breakpoints = {
  sm: '640px',   // Tablet pequeña
  md: '768px',   // Tablet
  lg: '1024px',  // Desktop pequeño
  xl: '1280px',  // Desktop
  '2xl': '1536px' // Desktop grande
};
```

## 🧪 Testing

### Ejecutar Tests

```bash
# Tests de filtros específicos
npm test -- --testPathPattern="Filter"

# Tests con cobertura
npm test -- --coverage --testPathPattern="FilteredProductsSection|ConditionalContent"

# Tests en modo watch
npm test -- --watch --testPathPattern="useFilterAnalytics"
```

### Estructura de Tests

```
__tests__/
├── components/
│   ├── FilteredProductsSection.test.tsx
│   └── ConditionalContent.test.tsx
└── hooks/
    ├── useProductFilters.test.ts
    ├── useFilterAnalytics.test.ts
    └── useProducts.test.ts
```

## 📊 Monitoreo y Analytics

### Dashboard de Analytics

Accede al dashboard en: `/admin/analytics/filters`

**Métricas disponibles**:
- Total de eventos de filtros
- Sesiones únicas con filtros
- Filtros más utilizados
- Conversión de filtros a compras
- Tiempo promedio en página filtrada

### Eventos Trackados

```typescript
// Eventos automáticos
- filter_applied: Filtro aplicado
- filter_removed: Filtro removido
- filter_cleared: Filtros limpiados
- filter_search: Búsqueda realizada
- filter_pagination: Página cambiada
- filter_sort_changed: Ordenamiento cambiado
- filter_session_started: Sesión iniciada
- filter_session_ended: Sesión terminada
```

## 🔧 Troubleshooting

### Problemas Comunes

**1. Filtros no se aplican**
- Verificar que la URL contiene los parámetros correctos
- Revisar que `useProductFilters` está configurado correctamente
- Comprobar que la API `/api/products` responde correctamente

**2. Analytics no funciona**
- Verificar variables de entorno de GA4
- Comprobar que Supabase está configurado
- Habilitar modo debug: `debug: true` en `useFilterAnalytics`

**3. Performance lenta**
- Verificar que el debouncing está activo (300ms)
- Comprobar que los componentes usan `React.memo`
- Revisar que las imágenes están optimizadas

### Debug Mode

```typescript
// Habilitar debug en desarrollo
const analytics = useFilterAnalytics({
  debug: process.env.NODE_ENV === 'development'
});

// Logs en consola
localStorage.setItem('debug-filters', 'true');
```

## 🚀 Deploy y Producción

### Variables de Entorno Requeridas

```env
# Analytics
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=xxx

# Debug (opcional)
NEXT_PUBLIC_DEBUG_FILTERS=false
```

### Comandos de Deploy

```bash
# Build de producción
npm run build

# Verificar tipos
npm run type-check

# Linting
npm run lint

# Deploy a Vercel
vercel --prod
```

---

**🎉 ¡El sistema está listo para usar!**

### 📚 Documentación Relacionada

- [Documentación técnica completa](./homepage-filter-system.md)
- [Componente Categories - Documentación específica](../components/categories-filter-system.md)

### ✅ Estado del Proyecto - Enero 2025

- **Sistema de Filtros**: 100% Funcional
- **Componente Categories**: ✅ Problema de navegación URL resuelto
- **Production Status**: Completamente operativo
- **Código**: Limpio y sin logs de debugging
