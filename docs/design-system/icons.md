# 🎨 Iconografía 3D - Design System Pinteya

> Sistema de iconografía 3D isométrica especializada para productos de pinturería, ferretería y corralón

## 📋 Índice

- [🎯 Filosofía de Diseño](#-filosofía-de-diseño)
- [📐 Especificaciones Técnicas](#-especificaciones-técnicas)
- [🎨 Librería de Íconos Pinturería](#-librería-de-íconos-pinturería)
- [🔧 Integración con Lucide React](#-integración-con-lucide-react)
- [🎭 Estilos y Variantes](#-estilos-y-variantes)
- [💻 Implementación](#-implementación)

---

## 🎯 Filosofía de Diseño

### Inspiración Airbnb
- **Estilo 3D isométrico**: Perspectiva 30° para profundidad
- **Colores vibrantes**: Paleta Tahiti Gold + complementarios
- **Estilo friendly**: Formas redondeadas y accesibles
- **Consistencia visual**: Mismo ángulo y iluminación

### Principios Clave

1. **Reconocimiento inmediato**: Íconos específicos del rubro
2. **Escalabilidad**: Funcionan en 16px hasta 128px
3. **Accesibilidad**: Alto contraste y formas claras
4. **Consistencia**: Mismo estilo en toda la aplicación

---

## 📐 Especificaciones Técnicas

### Tamaños Estándar

```css
/* Tamaños base */
--icon-xs: 16px;    /* Badges, texto inline */
--icon-sm: 20px;    /* Botones pequeños */
--icon-md: 24px;    /* Botones estándar */
--icon-lg: 32px;    /* Headers, destacados */
--icon-xl: 48px;    /* Hero sections */
--icon-2xl: 64px;   /* Ilustraciones */
--icon-3xl: 128px;  /* Landing pages */
```

### Formato y Optimización

```typescript
// Especificaciones SVG
interface IconSpecs {
  format: 'SVG';
  viewBox: '0 0 24 24';
  strokeWidth: 1.5 | 2;
  fill: 'none' | 'currentColor';
  stroke: 'currentColor';
  optimization: 'SVGO optimized';
  accessibility: 'aria-hidden="true"';
}
```

### Grid y Construcción

```css
/* Grid base 24x24 */
.icon-grid {
  width: 24px;
  height: 24px;
  padding: 2px; /* Safe area */
}

/* Perspectiva isométrica */
.icon-3d {
  transform: rotateX(30deg) rotateY(-15deg);
  filter: drop-shadow(2px 2px 4px rgba(0,0,0,0.1));
}
```

---

## 🎨 Librería de Íconos Pinturería

### Herramientas de Pintura

```tsx
// Pincel
<PaintBrushIcon className="w-6 h-6 text-primary" />

// Rodillo
<PaintRollerIcon className="w-6 h-6 text-primary" />

// Brocha
<BrushIcon className="w-6 h-6 text-primary" />

// Espátula
<SpatulaIcon className="w-6 h-6 text-primary" />

// Pistola de pintura
<SprayGunIcon className="w-6 h-6 text-primary" />
```

### Contenedores y Materiales

```tsx
// Balde de pintura
<PaintBucketIcon className="w-6 h-6 text-primary" />

// Lata de pintura
<PaintCanIcon className="w-6 h-6 text-primary" />

// Aerosol
<SprayCanIcon className="w-6 h-6 text-primary" />

// Tubo de silicona
<SiliconeTubeIcon className="w-6 h-6 text-primary" />

// Cartucho
<CartridgeIcon className="w-6 h-6 text-primary" />
```

### Herramientas de Ferretería

```tsx
// Martillo
<HammerIcon className="w-6 h-6 text-secondary" />

// Destornillador
<ScrewdriverIcon className="w-6 h-6 text-secondary" />

// Llave inglesa
<WrenchIcon className="w-6 h-6 text-secondary" />

// Taladro
<DrillIcon className="w-6 h-6 text-secondary" />

// Sierra
<SawIcon className="w-6 h-6 text-secondary" />
```

### Materiales de Construcción

```tsx
// Ladrillo
<BrickIcon className="w-6 h-6 text-teal-600" />

// Cemento
<CementIcon className="w-6 h-6 text-teal-600" />

// Madera
<WoodIcon className="w-6 h-6 text-teal-600" />

// Caño/Tubería
<PipeIcon className="w-6 h-6 text-teal-600" />

// Chapa
<SheetMetalIcon className="w-6 h-6 text-teal-600" />
```

### Íconos de E-commerce

```tsx
// Carrito 3D
<Cart3DIcon className="w-6 h-6 text-primary" />

// Envío gratis
<FreeShipping3DIcon className="w-6 h-6 text-success" />

// Descuento
<Discount3DIcon className="w-6 h-6 text-error" />

// Favoritos
<Heart3DIcon className="w-6 h-6 text-red-500" />

// Búsqueda
<Search3DIcon className="w-6 h-6 text-gray-600" />
```

---

## 🔧 Integración con Lucide React

### Instalación y Setup

```bash
npm install lucide-react
```

```tsx
// Importación básica
import { 
  ShoppingCart, 
  Heart, 
  Search, 
  Paintbrush,
  Hammer,
  Package
} from 'lucide-react'
```

### Componente Icon Wrapper

```tsx
// components/ui/icon.tsx
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface IconProps {
  icon: LucideIcon
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl'
  variant?: '2d' | '3d'
  color?: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info'
  className?: string
}

const iconSizes = {
  xs: 'w-4 h-4',
  sm: 'w-5 h-5', 
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12',
  '2xl': 'w-16 h-16',
  '3xl': 'w-32 h-32'
}

const iconColors = {
  primary: 'text-primary',
  secondary: 'text-secondary',
  success: 'text-success',
  error: 'text-error',
  warning: 'text-warning',
  info: 'text-info'
}

export function Icon({ 
  icon: IconComponent, 
  size = 'md', 
  variant = '2d',
  color,
  className 
}: IconProps) {
  return (
    <IconComponent 
      className={cn(
        iconSizes[size],
        color && iconColors[color],
        variant === '3d' && 'drop-shadow-sm transform-gpu',
        className
      )}
      strokeWidth={variant === '3d' ? 1.5 : 2}
    />
  )
}
```

### Uso del Componente

```tsx
// Íconos básicos
<Icon icon={ShoppingCart} size="md" color="primary" />
<Icon icon={Heart} size="lg" color="error" />
<Icon icon={Search} size="sm" />

// Íconos 3D
<Icon icon={Paintbrush} size="xl" variant="3d" color="primary" />
<Icon icon={Hammer} size="lg" variant="3d" color="secondary" />
```

---

## 🎭 Estilos y Variantes

### Variante 2D - Estándar
Para uso general en la interfaz

```css
.icon-2d {
  stroke-width: 2;
  filter: none;
  transform: none;
}
```

### Variante 3D - Destacada
Para elementos importantes y hero sections

```css
.icon-3d {
  stroke-width: 1.5;
  filter: drop-shadow(2px 2px 4px rgba(252, 157, 4, 0.2));
  transform: perspective(100px) rotateX(5deg) rotateY(-5deg);
  transition: transform 0.2s ease;
}

.icon-3d:hover {
  transform: perspective(100px) rotateX(10deg) rotateY(-10deg) scale(1.05);
}
```

### Estados Interactivos

```css
/* Hover effect */
.icon-interactive {
  transition: all 0.2s ease;
  cursor: pointer;
}

.icon-interactive:hover {
  transform: scale(1.1);
  filter: brightness(1.1);
}

/* Active/pressed */
.icon-interactive:active {
  transform: scale(0.95);
}

/* Loading state */
.icon-loading {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
```

---

## 💻 Implementación

### Componentes Especializados

```tsx
// components/icons/PaintingIcons.tsx
import { Paintbrush, Palette, Droplets } from 'lucide-react'
import { Icon } from '@/components/ui/icon'

export function PaintBrushIcon(props: any) {
  return <Icon icon={Paintbrush} {...props} />
}

export function PaletteIcon(props: any) {
  return <Icon icon={Palette} {...props} />
}

export function PaintDropIcon(props: any) {
  return <Icon icon={Droplets} {...props} />
}
```

### Uso en Componentes de Producto

```tsx
// ProductCard con íconos especializados
<ProductCard>
  <div className="flex items-center gap-2 mb-2">
    <PaintBrushIcon size="sm" color="primary" />
    <span className="text-sm text-gray-600">Pintura</span>
  </div>
  
  <div className="flex items-center gap-2">
    <Icon icon={Truck} size="sm" color="success" />
    <span className="text-sm text-success">Envío gratis</span>
  </div>
</ProductCard>
```

### Animaciones Contextuales

```tsx
// Carrito con animación
function CartIcon({ itemCount }: { itemCount: number }) {
  return (
    <div className="relative">
      <Icon 
        icon={ShoppingCart} 
        size="lg" 
        color="primary"
        className={cn(
          "transition-transform duration-200",
          itemCount > 0 && "animate-bounce-in"
        )}
      />
      {itemCount > 0 && (
        <Badge className="absolute -top-2 -right-2 animate-scale-in">
          {itemCount}
        </Badge>
      )}
    </div>
  )
}
```

### Librería de Íconos Personalizada

```tsx
// lib/icons.ts
export const PinteyaIcons = {
  // Herramientas
  paintBrush: Paintbrush,
  paintRoller: CircleDot, // Placeholder
  brush: Brush,
  
  // Materiales
  paintBucket: Bucket,
  paintCan: Package,
  spraycan: Zap,
  
  // E-commerce
  cart: ShoppingCart,
  heart: Heart,
  search: Search,
  truck: Truck,
  tag: Tag,
  
  // Estados
  check: Check,
  x: X,
  alert: AlertTriangle,
  info: Info,
  
  // Navegación
  home: Home,
  user: User,
  menu: Menu,
  arrow: ArrowRight
}
```

---

## 🎯 Criterios de Aceptación

### Técnicos
- [ ] SVG optimizados < 2KB cada uno
- [ ] Compatibles con screen readers
- [ ] Escalables sin pérdida de calidad
- [ ] Consistencia en stroke-width

### Visuales
- [ ] Estilo 3D coherente
- [ ] Colores de marca aplicados
- [ ] Animaciones suaves
- [ ] Hover states definidos

### Funcionales
- [ ] Carga rápida
- [ ] Tree-shaking compatible
- [ ] TypeScript support
- [ ] Documentación completa

---

*Última actualización: Junio 2025*
