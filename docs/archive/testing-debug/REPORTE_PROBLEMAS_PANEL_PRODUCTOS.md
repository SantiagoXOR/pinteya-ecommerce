# 🐛 REPORTE DE PROBLEMAS: PANEL DE PRODUCTOS ADMIN
## Diagnóstico con Playwright - 24 de Octubre, 2025

---

## 📋 RESUMEN EJECUTIVO

**Estado**: ❌ MÚLTIPLES PROBLEMAS CRÍTICOS  
**Screenshots**: 2 generados (inicial + stock-bajo)  
**Logs**: 46 capturados, 0 errores de JavaScript  

---

## ❌ PROBLEMAS IDENTIFICADOS

### 1. 🔄 RE-RENDERS EXCESIVOS (CRÍTICO)

**Síntoma**: ProductList se renderiza 6 VECES en la carga inicial:
```
Render 1: 0 productos, página 1 de 0
Render 2: 0 productos, página 1 de 0  
Render 3: 0 productos, página 1 de 0
Render 4: 0 productos, página 1 de 0
Render 5: 20 productos, página 1 de 4  ✅ DATOS LLEGAN
Render 6: 20 productos, página 1 de 4  ❌ RE-RENDER INNECESARIO
```

**Causa Probable**:
- React Query hace múltiples peticiones
- Hook `useProductsEnterprise` se ejecuta 4 veces antes de recibir datos
- Componente se re-renderiza al recibir stats, productos y categorías

**Impacto**:
- Performance degradada
- UX pobre (usuario ve "0 productos" por 2-3 segundos)
- Posible race condition entre renders

---

### 2. 📊 STATS CARDS NO SE MUESTRAN (CRÍTICO)

**Síntoma**: 
- Se encuentran 5 cards con `.border-t-4`
- Pero NO se pueden leer los números (text-3xl)
- Todos los stats retornan "NO ENCONTRADO"

**Evidencia del API**:
```javascript
Stats Response: {
  success: true, 
  stats: {
    total_products: 70,
    active_products: 70,
    low_stock_products: X,
    no_stock_products: Y
  }, 
  source: direct_queries
}
```

**Causa Probable**:
- Hook transforma correctamente: `statsData?.stats → camelCase`
- Pero el selector de Playwright NO encuentra el elemento `.text-3xl`
- Posible: El HTML renderiza pero con otra clase CSS

**Fix Sugerido**:
```typescript
// Verificar en ProductsPageClient.tsx línea ~140-180
// ¿Está usando la clase correcta para mostrar números?
<div className="text-3xl font-bold">{stats.totalProducts}</div>
```

---

### 3. 🔍 FILTROS NO FUNCIONAN (CRÍTICO)

**Síntoma**:
- Click en "Stock Bajo" → Sigue mostrando 20 productos (igual que "Todos")
- NO cambia la cantidad de productos
- NO muestra mensaje "No se encontraron datos"

**Evidencia de Logs**:
```
Productos en "Todos": 20
[Click en "Stock Bajo"]
Productos en "Stock Bajo": 20  ❌ DEBERÍA SER DIFERENTE
```

**Causa Probable**:
1. `onValueChange` del Tab SÍ se ejecuta (implementado en línea 240)
2. PERO el filtro `stock_status` NO llega al API o NO se aplica

**Verificar**:
- ¿El API `/admin/products` recibe `stock_status=low_stock`?
- ¿La query de Supabase aplica el filtro `.gt('stock', 0).lte('stock', 10)`?

---

### 4. 🖱️ BOTONES DE PAGINACIÓN NO SE ENCUENTRAN (MEDIO)

**Síntoma**:
```
Botones ">" encontrados: 0
```

**Causa Probable**:
- El selector `button:has-text(">")` de Playwright NO funciona
- Posible: Los botones usan un ícono SVG en lugar de texto ">"

**Fix Sugerido**:
```typescript
// Usar data-testid o aria-label
<Button data-testid="pagination-next" aria-label="Siguiente página">
  <ChevronRight />
</Button>
```

---

### 5. 📷 IMÁGENES FALTANTES (MEDIO)

**Síntoma**:
- 20 filas en tabla
- Solo 12 imágenes cargadas (8 faltantes)

