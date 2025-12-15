# CategoryMultiSelector

Componente simplificado de selección múltiple de categorías optimizado para casos donde solo se necesita seleccionar múltiples categorías sin árbol jerárquico.

> **Última actualización**: 15 de Diciembre, 2025 - Implementado como versión simplificada del CategorySelector para selección múltiple.

## 🎯 Características

- **Selección múltiple** - Diseñado específicamente para múltiples selecciones
- **Búsqueda rápida** - Filtrado instantáneo de categorías
- **Chips removibles** - Visualización clara de categorías seleccionadas
- **Límite de selecciones** - Opción para limitar cantidad máxima
- **Vista compacta** - Diseño optimizado para formularios
- **Carga desde API** - Obtiene categorías desde `/api/categories` con caché de 5 minutos

## 📐 Estructura Visual

```
┌─────────────────────────────────────┐
│ [Látex] [Esmalte] [Pinceles]    ✕ ▼│
│ 3 categorías seleccionadas (máx 5)   │
├─────────────────────────────────────┤
│ 🔍 [Buscar categorías...]           │
├─────────────────────────────────────┤
│ ☑ Látex                             │
│ ☐ Esmalte sintético                 │
│ ☑ Pinceles                          │
│ ☐ Rodillos                          │
└─────────────────────────────────────┘
```

## 🔧 Uso Básico

```tsx
import { CategoryMultiSelector } from '@/components/admin/products/CategoryMultiSelector'

function ProductForm() {
  const [categoryIds, setCategoryIds] = useState<number[]>([])

  return (
    <CategoryMultiSelector
      value={categoryIds}
      onChange={setCategoryIds}
      placeholder="Selecciona categorías"
      maxSelections={5}
    />
  )
}
```

## 📋 Props e Interfaces

### CategoryMultiSelectorProps

```typescript
interface CategoryMultiSelectorProps {
  value?: number[]                  // Array de IDs de categorías seleccionadas
  onChange: (categoryIds: number[]) => void
  error?: string                    // Mensaje de error
  placeholder?: string              // Texto placeholder (default: "Selecciona categorías")
  className?: string                // Clases CSS adicionales
  maxSelections?: number            // Límite máximo de selecciones
}
```

### Category Interface

```typescript
interface Category {
  id: number
  name: string
  slug: string
}
```

## 🎨 Estilos y Diseño

### Colores

- **Chips seleccionados**: `bg-blaze-orange-100 text-blaze-orange-800 border-blaze-orange-200`
- **Fondo dropdown**: `bg-white`
- **Item seleccionado**: `bg-blaze-orange-50 text-blaze-orange-700`
- **Checkbox seleccionado**: `bg-blaze-orange-600 border-blaze-orange-600`
- **Item deshabilitado**: `opacity-50 cursor-not-allowed`

### Componentes Visuales

- **Chips**: Badges naranjas con botón X para remover
- **Checkbox**: Cuadrado con checkmark blanco cuando seleccionado
- **Contador**: Texto pequeño mostrando cantidad seleccionada y límite
- **Botón limpiar**: Icono X en el botón principal cuando hay selecciones

## 🔄 Flujo de Datos

1. **Carga inicial**: Fetch a `/api/categories` usando TanStack Query
2. **Búsqueda**: Filtrado local basado en `searchTerm`
3. **Toggle**: Agregar o remover categoría del array `value`
4. **Validación**: Si `maxSelections` está definido, previene seleccionar más
5. **Remoción**: Botón X en chips o botón limpiar todo

## 🧪 Testing

### Casos de Prueba

- ✅ Carga de categorías desde API
- ✅ Selección múltiple de categorías
- ✅ Búsqueda y filtrado
- ✅ Remoción individual de categorías
- ✅ Limpieza de todas las selecciones
- ✅ Límite máximo de selecciones
- ✅ Deshabilitado cuando se alcanza el límite
- ✅ Manejo de errores de API

## 📝 Notas de Desarrollo

### Diferencias con CategorySelector

El `CategoryMultiSelector` es una versión simplificada del `CategorySelector`:

**Ventajas:**
- ✅ Más simple y ligero
- ✅ Sin lógica de árbol jerárquico
- ✅ Optimizado para selección múltiple
- ✅ Mejor rendimiento con muchas categorías

**Cuándo usar cada uno:**
- **CategorySelector**: Cuando necesitas árbol jerárquico o selección simple
- **CategoryMultiSelector**: Cuando solo necesitas selección múltiple simple

### Integración con ProductForm

```tsx
<CategoryMultiSelector
  value={formData.category_ids || []}
  onChange={(ids) => setFormData({ ...formData, category_ids: ids })}
  error={errors.category_ids}
  maxSelections={5}
  placeholder="Selecciona hasta 5 categorías"
/>
```

## 🔗 Archivos Relacionados

- `src/components/admin/products/CategoryMultiSelector.tsx` - Implementación del componente
- `src/components/admin/products/CategorySelector.tsx` - Versión completa con árbol jerárquico
- `src/components/admin/products/ProductForm.tsx` - Uso en formulario de productos
- `src/app/api/categories/route.ts` - API endpoint para obtener categorías

## 🐛 Troubleshooting

### No puedo seleccionar más categorías

**Solución**: Verifica si `maxSelections` está configurado y si ya alcanzaste el límite. Las categorías adicionales aparecerán deshabilitadas.

### Los chips no se muestran

**Solución**: Asegúrate de que `value` sea un array y que tenga IDs válidos que existan en las categorías cargadas.

### El botón limpiar no funciona

**Solución**: El botón limpiar solo aparece cuando hay selecciones. Verifica que `value` tenga elementos y que `onChange` esté actualizando el estado correctamente.
