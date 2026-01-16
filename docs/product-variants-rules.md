# Reglas de Negocio: Productos con Variantes

## Resumen

Este documento describe las reglas de negocio para productos que tienen variantes activas en el sistema de e-commerce.

## Regla Principal

**Cuando un producto tiene variantes activas, ciertos campos del producto principal deben ser `NULL` porque estos valores se definen en las variantes.**

## Campos Exclusivos de Variantes

Los siguientes campos **NO deben estar definidos** en el producto principal cuando hay variantes activas:

1. **`price`** - El precio se define en cada variante (`price_list`, `price_sale`)
2. **`discounted_price`** - El precio con descuento se define en cada variante (`price_sale`)
3. **`stock`** - El stock se maneja por variante
4. **`color`** - El color se define en cada variante (`color_name`)
5. **`medida`** - La medida se define en cada variante (`measure`)
6. **`terminaciones`** - Las terminaciones se definen en cada variante (`finish`)

### Campo `aikon_id`

- Si el producto **tiene variantes**: `aikon_id` debe ser `NULL` en el producto principal, y cada variante tiene su propio `aikon_id`
- Si el producto **no tiene variantes**: `aikon_id` puede estar definido en el producto principal

## Campos que SÍ se Mantienen en el Producto Principal

Estos campos se mantienen en el producto principal independientemente de si hay variantes:

- `name` - Nombre del producto
- `description` - Descripción del producto
- `brand` - Marca del producto
- `category_id` / `category_ids` - Categorías del producto
- `images` - Imágenes del producto
- `is_active` - Estado activo/inactivo
- `slug` - URL slug del producto

## Implementación

### Backend (APIs)

Las APIs de creación y actualización de productos incluyen validaciones automáticas:

- **`src/app/api/admin/products/route.ts`** (Crear producto)
  - Si el payload indica que habrá variantes, limpia automáticamente los campos inconsistentes

- **`src/app/api/admin/products/[id]/route.ts`** (Actualizar producto)
  - Verifica si el producto tiene variantes activas
  - Limpia automáticamente los campos inconsistentes antes de actualizar

### Frontend (Formularios)

El formulario `ProductFormMinimal` incluye validaciones:

- Detecta si el producto tiene variantes (existentes o nuevas)
- Limpia automáticamente los campos inconsistentes antes de enviar
- Muestra una notificación al usuario cuando se limpian campos automáticamente

### Utilidades

El archivo `src/lib/validation/product-variant-utils.ts` proporciona funciones helper:

- `hasActiveVariants(productId: number)`: Verifica si un producto tiene variantes activas
- `cleanProductFieldsForVariants(data, hasVariants)`: Limpia campos inconsistentes
- `validateProductDataForVariants(data, hasVariants)`: Valida que no haya inconsistencias
- `cleanProductFieldsIfHasVariants(productId, data)`: Limpia automáticamente basándose en el estado del producto

## Migración de Datos

Se ejecutó una migración SQL (`20260116140602_clean_product_variant_inconsistencies.sql`) el 16 de enero de 2026 que corrigió automáticamente **152 productos** con inconsistencias:

### Cambios en el Schema

- **Modificación del constraint `products_price_check`**: Se cambió de `price > 0` a `price >= 0` para permitir que productos con variantes tengan `price = 0`. Esto es necesario porque la columna `price` tiene una restricción NOT NULL.

### Resultados de la Migración

✅ **Migración ejecutada exitosamente el 16 de enero de 2026**

La migración corrigió automáticamente todas las inconsistencias identificadas:

- 152 productos con `price`/`discounted_price` inconsistente → **0 productos restantes** ✅
- 129 productos con `stock` inconsistente
- 86 productos con `medida` inconsistente
- 64 productos con `terminaciones` inconsistentes
- 31 productos con `color` inconsistente

## Razón de la Regla

Esta regla existe para:

1. **Consistencia de datos**: Evitar duplicación de información entre producto principal y variantes
2. **Claridad de negocio**: Los precios y stock se manejan a nivel de variante (cada color/tamaño puede tener precio diferente)
3. **Prevención de errores**: Evitar confusión sobre qué precio/stock usar cuando hay variantes
4. **Integridad referencial**: La UI muestra los datos correctos basándose en la variante seleccionada

## Ejemplo

### Producto SIN variantes (correcto):
```json
{
  "id": 1,
  "name": "Producto Simple",
  "price": 10000,
  "discounted_price": 9000,
  "stock": 50,
  "color": "Rojo",
  "medida": "20L",
  "aikon_id": 1234
}
```

### Producto CON variantes (correcto):
```json
{
  "id": 2,
  "name": "Producto con Variantes",
  "price": null,
  "discounted_price": null,
  "stock": null,
  "color": null,
  "medida": null,
  "terminaciones": null,
  "aikon_id": null,
  "variants": [
    {
      "color_name": "Rojo",
      "measure": "20L",
      "price_list": 12000,
      "price_sale": 10000,
      "stock": 30,
      "aikon_id": 5678
    },
    {
      "color_name": "Azul",
      "measure": "20L",
      "price_list": 12000,
      "price_sale": 10000,
      "stock": 20,
      "aikon_id": 5679
    }
  ]
}
```

## Mantenimiento Futuro

Para prevenir que estas inconsistencias vuelvan a ocurrir:

1. ✅ Las APIs limpian automáticamente los campos cuando detectan variantes
2. ✅ El frontend limpia automáticamente los campos antes de enviar
3. ✅ La migración SQL corrigió los datos históricos

## Referencias

- Migración SQL: `supabase/migrations/20260116140602_clean_product_variant_inconsistencies.sql`
- Utilidades: `src/lib/validation/product-variant-utils.ts`
- API de actualización: `src/app/api/admin/products/[id]/route.ts`
- API de creación: `src/app/api/admin/products/route.ts`
- Formulario: `src/components/admin/products/ProductFormMinimal.tsx`
