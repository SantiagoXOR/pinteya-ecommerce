# PromoBanners

Componente de banners promocionales con scroll horizontal, soporte para múltiples banners y optimizaciones de CLS.

> **Última actualización**: 15 de Diciembre, 2025 - Implementado con scroll horizontal, skeleton placeholders y altura fija para prevenir CLS.

## 🎯 Características

- **Scroll horizontal** - Navegación por scroll en lugar de carrusel
- **Múltiples banners** - Soporte para 3 banners promocionales
- **Filtrado por ID** - Opción para mostrar solo un banner específico
- **Altura fija** - Previene CLS con altura mínima de 48px
- **Skeleton placeholder** - Muestra skeleton mientras cargan imágenes
- **Badges personalizables** - Badges con colores y textos configurables
- **CTAs configurables** - Enlaces y acciones personalizables por banner

## 📐 Estructura Visual

```
┌─────────────────────────────────────┐
│ [Banner 1] [Banner 2] [Banner 3] → │
│ 30% OFF    Asesoramiento  Calculadora│
└─────────────────────────────────────┘
```

## 🔧 Uso Básico

### Mostrar todos los banners

```tsx
import { PromoBanners } from '@/components/Home-v2/PromoBanners'

<PromoBanners />
```

### Mostrar un banner específico

```tsx
<PromoBanners bannerId={1} /> // Solo muestra el banner con id 1
```

## 📋 Props e Interfaces

### PromoBannersProps

```typescript
export interface PromoBannersProps {
  bannerId?: number  // Si se proporciona, muestra solo ese banner
}
```

### Banner Structure

```typescript
interface Banner {
  id: number
  title: string              // Título principal
  subtitle?: string          // Subtítulo opcional
  badge: string             // Texto del badge
  badgeColor: string        // Clases Tailwind para color del badge
  ctaText: string           // Texto del botón CTA
  ctaUrl: string            // URL del enlace
  bgImage: string           // Ruta a imagen de fondo
  bgGradient: string        // Clases Tailwind para gradiente
}
```

## 🎨 Estilos y Diseño

### Banners Compactos

Los banners 1, 2 y 3 usan diseño compacto:
- **Altura**: `h-12 md:h-14` (48px mobile, 56px desktop)
- **Altura mínima**: `48px` (previene CLS)
- **Aspect ratio**: No aplica (altura fija)

### Colores de Badges

- **Banner 1 (30% OFF)**: `bg-yellow-400 text-gray-900`
- **Banner 2 (Asesoramiento)**: `bg-blue-500`
- **Banner 3 (Calculadora)**: `bg-purple-500`

### Gradientes de Fondo

- **Banner 1**: `from-red-600/85 via-red-500/85 to-orange-600/85`
- **Banner 2**: `from-blue-900/80 to-blue-700/80`
- **Banner 3**: `from-purple-900/80 to-purple-700/80`

## 🔄 Flujo de Datos

1. **Banners hardcodeados**: 3 banners con configuración predefinida
2. **Filtrado**: Si `bannerId` está definido, filtra por ese ID
3. **Scroll horizontal**: Contenedor con `overflow-x-auto`
4. **Carga de imágenes**: Skeleton mientras carga, se oculta con `onLoad`
5. **Navegación**: Click en banner navega a `ctaUrl` o hace scroll suave si es hash

## 🧪 Testing

### Casos de Prueba

- ✅ Renderizado de todos los banners
- ✅ Filtrado por bannerId
- ✅ Scroll horizontal funciona
- ✅ Skeleton se muestra mientras carga
- ✅ Skeleton se oculta cuando carga imagen
- ✅ Navegación a URLs externas
- ✅ Scroll suave a anchors (#)
- ✅ Altura fija previene CLS
- ✅ Responsive en diferentes tamaños

## 📝 Notas de Desarrollo

### Commits Relacionados

#### `2aa5bd20` - "Revertir aspectRatio en PromoBanners: mantener altura fija"

**Cambios implementados:**

1. **Altura fija en lugar de aspect ratio**
   - Cambio de aspect ratio a altura fija (`h-12 md:h-14`)
   - Altura mínima de 48px para prevenir CLS

2. **Skeleton placeholder**
   - Skeleton que se muestra mientras carga la imagen
   - Se oculta cuando `imagesLoaded.has(banner.id)`

#### `e91c0bd6` - "Unificar aspectRatio de PromoBanners con HeroCarousel y CombosSection"

**Cambios:**
- Intento de unificar aspect ratio (luego revertido)
- Lección aprendida: altura fija es mejor para banners compactos

#### `4b503264` - "Ajustes de UI/UX: eliminar degradados envío gratis, ajustar espaciado pills promocionales"

**Cambios:**
- Ajustes en espaciado de banners promocionales
- Mejoras en diseño compacto

### Optimizaciones CLS

El componente implementa varias optimizaciones para prevenir Cumulative Layout Shift:

1. **Altura mínima fija**: `minHeight: '48px'` en estilo inline
2. **Skeleton placeholder**: Ocupa espacio mientras carga
3. **Transición suave**: `transition-opacity` para ocultar skeleton
4. **Priority loading**: Banner 1 tiene `priority` para carga rápida

### Banners Disponibles

1. **Banner 1 - 30% OFF**
   - Título: "EN TODOS NUESTROS PRODUCTOS"
   - Badge: "30% OFF" (amarillo)
   - CTA: Ver todos los productos (`/products`)
   - Imagen: `/images/promo/CYBERMONDAY.png`

2. **Banner 2 - Asesoramiento**
   - Título: "ASESORAMIENTO GRATIS"
   - Subtítulo: "Te ayudamos con tu proyecto"
   - Badge: "100% GRATIS" (azul)
   - CTA: Contactar por WhatsApp
   - Imagen: `/images/promo/assetpaint.png`

3. **Banner 3 - Calculadora**
   - Título: "CALCULÁ TU PINTURA"
   - Subtítulo: "Herramienta para estimar materiales"
   - Badge: "GRATIS" (morado)
   - CTA: Calcular ahora (`/calculator`)
   - Imagen: `/images/promo/assetpaint.png`

## 🔗 Archivos Relacionados

- `src/components/Home-v2/PromoBanners/index.tsx` - Implementación del componente
- `public/images/promo/CYBERMONDAY.png` - Imagen del banner de descuento
- `public/images/promo/assetpaint.png` - Imagen de asesoramiento y calculadora

## 🐛 Troubleshooting

### El scroll horizontal no funciona

**Solución**: Verifica que el contenedor tenga `overflow-x-auto` y que los banners tengan `flex-shrink-0`. Asegúrate de que `scrollbar-hide` esté aplicado correctamente.

### El skeleton no se oculta

**Solución**: Verifica que los eventos `onLoad` de las imágenes se estén disparando. El skeleton se oculta cuando `imagesLoaded.has(banner.id)` es true.

### CLS aún ocurre

**Solución**: Asegúrate de que:
1. La altura mínima esté configurada (`minHeight: '48px'`)
2. El skeleton esté visible inicialmente
3. Las imágenes tengan dimensiones definidas

### Los banners no se filtran por ID

**Solución**: Verifica que `bannerId` sea un número válido (1, 2 o 3) y que el filtro `banners.filter(b => b.id === bannerId)` esté funcionando correctamente.

### La navegación a anchors no funciona

**Solución**: El componente detecta URLs que empiezan con `#` y hace scroll suave. Verifica que el elemento con ese ID exista en la página.
