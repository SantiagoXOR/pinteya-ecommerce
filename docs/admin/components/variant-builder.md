# VariantBuilder

Componente completo para crear y gestionar variantes de productos inline en el panel administrativo.

> **Última actualización**: 15 de Diciembre, 2025 - Implementado con creación inline de variantes con todos los campos.

## 🎯 Características

- **Creación inline** - Agregar variantes sin salir del formulario
- **Edición en lugar** - Editar variantes directamente en la tabla
- **Tabla de variantes** - Vista tabular de todas las variantes
- **Validación completa** - Valida campos requeridos antes de agregar
- **Variante por defecto** - Marcar una variante como predeterminada
- **Integración de componentes** - Usa `ColorPickerField` y `MeasureSelector`
- **Campos completos** - Color, medida, terminación, precios, stock, imagen

## 🚀 Uso

```tsx
import { VariantBuilder, VariantFormData } from '@/components/admin/products/VariantBuilder'

function ProductForm() {
  const [variants, setVariants] = useState<VariantFormData[]>([])

  return (
    <VariantBuilder
      variants={variants}
      onChange={setVariants}
      measures={['4L', '10L', '20L']}
      terminaciones={['Mate', 'Satinado', 'Brillante']}
    />
  )
}
```

## 📋 Props

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `variants` | `VariantFormData[]` | `[]` | Array de variantes existentes |
| `onChange` | `(variants: VariantFormData[]) => void` | - | Callback cuando cambian las variantes |
| `measures` | `string[]` | `[]` | Lista de medidas disponibles para el select |
| `terminaciones` | `string[]` | `[]` | Lista de terminaciones disponibles |
| `className` | `string` | - | Clases CSS adicionales |

## 📐 Estructura de Datos

### VariantFormData

```typescript
interface VariantFormData {
  id?: number                    // ID de la variante (si ya existe en BD)
  color_name: string             // Nombre del color
  color_hex?: string             // Código hexadecimal del color
  aikon_id: string               // Código Aikon (requerido)
  measure: string                // Medida/capacidad (requerido)
  finish: string                 // Terminación (Mate, Satinado, Brillante)
  price_list: number             // Precio de lista (requerido, > 0)
  price_sale?: number            // Precio de venta (opcional)
  stock: number                  // Stock disponible
  image_url?: string             // URL de imagen específica de la variante
  is_active?: boolean            // Si la variante está activa
  is_default?: boolean           // Si es la variante por defecto
}
```

## 🎨 Interfaz de Usuario

### Tabla de Variantes

La tabla muestra todas las variantes con las siguientes columnas:

| Columna | Descripción |
|---------|-------------|
| Color | Nombre del color (con indicador visual si tiene hex) |
| Aikon ID | Código Aikon en fuente monoespaciada |
| Medida | Medida/capacidad de la variante |
| Terminación | Tipo de acabado |
| Precio | Precio de lista (y precio de venta si aplica) |
| Stock | Cantidad disponible |
| Acciones | Botones para editar, eliminar y marcar como default |

### Formulario de Agregar/Editar

El formulario incluye:

1. **Color** - `ColorPickerField` para selección de color
2. **Código Aikon** - Input de texto (requerido)
3. **Medida** - Select con medidas disponibles (requerido)
4. **Terminación** - Select con terminaciones disponibles
5. **Precio de Lista** - Input numérico (requerido, > 0)
6. **Precio de Venta** - Input numérico (opcional)
7. **Stock** - Input numérico
8. **URL de Imagen** - Input de texto para imagen específica
9. **Activo** - Checkbox para activar/desactivar
10. **Por Defecto** - Checkbox para marcar como variante predeterminada

## 🔧 Funcionalidades

### Agregar Variante

```tsx
const handleAdd = () => {
  // Validación: aikon_id, measure y price_list son requeridos
  if (!formData.aikon_id || !formData.measure || formData.price_list <= 0) {
    return
  }

  const newVariants = [...variants, { ...formData }]
  onChange(newVariants)
  resetForm()
}
```

### Editar Variante

```tsx
const handleEdit = (index: number) => {
  setFormData(variants[index])
  setEditingIndex(index)
}

const handleUpdate = () => {
  if (editingIndex === null || !formData.aikon_id || !formData.measure || formData.price_list <= 0) {
    return
  }

  const newVariants = [...variants]
  newVariants[editingIndex] = { ...formData }
  onChange(newVariants)
  resetForm()
}
```

### Eliminar Variante

```tsx
const handleDelete = (index: number) => {
  const newVariants = variants.filter((_, i) => i !== index)
  onChange(newVariants)
}
```

### Marcar como Default

