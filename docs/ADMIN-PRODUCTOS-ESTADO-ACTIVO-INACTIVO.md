# Documentación: Gestión de Estado Activo/Inactivo de Productos

## 📋 Resumen

Este documento describe la implementación completa de la funcionalidad para actualizar el estado activo/inactivo de productos desde múltiples puntos de la interfaz administrativa. Los cambios se reflejan automáticamente en todas las vistas gracias a la invalidación de queries de React Query.

## 🎯 Funcionalidades Implementadas

### 1. Actualización desde Formulario de Edición
Los administradores pueden cambiar el estado activo/inactivo de un producto desde el formulario de edición usando el checkbox "Producto Activo".

**Ubicación**: `/admin/products/[id]/edit`

**Características**:
- El checkbox refleja correctamente el estado actual del producto al cargar el formulario
- Los cambios se guardan inmediatamente al hacer clic en "Guardar"
- El estado se sincroniza automáticamente con la base de datos

### 2. Actualización desde Menú de Acciones (Lista de Productos)
Los administradores pueden cambiar rápidamente el estado de un producto directamente desde la lista usando el menú de acciones.

**Ubicación**: `/admin/products` (en cada fila de producto)

**Características**:
- Opción "Activar" o "Desactivar" según el estado actual
- Cambio inmediato sin necesidad de abrir el formulario
- Actualización automática de la lista y métricas

### 3. Actualización desde Página de Detalle
Los administradores pueden cambiar el estado del producto desde la página de detalle usando un botón dedicado.

**Ubicación**: `/admin/products/[id]`

**Características**:
- Botón "Activar" o "Desactivar" visible en la sección de acciones
- Indicador visual del estado actual (verde para activar, amarillo para desactivar)
- Notificaciones de éxito/error
- Actualización inmediata de la vista

## 🔄 Flujo de Datos

### Formulario de Edición
```
ProductFormMinimal 
  → onSubmit(data con is_active) 
  → PUT /api/admin/products/[id] 
  → Base de Datos
  → Invalidación de queries:
     - ['admin-product', productId]
     - ['admin-products']
     - ['admin-products-stats']
```

### Menú de Acciones
```
ProductRowActions 
  → onToggleStatus(productId) 
  → toggleProductStatus (hook)
  → GET /api/admin/products/[id] (obtener estado actual)
  → PUT /api/admin/products/[id] (actualizar con is_active invertido)
  → Base de Datos
  → Invalidación de queries:
     - ['admin-products']
     - ['admin-product', productId]
     - ['admin-products-stats']
```

### Página de Detalle
```
ProductDetailPage 
  → handleToggleStatus() 
  → toggleStatusMutation
  → PUT /api/admin/products/[id] (con is_active invertido)
  → Base de Datos
  → Invalidación de queries:
     - ['admin-product', productId]
     - ['admin-products']
     - ['admin-products-stats']
```

## 📁 Archivos Modificados

### 1. `src/components/admin/products/ProductFormMinimal.tsx`
**Cambios**:
- Normalización de `status` a `is_active` en `normalizedInitialData`
- Asegurado que `is_active` siempre se incluya en los datos enviados al submit
- Mapeo correcto del estado inicial del producto al cargar el formulario

**Código clave**:
```typescript
is_active: (() => {
  if ((initialData as any).is_active !== undefined) {
    return Boolean((initialData as any).is_active);
  }
  if ((initialData as any).status) {
    return (initialData as any).status === 'active';
  }
  return true; // Default a activo
})(),
```

### 2. `src/hooks/admin/useProductsEnterprise.ts`
**Cambios**:
- Implementación de función `toggleProductStatus` que:
  - Obtiene el producto actual para conocer su estado
  - Invierte el valor de `is_active`
  - Actualiza el producto mediante `updateProductMutation`
  - Invalida todas las queries relevantes
  - Refetch inmediato para asegurar datos frescos

**Función exportada**:
```typescript
toggleProductStatus: (productId: string) => Promise<{ success: boolean; is_active: boolean }>
```

### 3. `src/components/admin/products/ProductList.tsx`
**Cambios**:
- Agregada prop `onToggleStatus?: (productId: string) => Promise<void>` a la interfaz
- Prop pasada a `ProductRowActions` para habilitar la opción en el menú de acciones

