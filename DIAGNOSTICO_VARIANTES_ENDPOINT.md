# 🔍 Diagnóstico: Endpoint PUT Variantes

## Fecha: 30 de Octubre, 2025

---

## 🎯 PROBLEMA DETECTADO

**Síntoma**: Al actualizar el stock de una variante individual, el toast muestra éxito pero el stock NO se guarda en la BD.

**Evidencia**:
- ✅ Toast de éxito aparece: "Variante actualizada"
- ✅ `updated_at` cambia en la BD
- ❌ Campo `stock` NO se actualiza

**Test Realizado**:
- Variante 10L del producto #92
- Intenté cambiar stock de 30 → 35
- Resultado: Stock sigue en 30

---

## 📝 CÓDIGO REVISADO

### Endpoint: `src/app/api/products/[id]/variants/[variantId]/route.ts`

#### Flujo de Datos:

```typescript
1. Recibir body del frontend
   ↓
2. Filtrar campos permitidos (incluyendo stock)
   allowedFields = {
     stock: body.stock,  ← Se incluye
     ...
   }
   ↓
3. Remover undefined
   filteredBody = Object.fromEntries(...)
   ↓
4. Validar con schema
   UpdateVariantSchema.safeParse(filteredBody)
   ↓
5. Preparar updateData
   updateData = {
     ...validatedData,  ← Aquí debería incluir stock
     updated_at: ...
   }
   ↓
6. Supabase UPDATE
   .update(updateData)
   .eq('id', variantId)
```

### Schema de Validación:

```typescript
const UpdateVariantSchema = z.object({
  stock: z.number().int().min(0).optional(),  ← Correcto
  // ... otros campos
})
```

---

## 🔍 LOGGING AGREGADO

He agregado logging exhaustivo en 4 puntos clave:

### Log 1: Datos Recibidos
```typescript
console.log('📥 [PUT Variant] Datos recibidos:', {
  productId,
  variantId,
  body: JSON.stringify(body, null, 2),
  bodyKeys: Object.keys(body),
  stock: body.stock,
  stockType: typeof body.stock
})
```

### Log 2: Campos Filtrados
```typescript
console.log('📦 [PUT Variant] Campos filtrados:', {
  original: Object.keys(body).length,
  filtered: Object.keys(filteredBody).length,
  filteredBody
})
```

### Log 3: Validación Exitosa
```typescript
console.log('✅ [PUT Variant] Validación exitosa:', {
  productId,
  variantId,
  data: validatedData
})
```

### Log 4: updateData Final
```typescript
console.log('🔍 [PUT Variant] updateData antes de enviar a Supabase:', {
  updateData,
  hasStock: 'stock' in updateData,
  stockValue: updateData.stock,
  stockType: typeof updateData.stock,
  allKeys: Object.keys(updateData)
})
```

### Log 5: Resultado de Supabase
```typescript
console.log('✅ [PUT Variant] Variante actualizada exitosamente:', {
  id: variant.id,
  measure: variant.measure,
  stockAntes: body.stock,
  stockDespues: variant.stock,
  updated_at: variant.updated_at
})
```

---

## 🧪 PASOS PARA DIAGNOSTICAR

### 1. Reinicia el servidor
```bash
# Ctrl+C para detener
npm run dev
```

### 2. Abre el Terminal del Servidor
Mantén visible la ventana del terminal

### 3. Intenta Actualizar una Variante
- Ve a `/admin/products/92/edit`
- Baja hasta la tabla de variantes
- Click en editar (lápiz) de la variante 10L
- Cambia el stock de 30 a 35
- Click en "Guardar Variante"

### 4. Captura TODOS los Logs que Aparezcan
Busca en el terminal del servidor los logs que empiecen con:
- `📥 [PUT Variant] Datos recibidos:`
- `📦 [PUT Variant] Campos filtrados:`
- `✅ [PUT Variant] Validación exitosa:`
- `🔍 [PUT Variant] updateData antes de enviar:`
- `✅ [PUT Variant] Variante actualizada exitosamente:`
- `❌ [PUT Variant] Error...` (si hay error)

### 5. Copia Aquí Todos los Logs

---

## 🔎 QUÉ BUSCAR EN LOS LOGS

### Escenario A: Stock se pierde en el filtrado
```
📥 Datos recibidos: { stock: 35 }  ← Llega bien
📦 Campos filtrados: { stock: undefined }  ← Se pierde aquí ❌
```
**Solución**: Problema con el filtrado de `undefined`

### Escenario B: Stock se pierde en la validación
```
📦 Campos filtrados: { stock: 35 }  ← Llega bien
✅ Validación exitosa: { }  ← No incluye stock ❌
```
**Solución**: Problema con el schema de validación

### Escenario C: Stock no está en updateData
```
✅ Validación exitosa: { stock: 35 }  ← Llega bien
🔍 updateData: { updated_at: ... }  ← No incluye stock ❌
```
**Solución**: Problema al construir updateData

### Escenario D: Supabase no actualiza el stock
```
🔍 updateData: { stock: 35, updated_at: ... }  ← Llega bien
✅ Variante actualizada: { stockAntes: 35, stockDespues: 30 }  ← Supabase no lo guardó ❌
```
**Solución**: Problema con permisos o constraint de BD

---

## 🔧 POSIBLES CAUSAS Y SOLUCIONES

### Causa 1: Campo stock se envía como string
**Diagnóstico**: En Log 1, verás `stockType: 'string'` en lugar de `'number'`

**Solución**:
```typescript
// En ProductFormMinimal.tsx - Modal de variante
onChange={(e) => {
  setFormData({ 
    ...formData, 
    stock: parseInt(e.target.value) || 0  ← Ya está así, debería ser correcto
  })
}}
```

### Causa 2: filter() remueve el stock
**Diagnóstico**: En Log 2, `filteredBody` no incluye stock

**Solución**:
```typescript
// No filtrar si value es 0 (stock puede ser 0)
const filteredBody = Object.fromEntries(
  Object.entries(allowedFields).filter(([key, value]) => {
    if (key === 'stock') return value !== undefined;  // Incluir incluso si es 0
    return value !== undefined;
  })
)
```

### Causa 3: Schema opcional no incluye el campo
**Diagnóstico**: En Log 3, `validatedData` no incluye stock

**Solución**: Ya está marcado como `.optional()`, debería funcionar

### Causa 4: Spread no incluye el campo
**Diagnóstico**: En Log 4, `updateData` no incluye stock

**Solución**: Debuggear el spread operator

---

## ⚠️ NOTA IMPORTANTE

El `updated_at` SÍ se está actualizando, lo que confirma que:
- ✅ El endpoint se está ejecutando
- ✅ Supabase está recibiendo y procesando el UPDATE
- ✅ La autenticación está correcta
- ❌ PERO el stock específicamente no se está incluyendo o guardando

**Esto sugiere que el problema está en cómo se construye el `updateData`, NO en la conexión o permisos.**

---

## 🚀 SIGUIENTE PASO

**Por favor, intenta actualizar una variante de nuevo y copia TODOS los logs del terminal del servidor aquí**. Con esos logs podré identificar exactamente en qué punto se pierde el stock.

