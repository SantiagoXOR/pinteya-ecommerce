# ⚡ QUICK REFERENCE - SISTEMA DE VARIANTES

**Última actualización:** 27 Oct 2025, 22:45 hrs

---

## 🎯 EN 30 SEGUNDOS

**¿Qué cambió?**
- ✅ 70 productos → 63 productos (7 duplicados eliminados)
- ✅ Sistema de variantes completamente funcional
- ✅ Admin puede gestionar variantes
- ✅ Tienda muestra selector de variantes
- ✅ Carrito guarda variante específica

**¿Qué probar?**
1. http://localhost:3000/admin/products → Ver 63 productos
2. http://localhost:3000/admin/products/92/edit → Ver 4 variantes
3. http://localhost:3000/products/35 → Selector funcionando

---

## 🗄️ PRODUCTOS CONSOLIDADOS

| Producto | ID | Antes | Después | Variantes |
|----------|----|-------|---------|-----------|
| Látex Eco Painting | 92 | 4 productos | 1 producto | 4 var. (1L, 4L, 10L, 20L) |
| Pintura Piletas | 61 | 4 productos | 1 producto | 8 var. (4 medidas × 2 colores) |
| Sintético Converlux | 34 | 2 productos | 1 producto | 60 var. (2 medidas × 20 colores) |
| Impregnante Danzke | 35 | Sin cambios | 1 producto | 24 var. (2×6×2) |

**Productos eliminados:** 38, 62, 63, 64, 93, 94, 95

---

## 🔌 ENDPOINTS CLAVE

### Admin
```
GET  /api/admin/products          → Lista con variant_count
GET  /api/admin/products/[id]     → Producto + variantes[]
POST /api/admin/products/variants → Crear variante
PUT  /api/products/[id]/variants/[variantId] → Editar variante
DEL  /api/products/[id]/variants/[variantId] → Eliminar variante
```

### Tienda
```
GET /api/products/[id]           → Producto info
GET /api/products/[id]/variants  → Lista de variantes activas
```

### Carrito
```
GET  /api/cart                   → Items con product_variants
POST /api/cart                   → Body: { productId, variantId?, quantity }
```

---

## 💻 CÓDIGO ÚTIL

### Agregar al Carrito (JavaScript)

```javascript
// Con variante específica
await fetch('/api/cart', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    productId: 35,
    variantId: 41,  // Opcional
    quantity: 2
  })
})

// Sin variante (usa default automáticamente)
await fetch('/api/cart', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    productId: 92,
    quantity: 1
  })
})
```

---

### Obtener Variantes (React)

```typescript
const { data: variants } = useQuery({
  queryKey: ['product-variants', productId],
  queryFn: () => fetch(`/api/products/${productId}/variants`)
    .then(r => r.json())
    .then(d => d.data)
})

const defaultVariant = variants?.find(v => v.is_default) || variants?.[0]
```

---

### Crear Variante (Admin)

```typescript
const createVariant = useMutation({
  mutationFn: async (variant) => {
    const res = await fetch('/api/admin/products/variants', {
      method: 'POST',
      body: JSON.stringify({ ...variant, product_id: productId })
    })
    return res.json()
  },
  onSuccess: () => {
    queryClient.invalidateQueries(['product-variants', productId])
  }
})
```

---

## 🗃️ QUERIES SQL ÚTILES

### Ver Productos con Variantes

```sql
SELECT 
  p.id,
  p.name,
  COUNT(pv.id) as variant_count
FROM products p
LEFT JOIN product_variants pv ON pv.product_id = p.id AND pv.is_active = true
GROUP BY p.id, p.name
HAVING COUNT(pv.id) > 0
ORDER BY variant_count DESC;
```

---

### Ver Variantes de un Producto

```sql
SELECT 
  id,
  color_name,
  measure,
  finish,
  price_list,
  price_sale,
  stock,
  is_default,
  aikon_id
FROM product_variants
WHERE product_id = 35
  AND is_active = true
ORDER BY is_default DESC, measure, color_name;
```

---

### Ver Items del Carrito con Variantes

```sql
SELECT 
  ci.id,
  p.name as product_name,
  pv.color_name,
  pv.measure,
  pv.finish,
  pv.price_sale,
  ci.quantity,
  (pv.price_sale * ci.quantity) as subtotal
FROM cart_items ci
JOIN products p ON p.id = ci.product_id
LEFT JOIN product_variants pv ON pv.id = ci.variant_id
WHERE ci.user_id = 'YOUR_USER_ID'
ORDER BY ci.created_at DESC;
```

