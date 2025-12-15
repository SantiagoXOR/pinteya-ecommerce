# BrandSelector

Componente de selección de marcas con búsqueda y creación inline para el panel de administración de productos.

> **Última actualización**: 15 de Diciembre, 2025 - Implementado con búsqueda en tiempo real y creación inline de marcas personalizadas.

## 🎯 Características

- **Búsqueda en tiempo real** - Filtrado instantáneo de marcas mientras escribes
- **Creación inline** - Permite crear nuevas marcas directamente desde el selector
- **Carga desde API** - Obtiene marcas desde `/api/brands` con caché de 5 minutos
- **Contador de productos** - Muestra cantidad de productos por marca
- **Validación de errores** - Manejo de errores de carga y validación de formularios
- **Accesibilidad** - Soporte completo de teclado y ARIA labels

## 📐 Estructura Visual

```
┌─────────────────────────────────────┐
│ [Selecciona una marca        ▼]     │
├─────────────────────────────────────┤
│ 🔍 [Buscar marcas...]               │
├─────────────────────────────────────┤
│ • Alba (15 productos)          ●     │
│ • Sherwin Williams (8 productos)    │
│ • Sinteplast (22 productos)          │
├─────────────────────────────────────┤
│ O crear nueva marca:                │
│ [Nombre de la marca] [+]            │
└─────────────────────────────────────┘
```

## 🔧 Uso Básico

```tsx
import { BrandSelector } from '@/components/admin/products/BrandSelector'

function ProductForm() {
  const [brand, setBrand] = useState<string>('')

  return (
    <BrandSelector
      value={brand}
      onChange={setBrand}
      placeholder="Selecciona una marca"
      allowCreate={true}
    />
  )
}
```

## 📋 Props e Interfaces

### BrandSelectorProps

```typescript
interface BrandSelectorProps {
  value?: string                    // Marca seleccionada
  onChange: (brand: string) => void // Callback cuando cambia la selección
  error?: string                    // Mensaje de error a mostrar
  placeholder?: string              // Texto placeholder (default: "Selecciona una marca")
  allowCreate?: boolean             // Permitir crear nuevas marcas (default: true)
  className?: string                // Clases CSS adicionales
}
```

### Brand Interface

```typescript
interface Brand {
  name: string           // Nombre de la marca
  products_count: number // Cantidad de productos con esta marca
}
```

## 🎨 Estilos y Diseño

### Colores

- **Fondo dropdown**: `bg-white`
- **Borde**: `border-gray-300`
- **Focus ring**: `focus:ring-blaze-orange-500`
- **Item seleccionado**: `bg-blaze-orange-50 text-blaze-orange-700`
- **Botón crear**: `bg-blaze-orange-600 hover:bg-blaze-orange-700`

### Estados

- **Loading**: Opacidad reducida y cursor `not-allowed`
- **Error**: Borde rojo y mensaje de error debajo
- **Hover**: Fondo gris claro en items
- **Seleccionado**: Fondo naranja claro con indicador circular

## 🔄 Flujo de Datos

1. **Carga inicial**: El componente hace fetch a `/api/brands` usando TanStack Query
2. **Búsqueda**: Filtra marcas localmente basado en `searchTerm`
3. **Selección**: Actualiza `value` y cierra el dropdown
4. **Creación**: Si `allowCreate` es true, permite crear marca directamente

## 🧪 Testing

### Casos de Prueba

- ✅ Carga de marcas desde API
- ✅ Búsqueda y filtrado
- ✅ Selección de marca existente
- ✅ Creación de nueva marca
- ✅ Manejo de errores de API
- ✅ Estados de loading
- ✅ Validación de formularios

## 📝 Notas de Desarrollo

### Commit: `17d60427` - "feat(admin): mejoras UI formulario de productos - Dropdown de marcas con búsqueda y creación inline"

**Cambios implementados:**

1. **Dropdown con búsqueda**
   - Campo de búsqueda integrado en el dropdown
   - Filtrado en tiempo real sin necesidad de API calls adicionales
   - Autofocus en el campo de búsqueda al abrir

2. **Creación inline de marcas**
   - Sección separada en el footer del dropdown
   - Input con botón de agregar
   - Soporte para Enter key para crear rápidamente

3. **Mejoras de UX**
   - Contador de productos por marca
   - Indicador visual de selección (punto naranja)
   - Overlay para cerrar al hacer click fuera

4. **Optimizaciones**
   - Caché de 5 minutos para evitar requests repetidos
   - Loading states apropiados
   - Manejo de errores con mensajes claros

### Integración con ProductForm

El `BrandSelector` se usa dentro del `ProductForm` para seleccionar la marca del producto:

```tsx
<BrandSelector
  value={formData.brand}
  onChange={(brand) => setFormData({ ...formData, brand })}
  error={errors.brand}
  allowCreate={true}
/>
```

## 🔗 Archivos Relacionados

- `src/components/admin/products/BrandSelector.tsx` - Implementación del componente
- `src/components/admin/products/ProductForm.tsx` - Uso en formulario de productos
- `src/app/api/brands/route.ts` - API endpoint para obtener marcas

## 🐛 Troubleshooting

### Las marcas no se cargan

**Solución**: Verifica que el endpoint `/api/brands` esté funcionando y retorne el formato correcto:
```json
{
  "data": [
    { "name": "Alba", "products_count": 15 }
  ]
}
```

### No puedo crear una nueva marca

**Solución**: Asegúrate de que `allowCreate={true}` esté configurado y que el input tenga texto antes de hacer click en el botón.

### El dropdown no se cierra

**Solución**: Verifica que el overlay esté funcionando correctamente. El dropdown se cierra automáticamente al hacer click fuera o al seleccionar una marca (en modo single select).
