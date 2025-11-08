# Hero Image Carousel - Documentación Técnica

## 📋 Descripción General

Carrusel de imágenes interactivo implementado en el Hero Section del proyecto Pinteya e-commerce, diseñado para mostrar las 4 imágenes principales del hero (hero-01.png a hero-04.png) con funcionalidades avanzadas de navegación y accesibilidad.

## ✨ Características Implementadas

### 🎯 Funcionalidades Core

- ✅ **Autoplay inteligente**: 5 segundos con pausa automática al hover
- ✅ **Navegación completa**: Botones anterior/siguiente + indicadores clickeables
- ✅ **Gestos táctiles**: Swipe nativo en dispositivos móviles
- ✅ **Navegación por teclado**: Flechas izquierda/derecha, Escape para pausar
- ✅ **Transiciones suaves**: Animaciones de 800ms con easing personalizado
- ✅ **Loop infinito**: Navegación circular sin fin

### 🎨 Diseño Responsive

- **Mobile (< 768px)**:
  - Carrusel ocupa 100% del ancho disponible
  - Elimina completamente el contenedor naranja
  - Altura mínima: 400px (sm: 500px)
  - Botones de navegación: 8x8 (32px)
  - Indicadores: 2.5x2.5 (10px)

- **Desktop (≥ 768px)**:
  - Integrado en grid con texto del hero
  - Mantiene gradiente naranja de fondo
  - Altura fija: 400px (lg: 450px)
  - Botones de navegación: 12x12 (48px)
  - Indicadores: 3x3 (12px)
  - Sombra y bordes redondeados

### ♿ Accesibilidad WCAG 2.1 AA

#### ARIA y Semántica

```typescript
// Estructura ARIA completa
<div role="region" aria-label="Carrusel de imágenes principales" aria-live="polite">
  <Swiper aria-label="Galería de imágenes de productos">
    <SwiperSlide role="group" aria-label="1 de 4">
      <Image aria-describedby="slide-description-0" />
    </SwiperSlide>
  </Swiper>
</div>
```

#### Navegación por Teclado

- **Flechas ←/→**: Navegación entre slides
- **Tab**: Enfoque en controles de navegación
- **Enter/Space**: Activación de botones
- **Escape**: Pausa/reanuda autoplay

#### Contraste y Visibilidad