**Causa Probable**:
- Algunos productos NO tienen `image_url`
- El mapeo `images[0] → image_url` falla para 8 productos

**Evidencia del Hook**:
```typescript
// useProductsEnterprise.ts línea ~70
image_url: Array.isArray(product.images) && product.images.length > 0 
  ? product.images[0] 
  : null,
```

**Fix Sugerido**:
- Mostrar imagen placeholder cuando `image_url` es null
- Verificar que TODOS los 70 productos tienen al menos 1 imagen en BD

---

### 6. 📄 PAGINACIÓN INCONSISTENTE (MEDIO)

**Síntoma**:
```
Log inicial: Página 1 de 4
Footer: Página 1 de 3  ❌ DIFERENCIA
```

**Causa Probable**:
- `totalPages` se calcula diferente en el hook vs el componente
- Posible: `Math.ceil(70 / 25) = 3` en vez de 4

---

## ✅ FUNCIONANDO CORRECTAMENTE

1. ✅ **API responde correctamente**: 20 productos, total 70
2. ✅ **Footer muestra datos reales**: "Mostrando 20 de 70 productos"
3. ✅ **Productos cargan**: IDs 93, 94, 92, 91, 89, 88...
4. ✅ **Sin errores de JavaScript**: 0 errores en consola
5. ✅ **Stats API funciona**: Retorna datos correctos

---

## 🎯 PRIORIDADES DE FIX

### P0 - CRÍTICO (Bloquea funcionalidad)
1. **Filtros no funcionan** → Usuarios no pueden filtrar por stock
2. **Stats no se muestran** → No hay visibilidad del inventario
3. **Re-renders excesivos** → Performance y UX pobres

### P1 - ALTO (Mejora UX)
4. **Paginación no funciona** → Usuarios solo ven primeros 20 productos
5. **Imágenes faltantes** → 40% de productos sin foto

### P2 - MEDIO (Pulido)
6. **Paginación inconsistente** → Confusión en navegación

---

## 🔍 PRÓXIMOS PASOS

### Paso 1: Fix Stats Cards
```typescript
// ProductsPageClient.tsx - Verificar que stats se pasan correctamente
console.log('🔍 Stats recibidos:', stats)

// Verificar que el componente usa la clase correcta
<div className="text-3xl font-bold text-gray-900">
  {stats?.totalProducts || 0}
</div>
```

### Paso 2: Fix Filtros
```typescript
// src/app/api/admin/products/route.ts
// Agregar log ANTES del .range()
console.log('🔍 Query ANTES de range:', {
  stock_status: searchParams.get('stock_status'),
  filtersApplied: !!stockStatus
})
```

### Paso 3: Optimizar Re-renders
```typescript
// useProductsEnterprise.ts
// Usar enabled: false hasta que filtersRef esté listo
const { data } = useQuery({
  queryKey: ['admin-products', filters],
  queryFn: fetchProducts,
  enabled: filters.page > 0, // Solo fetch cuando filters está listo
  staleTime: 0,
})
```

---

## 📸 SCREENSHOTS GENERADOS

1. ✅ `panel-productos-inicial.png` - Estado inicial con 20 productos
2. ✅ `panel-productos-stock-bajo.png` - Después de click en filtro

---

## 📊 MÉTRICAS

- **API Response Time**: ~500ms ✅
- **Products Loaded**: 20/70 (primera página) ✅
- **Images Loaded**: 12/20 (60%) ⚠️
- **Renders**: 6 (debería ser 1-2) ❌
- **Filtros Working**: 0/2 ❌
- **Stats Working**: 0/4 ❌

---

**Fecha**: 24 de Octubre, 2025  
**Herramienta**: Playwright Diagnostic Script  
**Logs Completos**: Ver `PLAYWRIGHT_DIAGNOSTICO_PANEL_PRODUCTOS.md`

---

## 🚀 RECOMENDACIÓN INMEDIATA

**Enfocarse en los 3 problemas P0**:

1. **Stats Cards**: Verificar HTML renderizado y clases CSS
2. **Filtros**: Confirmar que API recibe y aplica `stock_status`
3. **Re-renders**: Agregar `enabled` flag en useQuery para evitar fetches innecesarios

Una vez resueltos estos 3, el panel será funcionalmente completo.


