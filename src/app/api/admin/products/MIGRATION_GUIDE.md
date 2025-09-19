# Guía de Migración - API Unificada de Productos Admin

## 📋 Resumen

Esta guía explica cómo migrar de las múltiples rutas de productos admin a la nueva **API Unificada** que consolida toda la funcionalidad en un solo endpoint optimizado.

## 🔄 Rutas Consolidadas

### Antes (Múltiples Rutas)
```
/api/admin/products-simple     → Autenticación básica
/api/admin/products-direct     → NextAuth directo
/api/admin/products-rls        → Enterprise RLS
/api/admin/products-secure     → Supabase Auth seguro
/api/admin/products-test       → Testing sin auth
```

### Después (Ruta Unificada)
```
/api/admin/products/unified    → Todos los modos en uno
```

## 🚀 Cómo Usar la Nueva API

### 1. Parámetro `auth_mode`

La nueva API acepta un parámetro `auth_mode` que determina el tipo de autenticación:

```typescript
type AuthMode = 'simple' | 'direct' | 'rls' | 'secure' | 'test';
```

### 2. Ejemplos de Migración

#### Antes: products-simple
```javascript
// ❌ Ruta antigua
fetch('/api/admin/products-simple?page=1&limit=20')
```

```javascript
// ✅ Nueva ruta unificada
fetch('/api/admin/products/unified?auth_mode=simple&page=1&limit=20')
```

#### Antes: products-direct
```javascript
// ❌ Ruta antigua
fetch('/api/admin/products-direct', {
  method: 'POST',
  body: JSON.stringify({ name: 'Producto', price: 100 })
})
```

```javascript
// ✅ Nueva ruta unificada
fetch('/api/admin/products/unified', {
  method: 'POST',
  body: JSON.stringify({ 
    name: 'Producto', 
    price: 100,
    auth_mode: 'direct'
  })
})
```

#### Antes: products-rls
```javascript
// ❌ Ruta antigua
fetch('/api/admin/products-rls?enterprise=true&context=admin')
```

```javascript
// ✅ Nueva ruta unificada
fetch('/api/admin/products/unified?auth_mode=rls&page=1')
```

### 3. Parámetros Soportados

#### GET (Listar Productos)
```typescript
interface UnifiedProductFilters {
  // Paginación
  page?: number;           // Default: 1
  limit?: number;          // Default: 20, Max: 100
  
  // Filtros
  search?: string;         // Búsqueda por nombre
  category_id?: string;    // UUID de categoría
  is_active?: boolean;     // Estado activo/inactivo
  price_min?: number;      // Precio mínimo
  price_max?: number;      // Precio máximo
  
  // Ordenamiento
  sort_by?: 'name' | 'price' | 'created_at' | 'updated_at';
  sort_order?: 'asc' | 'desc';
  
  // Modo de autenticación
  auth_mode?: 'simple' | 'direct' | 'rls' | 'secure' | 'test';
}
```

#### POST (Crear Producto)
```typescript
interface UnifiedProductCreate {
  name: string;            // Requerido
  description?: string;
  price: number;           // Requerido, >= 0
  stock?: number;          // Default: 0
  category_id?: string;    // UUID opcional
  images?: string[];       // Array de URLs
  is_active?: boolean;     // Default: true
  auth_mode?: AuthMode;    // Default: 'secure'
}
```

## 🔐 Modos de Autenticación

### `simple`
- **Uso**: Desarrollo rápido
- **Auth**: `checkCRUDPermissions`
- **Migra de**: `/api/admin/products-simple`

### `direct`
- **Uso**: NextAuth directo
- **Auth**: Verificación de email admin
- **Migra de**: `/api/admin/products-direct`

### `rls` 
- **Uso**: Enterprise con RLS
- **Auth**: `requireAdminAuth` + `executeWithRLS`
- **Migra de**: `/api/admin/products-rls`

### `secure`
- **Uso**: Producción (recomendado)
- **Auth**: `checkPermission` completo
- **Migra de**: `/api/admin/products-secure`

### `test`
- **Uso**: Testing y debugging
- **Auth**: Sin autenticación
- **Migra de**: `/api/admin/products-test`

## 📊 Respuesta Unificada

### GET Response
```typescript
interface UnifiedProductResponse {
  data: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  meta: {
    auth_mode: AuthMode;
    timestamp: string;
  };
}
```

### POST Response
```typescript
interface UnifiedCreateResponse {
  data: Product;
  message: string;
  meta: {
    auth_mode: AuthMode;
    timestamp: string;
  };
}
```

## 🛠️ Plan de Migración

### Fase 1: Implementación Paralela
- ✅ Nueva API unificada creada
- ⏳ Mantener rutas antiguas temporalmente
- ⏳ Actualizar frontend gradualmente

### Fase 2: Migración Gradual
- [ ] Actualizar componentes React
- [ ] Migrar hooks y servicios
- [ ] Actualizar tests

### Fase 3: Limpieza
- [ ] Deprecar rutas antiguas
- [ ] Eliminar código duplicado
- [ ] Actualizar documentación

## 🧪 Testing

### Verificar Funcionalidad
```bash
# Test modo simple
curl "http://localhost:3000/api/admin/products/unified?auth_mode=simple&page=1"

# Test modo secure
curl "http://localhost:3000/api/admin/products/unified?auth_mode=secure&limit=5"

# Test creación
curl -X POST "http://localhost:3000/api/admin/products/unified" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Product","price":99.99,"auth_mode":"test"}'
```

## ⚠️ Consideraciones

1. **Backward Compatibility**: Las rutas antiguas seguirán funcionando durante la transición
2. **Default Mode**: Si no se especifica `auth_mode`, se usa `secure`
3. **Error Handling**: Todos los errores incluyen el modo de auth usado
4. **Logging**: Cada operación registra el modo utilizado para debugging

## 📝 Próximos Pasos

1. Probar la nueva API unificada
2. Actualizar el frontend para usar `auth_mode`
3. Migrar tests existentes
4. Documentar en Swagger/OpenAPI
5. Planificar eliminación de rutas antiguas


