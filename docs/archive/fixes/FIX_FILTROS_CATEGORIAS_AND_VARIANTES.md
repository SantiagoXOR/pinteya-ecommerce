# ✅ FIX: Filtros de Categorías (AND → OR) y Error de Variantes

**Fecha:** 2 de Noviembre, 2025  
**Estado:** 🔧 **CORREGIDO**

---

## 🐛 Problema #1: Filtro de Categorías (AND en lugar de OR)

### Causa Raíz

Cuando se proveían tanto `categoryId` como `categoryIds`, se aplicaban filtros secuencialmente:

```typescript
// ❌ ANTES: Creaba condición AND
if (categoryId) {
  query = query.in('id', productIds1)  // Filtro 1
}

if (categoryIds.length > 0) {
  query = query.in('id', productIds2)  // Filtro 2 (AND con filtro 1)
}
```

**Resultado:** Solo retornaba productos en la **intersección** de ambos sets, no la **unión**.

---

### ✅ Solución Aplicada

**Archivo:** `src/app/api/products/route.ts`

```typescript
// ✅ AHORA: Combina en un solo filtro (OR)
const allCategoryIds = []

if (categoryId) {
  allCategoryIds.push(categoryId)
}

if (categoryIds.length > 0) {
  allCategoryIds.push(...categoryIds)
}

// Aplicar filtro combinado
if (allCategoryIds.length > 0) {
  const uniqueCategoryIds = [...new Set(allCategoryIds)]
  
  const { data: productIdsData } = await supabase
    .from('product_categories')
    .select('product_id')
    .in('category_id', uniqueCategoryIds)  // Un solo .in() con todas las categorías
  
  if (productIdsData && productIdsData.length > 0) {
    const productIds = [...new Set(productIdsData.map(pc => pc.product_id))]
    query = query.in('id', productIds)
  }
}
```

**Beneficios:**
- ✅ Un solo filtro combinado (OR lógico)
- ✅ Elimina duplicados automáticamente
- ✅ Retorna unión de productos, no intersección

---

## 🐛 Problema #2: Error "No se encontró variante"

### Causa Raíz

El modal mostraba error en consola cuando:
- Productos sin colores definidos (`color_name: null`)
- Intentaba buscar variante por color inexistente

```typescript
// ❌ ANTES: Siempre mostraba error si no encontraba variante
if (!variant) {
  console.error('❌ No se encontró variante para:', {})
}
```

---

### ✅ Solución Aplicada

**Archivo:** `src/components/ShopDetails/ShopDetailModal.tsx`

```typescript
// ✅ AHORA: Solo error si el producto realmente tiene variantes de color
if (!variant) {
  const hasColorVariants = variants.some(v => 
    v.color_name && v.color_name.trim() !== ''
  )
  
  if (hasColorVariants && colorToUse && selectedCapacity) {
    console.error('❌ No se encontró variante para:', {...})
  } else {
    console.log('ℹ️ Variante no encontrada - usando primera variante')
  }
}
```

**Beneficios:**
- ✅ No muestra error para productos sin colores
- ✅ Solo alerta cuando realmente falta una variante esperada
- ✅ Productos nuevos (sin color) funcionan sin warnings

---

## 📊 Casos de Uso Corregidos

### Caso 1: Filtro Múltiple de Categorías

**Antes:**
```
categoryId = "complementos" (ID 40)
categoryIds = ["paredes", "techos"] (IDs 38, 35)

Resultado: Productos con categoría 40 AND (38 OR 35)
          = Solo productos en las 3 categorías ❌
```

**Ahora:**
```
allCategoryIds = [40, 38, 35]

Resultado: Productos con categoría 40 OR 38 OR 35
          = Productos en CUALQUIERA de las categorías ✅
```

### Caso 2: Productos Sin Colores

**Antes:**
```
Producto: Lija Rubi (sin color)
Variantes: [{ measure: "N50", color_name: null }, ...]

Console: ❌ No se encontró variante para: {} ❌
```

**Ahora:**
```
Producto: Lija Rubi (sin color)
Variantes: [{ measure: "N50", color_name: null }, ...]

Console: ℹ️ Usando primera variante disponible ✅
```

---

## 🎯 Impacto

### Filtrado de Categorías:
- ✅ Filtros múltiples funcionan correctamente
- ✅ Retorna más productos (unión vs intersección)
- ✅ Lógica correcta de OR

### Errores de Consola:
- ✅ Menos ruido en consola
- ✅ Solo errores relevantes
- ✅ Productos sin colores funcionan correctamente

---

🎉 **Ambos issues corregidos - Filtrado correcto y consola limpia!**

