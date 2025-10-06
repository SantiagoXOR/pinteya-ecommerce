# Hero Carousel - Optimización Móvil

## 📱 Resumen de Optimizaciones

Este documento detalla las optimizaciones implementadas en el hero-section del carrusel específicamente para dispositivos móviles, mejorando significativamente la experiencia de usuario en pantallas pequeñas.

## 🎯 Objetivos Cumplidos

### ✅ 1. Eliminación de Espaciado Superior

- **Antes**: Padding-top que separaba el hero-section del header sticky
- **Después**: El carrusel comienza inmediatamente debajo del header sin espacio en blanco
- **Implementación**: Layout separado para móvil (`md:hidden`) sin padding superior

### ✅ 2. Remoción del Contenedor Naranja

- **Antes**: Div con background gradient naranja envolviendo el carrusel
- **Después**: Carrusel con fondo transparente/blanco
- **Implementación**: Componente `HeroCarouselMobile` independiente sin contenedor naranja

### ✅ 3. Gestos Táctiles Nativos

- **Antes**: Botones de navegación (flechas anterior/siguiente)
- **Después**: Gestos de swipe izquierda/derecha para navegación
- **Implementación**: Hook personalizado `useSwipeGestures` con detección táctil

### ✅ 4. Vista de Imágenes Parciales (Peek)

- **Antes**: Una sola imagen visible
- **Después**: Imagen central (70%) + porciones laterales (20% cada una)
- **Implementación**: Layout de 3 imágenes con opacidad y escala diferenciadas

## 🏗️ Arquitectura Implementada

### Nuevos Componentes

```
src/
├── hooks/
│   └── useSwipeGestures.ts          # Hook para detección de gestos táctiles
├── components/Home/Hero/
│   ├── HeroCarouselMobile.tsx       # Carrusel optimizado para móvil
│   └── index.tsx                    # Hero principal con layout responsivo
└── styles/
    └── hero-carousel.css            # Estilos CSS actualizados
```

### Hook useSwipeGestures

```typescript
interface SwipeGestureConfig {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  threshold?: number
  preventDefaultTouchmove?: boolean
}
```

**Características:**

- Detección de touch events (touchstart, touchmove, touchend)
- Threshold configurable para activar navegación (50px por defecto)
- Prevención de scroll vertical durante swipe horizontal
- Cleanup automático de event listeners

### Componente HeroCarouselMobile

**Layout de Peek:**

```
[20% Anterior] [70% Actual] [20% Siguiente]
    ↑              ↑            ↑
  Opacidad 40%  Completa    Opacidad 40%
  Escala 90%    Escala 100%  Escala 90%
```

**Características:**

- Integración con `useHeroCarousel` para lógica de navegación
- Gestos táctiles con `useSwipeGestures`
- Indicadores (dots) mantenidos en la parte inferior
- Transiciones suaves entre slides
- Indicadores visuales de swipe (puntos animados)

## 🎨 Estilos CSS

### Nuevas Clases CSS

```css
.hero-carousel-mobile {
  touch-action: pan-y pinch-zoom;
  -webkit-overflow-scrolling: touch;
}

.hero-carousel-mobile-peek {
  transition: all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.hero-carousel-mobile-peek.active {
  transform: scale(1) translateX(0);
  opacity: 1;
  z-index: 20;
}

.hero-carousel-mobile-peek.previous,
.hero-carousel-mobile-peek.next {
  transform: scale(0.9) translateX(±10%);
  opacity: 0.4;
  z-index: 10;
}
```

## 📱 Responsive Design

### Breakpoints Utilizados

- **Móvil**: `< 768px` (md:hidden)
  - Usa `HeroCarouselMobile`
  - Sin padding superior
  - Gestos táctiles habilitados
  - Layout de peek activo

- **Desktop**: `≥ 768px` (hidden md:block)
  - Usa `HeroCarouselInteractive` original
  - Mantiene diseño existente
  - Controles de botones
  - Layout de grid con texto

## 🚀 Funcionalidades

### Gestos Táctiles

- **Swipe Izquierda**: Siguiente imagen
- **Swipe Derecha**: Imagen anterior
- **Threshold**: 50px mínimo para activar
- **Prevención**: Scroll vertical bloqueado durante swipe horizontal

### Indicadores Visuales

- **Dots**: Indicadores de posición en la parte inferior
- **Animaciones**: Puntos laterales que indican dirección de swipe
- **Estados**: Activo (amarillo, escala 125%) vs inactivo (blanco/60%)

### Transiciones

- **Duración**: 500ms para cambios de imagen
- **Easing**: `cubic-bezier(0.25, 0.46, 0.45, 0.94)` para suavidad
- **Propiedades**: Transform, opacity, scale

## 🔧 Configuración

### Parámetros del Hook useSwipeGestures

```typescript
const { attachListeners } = useSwipeGestures({
  onSwipeLeft: goToNext,
  onSwipeRight: goToPrevious,
  threshold: 50, // Distancia mínima en px
  preventDefaultTouchmove: true, // Bloquear scroll vertical
})
```

### Configuración del Carrusel

```typescript
const { currentIndex, goToSlide, goToNext, goToPrevious } = useHeroCarousel({
  images,
  autoPlayInterval: 5000,
  pauseOnHover: false, // Deshabilitado para móvil
})
```

## 📊 Métricas de Performance

### Optimizaciones Implementadas

- **Touch Events**: Passive listeners donde es posible
- **Image Loading**: Priority para imagen actual, lazy para laterales
- **CSS Transitions**: Hardware acceleration con transform
- **Memory Management**: Cleanup automático de event listeners

### Tamaños de Imagen

- **Imagen Central**: `sizes="70vw"`
- **Imágenes Laterales**: `sizes="20vw"`
- **Optimización**: Next.js Image component con fill

## 🧪 Testing

### Casos de Prueba Recomendados

1. **Gestos Táctiles**
   - Swipe izquierda/derecha en diferentes velocidades
   - Swipe vertical (no debe cambiar imagen)
   - Swipe con threshold insuficiente

2. **Responsive Design**
   - Cambio de orientación (portrait/landscape)
   - Diferentes tamaños de pantalla móvil
   - Transición móvil ↔ desktop

3. **Performance**
   - Fluidez de transiciones
   - Tiempo de carga de imágenes
   - Memory leaks en event listeners

## 🔄 Compatibilidad

### Navegadores Soportados

- **iOS Safari**: 12+
- **Chrome Mobile**: 80+
- **Firefox Mobile**: 80+
- **Samsung Internet**: 12+

### Fallbacks

- Touch events no soportados: Mantiene indicadores clickeables
- CSS transforms no soportados: Fallback a opacity
- Intersection Observer: Polyfill automático de Next.js

## 📝 Notas de Implementación

### Consideraciones Técnicas

1. **Event Listeners**: Uso de `{ passive: false }` solo cuando necesario
2. **Memory Management**: Cleanup en useEffect y componentWillUnmount
3. **Performance**: Debounce implícito en gesture detection
4. **Accessibility**: Mantenimiento de ARIA labels y keyboard navigation

### Futuras Mejoras

- [ ] Implementar haptic feedback en dispositivos compatibles
- [ ] Añadir indicadores de progreso durante swipe
- [ ] Optimizar para pantallas ultra-wide
- [ ] Implementar lazy loading más agresivo para imágenes laterales
