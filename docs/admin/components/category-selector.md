# CategorySelector

Componente de selección de categorías con soporte para árbol jerárquico, búsqueda y selección simple o múltiple para el panel de administración.

> **Última actualización**: 15 de Diciembre, 2025 - Implementado con árbol jerárquico, búsqueda y soporte para selección múltiple.

## 🎯 Características

- **Árbol jerárquico** - Visualización de categorías con estructura padre-hijo
- **Búsqueda avanzada** - Filtrado por nombre con vista plana durante la búsqueda
- **Selección simple/múltiple** - Modo single o multiple según configuración
- **Expansión/colapso** - Navegación por niveles con iconos de carpeta
- **Chips de selección** - En modo múltiple, muestra chips removibles
- **Carga desde API** - Obtiene categorías desde `/api/categories` con caché de 5 minutos

## 📐 Estructura Visual

### Modo Single Select

```
┌─────────────────────────────────────┐
│ [Selecciona una categoría      ▼]   │
├─────────────────────────────────────┤
│ 🔍 [Buscar categorías...]           │
├─────────────────────────────────────┤
│ 📁 Pinturas                         │
│   📁 Interiores                     │
│     • Látex (12 productos)      ●   │
│     • Esmalte sintético             │
│   📁 Exteriores                     │
│ 📁 Herramientas                     │
└─────────────────────────────────────┘
```

### Modo Multiple Select

```
┌─────────────────────────────────────┐
│ [Látex] [Esmalte] [Pinceles]    ▼  │
│ 3 categorías seleccionadas          │
├─────────────────────────────────────┤
│ 🔍 [Buscar categorías...]           │
├─────────────────────────────────────┤
│ ☑ Látex                             │
│ ☐ Esmalte sintético                 │
│ ☑ Pinceles                          │
└─────────────────────────────────────┘
```

## 🔧 Uso Básico

### Selección Simple

```tsx
import { CategorySelector } from '@/components/admin/products/CategorySelector'

function ProductForm() {
  const [categoryId, setCategoryId] = useState<number>()

  return (
    <CategorySelector
      value={categoryId}
      onChange={setCategoryId}
      placeholder="Selecciona una categoría"
      multiple={false}
    />
  )
}
```

### Selección Múltiple

```tsx
<CategorySelector
  value={[1, 2, 3]}
  onChange={(ids) => setCategoryIds(ids)}
  placeholder="Selecciona categorías"
  multiple={true}
  allowCreate={false}
/>
```

## 📋 Props e Interfaces

### CategorySelectorProps

```typescript
interface CategorySelectorProps {
  value?: number | number[]        // ID(s) de categoría(s) seleccionada(s)
  onChange: (categoryId: number | number[]) => void
  error?: string                   // Mensaje de error
  placeholder?: string             // Texto placeholder
  allowCreate?: boolean            // Permitir crear categorías (default: false)
  className?: string               // Clases CSS adicionales
  multiple?: boolean               // Modo selección múltiple (default: false)
}
```

### Category Interface

```typescript
interface Category {
  id: number
  name: string
  description?: string
  parent_id?: number    // ID de categoría padre (null para raíz)
  level: number         // Nivel en el árbol (0 = raíz)
  children?: Category[] // Categorías hijas
}
```

## 🎨 Estilos y Diseño

### Colores

- **Fondo dropdown**: `bg-white`
- **Borde**: `border-gray-300`
- **Focus ring**: `focus:ring-blaze-orange-500`
- **Item seleccionado**: `bg-blaze-orange-50 text-blaze-orange-700`
- **Checkbox seleccionado**: `border-blaze-orange-600 bg-blaze-orange-600`

### Iconos

- **Carpeta cerrada**: `Folder` (gris)
- **Carpeta abierta**: `FolderOpen` (gris)
- **Checkbox**: Checkmark blanco cuando está seleccionado
- **Indicador selección**: Punto naranja en modo single

### Indentación

- **Nivel 0**: `paddingLeft: 12px`
- **Nivel 1**: `paddingLeft: 32px`
- **Nivel 2**: `paddingLeft: 52px`
- Incremento de 20px por nivel

## 🔄 Flujo de Datos

1. **Carga inicial**: Fetch a `/api/categories` usando TanStack Query
2. **Construcción del árbol**: Función `buildCategoryTree` organiza categorías por parent_id
3. **Búsqueda**: Si hay `searchTerm`, muestra vista plana con indentación por nivel
4. **Selección**: 
   - **Single**: Actualiza `value` con un número y cierra dropdown
   - **Multiple**: Actualiza `value` con array y mantiene dropdown abierto
5. **Expansión**: Estado local `expandedCategories` controla qué categorías están expandidas

## 🧪 Testing

### Casos de Prueba

- ✅ Carga de categorías desde API
- ✅ Construcción correcta del árbol jerárquico
- ✅ Búsqueda y filtrado
- ✅ Selección simple
- ✅ Selección múltiple
- ✅ Expansión/colapso de categorías
- ✅ Remoción de categorías en modo múltiple
- ✅ Manejo de errores de API

## 📝 Notas de Desarrollo

### Commit: `6b3bcf81` - "feat: implementar selección múltiple de categorías y terminaciones en panel de crear producto"

**Cambios implementados:**

1. **Soporte para selección múltiple**
   - Prop `multiple` para alternar entre modos
   - Checkboxes en lugar de radio buttons en modo múltiple
   - Chips removibles para mostrar selecciones

2. **Árbol jerárquico**
   - Función `buildCategoryTree` para organizar categorías
   - Navegación con expansión/colapso
   - Iconos de carpeta para indicar categorías con hijos

3. **Búsqueda mejorada**
   - Vista plana durante búsqueda con indicadores de nivel
   - Filtrado case-insensitive
   - Vista de árbol cuando no hay búsqueda activa

4. **Mejoras de UX**
   - El dropdown permanece abierto en modo múltiple
   - Botón para limpiar todas las selecciones
   - Contador de categorías seleccionadas

### Integración con ProductForm

El `CategorySelector` se usa en el formulario de productos:

```tsx
<CategorySelector
  value={formData.category_id}
  onChange={(id) => setFormData({ ...formData, category_id: id })}
  error={errors.category_id}
  multiple={false}
/>
```

Para múltiples categorías:

```tsx
<CategorySelector
  value={formData.category_ids}
  onChange={(ids) => setFormData({ ...formData, category_ids: ids })}
  multiple={true}
/>
```

## 🔗 Archivos Relacionados

- `src/components/admin/products/CategorySelector.tsx` - Implementación del componente
- `src/components/admin/products/CategoryMultiSelector.tsx` - Versión simplificada para múltiples selecciones
- `src/components/admin/products/ProductForm.tsx` - Uso en formulario de productos
- `src/app/api/categories/route.ts` - API endpoint para obtener categorías

## 🐛 Troubleshooting

### El árbol no se muestra correctamente

**Solución**: Verifica que las categorías tengan `parent_id` correcto. Las categorías raíz deben tener `parent_id: null` o no tener la propiedad.

### No puedo seleccionar múltiples categorías

**Solución**: Asegúrate de que `multiple={true}` esté configurado. En modo single, solo se puede seleccionar una categoría.

### Las categorías no se expanden

**Solución**: Verifica que las categorías tengan el array `children` poblado correctamente después de construir el árbol.

### La búsqueda no funciona

**Solución**: La búsqueda filtra por `name` case-insensitive. Verifica que las categorías tengan el campo `name` correctamente.