---

## 🎨 ESTRUCTURA DE DATOS

### ProductVariant (TypeScript)

```typescript
interface ProductVariant {
  id: number
  product_id: number
  aikon_id: string | null       // SKU
  variant_slug: string           // SEO slug
  color_name: string | null      // "CAOBA"
  color_hex: string | null       // "#8B4513"
  measure: string | null         // "1L", "4L"
  finish: string | null          // "Brillante", "Satinado"
  price_list: number            // Precio sin descuento
  price_sale: number | null     // Precio con descuento
  stock: number                 // Stock disponible
  is_active: boolean
  is_default: boolean
  image_url: string | null
  metadata: Record<string, any>
  created_at: string
  updated_at: string
}
```

---

### CartItem con Variante

```typescript
interface CartItem {
  id: string
  user_id: string
  product_id: number
  variant_id: number | null     // NUEVO
  quantity: number
  products: {
    id: number
    name: string
    price: number
    images: any
  }
  product_variants?: {          // NUEVO
    id: number
    aikon_id: string
    color_name: string
    measure: string
    price_sale: number
    stock: number
  }
}
```

---

## 🔧 TROUBLESHOOTING

### Error: "Stock insuficiente para esta variante"

**Causa:** `variant.stock < quantity`  
**Solución:** Verificar stock en BD o reducir cantidad

---

### Error: "Variante no encontrada"

**Causa:** `variantId` no existe o `is_active = false`  
**Solución:**
```sql
SELECT * FROM product_variants WHERE id = [variantId];
UPDATE product_variants SET is_active = true WHERE id = [variantId];
```

---

### Selector no muestra colores/acabados

**Causa:** Variantes no tienen `color_name` o `finish`  
**Solución:**
```sql
UPDATE product_variants 
SET color_name = 'BLANCO', finish = 'Brillante'
WHERE id = [variantId] AND color_name IS NULL;
```

---

### Precio no actualiza al cambiar variante

**Causa:** `selectedVariant` no está actualizado  
**Solución:** Verificar que `onSelect` está conectado:
```typescript
<VariantSelector 
  variants={variants}
  selected={selectedVariant}
  onSelect={setSelectedVariant}  // ← Importante
/>
```

---

## 📊 MÉTRICAS IMPORTANTES

| Métrica | Valor | Fuente |
|---------|-------|--------|
| Total productos | 63 | `SELECT COUNT(*) FROM products` |
| Total variantes | 96 | `SELECT COUNT(*) FROM product_variants` |
| Productos con variantes | 4 | Manual |
| Variantes activas | 96 | `WHERE is_active = true` |
| Variantes default | 4 | `WHERE is_default = true` |

---

## 🔗 ENLACES RÁPIDOS

**Admin:**
- Lista: http://localhost:3000/admin/products
- Editar: http://localhost:3000/admin/products/[ID]/edit

**Tienda:**
- Producto: http://localhost:3000/products/[ID]

**Testing:**
- Producto 35 (Impregnante): http://localhost:3000/products/35
- Producto 92 (Látex): http://localhost:3000/products/92
- Producto 61 (Piletas): http://localhost:3000/products/61
- Producto 34 (Sintético): http://localhost:3000/products/34

---

## 📞 SOPORTE

**Documentación completa:**
- `SISTEMA_VARIANTES_COMPLETADO_RESUMEN_FINAL.md` - Overview técnico
- `GUIA_TESTING_SISTEMA_VARIANTES.md` - Tests paso a paso
- `IMPLEMENTACION_TECNICA_VARIANTES.md` - Detalles técnicos

**Backups:**
- `backup-products-before-migration.json`
- `backup-product-variants-before-migration.txt`

**Migraciones SQL:**
- `supabase/migrations/20251027_*.sql`

---

## ✅ CHECKLIST EXPRESS

Antes de empezar, verifica:

- [ ] Servidor corriendo: `npm run dev`
- [ ] Navegador en: http://localhost:3000
- [ ] Cache limpio: `Ctrl + Shift + R`
- [ ] Consola abierta: `F12`

Prueba mínima:

1. [ ] Admin lista: 63 productos
2. [ ] Edit producto 92: 4 variantes
3. [ ] Tienda producto 35: selector funcional
4. [ ] Cambiar variante: precio actualiza

Si todo funciona → ✅ Sistema OK

---

**Última actualización:** 27 Oct 2025, 22:45 hrs

