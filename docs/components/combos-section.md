# CombosSection

Componente de carrusel de combos destacados con navegación táctil, auto-play y optimizaciones de performance para la página principal.

> **Última actualización**: 15 de Diciembre, 2025 - Implementado con loop infinito, gestos táctiles y optimización de imágenes WebP.

## 🎯 Características

- **Carrusel de combos** - Muestra 3 combos destacados con imágenes optimizadas
- **Loop infinito** - Transición suave entre última y primera slide
- **Auto-play** - Avance automático cada 5 segundos
- **Gestos táctiles** - Soporte para swipe en mobile
- **Navegación manual** - Botones prev/next y click en slides
- **Optimización CLS** - Skeleton placeholder mientras cargan imágenes
- **Aspect ratio preservado** - AspectRatio 2.77 para consistencia visual

## 📐 Estructura Visual

```
┌─────────────────────────────────────┐
│ [<]  [Combo 1] [Combo 2] [>]       │
│       • • •                         │
└─────────────────────────────────────┘
```

## 🔧 Uso Básico

```tsx
import CombosSection from '@/components/Home-v2/CombosSection'

// El componente no requiere props
<CombosSection />
```

## 📋 Props e Interfaces

El componente no acepta props. Usa slides hardcodeados:

```typescript
interface Slide {
  id: string
  image: string        // Ruta a imagen WebP
  alt: string          // Texto alternativo
  productSlug: string  // Slug del producto para navegación
}
```

## 🎨 Estilos y Diseño

### Aspect Ratio

- **AspectRatio**: `2.77` (igual a HeroCarousel)
- **Altura**: Responsive según ancho del contenedor
- **Consistencia**: Mismo aspect ratio que otros carruseles

### Colores

- **Fondo**: Transparente
- **Botones navegación**: Blanco con sombra, hover con escala
- **Indicadores**: Puntos grises, activo en naranja

### Comportamiento Responsive

- **Desktop**: Navegación completa con botones
- **Tablet**: Swipe gestures y botones
- **Mobile**: Swipe gestures optimizados

## 🔄 Flujo de Datos

1. **Slides hardcodeados**: 3 combos con imágenes WebP optimizadas
2. **Loop infinito**: Crea array extendido con clones al inicio y final
3. **Auto-play**: Timer de 5 segundos que avanza slides
4. **Interacción**: Pausa auto-play al usar controles o hacer swipe
5. **Navegación**: Click en slide, botones o swipe navega al producto

## 🧪 Testing

### Casos de Prueba

- ✅ Carga de imágenes con skeleton placeholder
- ✅ Auto-play funciona correctamente
- ✅ Pausa en interacción manual
- ✅ Loop infinito (última → primera)
- ✅ Swipe gestures en mobile
- ✅ Navegación a producto al hacer click
- ✅ Skeleton se oculta cuando carga primera imagen
- ✅ Aspect ratio se preserva correctamente

## 📝 Notas de Desarrollo

### Commits Relacionados

#### `4b503264` - "Ajustes de UI/UX: CombosSection igual a HeroCarousel"

**Cambios implementados:**

1. **Unificación de aspect ratio**
   - CombosSection ahora usa aspectRatio 2.77 (igual a HeroCarousel)
   - Consistencia visual entre carruseles

2. **Optimizaciones de espaciado**
   - Ajustes en padding y margins
   - Mejora en espaciado de pills promocionales

#### `e91c0bd6` - "Unificar aspectRatio de PromoBanners con HeroCarousel y CombosSection"

**Cambios:**
- Unificación de aspect ratio entre todos los carruseles
- Consistencia visual en toda la página principal

#### `2aa5bd20` - "Revertir aspectRatio en PromoBanners: mantener altura fija, aspectRatio 2.77 solo en CombosSection"

**Cambios:**
- AspectRatio 2.77 específico para CombosSection
- Mantiene consistencia con HeroCarousel

### Optimizaciones Implementadas

1. **Imágenes WebP**: Conversión de formatos para reducir tamaño
2. **Skeleton placeholder**: Previene CLS mientras cargan imágenes
3. **Lazy loading**: Imágenes siguientes se cargan lazy
4. **Priority loading**: Primera imagen con priority
5. **Aspect ratio fijo**: Previene layout shift

### Gestos Táctiles

El componente usa el hook `useSwipeGestures` para soporte táctil:

```typescript
const swipeRef = useSwipeGestures({
  onSwipeLeft: goToNext,   // Deslizar izquierda = siguiente
  onSwipeRight: goToPrevious, // Deslizar derecha = anterior
})
```

### Navegación a Productos

Cada slide tiene un `productSlug` que se usa para navegar al producto:

```typescript
const handleSlideClick = (productSlug: string) => {
  router.push(`/products/${productSlug}`)
}
```

## 🔗 Archivos Relacionados

- `src/components/Home-v2/CombosSection/index.tsx` - Implementación del componente
- `src/hooks/useSwipeGestures.ts` - Hook para gestos táctiles
- `public/images/hero/hero2/hero4.webp` - Imágenes de combos (hero4, hero5, hero6)
- `src/components/Home-v2/HeroCarousel/index.tsx` - Referencia para aspect ratio

## 🐛 Troubleshooting

### El carrusel no hace loop

**Solución**: Verifica que `extendedSlides` tenga los clones correctos. El array debe ser: `[última, ...originales, primera]`.

### Las imágenes no cargan

**Solución**: Verifica que las rutas en `slides` sean correctas y que los archivos WebP existan en `public/images/hero/hero2/`.

### El skeleton no se oculta

**Solución**: El skeleton se oculta cuando `loadedImagesCount >= 1` o después de 2 segundos (fallback). Verifica que los eventos `onLoad` de las imágenes se estén disparando.

### Swipe no funciona en mobile

**Solución**: Verifica que `useSwipeGestures` esté configurado correctamente y que el `swipeRef` esté asignado al contenedor del carrusel.

### El aspect ratio no se preserva

**Solución**: Asegúrate de que el contenedor tenga `aspect-ratio: 2.77` o use padding-bottom para mantener el ratio.
