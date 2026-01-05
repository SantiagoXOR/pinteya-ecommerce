# HeroCarousel

Componente de carrusel de imágenes hero para la página principal, con soporte para autoplay, navegación por teclado, y optimizaciones de performance.

> **Última actualización**: 15 de Diciembre, 2025 - Implementado con Swiper.js y versión custom optimizada para Home-v2.

## 🎯 Características

- **Autoplay configurable** - Reproducción automática con delay personalizable
- **Navegación por teclado** - Flechas izquierda/derecha y Escape para pausar
- **Pausa en hover** - Detiene autoplay al pasar el mouse
- **Navegación visual** - Botones prev/next y paginación
- **Loop infinito** - Transición suave entre última y primera slide
- **Optimización de imágenes** - Soporte para priority, fetchPriority y lazy loading
- **Accesibilidad** - ARIA labels y roles apropiados

## 📐 Estructura Visual

```
┌─────────────────────────────────────┐
│  [<]  [Imagen Hero]  [>]           │
│       • • •                         │
└─────────────────────────────────────┘
```

## 🔧 Uso Básico

### Versión con Swiper (Common)

```tsx
import { HeroCarousel } from '@/components/Common/HeroCarousel'

const images = [
  {
    src: '/images/hero/hero1.webp',
    alt: 'Pintá rápido, fácil y cotiza al instante',
    priority: true,
    fetchPriority: 'high' as const,
  },
  {
    src: '/images/hero/hero2.webp',
    alt: 'Envío express en 24HS',
  },
]

<HeroCarousel
  images={images}
  autoplayDelay={5000}
  showNavigation={true}
  showPagination={true}
  onSlideChange={(index) => console.log('Slide:', index)}
/>
```

### Versión Custom (Home-v2)

```tsx
import HeroCarousel from '@/components/Home-v2/HeroCarousel'

// El componente usa slides hardcodeados optimizados
<HeroCarousel />
```

## 📋 Props e Interfaces

### HeroCarouselProps (Common)

```typescript
interface HeroCarouselProps {
  images: HeroImage[]              // Array de imágenes del carrusel
  autoplayDelay?: number          // Delay entre slides en ms (default: 5000)
  className?: string              // Clases CSS adicionales
  showNavigation?: boolean         // Mostrar botones prev/next (default: true)
  showPagination?: boolean        // Mostrar indicadores de página (default: true)
  onSlideChange?: (index: number) => void // Callback cuando cambia el slide
}

interface HeroImage {
  src: string
  alt: string
  priority?: boolean              // Prioridad de carga (Next.js Image)
  unoptimized?: boolean           // Desactivar optimización
  fetchPriority?: 'high' | 'low' | 'auto' // Prioridad de fetch
  quality?: number                // Calidad de imagen (1-100)
  sizes?: string                  // Sizes attribute para responsive
}
```

## 🎨 Estilos y Diseño

### Colores

- **Fondo**: Transparente
- **Botones navegación**: Blanco con sombra, hover con escala
- **Paginación activa**: Naranja blaze (`blaze-orange-600`)
- **Paginación inactiva**: Gris claro

### Comportamiento Responsive

- **Desktop**: Navegación completa con botones y paginación
- **Tablet**: Navegación táctil y paginación
- **Mobile**: Swipe gestures y paginación compacta

## 🔄 Flujo de Datos

1. **Inicialización**: Carga imágenes con prioridad según configuración
2. **Autoplay**: Timer que avanza slides cada `autoplayDelay` ms
3. **Interacción**: Pausa autoplay en hover o al usar controles
4. **Navegación**: Botones, teclado o swipe cambian slide activo
5. **Callback**: Ejecuta `onSlideChange` cuando cambia el slide

## 🧪 Testing

### Casos de Prueba

- ✅ Carga de imágenes con diferentes prioridades
- ✅ Autoplay funciona correctamente
- ✅ Pausa en hover
- ✅ Navegación por teclado (ArrowLeft, ArrowRight, Escape)
- ✅ Navegación por botones
- ✅ Loop infinito (última → primera)
- ✅ Callback onSlideChange se ejecuta
- ✅ Responsive en diferentes tamaños de pantalla

## 📝 Notas de Desarrollo

### Commits Relacionados

#### `c6af607a` - "fix: Regresión LCP y CLS - Remover lazy loading de HeroCarousel"

**Cambios:**
- Removido lazy loading de la primera imagen hero
- Agregado `priority={true}` y `fetchPriority="high"` para LCP
- Mejora en tiempo de carga de la primera imagen

#### `ec601009` - "fix: Agregar fetchPriority explícito a imagen hero para LCP"

**Cambios:**
- Agregado `fetchPriority="high"` explícito
- Optimización para mejorar Largest Contentful Paint

#### `847a1ea4` - "refactor: optimización CartSidebarModal, HeroCarousel y estilos"

**Cambios:**
- Optimizaciones de performance
- Mejoras en estilos y animaciones

### Versiones del Componente

#### 1. HeroCarousel (Common) - Con Swiper.js

**Ubicación**: `src/components/Common/HeroCarousel.tsx`

**Características:**
- Usa Swiper.js para funcionalidad completa
- Soporte para módulos: Autoplay, Pagination, Navigation, Keyboard, A11y
- Más configurable y flexible

**Uso recomendado**: Cuando necesitas máxima flexibilidad y configuración

#### 2. HeroCarousel (Home-v2) - Custom Optimizado

**Ubicación**: `src/components/Home-v2/HeroCarousel/index.tsx`

**Características:**
- Implementación custom sin dependencias externas
- Optimizado específicamente para Home-v2
- Slides hardcodeados con imágenes WebP optimizadas
- Loop infinito con clones para transición suave

**Uso recomendado**: Para la página principal con slides específicos

### Optimizaciones Implementadas

1. **Imágenes WebP**: Conversión de SVG a WebP para reducir tamaño
2. **Priority Loading**: Primera imagen con `priority` y `fetchPriority="high"`
3. **Lazy Loading**: Imágenes siguientes con lazy loading
4. **Aspect Ratio**: Preservado para evitar CLS
5. **Will-change**: Para animaciones fluidas

## 🔗 Archivos Relacionados

- `src/components/Common/HeroCarousel.tsx` - Versión con Swiper.js
- `src/components/Home-v2/HeroCarousel/index.tsx` - Versión custom optimizada
- `src/components/Common/HeroCarousel.lazy.tsx` - Versión lazy loaded
- `public/images/hero/hero2/` - Imágenes optimizadas del carrusel

## 🐛 Troubleshooting

### El autoplay no funciona

**Solución**: Verifica que `autoplayDelay` esté configurado correctamente (mínimo 3000ms recomendado) y que no haya errores en la consola.

### Las imágenes no cargan

**Solución**: Verifica que las rutas de las imágenes sean correctas y que los archivos existan en `public/images/hero/`. Para la primera imagen, asegúrate de tener `priority={true}`.

### El carrusel no hace loop

**Solución**: En la versión custom (Home-v2), el loop está implementado con clones. Verifica que `extendedSlides` tenga los clones correctos al inicio y final.

### Navegación por teclado no funciona

**Solución**: Asegúrate de que el componente tenga focus. En la versión Swiper, verifica que el módulo Keyboard esté importado y configurado.
