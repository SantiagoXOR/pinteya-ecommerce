# BestSeller

Componente que muestra los productos más vendidos en la página principal, con soporte para filtrado por categoría y manejo inteligente de estados de carga.

> **Última actualización**: 15 de Diciembre, 2025 - Optimizado con manejo de skeletons, timeout y integración con CategoryFilterContext.

## 🎯 Características

- **Filtrado por categoría** - Muestra productos según categoría seleccionada
- **Productos destacados** - Sin categoría, muestra 10 productos específicos hardcodeados
- **Grid responsive** - 2 columnas mobile, 2 tablet, 4 desktop
- **Skeletons inteligentes** - Manejo de estados de carga con timeout
- **Ordenamiento** - Productos con stock primero, luego sin stock
- **HelpCard** - Muestra tarjeta de ayuda cuando hay espacios vacíos en la última fila
- **Empty state** - Mensaje cuando no hay productos disponibles

## 📐 Estructura Visual

```
┌─────────────────────────────────────┐
│ [Producto] [Producto]              │
│ [Producto] [Producto]               │
│ [Producto] [HelpCard]               │
└─────────────────────────────────────┘
```

## 🔧 Uso Básico

```tsx
import BestSeller from '@/components/Home-v2/BestSeller'

// El componente no requiere props, usa CategoryFilterContext
<BestSeller />
```

## 📋 Props e Interfaces

El componente no acepta props directamente. Obtiene datos de:

- **CategoryFilterContext**: Para la categoría seleccionada
- **useBestSellerProducts**: Hook que obtiene productos según categoría

## 🎨 Estilos y Diseño

### Grid Layout

- **Mobile**: `grid-cols-2` (2 columnas)
- **Tablet**: `md:grid-cols-2` (2 columnas)
- **Desktop**: `lg:grid-cols-4` (4 columnas)
- **Gap**: `gap-4 md:gap-6`

### Estados Visuales

- **Loading**: Grid de skeletons (`ProductSkeletonGrid`)
- **Empty**: Card con icono de trofeo y mensaje
- **Con productos**: Grid de `ProductItem` components
- **HelpCard**: Aparece cuando hay espacios vacíos en última fila

## 🔄 Flujo de Datos

1. **Contexto**: Obtiene `selectedCategory` de `CategoryFilterContext`
2. **Fetch**: Llama a `useBestSellerProducts` con `categorySlug`
3. **Lógica de productos**:
   - **Sin categoría**: 10 productos hardcodeados específicos
   - **Con categoría**: Todos los productos de la categoría (limit 50)
4. **Ordenamiento**: Productos con stock primero, ordenados por precio descendente
5. **Renderizado**: Grid de productos o estados vacíos/loading

## 🧪 Testing

### Casos de Prueba

- ✅ Carga de productos sin categoría seleccionada
- ✅ Filtrado por categoría
- ✅ Manejo de estados de loading con timeout
- ✅ Skeletons se muestran correctamente
- ✅ Empty state cuando no hay productos
- ✅ HelpCard aparece en última fila incompleta
- ✅ Ordenamiento correcto (stock primero, precio descendente)
- ✅ Grid responsive en diferentes tamaños

## 📝 Notas de Desarrollo

### Commits Relacionados

#### `ac070a0a` - "fix: resolver problema de skeletons eternos cargando productos"

**Cambios implementados:**

1. **Reemplazo de dynamic import**
   - Eliminado `dynamic()` de Next.js que impedía carga correcta
   - Importación directa de BestSeller

2. **Logs de debugging**
   - Logs extensivos en BestSeller y useBestSellerProducts
   - Rastreo de ciclo de vida del componente

3. **Simplificación de LazyBestSeller**
   - Renderizado inmediato sin progressive loading
   - Eliminación de estados intermedios innecesarios

#### `e3d6f09e` - "fix: corregir problema de skeletons que se quedaban cargando eternamente en primera carga"

**Cambios implementados:**

1. **Configuración de TanStack Query**
   - Forzar ejecución en mount
   - Ajustes en staleTime y cacheTime

2. **Overflow-hidden en skeletons**
   - Prevenir desbordamientos visuales
   - Mejor manejo de estados de carga

3. **Timeout de seguridad**
   - Timeout de 6 segundos para ocultar skeletons
   - Prevenir estados de loading infinitos

### Lógica de Productos

#### Sin Categoría Seleccionada

Muestra 10 productos específicos hardcodeados (IDs definidos en `useBestSellerProducts`):

```typescript
const HARDCODED_BEST_SELLER_IDS = [
  // IDs de productos específicos
]
```

#### Con Categoría Seleccionada

Obtiene todos los productos de la categoría desde la API con límite de 50:

```typescript
const { products } = useBestSellerProducts({
  categorySlug: selectedCategory,
})
```

### Manejo de Estados

El componente implementa un sistema robusto de manejo de estados:

1. **Loading inicial**: Muestra skeletons
2. **Timeout**: Después de 6 segundos, oculta skeletons si no hay productos
3. **Error**: Oculta componente si hay error
4. **Productos disponibles**: Muestra grid de productos
5. **Sin productos**: Muestra empty state con mensaje

### HelpCard

El `HelpCard` se muestra cuando:
- Hay productos en el grid
- La última fila tiene espacios vacíos (no es múltiplo de 4 o 2 según breakpoint)

## 🔗 Archivos Relacionados

- `src/components/Home-v2/BestSeller/index.tsx` - Implementación del componente
- `src/components/Home-v2/BestSeller/HelpCard.tsx` - Tarjeta de ayuda
- `src/hooks/useBestSellerProducts.ts` - Hook para obtener productos
- `src/contexts/CategoryFilterContext.tsx` - Contexto de categorías
- `src/components/Common/ProductItem.tsx` - Componente de producto individual
- `src/components/ui/product-skeleton.tsx` - Skeletons de carga

## 🐛 Troubleshooting

### Los skeletons se quedan cargando eternamente

**Solución**: El componente tiene un timeout de 6 segundos. Si persiste, verifica:
1. Que `useBestSellerProducts` esté retornando datos correctamente
2. Que no haya errores en la consola
3. Que la API `/api/products` esté funcionando

### No se muestran productos sin categoría

**Solución**: Verifica que los IDs hardcodeados en `useBestSellerProducts` existan en la base de datos y tengan productos válidos.

### El HelpCard no aparece

**Solución**: El HelpCard solo aparece cuando hay espacios vacíos en la última fila. Verifica que el cálculo de `shouldShowHelpCard` sea correcto según la cantidad de productos.

### Los productos no se ordenan correctamente

**Solución**: El ordenamiento es: primero productos con stock (ordenados por precio descendente), luego productos sin stock. Verifica que el campo `stock` esté disponible en los productos.
