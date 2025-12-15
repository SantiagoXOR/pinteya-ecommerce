# ColorPickerField

Componente para selección de colores con paleta predefinida y soporte para colores personalizados en el panel administrativo.

> **Última actualización**: 15 de Diciembre, 2025 - Implementado con integración de paleta de colores de pintura.

## 🎯 Características

- **Paleta de colores predefinida** - Integrado con `PAINT_COLORS` del sistema
- **Búsqueda por nombre o hex** - Encuentra colores por nombre o código hexadecimal
- **Selector visual** - Muestra colores con su hex code
- **Color personalizado** - Permite agregar colores que no están en la paleta
- **Sincronización automática** - Sincroniza nombre y hex automáticamente
- **Validación** - Previene colores inválidos

## 🚀 Uso

```tsx
import { ColorPickerField } from '@/components/admin/products/ColorPickerField'

function ProductForm() {
  const [colorName, setColorName] = useState('')
  const [colorHex, setColorHex] = useState('')

  const handleColorChange = (name: string, hex?: string) => {
    setColorName(name)
    setColorHex(hex || '')
  }

  return (
    <ColorPickerField
      colorName={colorName}
      colorHex={colorHex}
      onColorChange={handleColorChange}
      label="Color del Producto"
    />
  )
}
```

## 📋 Props

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `colorName` | `string` | `''` | Nombre del color seleccionado |
| `colorHex` | `string` | - | Código hexadecimal del color |
| `onColorChange` | `(name: string, hex?: string) => void` | - | Callback cuando cambia el color |
| `label` | `string` | `'Color'` | Etiqueta del campo |
| `className` | `string` | - | Clases CSS adicionales |
| `error` | `string` | - | Mensaje de error a mostrar |

## 🎨 Paleta de Colores

El componente utiliza la paleta `PAINT_COLORS` del sistema, que incluye:

- Colores de pintura comunes (Blanco, Negro, Rojo, Azul, etc.)
- Colores de madera (Roble, Pino, Caoba, etc.)
- Colores especiales (Metalizado, Perla, etc.)

Cada color tiene:
- `name`: Nombre técnico
- `displayName`: Nombre para mostrar
- `hex`: Código hexadecimal
- `category`: Categoría del color
- `family`: Familia de colores

## 🔧 Funcionalidades

### Búsqueda por Nombre

```tsx
const selectedColorOption = useMemo(() => {
  // Buscar por nombre primero
  const byName = PAINT_COLORS.find(
    c => c.name.toLowerCase() === colorName.toLowerCase() || 
         c.displayName.toLowerCase() === colorName.toLowerCase()
  )
  return byName
}, [colorName, colorHex])
```

### Búsqueda por Hex

```tsx
// Si hay hex, buscar en la paleta
if (colorHex) {
  const byHex = PAINT_COLORS.find(
    c => c.hex.toLowerCase() === colorHex.toLowerCase()
  )
  if (byHex) return byHex
}
```

### Selección desde Paleta

```tsx
const handlePaletteColorSelect = (color: typeof PAINT_COLORS[0]) => {
  onColorChange(color.displayName, color.hex)
  setCustomName(color.displayName)
  setIsPickerOpen(false)
}
```

### Color Personalizado

```tsx
const handleNameChange = (name: string) => {
  setCustomName(name)
  // Buscar en paleta, si no existe, usar como personalizado
  const color = PAINT_COLORS.find(
    c => c.name.toLowerCase() === name.toLowerCase() || 
         c.displayName.toLowerCase() === name.toLowerCase()
  )
  if (color) {
    onColorChange(color.displayName, color.hex)
  } else {
    onColorChange(name, colorHex || undefined)
  }
}
```

## 📝 Ejemplo Completo

```tsx
'use client'

import { useState } from 'react'
import { ColorPickerField } from '@/components/admin/products/ColorPickerField'

export function ProductColorSection() {
  const [colorName, setColorName] = useState('Roble')
  const [colorHex, setColorHex] = useState('#8B4513')

  const handleColorChange = (name: string, hex?: string) => {
    setColorName(name)
    if (hex) setColorHex(hex)
  }

  return (
    <div className="space-y-4">
      <ColorPickerField
        colorName={colorName}
        colorHex={colorHex}
        onColorChange={handleColorChange}
        label="Color del Producto"
      />
      <div className="flex items-center gap-2">
        <div
          className="w-8 h-8 rounded border"
          style={{ backgroundColor: colorHex }}
        />
        <span className="text-sm text-gray-600">
          {colorName} ({colorHex})
        </span>
      </div>
    </div>
  )
}
```

## 🎯 Casos de Uso

### Selección de Color para Variante

```tsx
// En VariantBuilder
<ColorPickerField
  colorName={variant.color_name}
  colorHex={variant.color_hex}
  onColorChange={(name, hex) => {
    updateVariant({ ...variant, color_name: name, color_hex: hex })
  }}
  label="Color de la Variante"
/>
```

### Color Personalizado no en Paleta

```tsx
// El usuario puede escribir un color que no está en la paleta
<ColorPickerField
  colorName="Verde Esmeralda Personalizado"
  colorHex="#50C878"
  onColorChange={handleColorChange}
/>
// El componente mantendrá el nombre y hex personalizados
```

## 🐛 Troubleshooting

### El color no se encuentra en la paleta

**Solución**: El componente permite colores personalizados. Si escribes un nombre que no está en la paleta, se guardará como color personalizado.

### El hex no se sincroniza con el nombre

**Solución**: El componente sincroniza automáticamente. Si el nombre coincide con un color de la paleta, actualizará el hex. Si no, mantendrá el hex actual.

### El picker no se abre

**Solución**: Verifica que el componente tenga suficiente espacio y que no haya overlays bloqueando el click.

## 🔗 Archivos Relacionados

- `src/components/admin/products/ColorPickerField.tsx` - Implementación del componente
- `src/components/ui/advanced-color-picker.tsx` - Paleta de colores `PAINT_COLORS`
- `src/components/admin/products/VariantBuilder.tsx` - Uso en builder de variantes
- `src/components/admin/products/ProductForm.tsx` - Uso en formulario de productos

## 📝 Notas de Desarrollo

### Commit: `9b3c9e2c` - "feat: agregar color picker para selección de colores en productos y variantes"

Este componente fue implementado para mejorar la selección de colores en el panel admin, reemplazando inputs de texto simples por un selector visual con paleta integrada.

### Integración con PAINT_COLORS

El componente está integrado con la paleta centralizada `PAINT_COLORS`, asegurando consistencia en toda la aplicación:

```tsx
import { PAINT_COLORS } from '@/components/ui/advanced-color-picker'
```

### Sincronización Bidireccional

El componente sincroniza automáticamente entre nombre y hex:
- Si seleccionas un color de la paleta → actualiza nombre y hex
- Si escribes un nombre que existe en la paleta → actualiza el hex
- Si escribes un hex que existe en la paleta → actualiza el nombre
- Si escribes algo personalizado → mantiene ambos valores
