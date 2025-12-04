# Admin UI Components

Sistema de componentes UI modernos para el panel de administración.

---

## 📦 Componentes Disponibles

### Badge
Badge component con múltiples variantes y estados.

**Variantes**: `default`, `secondary`, `destructive`, `outline`, `success`, `warning`, `info`, `soft`

**Props**:
- `variant`: Variante visual
- `size`: `sm`, `default`, `lg`
- `icon`: Componente de Lucide React
- `pulse`: Animación de pulse

```tsx
import { Badge } from './Badge'
import { CheckCircle } from 'lucide-react'

<Badge variant="success" icon={CheckCircle} pulse>Activo</Badge>
```

---

### Skeleton
Loading placeholder con shimmer effect.

**Variantes**: `default`, `circle`, `rectangle`  
**Animaciones**: `pulse`, `shimmer`, `none`

**Presets**:
- `ProductListSkeleton`: 5 filas con imagen + texto
- `TableSkeleton`: Grid configurable

```tsx
import { Skeleton, ProductListSkeleton } from './Skeleton'

// Simple
<Skeleton className="h-4 w-48" />

// Con shimmer
<Skeleton animation="shimmer" className="h-20 w-full" />

// Preset
<ProductListSkeleton count={5} />
```

---

### EmptyState
Estado vacío con ilustración y acción.

**Variantes**: `default`, `search`, `error`

```tsx
import { EmptyState } from './EmptyState'

<EmptyState
  variant="search"
  title="No hay productos"
  description="Intenta ajustar los filtros"
  action={{
    label: 'Limpiar filtros',
    onClick: () => resetFilters()
  }}
/>
```

---

### Input
Input mejorado con validación visual.

**Features**:
- Validación automática (error/success states)
- Iconos left/right
- Prefix/suffix
- Helper text
- Error messages animados

```tsx
import { Input } from './Input'
import { DollarSign } from 'lucide-react'

<Input
  label="Precio"
  type="number"
  prefix="$"
  icon={DollarSign}
  error={errors.price?.message}
  success={isValid}
  helperText="Precio en pesos"
  required
/>
```

---

### Textarea
Textarea con contador de caracteres.

**Features**:
- Validación visual
- Contador de caracteres
- Max length indicator
- Resize vertical

```tsx
import { Textarea } from './Textarea'

<Textarea
  label="Descripción"
  showCount
  maxLength={500}
  error={errors.description?.message}
/>
```

---

### ImageUpload
Upload de imágenes con drag & drop y preview.

**Features**:
- Drag & drop zone
- Preview con zoom
- Modal fullscreen
- Validación visual
- Estados de carga

```tsx
import { ImageUpload } from './ImageUpload'

<ImageUpload
  label="Imagen del Producto"
  value={imageUrl}
  onChange={(url) => setImageUrl(url)}
  preview
  helperText="Formatos: JPG, PNG, WEBP"
/>
```

---

## 🎨 Sistema de Diseño

### Paleta de Colores

| Variante | Color | Uso |
|----------|-------|-----|
| success | Verde | Confirmaciones, estados activos |
| warning | Amarillo | Advertencias, borradores |
| destructive | Rojo | Errores, eliminaciones |
| info | Azul | Información general |
| soft | Gris | Neutral |
| outline | Borde | Datos secundarios |

### Tamaños

| Tamaño | Height | Padding | Font Size |
|--------|--------|---------|-----------|
| sm | - | px-2 py-0 | text-xs |
| default | h-11 | px-2.5 py-0.5 | text-xs |
| lg | - | px-3 py-1 | text-sm |

---

## 🔧 Utilidades

### cn() - Merge de clases
```tsx
import { cn } from '@/lib/core/utils'

className={cn(
  'base-classes',
  condition && 'conditional-classes',
  className // props
)}
```

---

## 📖 Ejemplos de Uso

### Badge en Lista
```tsx
{products.map(product => (
  <tr key={product.id}>
    <td>
      {product.stock === 0 ? (
        <Badge variant="destructive" pulse>Sin stock</Badge>
      ) : product.stock <= 10 ? (
        <Badge variant="warning">Stock bajo</Badge>
      ) : (
        <Badge variant="success">En stock</Badge>
      )}
    </td>
  </tr>
))}
```

### Input en Formulario
```tsx
<form onSubmit={handleSubmit(onSubmit)}>
  <Input
    label="Nombre"
    {...register('name')}
    error={errors.name?.message}
    required
  />
  
  <Input
    label="Precio"
    type="number"
    prefix="$"
    {...register('price', { valueAsNumber: true })}
    error={errors.price?.message}
  />
</form>
```

### Loading State
```tsx
function ProductsPage() {
  const { data, isLoading } = useQuery(...)
  
  if (isLoading) return <ProductListSkeleton />
  if (!data?.length) return <EmptyState title="No hay productos" />
  
  return <ProductList products={data} />
}
```

---

## 🎯 Mejores Prácticas

### 1. Validación Visual
Siempre proporciona feedback visual al usuario:
```tsx
// ✅ BUENO
<Input 
  error={errors.name?.message}
  success={!errors.name && isDirty}
/>

// ❌ MALO
<input type="text" />
```

### 2. Estados de Carga
Muestra loading states informativos:
```tsx
// ✅ BUENO
{isLoading ? <ProductListSkeleton /> : <ProductList />}

// ❌ MALO
{isLoading ? 'Cargando...' : <ProductList />}
```

### 3. Empty States
Proporciona acciones contextuales:
```tsx
// ✅ BUENO
<EmptyState
  title="No hay productos"
  action={{ label: 'Crear producto', onClick: handleCreate }}
/>

// ❌ MALO
<p>No hay productos</p>
```

### 4. Animaciones
Usa AnimatePresence para mounted/unmounted:
```tsx
// ✅ BUENO
<AnimatePresence>
  {isOpen && <Modal />}
</AnimatePresence>

// ❌ MALO
{isOpen && <Modal />}
```

---

## 🔄 Actualizaciones

### v1.0.0 - 1 de Noviembre 2025
- ✅ Componentes iniciales creados
- ✅ Sistema de badges implementado
- ✅ Skeleton loaders con shimmer
- ✅ Input/Textarea con validación
- ✅ ImageUpload con drag & drop
- ✅ EmptyState component

---

## 📝 Notas

### Dependencies
Estos componentes requieren:
- `framer-motion` - Animaciones
- `lucide-react` - Iconos
- `class-variance-authority` - Variantes de estilos
- `tailwindcss` - Estilos

### Compatibilidad
- ✅ React 19
- ✅ Next.js 15
- ✅ TypeScript 5+
- ✅ Tailwind CSS 3+

---

_Creado el 1 de Noviembre 2025_