```tsx
const handleSetDefault = (index: number) => {
  // Solo una variante puede ser default
  const newVariants = variants.map((v, i) => ({
    ...v,
    is_default: i === index,
  }))
  onChange(newVariants)
}
```

## 📝 Ejemplo Completo

```tsx
'use client'

import { useState } from 'react'
import { VariantBuilder, VariantFormData } from '@/components/admin/products/VariantBuilder'

export function ProductVariantsSection() {
  const [variants, setVariants] = useState<VariantFormData[]>([
    {
      color_name: 'Roble',
      color_hex: '#8B4513',
      aikon_id: 'AIKON-001',
      measure: '4L',
      finish: 'Mate',
      price_list: 25000,
      price_sale: 22000,
      stock: 50,
      is_active: true,
      is_default: true,
    }
  ])

  const measures = ['4L', '10L', '20L']
  const terminaciones = ['Mate', 'Satinado', 'Brillante']

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Variantes del Producto</h3>
      <VariantBuilder
        variants={variants}
        onChange={setVariants}
        measures={measures}
        terminaciones={terminaciones}
      />
      <p className="text-sm text-gray-500">
        {variants.length} variante(s) configurada(s)
      </p>
    </div>
  )
}
```

## 🎯 Casos de Uso

### Producto con Múltiples Colores y Medidas

```tsx
// Ejemplo: Impregnante disponible en 3 colores y 2 medidas
// Resultado: 6 variantes (3 colores × 2 medidas)
<VariantBuilder
  variants={variants}
  onChange={setVariants}
  measures={['4L', '10L']}
  terminaciones={['Mate', 'Satinado']}
/>
```

### Producto con Variante por Defecto

```tsx
// La primera variante se marca automáticamente como default
// O puedes usar handleSetDefault para cambiar cuál es la default
const handleSetDefault = (index: number) => {
  const newVariants = variants.map((v, i) => ({
    ...v,
    is_default: i === index,
  }))
  setVariants(newVariants)
}
```

### Variante con Imagen Específica

```tsx
// Algunas variantes pueden tener imágenes diferentes
{
  color_name: 'Roble',
  measure: '4L',
  image_url: '/images/products/impregnante-roble-4l.jpg',
  // ...
}
```

## 🔄 Flujo de Trabajo

1. **Usuario completa el formulario** con los datos de la variante
2. **Validación automática** verifica campos requeridos
3. **Agregar/Actualizar** añade la variante a la tabla o actualiza existente
4. **Visualización** muestra todas las variantes en tabla
5. **Edición inline** permite modificar variantes existentes
6. **Eliminación** remueve variantes no deseadas
7. **Guardado** las variantes se guardan con el producto

## 🐛 Troubleshooting

### No se puede agregar la variante

**Solución**: Verifica que:
- `aikon_id` no esté vacío
- `measure` esté seleccionado
- `price_list` sea mayor a 0

### La variante no se actualiza

**Solución**: Asegúrate de hacer clic en "Actualizar" después de editar. El botón "Agregar" solo funciona para nuevas variantes.

### No se puede marcar como default

**Solución**: Solo una variante puede ser default. Al marcar una nueva como default, la anterior se desmarca automáticamente.

### Los colores no aparecen

**Solución**: Verifica que `ColorPickerField` esté funcionando correctamente y que la paleta de colores esté cargada.

## 🔗 Archivos Relacionados

- `src/components/admin/products/VariantBuilder.tsx` - Implementación del componente
- `src/components/admin/products/ColorPickerField.tsx` - Selector de colores
- `src/components/admin/products/MeasureSelector.tsx` - Selector de medidas
- `src/components/admin/products/ProductForm.tsx` - Uso en formulario de productos

## 📝 Notas de Desarrollo

### Commit: `17d60427` - "feat(admin): mejoras UI formulario de productos - VariantBuilder para creación inline de variantes"

Este componente fue parte de las mejoras del formulario de productos, permitiendo crear variantes directamente en el formulario sin necesidad de guardar el producto primero.

### Integración con Otros Componentes

El `VariantBuilder` integra:
- **ColorPickerField**: Para selección de colores con paleta
- **MeasureSelector**: Para selección de medidas (aunque aquí usa un select simple)
- **Formulario de productos**: Se usa dentro del `ProductForm` completo

### Validación

El componente valida:
- Campos requeridos: `aikon_id`, `measure`, `price_list > 0`
- Precio de venta debe ser menor o igual al precio de lista (lógica opcional)
- Solo una variante puede ser `is_default: true`

### Estados del Formulario

El componente maneja dos estados:
- **Agregar**: `editingIndex === null` - Muestra formulario vacío para nueva variante
- **Editar**: `editingIndex !== null` - Muestra datos de la variante seleccionada
