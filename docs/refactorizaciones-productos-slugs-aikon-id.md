# Refactorizaciones: Slugs y Aikon ID de Productos

> Documentación consolidada de las refactorizaciones realizadas en el sistema de productos

**Última actualización**: 2025-01-29  
**Estado**: ✅ Completado

---

## 📋 Tabla de Contenidos

1. [Corrección de Slugs con Timestamps](#corrección-de-slugs-con-timestamps)
2. [Refactorización de Aikon ID](#refactorización-de-aikon-id)
3. [Archivos Relacionados](#archivos-relacionados)
4. [Verificación y Testing](#verificación-y-testing)

---

## 🔗 Corrección de Slugs con Timestamps

### Problema Identificado

Los productos tenían slugs con timestamps al final (ej: `sellador-silicona-nuetra-s-500-1768256189784`), lo que causaba:

- URLs incorrectas en el panel admin ("Información SEO")
- El botón "Ver en Tienda" llevaba a URLs que no funcionaban
- El searchbar encontraba productos porque busca por nombre, no por slug exacto
- La ruta `/products/[slug]` no encontraba productos con slugs con timestamp

### Solución Implementada

#### 1. Módulo de Utilidades (`src/lib/products/slug-utils.ts`)

Funciones creadas:

- `hasTimestampSuffix(slug: string)`: Detecta si un slug tiene sufijo de timestamp (13 dígitos)
- `cleanSlug(slug: string)`: Elimina sufijo de timestamp si existe
- `generateCleanSlug(name: string)`: Genera slug limpio sin timestamp
- `normalizeSlug(slug, productName)`: Normaliza slug limpiando timestamp o generando uno nuevo

#### 2. Migración SQL (`supabase/migrations/20250129_fix_product_slugs_with_timestamps.sql`)

La migración:

- Identifica slugs con patrón `-{13 dígitos}` al final
- Genera slug limpio basado en el nombre del producto
- Verifica unicidad y agrega sufijo numérico (`-1`, `-2`, etc.) si es necesario
- Actualiza todos los slugs problemáticos

**Resultado**: ✅ Todos los slugs con timestamps fueron corregidos (0 productos con timestamps restantes)

#### 3. Corrección en Generación de Slugs

**Archivo**: `src/app/api/admin/products/[id]/route.ts`

- `generateUniqueSlug()` ya no usa timestamp como fallback
- Limpia slugs con timestamp al actualizar productos
- Lanza error si no se puede generar slug único (en lugar de usar timestamp)

**Archivo**: `src/app/api/admin/products/route.ts`

- `postHandlerSimple()` usa `generateUniqueSlug()` sin timestamps
- Genera slugs únicos verificando existencia en BD

#### 4. Actualización de UI

**Archivo**: `src/app/admin/products/[id]/page.tsx`

- `handleViewPublic()` usa `cleanSlug()` para eliminar timestamps
- Visualización de slug muestra slug limpio
- Muestra advertencia si el slug tiene timestamp

### Estado Final

- ✅ Todos los slugs están limpios (sin timestamps)
- ✅ Las URLs públicas funcionan correctamente
- ✅ El botón "Ver en Tienda" usa slugs limpios
- ✅ No se generarán nuevos slugs con timestamps

---

## 🔢 Refactorización de Aikon ID

### Problema Identificado

1. **`aikon_id` era NULL en muchos productos**: La columna `aikon_id` en `products` era nullable, pero debería ser obligatoria para productos sin variantes
2. **Tipo de dato incorrecto**: `aikon_id` era `VARCHAR` cuando debería ser `INTEGER` (6 dígitos: 0-999999)
3. **Visualización incompleta**: La lista de productos solo mostraba un `aikon_id` (el de la variante predeterminada), no todos los códigos de las variantes
4. **Falta de consistencia**: No había una regla clara sobre cuándo usar `products.aikon_id` vs `product_variants.aikon_id`

### Solución Implementada

#### 1. Migración de Base de Datos

**Archivo**: `supabase/migrations/20250129_convert_aikon_id_to_integer.sql`

**Cambios principales**:

- Convertir `aikon_id` de `VARCHAR` a `INTEGER`
- Agregar constraint para validar que sea de 6 dígitos (0-999999)
- Limpiar valores existentes (eliminar caracteres no numéricos)
- Hacer `NOT NULL` en `product_variants.aikon_id`
- Mantener `NULL` en `products.aikon_id` para productos con variantes

**Lógica de negocio**:

- **Productos SIN variantes**: Deben tener `aikon_id` en `products.aikon_id` (NOT NULL)
- **Productos CON variantes**: Tienen `aikon_id = NULL` en `products.aikon_id` (los códigos están en las variantes)

#### 2. Módulo de Utilidades (`src/lib/products/aikon-id-utils.ts`)

Funciones creadas:

- `formatAikonId(aikonId: number)`: Formatea número a string de 6 dígitos con ceros a la izquierda (ej: 141 → "000141")
- `parseAikonId(aikonId: string | number)`: Parsea string o número a integer válido
- `validateAikonIdRange(aikonId: number)`: Valida que el número esté en el rango 0-999999
- `getProductAikonId(product, variants)`: Obtiene el aikon_id correcto según si tiene variantes
- `getAllVariantAikonIds(variants)`: Obtiene todos los aikon_id de las variantes
- `getProductAikonIdFormatted()`: Retorna aikon_id formateado
- `getAllVariantAikonIdsFormatted()`: Retorna todos los aikon_id formateados

#### 3. Servicio de Productos (`src/lib/services/product-service.ts`)

Centraliza lógica de:

- Obtención de productos con sus variantes
- Transformación de datos
- Validaciones de negocio
- Cálculos de stock, precios, etc.

#### 4. Actualización de APIs

**Archivo**: `src/app/api/admin/products/route.ts`

- Recolecta **todos los aikon_id** de las variantes en `variantAikonIdsByProduct`
- Retorna arrays: `variant_aikon_ids` (number[]) y `variant_aikon_ids_formatted` (string[])
- Retorna también: `aikon_id`, `aikon_id_formatted`, `has_variants`

**Archivo**: `src/app/api/admin/products/[id]/route.ts`

- Agrega `aikon_id` al `.select()` en GET
- Maneja `aikon_id` en PUT (parsing y validación)

#### 5. Actualización de UI

**Archivo**: `src/components/admin/products/ProductList.tsx`

- Muestra **todos los códigos** de las variantes como badges cuando `has_variants = true`
- Muestra el código del producto cuando no tiene variantes

**Archivo**: `src/components/admin/products/ProductFormMinimal.tsx`

- Validación: `aikon_id` requerido si no hay variantes
- Validación: rango 0-999999
- Tipo de input: `number` con `min={0}` y `max={999999}`
- Preview: muestra formato de 6 dígitos

### Estado Final

#### Tabla `products`
- **Total**: 180 productos
- **Con aikon_id (sin variantes)**: 50 productos ✅
- **Sin aikon_id (con variantes)**: 130 productos ✅
- **Sin variantes y sin aikon_id**: 0 productos ✅

#### Tabla `product_variants`
- **Total**: 646 variantes
- **Con aikon_id**: 646 (100%) ✅
- **Tipo de dato**: `INTEGER` ✅
- **Rango válido**: 0-999999 ✅

#### Constraints Aplicados

- `check_aikon_id_range`: Valida rango 0-999999 en `products`
- `check_variant_aikon_id_range`: Valida rango 0-999999 en `product_variants`
- `product_variants.aikon_id`: NOT NULL ✅

---

## 📁 Archivos Relacionados

### Nuevos Archivos Creados

1. `src/lib/products/slug-utils.ts` - Utilidades para manejo de slugs
2. `src/lib/products/aikon-id-utils.ts` - Utilidades para manejo de aikon_id
3. `src/lib/services/product-service.ts` - Servicio centralizado de productos
4. `supabase/migrations/20250129_fix_product_slugs_with_timestamps.sql` - Migración de slugs
5. `supabase/migrations/20250129_convert_aikon_id_to_integer.sql` - Migración de aikon_id

### Archivos Modificados

1. `src/app/api/admin/products/route.ts` - API de lista de productos
2. `src/app/api/admin/products/[id]/route.ts` - API de detalle de producto
3. `src/components/admin/products/ProductList.tsx` - Lista de productos
4. `src/components/admin/products/ProductFormMinimal.tsx` - Formulario de productos
5. `src/app/admin/products/[id]/page.tsx` - Página de detalle de producto

---

## ✅ Verificación y Testing

### Slugs con Timestamps

- ✅ Verificado: 0 productos con slugs con timestamps restantes
- ✅ Verificado: Botón "Ver en Tienda" funciona correctamente
- ✅ Verificado: URLs públicas funcionan con slugs limpios
- ✅ Verificado: No se generan nuevos slugs con timestamps

### Aikon ID

- ✅ Verificado: Todos los productos tienen aikon_id o variantes
- ✅ Verificado: No hay productos sin variantes y sin aikon_id
- ✅ Verificado: Todas las variantes tienen aikon_id (NOT NULL)
- ✅ Verificado: Todos los valores están en el rango 0-999999
- ✅ Verificado: Formateo funciona correctamente en la UI
- ✅ Verificado: Lista de productos muestra todos los códigos de variantes

---

## 📝 Notas Importantes

### Slugs

- Los slugs se almacenan sin timestamps en la base de datos
- Si un slug limpio ya existía, se agregó un sufijo numérico (`-1`, `-2`, etc.)
- La función `generateUniqueSlug()` verifica unicidad antes de generar slugs

### Aikon ID

- Los valores se almacenan como `INTEGER` (sin ceros a la izquierda)
- Los ceros a la izquierda se agregan en la aplicación usando `formatAikonId()`
- Ejemplo: `4610` en BD → `"004610"` en UI (6 dígitos)
- Productos con variantes tienen `aikon_id = NULL` para evitar confusión

---

## 🔄 Próximos Pasos (Opcional)

1. **Testing**: Agregar tests unitarios para las funciones de utilidades
2. **Documentación API**: Actualizar documentación de APIs con nuevos campos
3. **Monitoreo**: Agregar alertas si se detectan slugs con timestamps en el futuro
4. **Optimización**: Considerar índices adicionales si es necesario

---

## 📚 Referencias

- Migración de slugs: `supabase/migrations/20250129_fix_product_slugs_with_timestamps.sql`
- Migración de aikon_id: `supabase/migrations/20250129_convert_aikon_id_to_integer.sql`
- Utilidades de slugs: `src/lib/products/slug-utils.ts`
- Utilidades de aikon_id: `src/lib/products/aikon-id-utils.ts`
- Servicio de productos: `src/lib/services/product-service.ts`
