# Guía de Responsive Design con TailwindCSS

## 📱 Análisis del Estado Actual

### Fortalezas Identificadas

✅ **Hook useResponsiveOptimized**

- Implementación robusta con debounce (150ms)
- Breakpoints alineados con Tailwind CSS
- Memoización para optimizar performance
- Helpers útiles para queries específicas

✅ **Configuración de Tailwind**

- Breakpoints personalizados: `xsm: 375px`, `lsm: 425px`, `3xl: 2000px`
- Sistema de spacing extenso y bien definido
- Animaciones y transiciones optimizadas
- Paleta de colores consistente

✅ **Implementación Mobile-First**

- Grid responsive en productos (2 cols mobile → 3-4 desktop)
- Sidebar con transformaciones apropiadas
- Padding y spacing adaptativos

### Oportunidades de Mejora

🔄 **Inconsistencias en Breakpoints**

- Uso mixto de `lg:`, `xl:` sin estrategia clara
- Falta de aprovechamiento de breakpoints personalizados (`xsm`, `lsm`)
- Algunos componentes no siguen mobile-first consistentemente

🔄 **Optimización de Performance**

- Re-renders innecesarios en cambios de viewport
- Falta de lazy loading en imágenes responsive
- Bundle size podría optimizarse con purging más agresivo

## 🎯 Mejores Prácticas Recomendadas

### 1. Estrategia Mobile-First Consistente

```tsx
// ❌ Enfoque Desktop-First (evitar)
<div className="w-full lg:w-1/2 md:w-2/3 sm:w-full">

// ✅ Enfoque Mobile-First (recomendado)
<div className="w-full sm:w-2/3 lg:w-1/2">
```

### 2. Uso Estratégico de Breakpoints Personalizados

```tsx
// Aprovecha los breakpoints personalizados del proyecto
const ResponsiveProductGrid = () => {
  return (
    <div
      className='
      grid grid-cols-1          // Mobile base (< 375px)
      xsm:grid-cols-2          // iPhone SE y similares (375px+)
      lsm:grid-cols-2          // iPhone 12 Pro y similares (425px+)
      md:grid-cols-3           // Tablet (768px+)
      lg:grid-cols-4           // Desktop (1024px+)
      xl:grid-cols-5           // Large Desktop (1280px+)
      3xl:grid-cols-6          // Ultra Wide (2000px+)
      gap-4 xsm:gap-6 lg:gap-8
    '
    >
      {products.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}
```

### 3. Componente Sidebar Optimizado

```tsx
// Mejora para ShopWithSidebar
const OptimizedSidebar = ({ isOpen, onClose }) => {
  return (
    <>
      {/* Overlay para móvil */}
      <div
        className={`
          fixed inset-0 bg-black/50 z-40
          transition-opacity duration-300
          lg:hidden
          ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}
        `}
        onClick={onClose}
      />

      {/* Sidebar */}
      <aside
        className={`
        fixed top-0 left-0 h-full w-80 bg-white z-50
        transform transition-transform duration-300 ease-in-out
        lg:relative lg:transform-none lg:z-auto
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        
        // Responsive width
        w-full xsm:w-80 sm:w-96 lg:w-80
        
        // Responsive padding
        p-4 sm:p-6 lg:p-8
      `}
      >
        {/* Contenido del sidebar */}
      </aside>
    </>
  )
}
```

### 4. Sistema de Typography Responsive

```tsx
// Utiliza las clases de fontSize personalizadas
const ResponsiveHeadings = () => {
  return (
    <div>
      <h1
        className='
        text-heading-6 sm:text-heading-5 lg:text-heading-3 xl:text-heading-1
        leading-tight
      '
      >
        Título Principal
      </h1>

      <h2
        className='
        text-custom-lg sm:text-custom-xl lg:text-custom-2xl
        text-gray-600
      '
      >
        Subtítulo
      </h2>

      <p
        className='
        text-custom-sm sm:text-base lg:text-custom-lg
        leading-relaxed
      '
      >
        Contenido del párrafo
      </p>
    </div>
  )
}
```

### 5. Imágenes Responsive Optimizadas

```tsx
const ResponsiveProductImage = ({ product }) => {
  return (
    <div
      className='
      relative overflow-hidden rounded-card
      aspect-square sm:aspect-[4/3] lg:aspect-square
    '
    >
      <Image
        src={product.image}
        alt={product.name}
        fill
        className='object-cover transition-transform duration-300 hover:scale-105'
        sizes='
          (max-width: 374px) 100vw,
          (max-width: 424px) 50vw,
          (max-width: 767px) 50vw,
          (max-width: 1023px) 33vw,
          (max-width: 1279px) 25vw,
          20vw
        '
        priority={product.featured}
        loading={product.featured ? 'eager' : 'lazy'}
      />
    </div>
  )
}
```

### 6. Hook Personalizado para Responsive Classes

