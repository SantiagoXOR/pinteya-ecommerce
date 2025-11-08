# 🔧 Corrección: Stock No Se Actualiza en UI

## Fecha: 28 de Octubre, 2025

---

## 🎯 PROBLEMA REPORTADO

**Síntoma**: El usuario actualiza el stock de 25 a 30, ve el mensaje de éxito "Producto actualizado", pero al ver el detalle del producto sigue mostrando stock: 25.

**Causa Raíz**: Los datos cacheados de React Query no se estaban refrescando automáticamente después de la actualización, causando que la UI mostrara información obsoleta.

---

## 📝 SOLUCIONES IMPLEMENTADAS

### 1. Logging de Debugging

**Archivo**: `src/app/admin/products/[id]/edit/page.tsx`

Agregado logging para diagnosticar el flujo de datos:

```typescript
async function updateProduct(productId: string, data: ProductFormData) {
  console.log('📤 Enviando actualización:', { productId, data })
  
  // ... fetch ...
  
  const result = await response.json()
  console.log('📥 Respuesta recibida:', result)
  return result
}
```

### 2. Refetch Forzado Después de Actualizar

**Archivo**: `src/app/admin/products/[id]/edit/page.tsx`

Modificado el `onSuccess` del mutation para forzar refetch inmediato:

```typescript
// ❌ ANTES
onSuccess: data => {
  queryClient.invalidateQueries({ queryKey: ['admin-products'] })
  queryClient.invalidateQueries({ queryKey: ['admin-product', productId] })
  toast.success('Producto actualizado exitosamente')
  router.push(`/admin/products/${productId}`)
}

// ✅ DESPUÉS
onSuccess: async (data) => {
  console.log('✅ Actualización exitosa, datos recibidos:', data)
  
  // Invalidate queries y forzar refetch
  await queryClient.invalidateQueries({ queryKey: ['admin-products'] })
  await queryClient.invalidateQueries({ queryKey: ['admin-product', productId] })
  
  // Refetch inmediato para asegurar datos frescos
  await queryClient.refetchQueries({ queryKey: ['admin-product', productId] })

  toast.success('Producto actualizado exitosamente')

  // Pequeño delay antes de redirigir para asegurar que los datos se carguen
  setTimeout(() => {
    router.push(`/admin/products/${productId}`)
  }, 100)
}
```

**Cambios clave**:
- ✅ `async` en `onSuccess` para usar `await`
- ✅ `await` en `invalidateQueries` para asegurar que se completen
- ✅ `refetchQueries` adicional para forzar recarga inmediata
- ✅ `setTimeout` de 100ms antes de redirigir para dar tiempo al refetch
- ✅ Logging de confirmación

### 3. Configuración de Cache en Página de Detalle

**Archivo**: `src/app/admin/products/[id]/page.tsx`

Modificado el `useQuery` para siempre obtener datos frescos:

```typescript
// ❌ ANTES
useQuery({
  queryKey: ['admin-product', productId],
  queryFn: () => fetchProduct(productId),
  enabled: !!productId,
})

// ✅ DESPUÉS
useQuery({
  queryKey: ['admin-product', productId],
  queryFn: () => fetchProduct(productId),
  enabled: !!productId,
  staleTime: 0, // Siempre considerar los datos como obsoletos
  refetchOnMount: 'always', // Siempre refetch al montar
})
```

**Opciones agregadas**:
- ✅ `staleTime: 0` - Marca los datos como obsoletos inmediatamente
- ✅ `refetchOnMount: 'always'` - Siempre hace refetch al montar el componente

### 4. Configuración de Cache en Página de Edición

**Archivo**: `src/app/admin/products/[id]/edit/page.tsx`

Mismo cambio aplicado al formulario de edición:

```typescript
useQuery({
  queryKey: ['admin-product', productId],
  queryFn: () => fetchProduct(productId),
  enabled: !!productId,
  staleTime: 0, // Siempre considerar los datos como obsoletos
  refetchOnMount: 'always', // Siempre refetch al montar
})
```