- Botones: Fondo blanco/80% con texto naranja (ratio > 4.5:1)
- Indicadores activos: Amarillo (#FBBF24) sobre fondo oscuro
- Focus rings: Amarillo con offset de 2px
- Soporte para modo alto contraste

## 🏗️ Arquitectura Técnica

### Estructura de Archivos

```
src/
├── components/
│   ├── common/
│   │   ├── HeroImageCarousel.tsx          # Componente principal
│   │   └── __tests__/
│   │       └── HeroImageCarousel.test.tsx # Tests unitarios
│   └── Home/
│       └── Hero/
│           └── index.tsx                  # Integración en Hero
├── styles/
│   └── hero-carousel.css                  # Estilos personalizados
└── docs/
    └── components/
        └── hero-image-carousel-implementation.md
```

### Dependencias Utilizadas

- **Swiper.js v11.1.15**: Motor del carrusel
- **Next.js Image**: Optimización de imágenes
- **Tailwind CSS**: Estilos y responsive design
- **TypeScript**: Tipado estático
- **React Hooks**: Estado y efectos

### Configuración de Imágenes

```typescript
const heroImages = [
  {
    src: '/images/hero/hero-01.png',
    alt: 'Pintá rápido, fácil y cotiza al instante - Productos de pinturería de calidad',
    priority: true, // Carga prioritaria para LCP
  },
  {
    src: '/images/hero/hero-02.png',
    alt: 'Amplia gama de productos para pinturería, ferretería y corralón',
    priority: false,
  },
  // ... resto de imágenes
]
```

## 🎛️ API del Componente

### Props Interface

```typescript
interface HeroImageCarouselProps {
  images: HeroImage[] // Array de imágenes (requerido)
  autoplayDelay?: number // Delay en ms (default: 5000)
  className?: string // Clases CSS adicionales
  showNavigation?: boolean // Mostrar botones nav (default: true)
  showPagination?: boolean // Mostrar indicadores (default: true)
  onSlideChange?: (index: number) => void // Callback cambio slide
}
```

### Uso Básico

```typescript
<HeroImageCarousel
  images={heroImages}
  autoplayDelay={5000}
  showNavigation={true}
  showPagination={true}
  className="w-full h-full"
/>
```

## 🎨 Personalización de Estilos

### Variables CSS Principales

```css
/* Colores del tema Pinteya */
--carousel-primary: #ea5a17; /* Blaze Orange */
--carousel-accent: #fbbf24; /* Yellow 400 */
--carousel-bg: rgba(255, 255, 255, 0.8);

/* Tamaños responsive */
--carousel-button-mobile: 2rem; /* 32px */
--carousel-button-desktop: 3rem; /* 48px */
--carousel-bullet-mobile: 0.625rem; /* 10px */
--carousel-bullet-desktop: 0.75rem; /* 12px */
```

### Clases CSS Personalizables

- `.hero-carousel`: Contenedor principal
- `.hero-carousel-bullet`: Indicadores de paginación
- `.hero-carousel-bullet-active`: Indicador activo
- `.hero-carousel-button-prev/next`: Botones de navegación

## 🧪 Testing

### Cobertura de Tests

- ✅ **Renderizado**: Componente y props
- ✅ **Accesibilidad**: ARIA labels y roles
- ✅ **Interactividad**: Navegación y eventos
- ✅ **Responsive**: Comportamiento en diferentes tamaños
- ✅ **Edge cases**: Arrays vacíos, props opcionales

### Comandos de Testing

```bash
# Tests específicos del carrusel
npm test -- --testPathPattern="HeroImageCarousel"

# Tests con cobertura
npm test -- --coverage --testPathPattern="HeroImageCarousel"

# Tests en modo watch
npm test -- --watch --testPathPattern="HeroImageCarousel"
```

## 🚀 Performance

### Optimizaciones Implementadas

- **Lazy loading**: Solo primera imagen con priority
- **Image optimization**: Next.js Image con sizes responsive
- **CSS optimizado**: Clases Tailwind compiladas
- **Reduced motion**: Soporte para usuarios con preferencias de movimiento reducido
- **Touch optimizations**: Gestos nativos optimizados para dispositivos táctiles

### Métricas Esperadas

- **LCP**: < 2.5s (primera imagen con priority)
- **CLS**: < 0.1 (dimensiones fijas)
- **FID**: < 100ms (eventos optimizados)
- **Bundle size**: +15KB (Swiper ya incluido)

## 🔧 Mantenimiento

### Agregar Nueva Imagen

1. Colocar imagen en `/public/images/hero/`
2. Agregar entrada en array `heroImages`
3. Actualizar tests si es necesario

### Modificar Estilos

1. Editar `/src/styles/hero-carousel.css`
2. Usar variables CSS para consistencia
3. Verificar responsive en todos los breakpoints

### Debugging

- Usar React DevTools para estado del componente
- Verificar console para errores de Swiper
- Validar accesibilidad con axe-core

## 📱 Compatibilidad

### Navegadores Soportados

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ iOS Safari 14+
- ✅ Chrome Android 90+

### Dispositivos Testados

- ✅ iPhone 12/13/14 (iOS 15+)
- ✅ Samsung Galaxy S21+ (Android 11+)
- ✅ iPad Pro (iPadOS 15+)
- ✅ Desktop 1920x1080+
- ✅ Laptop 1366x768+

---

**Implementado**: 28 de Julio 2025  
**Versión**: 1.0.0  
**Autor**: Pinteya Development Team  
**Estado**: ✅ Producción Ready
