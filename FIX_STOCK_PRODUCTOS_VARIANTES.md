# ✅ Fix: Stock "Sin stock" para Productos con Variantes

**Fecha:** 2 de Noviembre, 2025  
**Problema:** Productos mostraban "Sin stock" a pesar de tener stock en variantes  
**Estado:** ✅ RESUELTO

---

## 🔍 Problema Identificado

### Ejemplo: Plavipint Fibrado
**En la UI:** "Sin stock" ❌

**En la base de datos:**
```
products.stock = 0          ❌ (campo legacy vacío)
variants[0].stock = 15      ✅ (stock real)
```

**Causa:** El componente usaba `product.stock` (0) en lugar de `variant.stock` (15)

---

## 🛠️ Soluciones Implementadas

### 1. ✅ Modificado calculateProductFeatures para priorizar stock de variante

**Archivo:** `src/lib/adapters/productAdapter.ts` (líneas 153-155)

**ANTES:**
```typescript
// Stock disponible
const stock = product.stock || 0
```

**DESPUÉS:**
```typescript
// Stock disponible - priorizar stock de variante por defecto
const defaultVariant = (product as any).default_variant || (product as any).variants?.[0]
const stock = defaultVariant?.stock ?? product.stock ?? 0
```

**Lógica:**
1. ✅ Si hay variante por defecto → Usa `variant.stock`
2. ✅ Si no hay variante → Usa `product.stock`
3. ✅ Si ambos son null → Usa 0

---

### 2. ✅ Sincronizado stock legacy en tabla products

**Base de datos:** 14 productos actualizados

**SQL ejecutado:**
```sql
UPDATE products p
SET stock = (
  SELECT pv.stock 
  FROM product_variants pv 
  WHERE pv.product_id = p.id 
  AND pv.is_default = TRUE 
  LIMIT 1
)
WHERE stock = 0
AND EXISTS (
  SELECT 1 FROM product_variants 
  WHERE product_id = p.id AND is_default = TRUE
)
```

**Productos sincronizados:**
- Plavipint Fibrado: 0 → 15
- Plavicon Fibrado: 0 → 15
- Piscinas Solvente: 0 → 15
- Sellador Multi Uso: 0 → 25
- Removedor Gel Penta: 0 → 15
- Protector Ladrillos: 0 → 15
- Diluyente: 0 → 15
- Lija Rubi: 0 → 15
- Enduido: 0 → 15
- Fijador: 0 → 15
- Látex Impulso: 0 → 15
- Ladrillo Visto: 0 → 15
- Aguarrás: 0 → 15
- Thinner: 0 → 15

---

## 📊 Flujo Corregido

### ANTES:
```
1. API retorna product.stock = 0
2. calculateProductFeatures() usa product.stock = 0
3. SingleGridItem recibe stock = 0
4. UI muestra "Sin stock" ❌
```

### AHORA:
```
1. API retorna product con variants[0].stock = 15
2. calculateProductFeatures() prioriza variant.stock = 15
3. SingleGridItem recibe stock = 15
4. UI muestra "Agregar al carrito" ✅
```

---

## 🎯 Resultados Esperados

### En /products

| Producto | Antes | Ahora |
|----------|-------|-------|
| Plavipint Fibrado | "Sin stock" ❌ | "Agregar al carrito" ✅ |
| Plavicon Fibrado | "Sin stock" ❌ | "Agregar al carrito" ✅ |
| Sellador Multi Uso | "Sin stock" ❌ | "Agregar al carrito" ✅ |
| Todos los productos nuevos | "Sin stock" ❌ | Botón activo ✅ |

---

## 📝 Archivos Modificados

| Archivo | Cambio | Líneas |
|---------|--------|--------|
| `src/lib/adapters/productAdapter.ts` | Priorizar variant.stock | 153-155 |
| Base de datos `products` | 14 productos con stock sincronizado | - |

---

## 🔄 Próximos Pasos

1. **Reiniciar servidor:**
   ```bash
   Ctrl + C
   npm run dev
   ```

2. **Verificar en /products:**
   - ✅ Plavipint Fibrado: Debe decir "Agregar al carrito"
   - ✅ Plavicon Fibrado: Debe decir "Agregar al carrito"
   - ✅ Stock debe reflejar el de las variantes

---

## ✅ Estado

✅ **Código modificado**  
✅ **Base de datos sincronizada**  
✅ **Sin errores de linting**  
⏳ **Pendiente:** Reiniciar servidor

---

🎉 **¡Stock corregido! Los productos ahora muestran disponibilidad correcta.**

