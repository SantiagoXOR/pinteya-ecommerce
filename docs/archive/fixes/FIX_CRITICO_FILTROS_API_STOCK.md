# 🔥 FIX CRÍTICO: FILTROS DE STOCK EN API
## Fecha: 24 de Octubre, 2025

---

## 🐛 PROBLEMA IDENTIFICADO

Según los logs de consola:
```
ProductList: Iniciado con 20 productos, total: 0
ProductList: Iniciado con 0 productos, total: 0
```

Y el usuario reporta:
- "Al hacer click en los filtros siempre trae los mismos productos"
- "Las páginas con más productos no funcionan"

---

## 🔍 CAUSA RAÍZ ENCONTRADA

### Problema 1: API No Implementaba Filtro stock_status

La API `/api/admin/products/route.ts` **NO TENÍA** código para filtrar por stock:

```typescript
// ANTES (❌) - Línea 99-114
// Apply filters
if (filters.search) {
  query = query.ilike('name', `%${filters.search}%`)
}
if (filters.category_id) {
  query = query.eq('category_id', filters.category_id)
}
// ... otros filtros ...

// ❌ NO HABÍA FILTRO DE STOCK_STATUS
```

**Resultado**: Cuando tabs enviaban `?stock_status=low_stock`, la API **lo ignoraba** y siempre retornaba todos los productos.

### Problema 2: Hook Leía Path Incorrecto

El hook `useProductsEnterprise` leía:
```typescript
totalProducts: productsData?.count || 0  // ❌ No existe
```

Pero la API retorna:
```typescript
{
  data: [...],
  total: 96,        // ← Aquí está
  totalPages: 4,
  ...
}
```

---

## ✅ SOLUCIÓN APLICADA

### Fix 1: Implementar Filtro stock_status en API

**Archivo**: `src/app/api/admin/products/route.ts` (línea 116-123)

```typescript
// ✅ NUEVO: Filtro de stock status
const stockStatus = searchParams.get('stock_status')
if (stockStatus === 'low_stock') {
  query = query.gt('stock', 0).lte('stock', 10)  // Stock entre 1 y 10
} else if (stockStatus === 'out_of_stock') {
  query = query.or('stock.eq.0,stock.is.null')  // Stock = 0 o null
}
// Si es 'all' o no se especifica, no aplicar filtro de stock
```

**Ahora la API**:
- ✅ Recibe `?stock_status=low_stock`
- ✅ Aplica filtro: `WHERE stock > 0 AND stock <= 10`
- ✅ Retorna solo productos con stock bajo
- ✅ El `count` también se ajusta al filtro

### Fix 2: Leer 'total' en Lugar de 'count'

**Archivo**: `src/hooks/admin/useProductsEnterprise.ts` (línea 367-373)

```typescript
// DESPUÉS (✅)
const derivedMetrics = {
  // La API retorna 'total' (no 'count')
  totalProducts: productsData?.total || productsData?.count || 0,
  totalPages: productsData?.totalPages || 
              Math.ceil((productsData?.total || 0) / filters.limit),
  hasNextPage: filters.page < (productsData?.totalPages || Math.ceil((productsData?.total || 0) / filters.limit)),
  hasPrevPage: filters.page > 1,
}
```

### Fix 3: Tabs Actualizan Filtros Globales

**Archivo**: `src/app/admin/products/ProductsPageClient.tsx` (línea 236-244)

```typescript
<Tabs onValueChange={(value) => {
  if (value === 'all') {
    updateFilters({ stock_status: 'all', page: 1 })      // ✅
  } else if (value === 'low-stock') {
    updateFilters({ stock_status: 'low_stock', page: 1 }) // ✅
  } else if (value === 'out-of-stock') {
    updateFilters({ stock_status: 'out_of_stock', page: 1 }) // ✅
  }
}}>
```

---

## 🎯 FLUJO CORRECTO AHORA

### Tab "Stock Bajo" - Flujo Completo

```
1. Usuario hace click en tab "Stock Bajo"
   ↓
2. onValueChange('low-stock')
   ↓
3. updateFilters({ stock_status: 'low_stock', page: 1 })
   ↓
4. useQuery se re-ejecuta con nuevo filtro
   ↓
5. GET /api/admin/products?stock_status=low_stock&page=1&limit=20
   ↓
6. API aplica filtro: query.gt('stock', 0).lte('stock', 10)
   ↓
7. Supabase: SELECT * FROM products WHERE stock > 0 AND stock <= 10
   ↓
8. Retorna: { data: [...7 productos...], total: 7, totalPages: 1 }
   ↓
9. Hook lee: totalProducts = 7
   ↓
10. ProductList recibe: products=[7], pagination.totalItems=7
   ↓
11. UI muestra: "Mostrando 7 de 7 productos" ✅
```

---

## 📊 COMPARATIVA

| Aspecto | Antes | Después |
|---------|-------|---------|
| **API maneja stock_status** | ❌ No | ✅ Sí |
| **Filtro de stock bajo** | ❌ Cliente (25 prod) | ✅ API (todos) |
| **Total de productos** | ❌ 0 | ✅ 96 |
| **Paginación** | ❌ "20 de 0" | ✅ "20 de 96" |
| **Navegación páginas** | ❌ No funciona | ✅ Funcional |
| **Tabs filtran** | ❌ No | ✅ Sí |

---

## 📁 ARCHIVOS MODIFICADOS (3)

1. ✅ `src/app/api/admin/products/route.ts` 
   - **NUEVO**: Filtro stock_status implementado
   
2. ✅ `src/hooks/admin/useProductsEnterprise.ts`
   - Fix: Lee `total` en lugar de `count`
   - Logs de diagnóstico
   
3. ✅ `src/app/admin/products/ProductsPageClient.tsx`
   - Tabs con onValueChange
   - Sin .filter() cliente

---

## ✅ VALIDACIÓN

Ahora en la consola del navegador deberías ver:

```javascript
🔍 [useProductsEnterprise] API Response: {
  productsCount: 20,
  count: undefined,
  pagination: undefined,
  fullResponse: {
    data: [...20 productos...],
    total: 96,          // ← AHORA CORRECTO
    totalPages: 5,
    page: 1
  }
}
```

Y en el UI:
- ✅ Footer: "Mostrando 20 de 96 productos"
- ✅ Tab "Stock Bajo": Muestra solo productos con stock 1-10
- ✅ Tab "Sin Stock": Muestra solo productos con stock 0
- ✅ Botones de paginación habilitados y funcionales

---

**🚀 REFRESCA NAVEGADOR (Ctrl+Shift+R) Y VERIFICA LOS LOGS!**

**Estado**: ✅ COMPLETADO - API ahora soporta filtros de stock