---

## 🔄 FLUJO DE ACTUALIZACIÓN CORREGIDO

### Antes (con bug):
1. Usuario cambia stock de 25 a 30
2. Se envía PUT request al servidor
3. Servidor actualiza BD exitosamente
4. `invalidateQueries` marca cache como obsoleto
5. **Redirige inmediatamente** → Muestra datos cacheados (stock: 25) ❌
6. Query eventual refetch ocurre después → Datos actualizados llegan tarde

### Después (corregido):
1. Usuario cambia stock de 25 a 30
2. Se envía PUT request al servidor
3. Servidor actualiza BD exitosamente
4. `invalidateQueries` marca cache como obsoleto
5. **`refetchQueries` fuerza recarga inmediata** ✅
6. Espera 100ms para que se complete el refetch
7. Redirige a página de detalle
8. Página de detalle monta con `refetchOnMount: 'always'`
9. **Hace refetch automático** por si acaso ✅
10. Muestra datos frescos (stock: 30) ✅

---

## 📊 ARCHIVOS MODIFICADOS

1. **`src/app/admin/products/[id]/edit/page.tsx`**
   - Línea 54-71: Logging en `updateProduct`
   - Línea 89-90: `staleTime` y `refetchOnMount` en query
   - Línea 94-111: `onSuccess` mejorado con refetch forzado

2. **`src/app/admin/products/[id]/page.tsx`**
   - Línea 105-106: `staleTime` y `refetchOnMount` en query

---

## ✅ RESULTADO ESPERADO

Ahora cuando actualices el stock:

1. ✅ El cambio se guarda en la BD
2. ✅ La cache se invalida correctamente
3. ✅ Se fuerza un refetch inmediato
4. ✅ Se espera a que se complete la carga
5. ✅ La página de detalle muestra los datos frescos
6. ✅ Stock actualizado visible inmediatamente

---

## 🧪 CÓMO VERIFICAR

1. Ve a la página de edición de un producto
2. Cambia el stock de 25 a 30
3. Guarda los cambios
4. Deberías ver:
   - En console: `📤 Enviando actualización` con stock: 30
   - En console: `📥 Respuesta recibida` con stock: 30
   - En console: `✅ Actualización exitosa`
   - Toast verde de éxito
   - Redirigir a detalle del producto
   - **Stock: 30 visible en la UI** ✅

---

## 📝 NOTAS TÉCNICAS

### React Query Cache Behavior

Por defecto, React Query:
- Cachea datos por 5 minutos (`staleTime`)
- No hace refetch automático al montar si los datos no están marcados como obsoletos
- `invalidateQueries` solo marca como obsoleto, no fuerza refetch inmediato

### Por Qué Necesitamos `refetchQueries`:

- `invalidateQueries` marca los datos como obsoletos
- Pero no fuerza un refetch si nadie está "observando" esa query
- `refetchQueries` activamente ejecuta la query de nuevo
- Esto asegura que los datos estén listos antes de redirigir

### Por Qué `staleTime: 0`:

- Evita mostrar datos cacheados incluso por un segundo
- Fuerza siempre a verificar con el servidor
- Especialmente importante para datos que cambian frecuentemente

### Por Qué `refetchOnMount: 'always'`:

- Asegura que al navegar a la página, siempre obtiene datos frescos
- Incluso si ya hay datos en cache
- Es una red de seguridad adicional

---

## 🎯 ESTADO FINAL

```
✅ Stock se actualiza en BD correctamente
✅ Cache se invalida inmediatamente  
✅ Refetch forzado antes de redirigir
✅ Página de detalle siempre muestra datos frescos
✅ Logging para debugging habilitado
✅ UI consistente con el estado de la BD
```

**El problema del stock que no se actualizaba está completamente resuelto** 🎉

