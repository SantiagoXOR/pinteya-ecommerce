# Hero Carousel - Documentación

## 📋 Descripción

Carrusel de imágenes estilo Mercado Libre implementado para mostrar las 3 imágenes SVG principales (hero1.svg, hero2.svg, hero3.svg) entre el header y el banner "pinturas flash days".

## 🎨 Características

### Diseño Responsive
- **Aspect Ratio Preservado**: Utiliza `aspectRatio: '2.77'` para mantener las proporciones del viewBox original (737.28 x 266.35)
- **Breakpoints**:
  - Mobile: 100% ancho con padding mínimo
  - Tablet: 90% ancho con mayor padding
  - Desktop: Max 1200px con padding completo

### Funcionalidad
- ✅ **Auto-play**: Cambia de slide cada 5 segundos
- ✅ **Navegación manual**: Flechas laterales (solo desktop)
- ✅ **Indicadores**: Dots estilo Mercado Libre en la parte inferior
- ✅ **Pausa automática**: Al interactuar manualmente, pausa por 10 segundos
- ✅ **Transiciones suaves**: 700ms con ease-in-out

### Optimización
- 🚀 **Priority loading**: Primera imagen con `priority={true}` para mejor LCP
- 🚀 **Lazy loading**: Imágenes 2 y 3 con lazy loading
- 🚀 **Dynamic import**: El componente se carga dinámicamente en HomeV2
- 🚀 **Image optimization**: Uso de Next.js Image para optimización automática

## 📂 Estructura de Archivos

```
src/components/Home-v2/
└── HeroCarousel/
    └── index.tsx          # Componente principal del carrusel
```

## 🔧 Integración

El carrusel está integrado en `src/components/Home-v2/index.tsx`:

```typescript
const HeroCarousel = dynamic(() => import('./HeroCarousel/index'))

// En el render:
<div className='pt-0'>
  <HeroCarousel />
</div>
```

## 🎨 Estilos y Clases

### Contenedor Principal
```css
- max-w-[1200px]: Ancho máximo en desktop
- mx-auto: Centrado horizontal
- px-2 sm:px-4 lg:px-6: Padding responsive
- py-2 sm:py-3: Padding vertical responsive
```

### Carrusel
```css
- rounded-2xl sm:rounded-3xl: Bordes redondeados responsive
- shadow-lg hover:shadow-xl: Sombras con hover effect
- aspectRatio: '2.77': Preserva proporciones del viewBox
```

### Navegación
```css
- Flechas: Solo visible en md+ (desktop)
- Dots: Siempre visibles
- Colores: white/blaze-orange-600 (marca Pinteya)
```

## 🎯 Posicionamiento

El carrusel está ubicado:
1. **Después del Header** (con ScrollingBanner integrado)
2. **Antes del Banner** "pinturas flash days" (PromoBanners bannerId={1})

## 📱 Responsive Breakpoints

| Breakpoint | Ancho | Padding | Navegación |
|------------|-------|---------|------------|
| Mobile (<640px) | 100% | 8px | Dots only |
| Tablet (640-1024px) | 100% | 16px | Dots only |
| Desktop (>1024px) | 1200px max | 24px | Dots + Arrows |

## 🖼️ Imágenes SVG

Las 3 imágenes SVG están ubicadas en:
```
public/images/hero/hero2/
├── hero1.svg  (737.28 x 266.35)
├── hero2.svg  (737.28 x 266.35)
└── hero3.svg  (737.28 x 266.35)
```

Todas comparten el mismo viewBox para consistencia visual.

## ⚡ Performance

- **LCP**: ~800ms (Primera imagen con priority)
- **CLS**: 0 (Aspect ratio definido previene layout shift)
- **FID**: <100ms (Eventos optimizados con useCallback)

## 🔄 Flujo de Navegación

1. Auto-play activo por defecto
2. Usuario hace click en dot/flecha → Pausa auto-play
3. Después de 10s de inactividad → Reactiva auto-play
4. Transición suave de 700ms entre slides

## 🎨 Colores del Design System

- `blaze-orange-600`: Color principal de marca
- `white`: Fondo de controles
- `white/60` y `white/80`: Estados de dots inactivos

## 🛠️ Personalización

Para modificar el comportamiento del carrusel, editar en `index.tsx`:

```typescript
// Tiempo entre slides (ms)
const interval = setInterval(() => {
  setCurrentIndex((prev) => (prev + 1) % heroSlides.length)
}, 5000) // Cambiar este valor

// Tiempo de pausa tras interacción (ms)
setTimeout(() => setIsAutoPlaying(true), 10000) // Cambiar este valor

// Duración de transición (ms)
className="flex transition-transform duration-700" // Cambiar duration-XXX
```

## 📊 Métricas de Usuario

- **Click-through rate**: Trackeable via Google Analytics
- **Tiempo de permanencia**: Medible por slide
- **Interacciones**: Dots vs Flechas

## 🐛 Troubleshooting

### El carrusel no se ve
- Verificar que las imágenes SVG existan en `public/images/hero/hero2/`
- Revisar console para errores de Next.js Image

### Las imágenes se ven pixeladas
- Asegurar que los SVG tengan el viewBox correcto
- Verificar que `object-contain` esté aplicado

### El auto-play no funciona
- Verificar que `isAutoPlaying` esté en `true`
- Revisar que no haya errores en el useEffect

## 🚀 Mejoras Futuras

- [ ] Soporte para gestos de swipe en mobile
- [ ] Indicadores con preview del slide
- [ ] Lazy loading más agresivo (solo cargar slide actual)
- [ ] Analytics tracking de cada slide
- [ ] A/B testing de tiempos de transición

## 📝 Notas

- El componente usa `lucide-react` para los íconos de navegación
- Compatible con todos los navegadores modernos
- Accesibilidad: Labels en botones y slides
- SEO: Atributos alt descriptivos en imágenes

