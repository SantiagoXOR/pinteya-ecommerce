# Hero Section - Documentación Técnica

## 📋 Resumen

El **Hero Section** es el componente principal de la página de inicio de Pinteya e-commerce. Diseñado con un enfoque limpio y minimalista, se centra exclusivamente en el mensaje principal de la marca sin distracciones visuales. Optimizado para dispositivos móviles y desktop con layers de imágenes de fondo y efectos visuales atractivos.

## 🎯 Actualización Enero 2025

**✅ LIMPIEZA COMPLETADA**: Se eliminaron los iconos de servicios (Envíos, Asesoramiento, Pagos, Cambios) que anteriormente estaban incluidos en el hero section. Estos elementos fueron correctamente reubicados al `TrustSection` para mantener una arquitectura limpia y separación de responsabilidades.

## 🎯 Características Principales

### ✅ Funcionalidades Implementadas

- **Navegación automática** con intervalo configurable (5 segundos por defecto)
- **Pausa en hover** para mejorar la experiencia del usuario
- **Controles de navegación manual** (flechas anterior/siguiente)
- **Indicadores de posición** (dots) con navegación directa
- **Barra de progreso** visual en la parte inferior
- **Transiciones suaves** con animaciones CSS optimizadas
- **Responsive design** mobile-first
- **Accesibilidad completa** (WCAG 2.1 AA)
- **Optimización de rendimiento** con lazy loading

### 🎨 Diseño Visual

- **Paleta de colores Pinteya**: Blaze Orange (#ea5a17) y amarillo (#fbbf24)
- **Controles semi-transparentes** que aparecen solo en hover
- **Indicadores animados** con efectos de escala
- **Transiciones fluidas** entre imágenes
- **Efectos de profundidad** con sombras y blur

## 🏗️ Arquitectura

### Componentes

```
src/components/Home/Hero/
├── HeroCarouselInteractive.tsx    # Componente principal del carrusel
└── index.tsx                      # Hero section actualizado

src/hooks/
└── useHeroCarousel.ts            # Hook personalizado para lógica del carrusel

src/styles/
└── hero-carousel.css             # Estilos específicos del carrusel
```

### Hook useHeroCarousel

```typescript
interface UseHeroCarouselProps {
  images: string[];
  autoPlayInterval?: number;
  pauseOnHover?: boolean;
}

interface UseHeroCarouselReturn {
  currentIndex: number;
  isPlaying: boolean;
  isPaused: boolean;
  goToSlide: (index: number) => void;
  goToNext: () => void;
  goToPrevious: () => void;
  pause: () => void;
  resume: () => void;
  setHover: (isHovering: boolean) => void;
}
```

## 🚀 Uso

### Implementación Básica

```tsx
import HeroCarouselInteractive from '@/components/Home/Hero/HeroCarouselInteractive';

function MyComponent() {
  return (
    <div className="relative w-full h-[400px]">
      <HeroCarouselInteractive className="w-full h-full" />
    </div>
  );
}
```

### Configuración de Imágenes

Las imágenes se configuran en el componente:

```typescript
const HERO_IMAGES = [
  {
    src: '/images/hero/hero-01.png',
    alt: 'Pintá rápido, fácil y cotiza al instante - Promoción principal',
    priority: true,
  },
  {
    src: '/images/hero/hero-02.png',
    alt: 'Ofertas especiales en pintura y ferretería',
    priority: false,
  },
  {
    src: '/images/hero/hero-03.png',
    alt: 'Productos de calidad para tu hogar',
    priority: false,
  },
];
```

## 🎛️ Controles y Interactividad

### Navegación Automática
- **Intervalo**: 5 segundos por defecto
- **Pausa automática** al hacer hover
- **Reanudación** al quitar el hover

### Controles Manuales
- **Flechas de navegación**: Aparecen solo en hover
- **Indicadores (dots)**: Siempre visibles en la parte inferior
- **Navegación por teclado**: Soporte completo para accesibilidad

### Estados Visuales
- **Imagen activa**: Opacidad 100%, escala normal
- **Imágenes inactivas**: Opacidad 0%, escala 105%
- **Transiciones**: 700ms con easing cubic-bezier

## 📱 Responsive Design

### Breakpoints

```css
/* Mobile (< 768px) */
.hero-carousel-control {
  width: 40px;
  height: 40px;
}

.hero-carousel-dot {
  width: 8px;
  height: 8px;
}

/* Desktop (>= 768px) */
.hero-carousel-control {
  width: 48px;
  height: 48px;
}

.hero-carousel-dot {
  width: 12px;
  height: 12px;
}
```

### Optimizaciones Mobile
- **Controles táctiles** optimizados para dedos
- **Gestos de swipe** (futuro enhancement)
- **Carga lazy** de imágenes no prioritarias

## ♿ Accesibilidad

### Características WCAG 2.1 AA

- **Aria-labels** descriptivos en todos los controles
- **Aria-current** para indicar slide activo
- **Focus states** visibles con outline personalizado
- **Navegación por teclado** completa
- **Reducción de movimiento** para usuarios que lo prefieren

### Atributos de Accesibilidad

```tsx
// Botones de navegación
aria-label="Imagen anterior"
aria-label="Imagen siguiente"

// Indicadores
aria-label="Ir a imagen 1"
aria-current="true" // Para el slide activo

// Imágenes
alt="Descripción detallada de la imagen"
```

## 🔧 Configuración Avanzada

### Variables CSS Personalizables

```css
:root {
  --carousel-transition-duration: 0.7s;
  --carousel-control-size: 48px;
  --carousel-dot-size: 12px;
  --carousel-progress-height: 4px;
}
```

### Optimizaciones de Rendimiento

```css
.hero-carousel-container {
  will-change: transform;
  transform: translateZ(0);
}

.hero-carousel-image {
  will-change: transform, opacity;
  transform: translateZ(0);
}
```

## 🧪 Testing

### Cobertura de Tests

- **Hook useHeroCarousel**: 15 tests, 100% cobertura
- **Componente HeroCarouselInteractive**: 11 tests, 95%+ cobertura

### Ejecutar Tests

```bash
# Tests del hook
npm test -- --testPathPattern="useHeroCarousel"

# Tests del componente
npm test -- --testPathPattern="HeroCarouselInteractive"

# Todos los tests del carrusel
npm test -- --testPathPattern="Carousel"
```

## 🚀 Roadmap Futuro

### Fase 2 - Enhancements
- [ ] Gestos de swipe para móviles
- [ ] Lazy loading avanzado con Intersection Observer
- [ ] Preload de imagen siguiente
- [ ] Animaciones de entrada personalizadas

### Fase 3 - Funcionalidades Avanzadas
- [ ] Carrusel infinito sin saltos
- [ ] Thumbnails de navegación
- [ ] Autoplay con pausa en focus
- [ ] Integración con analytics

## 📊 Métricas de Rendimiento

### Objetivos
- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Cumulative Layout Shift**: < 0.1
- **Time to Interactive**: < 3s

### Optimizaciones Implementadas
- **Priority loading** para primera imagen
- **Lazy loading** para imágenes secundarias
- **CSS transforms** para animaciones GPU
- **Will-change** para optimización de capas

---

## 📝 Notas de Implementación

Este carrusel reemplaza la implementación anterior estática del hero section, proporcionando una experiencia más dinámica y atractiva para los usuarios de Pinteya e-commerce. La implementación sigue los estándares enterprise-ready del proyecto con testing completo, documentación detallada y optimizaciones de rendimiento.
