# 🔘 Botones - Design System Pinteya

> Componentes de botón optimizados para e-commerce de pinturería con estados interactivos y variantes especializadas

## 📋 Índice

- [🎯 Variantes](#-variantes)
- [📏 Tamaños](#-tamaños)
- [⚡ Estados](#-estados)
- [🎨 Ejemplos de Uso](#-ejemplos-de-uso)
- [🔧 API Reference](#-api-reference)
- [♿ Accesibilidad](#-accesibilidad)

---

## 🎯 Variantes

### Primary - Acción Principal
Botón principal para acciones críticas como "Agregar al carrito", "Comprar ahora"

```tsx
<Button variant="primary">
  Agregar al carrito
</Button>
```

**Especificaciones:**
- Color: Tahiti Gold (#fc9d04)
- Hover: #ef7d00
- Active: #b95004 + scale(0.98)
- Sombra: shadow-1 → shadow-2 en hover

### Secondary - Acción Secundaria
Para acciones secundarias como "Ver detalles", "Comparar"

```tsx
<Button variant="secondary">
  Ver detalles
</Button>
```

**Especificaciones:**
- Fondo: Blanco con borde gris
- Hover: Fondo gris claro
- Texto: Gris oscuro

### Outline - Acción Terciaria
Para acciones menos importantes o alternativas

```tsx
<Button variant="outline">
  Agregar a favoritos
</Button>
```

**Especificaciones:**
- Borde: Primary color
- Hover: Fondo primary + texto blanco
- Transición suave

### Ghost - Acción Sutil
Para acciones discretas en la interfaz

```tsx
<Button variant="ghost">
  Cancelar
</Button>
```

### Destructive - Acciones Peligrosas
Para eliminar, cancelar pedidos, etc.

```tsx
<Button variant="destructive">
  Eliminar producto
</Button>
```

### Success - Confirmaciones
Para acciones exitosas

```tsx
<Button variant="success">
  Pedido confirmado
</Button>
```

### Warning - Advertencias
Para acciones que requieren atención

```tsx
<Button variant="warning">
  Stock limitado
</Button>
```

---

## 📏 Tamaños

### Small (sm)
Para espacios reducidos, badges, etc.

```tsx
<Button size="sm">Pequeño</Button>
```
- Altura: 32px (h-8)
- Padding: 12px horizontal
- Texto: 12px

### Medium (md) - Default
Tamaño estándar para la mayoría de casos

```tsx
<Button size="md">Mediano</Button>
```
- Altura: 36px (h-9)
- Padding: 16px horizontal
- Texto: 14px

### Large (lg)
Para CTAs importantes, hero sections

```tsx
<Button size="lg">Grande</Button>
```
- Altura: 40px (h-10)
- Padding: 24px horizontal
- Texto: 16px

### Extra Large (xl)
Para acciones muy prominentes

```tsx
<Button size="xl">Extra Grande</Button>
```
- Altura: 48px (h-12)
- Padding: 32px horizontal
- Texto: 18px

### Icon Variants
Para botones solo con íconos

```tsx
<Button size="icon">
  <ShoppingCartIcon />
</Button>

<Button size="icon-sm">
  <HeartIcon />
</Button>

<Button size="icon-lg">
  <SearchIcon />
</Button>
```

---

## ⚡ Estados

### Loading State
Con spinner integrado

```tsx
<Button loading={true}>
  Procesando...
</Button>
```

### Disabled State
Para acciones no disponibles

```tsx
<Button disabled>
  Sin stock
</Button>
```

### With Icons
Íconos izquierda y derecha

```tsx
<Button 
  leftIcon={<ShoppingCartIcon />}
  variant="primary"
>
  Agregar al carrito
</Button>

<Button 
  rightIcon={<ArrowRightIcon />}
  variant="outline"
>
  Ver más
</Button>
```

### Full Width
Para formularios y móviles

```tsx
<Button fullWidth variant="primary">
  Finalizar compra
</Button>
```

---

## 🎨 Ejemplos de Uso

### E-commerce Específicos

```tsx
// Botón de carrito con contador
<Button 
  variant="primary"
  leftIcon={<ShoppingCartIcon />}
  className="relative"
>
  Carrito
  <Badge className="absolute -top-2 -right-2">3</Badge>
</Button>

// Botón de compra rápida
<Button 
  variant="primary"
  size="lg"
  fullWidth
  className="bg-gradient-to-r from-primary to-primary-hover"
>
  🚀 Comprar ahora
</Button>

// Botón de favoritos
<Button 
  variant="ghost"
  size="icon"
  className="text-red-500 hover:text-red-600"
>
  <HeartIcon />
</Button>

// Botón con descuento
<Button 
  variant="destructive"
  leftIcon={<TagIcon />}
>
  ¡30% OFF!
</Button>
```

### Combinaciones Comunes

```tsx
// Grupo de acciones de producto
<div className="flex gap-2">
  <Button variant="primary" size="lg" fullWidth>
    Agregar al carrito
  </Button>
  <Button variant="outline" size="lg">
    <HeartIcon />
  </Button>
  <Button variant="outline" size="lg">
    <ShareIcon />
  </Button>
</div>

// Navegación de pasos
<div className="flex gap-2">
  <Button variant="outline" leftIcon={<ArrowLeftIcon />}>
    Anterior
  </Button>
  <Button variant="primary" rightIcon={<ArrowRightIcon />}>
    Siguiente
  </Button>
</div>
```

---

## 🔧 API Reference

### ButtonProps

```typescript
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'success' | 'warning' | 'link'
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'icon' | 'icon-sm' | 'icon-lg'
  fullWidth?: boolean
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  asChild?: boolean
}
```

### Clases CSS Principales

```css
/* Base */
.btn-base {
  @apply inline-flex items-center justify-center whitespace-nowrap rounded-button text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98];
}

/* Variantes */
.btn-primary {
  @apply bg-primary text-white shadow-1 hover:bg-primary-hover hover:shadow-2 active:bg-primary-active;
}

.btn-secondary {
  @apply border border-gray-300 bg-white text-gray-900 shadow-1 hover:bg-gray-50 hover:border-gray-400 active:bg-gray-100;
}
```

---

## ♿ Accesibilidad

### Estándares WCAG 2.1 AA

- ✅ **Contraste**: Mínimo 4.5:1 para texto normal
- ✅ **Focus visible**: Ring de 2px en color primary
- ✅ **Tamaño mínimo**: 44px para touch targets
- ✅ **Estados claros**: Disabled, loading, active

### Mejores Prácticas

```tsx
// ✅ Correcto - Con aria-label para íconos
<Button variant="ghost" size="icon" aria-label="Agregar a favoritos">
  <HeartIcon />
</Button>

// ✅ Correcto - Loading state accesible
<Button loading aria-label="Procesando pedido">
  Finalizar compra
</Button>

// ✅ Correcto - Disabled con explicación
<Button disabled title="Producto sin stock">
  Agregar al carrito
</Button>

// ❌ Incorrecto - Sin contexto
<Button size="icon">
  <Icon />
</Button>
```

### Navegación por Teclado

- **Tab**: Navegar entre botones
- **Enter/Space**: Activar botón
- **Escape**: Cancelar acción (en modales)

---

## 🎯 Criterios de Aceptación

### Funcionales
- [ ] Todas las variantes renderizan correctamente
- [ ] Estados loading/disabled funcionan
- [ ] Íconos se posicionan correctamente
- [ ] FullWidth responsive funciona

### Visuales
- [ ] Colores coinciden con design tokens
- [ ] Animaciones suaves (200ms)
- [ ] Hover/active states visibles
- [ ] Sombras apropiadas

### Accesibilidad
- [ ] Contraste WCAG AA
- [ ] Focus ring visible
- [ ] Screen readers compatibles
- [ ] Touch targets 44px+

### Performance
- [ ] Sin re-renders innecesarios
- [ ] Animaciones optimizadas
- [ ] Bundle size mínimo

---

*Última actualización: Junio 2025*
