# Recomendaciones: Limpiar Schemas de Validación

## Campos en Schemas que NO Existen en la DB

### 1. `short_description`
- **Estado:** Validado en `UpdateProductSchema` pero NO existe en tabla `products`
- **Ubicación:** `src/app/api/admin/products/[id]/route.ts:28`
- **Acción:** Remover del schema o agregar a la DB

### 2. `low_stock_threshold`
- **Estado:** Validado en `UpdateProductSchema` pero NO existe en tabla `products`
- **Ubicación:** `src/app/api/admin/products/[id]/route.ts:32`
- **Acción:** Remover del schema o agregar a la DB

### 3. `is_featured`
- **Estado:** Validado en `UpdateProductSchema` pero NO existe en tabla `products`
- **Ubicación:** `src/app/api/admin/products/[id]/route.ts:45`
- **Acción:** Remover del schema (ya verificado que no existe en DB)

---

## Archivos a Modificar

### `src/app/api/admin/products/[id]/route.ts`

**Remover del UpdateProductSchema:**
```typescript
const UpdateProductSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(255, 'Máximo 255 caracteres').optional(),
  description: z.string().optional(),
  // ❌ REMOVER: short_description: z.string().max(500, 'Máximo 500 caracteres').optional(),
  price: z.number().min(0, 'El precio debe ser mayor a 0').optional(),
  discounted_price: z.number().min(0).optional(),
  stock: z.number().min(0, 'El stock debe ser mayor o igual a 0').optional(),
  // ❌ REMOVER: low_stock_threshold: z.number().min(0).optional(),
  category_id: z.number().int().positive('ID de categoría inválido').optional(),
  brand: z.string().optional(),
  images: z.array(...).optional(),
  is_active: z.boolean().optional(),
  // ❌ REMOVER: is_featured: z.boolean().optional(),
  terminaciones: z.array(z.string()).optional(),
})
```

**Remover del SELECT en getProductById:**
```typescript
.select(`
  id,
  name,
  slug,
  description,
  // ❌ REMOVER: short_description,
  price,
  discounted_price,
  stock,
  // ❌ REMOVER: low_stock_threshold,
  category_id,
  brand,
  images,
  terminaciones,
  is_active,
  // ❌ REMOVER: is_featured,
  created_at,
  updated_at,
  ...
`)
```

---

### `src/app/api/admin/products/export/route.ts`

**Verificar si se usa `is_featured`:**
- Si solo es para export, mantener pero documentar que puede ser undefined
- Si se usa en otras partes, considerar agregar a DB o remover

---

### `src/app/api/admin/products/import/route.ts`

**Verificar si se importa `is_featured`:**
- Si se importa pero no se guarda en DB, remover del schema de importación
- O agregar a la DB si es necesario

---

## Impacto de Remover Estos Campos

### Riesgo: Bajo
- Estos campos están marcados como `.optional()`, así que no romperán validaciones
- Si el frontend los envía, simplemente se ignorarán
- No afectan la funcionalidad actual

### Beneficio: Alto
- Schemas más precisos y alineados con la DB real
- Evita confusión sobre qué campos existen
- Facilita mantenimiento futuro

---

## Decisión

**Recomendación:** Remover estos campos de los schemas de validación ya que:
1. No existen en la DB
2. Están marcados como opcionales (no rompen nada)
3. No se usan en el código actual
4. Mantenerlos puede causar confusión

**Excepción:** Si se planea agregar estos campos a la DB en el futuro, mantenerlos pero documentar que aún no existen.
