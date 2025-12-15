# MeasureSelector

Componente para selección múltiple de medidas/capacidades de productos en el panel administrativo.

> **Última actualización**: 15 de Diciembre, 2025 - Implementado con búsqueda y creación inline de medidas personalizadas.

## 🎯 Características

- **Selección múltiple** - Permite seleccionar varias medidas a la vez
- **Medidas predefinidas** - Lista de medidas comunes (L, KG, Nº, ml)
- **Búsqueda** - Filtrado en tiempo real de medidas disponibles
- **Creación inline** - Agregar medidas personalizadas que no están en la lista
- **Visualización de seleccionadas** - Pills con botón de eliminar
- **Validación** - Previene duplicados automáticamente

## 🚀 Uso

```tsx
import { MeasureSelector } from '@/components/admin/products/MeasureSelector'

function ProductForm() {
  const [measures, setMeasures] = useState<string[]>([])

  return (
    <MeasureSelector
      value={measures}
      onChange={setMeasures}
      placeholder="Selecciona o agrega medidas"
    />
  )
}
```

## 📋 Props

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `value` | `string[]` | `[]` | Array de medidas seleccionadas |
| `onChange` | `(measures: string[]) => void` | - | Callback cuando cambian las medidas |
| `placeholder` | `string` | `'Selecciona o agrega medidas'` | Texto del placeholder |
| `className` | `string` | - | Clases CSS adicionales |

## 📐 Medidas Predefinidas

El componente incluye las siguientes medidas comunes:

### Volumen (L)
- 1L, 4L, 10L, 20L, 25L

### Peso (KG)
- 1KG, 4KG, 10KG, 20KG

### Números
- Nº10, Nº12, Nº14, Nº16, Nº18, Nº20

### Mililitros
- 250ml, 500ml, 750ml

### Otros
- 2.5L, 5L

## 🎨 Interfaz de Usuario

### Vista de Medidas Seleccionadas

Las medidas seleccionadas se muestran como pills con botón de eliminar:

```
[4L ×] [10L ×] [20L ×]
```

### Dropdown de Selección

Al hacer clic, se abre un dropdown con:
- Campo de búsqueda
- Lista de medidas disponibles filtradas
- Campo para agregar medida personalizada
- Botón "Agregar" para medidas personalizadas

## 🔧 Funcionalidades

### Búsqueda en Tiempo Real

```tsx
// Filtra medidas que contengan el término de búsqueda
const filteredMeasures = searchTerm
  ? availableMeasures.filter(m =>
      m.toLowerCase().includes(searchTerm.toLowerCase())
    )
  : availableMeasures
```

### Agregar Medida Predefinida

```tsx
const handleAddMeasure = (measure: string) => {
  if (measure && !selectedMeasures.includes(measure)) {
    onChange([...selectedMeasures, measure])
  }
}
```

### Agregar Medida Personalizada

```tsx
const handleCustomMeasure = () => {
  if (customMeasure.trim() && !selectedMeasures.includes(customMeasure.trim())) {
    handleAddMeasure(customMeasure.trim())
    setCustomMeasure('')
  }
}
```

### Eliminar Medida

```tsx
const handleRemoveMeasure = (measure: string) => {
  onChange(selectedMeasures.filter(m => m !== measure))
}
```

## 📝 Ejemplo Completo

```tsx
'use client'

import { useState } from 'react'
import { MeasureSelector } from '@/components/admin/products/MeasureSelector'

export function ProductMeasuresSection() {
  const [measures, setMeasures] = useState<string[]>(['4L', '10L'])

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium">
        Medidas Disponibles
      </label>
      <MeasureSelector
        value={measures}
        onChange={setMeasures}
        placeholder="Selecciona las medidas del producto"
      />
      <p className="text-sm text-gray-500">
        {measures.length} medida(s) seleccionada(s)
      </p>
    </div>
  )
}
```

## 🎯 Casos de Uso

### Producto con Múltiples Capacidades

```tsx
// Ejemplo: Pintura disponible en 4L, 10L y 20L
<MeasureSelector
  value={['4L', '10L', '20L']}
  onChange={(newMeasures) => {
    // Actualizar variantes del producto según las medidas
    updateProductVariants(newMeasures)
  }}
/>
```

### Producto con Medida Personalizada

```tsx
// Ejemplo: Producto con medida especial "3.5L"
<MeasureSelector
  value={['3.5L']}
  onChange={setMeasures}
/>
// El usuario puede escribir "3.5L" en el campo personalizado
```

## 🐛 Troubleshooting

### Las medidas no se guardan

**Solución**: Asegúrate de que el `onChange` esté actualizando el estado correctamente y que el estado se esté guardando en el formulario.

### No aparece la medida que busco

**Solución**: Usa el campo de medida personalizada para agregar medidas que no están en la lista predefinida.

### Se agregan medidas duplicadas

**Solución**: El componente previene duplicados automáticamente. Si ocurre, verifica que el `value` prop esté sincronizado correctamente.

## 🔗 Archivos Relacionados

- `src/components/admin/products/MeasureSelector.tsx` - Implementación del componente
- `src/components/admin/products/ProductForm.tsx` - Uso en formulario de productos
- `src/components/admin/products/VariantBuilder.tsx` - Integración con builder de variantes

## 📝 Notas de Desarrollo

### Commit: `6b3bcf81` - "feat: implementar selección múltiple de categorías y terminaciones"

Este componente fue parte de las mejoras del formulario de productos del panel admin, permitiendo selección múltiple de medidas para crear variantes automáticamente.

### Integración con VariantBuilder

El `MeasureSelector` se usa dentro del `VariantBuilder` para seleccionar la medida de cada variante:

```tsx
<VariantBuilder
  variants={variants}
  onChange={setVariants}
  measures={selectedMeasures} // Medidas del MeasureSelector
/>
```