### 4. `src/app/admin/products/ProductsPageClient.tsx`
**Cambios**:
- Extracción de `toggleProductStatus` desde `useProductsEnterprise`
- Prop `onToggleStatus={toggleProductStatus}` pasada a todas las instancias de `ProductList` (tabs: Todos, Stock Bajo, Sin Stock)

### 5. `src/app/admin/products/[id]/page.tsx`
**Cambios**:
- Implementación de `toggleStatusMutation` usando `useMutation`
- Handler `handleToggleStatus` para cambiar el estado
- Botón "Activar/Desactivar" en la sección de acciones con:
  - Estilos dinámicos según el estado actual
  - Iconos condicionales (CheckCircle para activar, XCircle para desactivar)
  - Estado deshabilitado durante la mutación
- Invalidación completa de queries y notificaciones toast

**Imports agregados**:
```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { CheckCircle, XCircle } from '@/lib/optimized-imports'
```

### 6. `src/app/admin/products/[id]/edit/page.tsx`
**Cambios**:
- Invalidación de `['admin-products-stats']` agregada en `updateProductMutation.onSuccess`
- Asegura que las métricas del dashboard se actualicen cuando se edita un producto

## 🔧 Consideraciones Técnicas

### Invalidación de Queries
Todas las actualizaciones de estado invalidan las siguientes queries para mantener la consistencia:
- `['admin-products']` - Lista de productos
- `['admin-product', productId]` - Detalle del producto
- `['admin-products-stats']` - Métricas del dashboard

### Mapeo de Estados
El sistema maneja dos campos relacionados:
- `status`: String ('active' | 'inactive') - Campo legacy
- `is_active`: Boolean - Campo principal usado en la base de datos

El código realiza mapeo automático entre ambos para compatibilidad:
- `status === 'active'` → `is_active = true`
- `status === 'inactive'` → `is_active = false`

### Sincronización en Tiempo Real
Gracias a React Query:
- Los cambios se reflejan inmediatamente en todas las vistas abiertas
- No es necesario recargar la página manualmente
- Las métricas se actualizan automáticamente

### Manejo de Errores
- Notificaciones toast para éxito/error en la página de detalle
- Manejo de errores en el hook `toggleProductStatus`
- Validación de datos antes de enviar al API

## 🧪 Testing

Para verificar que todo funciona correctamente:

1. **Formulario de Edición**:
   - Ir a `/admin/products/[id]/edit`
   - Cambiar el checkbox "Producto Activo"
   - Guardar y verificar que el cambio se refleja en la lista y métricas

2. **Menú de Acciones**:
   - Ir a `/admin/products`
   - Hacer clic en el menú de acciones de cualquier producto
   - Seleccionar "Activar" o "Desactivar"
   - Verificar que la lista y métricas se actualizan

3. **Página de Detalle**:
   - Ir a `/admin/products/[id]`
   - Hacer clic en el botón "Activar" o "Desactivar"
   - Verificar que el badge de estado cambia inmediatamente
   - Verificar que las métricas se actualizan

4. **Sincronización**:
   - Abrir múltiples pestañas con diferentes vistas (lista, detalle, dashboard)
   - Cambiar el estado desde una pestaña
   - Verificar que todas las pestañas se actualizan automáticamente

## 📊 Impacto en Métricas

Las métricas del dashboard (`/admin/products`) se actualizan automáticamente:
- **Total Productos**: No cambia
- **Activos**: Se incrementa/decrementa según el cambio
- **Inactivos**: Se calcula como `Total - Activos`

## 🚀 Estado en Producción

✅ **Implementado y funcionando en producción**

Todas las funcionalidades han sido probadas y están operativas. Los cambios se guardan correctamente en la base de datos y se reflejan inmediatamente en todas las vistas de la interfaz administrativa.

## 📝 Notas Adicionales

- El estado `is_active` se guarda como boolean en la base de datos
- Los productos inactivos no aparecen en el frontend público (implementado previamente)
- El sistema mantiene compatibilidad con el campo `status` legacy
- Todas las operaciones son transaccionales y seguras

---

**Última actualización**: Enero 2025  
**Versión**: 1.0.0  
**Estado**: ✅ Producción