```tsx
// Extensión del useResponsiveOptimized existente
export const useResponsiveClasses = () => {
  const { currentBreakpoint, isMobile, isTablet, isDesktop } = useResponsiveOptimized()

  return useMemo(
    () => ({
      // Container classes
      container: {
        padding: isMobile ? 'px-4' : isTablet ? 'px-6' : 'px-8',
        maxWidth: 'max-w-7xl mx-auto',
        full: `max-w-7xl mx-auto ${isMobile ? 'px-4' : isTablet ? 'px-6' : 'px-8'}`,
      },

      // Grid systems
      productGrid: {
        base: 'grid gap-4 xsm:gap-6 lg:gap-8',
        cols: 'grid-cols-1 xsm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 3xl:grid-cols-6',
        full: 'grid grid-cols-1 xsm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 3xl:grid-cols-6 gap-4 xsm:gap-6 lg:gap-8',
      },

      // Typography
      heading: {
        h1: 'text-heading-6 sm:text-heading-5 lg:text-heading-3 xl:text-heading-1',
        h2: 'text-heading-6 sm:text-heading-5 lg:text-heading-4',
        h3: 'text-custom-xl sm:text-custom-2xl lg:text-heading-6',
      },

      // Buttons
      button: {
        base: 'px-4 py-2 sm:px-6 sm:py-3 lg:px-8 lg:py-4',
        text: 'text-custom-sm sm:text-base lg:text-custom-lg',
      },

      // Cards
      card: {
        padding: 'p-4 sm:p-6 lg:p-8',
        spacing: 'space-y-4 sm:space-y-6 lg:space-y-8',
      },
    }),
    [currentBreakpoint, isMobile, isTablet, isDesktop]
  )
}
```

## 🚀 Implementación Práctica

### Refactorización de ShopWithSidebar

```tsx
// Ejemplo de refactorización aplicando las mejores prácticas
const ShopWithSidebarOptimized = () => {
  const { container, productGrid } = useResponsiveClasses()
  const { isMobile } = useResponsiveOptimized()

  return (
    <div className={container.full}>
      <div className='flex flex-col lg:flex-row gap-6 lg:gap-8'>
        {/* Sidebar */}
        <OptimizedSidebar />

        {/* Main Content */}
        <main className='flex-1 min-w-0'>
          {/* Header */}
          <div
            className='
            flex flex-col sm:flex-row sm:items-center sm:justify-between
            gap-4 sm:gap-6 mb-6 lg:mb-8
          '
          >
            <h1 className='text-heading-6 sm:text-heading-5 lg:text-heading-4'>Productos</h1>

            <div
              className='
              flex flex-col xsm:flex-row gap-3 xsm:gap-4
              w-full sm:w-auto
            '
            >
              <SortSelect />
              <ViewToggle />
            </div>
          </div>

          {/* Products Grid */}
          <div className={productGrid.full}>
            {products.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {/* Pagination */}
          <div className='mt-8 lg:mt-12'>
            <Pagination />
          </div>
        </main>
      </div>
    </div>
  )
}
```

## 📊 Métricas de Performance

### Core Web Vitals Objetivos

- **LCP (Largest Contentful Paint)**: < 2.5s
- **FID (First Input Delay)**: < 100ms
- **CLS (Cumulative Layout Shift)**: < 0.1

### Optimizaciones Específicas

1. **Lazy Loading Inteligente**

```tsx
const LazyProductImage = ({ product, priority = false }) => {
  return (
    <Image
      src={product.image}
      alt={product.name}
      loading={priority ? 'eager' : 'lazy'}
      sizes='(max-width: 374px) 100vw, (max-width: 767px) 50vw, (max-width: 1023px) 33vw, 25vw'
    />
  )
}
```

2. **Skeleton Loading Responsive**

```tsx
const ProductSkeleton = () => {
  return (
    <div className='animate-pulse'>
      <div
        className='
        bg-gray-200 rounded-card
        aspect-square sm:aspect-[4/3] lg:aspect-square
        mb-4
      '
      />
      <div className='space-y-2'>
        <div className='h-4 bg-gray-200 rounded w-3/4' />
        <div className='h-4 bg-gray-200 rounded w-1/2' />
      </div>
    </div>
  )
}
```

## 🔧 Herramientas de Desarrollo

### Extensiones Recomendadas

- **Tailwind CSS IntelliSense**: Autocompletado y validación
- **Responsive Viewer**: Testing en múltiples dispositivos
- **React Developer Tools**: Profiling de componentes

### Scripts de Testing

```json
{
  "scripts": {
    "test:responsive": "playwright test --config=playwright.responsive.config.ts",
    "lighthouse:mobile": "lighthouse --preset=mobile --output=html --output-path=./reports/mobile.html",
    "lighthouse:desktop": "lighthouse --preset=desktop --output=html --output-path=./reports/desktop.html"
  }
}
```

## 📱 Checklist de Implementación

### Mobile-First

- [ ] Todas las clases empiezan sin prefijo (mobile base)
- [ ] Uso progresivo de breakpoints: `sm:` → `md:` → `lg:` → `xl:`
- [ ] Aprovechamiento de breakpoints personalizados (`xsm`, `lsm`)
- [ ] Touch targets mínimo 44px

### Performance

- [ ] Imágenes con `sizes` attribute apropiado
- [ ] Lazy loading implementado
- [ ] Skeleton states para loading
- [ ] Debounce en resize handlers

### Accesibilidad

- [ ] Contraste adecuado en todos los breakpoints
- [ ] Navegación por teclado funcional
- [ ] Screen reader friendly
- [ ] Focus states visibles

### Testing

- [ ] Pruebas en dispositivos reales
- [ ] Lighthouse scores > 90
- [ ] Cross-browser compatibility
- [ ] Performance monitoring

---

_Esta guía debe actualizarse regularmente conforme evolucionen las mejores prácticas y se identifiquen nuevas oportunidades de optimización._
