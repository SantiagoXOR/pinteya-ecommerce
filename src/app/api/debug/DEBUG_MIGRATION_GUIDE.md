# Guía de Migración - API Unificada de Debug

## 📋 Resumen

Esta guía explica cómo migrar de las múltiples rutas de debug dispersas a la nueva **API Unificada de Debug** que consolida toda la funcionalidad de diagnóstico en un solo endpoint optimizado.

## 🔄 Rutas Consolidadas

### Antes (Rutas Dispersas)

```
/api/debug/auth                    → Diagnóstico de autenticación
/api/debug/clerk-session           → Debug específico de Clerk
/api/debug/admin-products          → Debug de productos admin
/api/debug/user-profile            → Debug de perfiles
/api/debug/user-status             → Estado de usuario
/api/debug/simple-auth-check       → Verificación auth simple
/api/debug/check-admin-access      → Acceso admin
/api/debug/check-admin-permissions → Permisos admin
/api/debug/get-user-profile        → Obtener perfil
/api/debug/get-authenticated-user  → Usuario autenticado
/api/debug/simple-products         → Productos simples
/api/admin/debug                   → Debug panel admin
/api/debug-clerk-session           → Sesión Clerk
/api/debug-auth                    → Auth en producción
```

### Después (Ruta Unificada)

```
/api/debug/unified                 → Todos los diagnósticos en uno
```

## 🚀 Cómo Usar la Nueva API

### 1. Parámetro `module`

La nueva API acepta un parámetro `module` que determina el tipo de diagnóstico:

```typescript
type DebugModule =
  | 'auth' // Autenticación general
  | 'clerk' // Clerk específico
  | 'admin' // Panel administrativo
  | 'products' // Productos y permisos
  | 'user-profile' // Perfiles de usuario
  | 'user-status' // Estado de usuario
  | 'permissions' // Sistema de permisos
  | 'supabase' // Conexión Supabase
  | 'environment' // Variables de entorno
  | 'all' // Diagnóstico completo
```

### 2. Ejemplos de Migración

#### Antes: debug/auth

```javascript
// ❌ Ruta antigua
fetch('/api/debug/auth')
```

```javascript
// ✅ Nueva ruta unificada
fetch('/api/debug/unified?module=auth')
```

#### Antes: debug-clerk-session

```javascript
// ❌ Ruta antigua
fetch('/api/debug-clerk-session')
```

```javascript
// ✅ Nueva ruta unificada
fetch('/api/debug/unified?module=clerk&detailed=true')
```

#### Antes: admin/debug

```javascript
// ❌ Ruta antigua
fetch('/api/admin/debug')
```

```javascript
// ✅ Nueva ruta unificada
fetch('/api/debug/unified?module=admin&detailed=true')
```

#### Antes: debug/admin-products

```javascript
// ❌ Ruta antigua
fetch('/api/debug/admin-products?user_id=123')
```

```javascript
// ✅ Nueva ruta unificada
fetch('/api/debug/unified?module=products&user_id=123&detailed=true')
```

### 3. Parámetros Soportados

#### GET (Diagnóstico)

```typescript
interface UnifiedDebugParams {
  // Módulo a diagnosticar
  module?: DebugModule // Default: 'all'

  // Usuario específico (opcional)
  user_id?: string

  // Nivel de detalle
  detailed?: boolean // Default: false

  // Incluir información sensible
  include_sensitive?: boolean // Default: false
}
```

#### POST (Diagnóstico con datos)

```typescript
interface UnifiedDebugPostData {
  module: DebugModule
  user_id?: string
  test_data?: any // Datos específicos para testing
  detailed?: boolean
}
```

## 🔍 Módulos de Diagnóstico

### `auth` - Autenticación General

- **Funcionalidad**: Prueba múltiples métodos de auth
- **Incluye**: getAuthenticatedUser, auth(), headers, cookies
- **Migra de**: `/api/debug/auth`, `/api/debug/simple-auth-check`

### `clerk` - Clerk Específico

- **Funcionalidad**: Diagnóstico completo de Clerk
- **Incluye**: userId, sessionClaims, roles, metadata
- **Migra de**: `/api/debug-clerk-session`

### `admin` - Panel Administrativo

- **Funcionalidad**: Diagnóstico del sistema admin
- **Incluye**: Variables de entorno, conexiones, tablas
- **Migra de**: `/api/admin/debug`

### `products` - Productos y Permisos

- **Funcionalidad**: Prueba permisos de productos
- **Incluye**: CRUD permissions, enterprise auth, queries
- **Migra de**: `/api/debug/admin-products`, `/api/debug/simple-products`

### `user-profile` - Perfiles de Usuario

- **Funcionalidad**: Debug de perfiles y estados
- **Incluye**: Búsqueda de usuarios, perfiles activos
- **Migra de**: `/api/debug/user-profile`, `/api/debug/get-user-profile`

### `user-status` - Estado de Usuario

- **Funcionalidad**: Verificación completa de usuario
- **Incluye**: Auth, roles, permisos, metadata
- **Migra de**: `/api/debug/user-status`, `/api/debug/get-authenticated-user`

### `permissions` - Sistema de Permisos

- **Funcionalidad**: Diagnóstico de permisos
- **Incluye**: Admin access, CRUD permissions
- **Migra de**: `/api/debug/check-admin-access`, `/api/debug/check-admin-permissions`

### `all` - Diagnóstico Completo

- **Funcionalidad**: Ejecuta todos los módulos
- **Incluye**: Resumen general del sistema
- **Recomendado**: Para diagnósticos iniciales

## 📊 Respuesta Unificada

### Estructura General

```typescript
interface UnifiedDebugResponse {
  timestamp: string
  module: DebugModule
  status: 'success' | 'partial' | 'failed' | 'unknown'
  data: any // Datos específicos del módulo
  error?: string // Error si falló
  meta: {
    api_version: string
    unified: boolean
    parameters: {
      module: DebugModule
      detailed: boolean
      include_sensitive: boolean
    }
  }
}
```

### Respuesta de Diagnóstico Completo (`all`)

```typescript
interface CompleteDebugResponse extends UnifiedDebugResponse {
  summary: {
    total_modules: number
    success_count: number
    partial_count: number
    failed_count: number
  }
  data: {
    auth: DebugResult
    clerk: DebugResult
    admin: DebugResult
    products: DebugResult
  }
}
```

## 🛠️ Plan de Migración

### Fase 1: Implementación Paralela ✅

- ✅ Nueva API unificada creada
- ✅ Todos los módulos implementados
- ⏳ Mantener rutas antiguas temporalmente

### Fase 2: Migración Gradual

- [ ] Actualizar herramientas de desarrollo
- [ ] Migrar scripts de diagnóstico
- [ ] Actualizar documentación interna

### Fase 3: Limpieza

- [ ] Deprecar rutas antiguas
- [ ] Eliminar código duplicado
- [ ] Consolidar logs y métricas

## 🧪 Testing

### Verificar Funcionalidad

```bash
# Diagnóstico completo
curl "http://localhost:3000/api/debug/unified?module=all&detailed=true"

# Auth específico
curl "http://localhost:3000/api/debug/unified?module=auth"

# Clerk con detalles
curl "http://localhost:3000/api/debug/unified?module=clerk&detailed=true"

# Admin diagnóstico
curl "http://localhost:3000/api/debug/unified?module=admin"

# Productos con usuario específico
curl "http://localhost:3000/api/debug/unified?module=products&user_id=user_123"

# POST con datos de prueba
curl -X POST "http://localhost:3000/api/debug/unified" \
  -H "Content-Type: application/json" \
  -d '{"module":"auth","test_data":{"user_id":"test_user"},"detailed":true}'
```

### Comparar con Rutas Antiguas

```bash
# Comparar auth
curl "/api/debug/auth" > old_auth.json
curl "/api/debug/unified?module=auth" > new_auth.json
diff old_auth.json new_auth.json

# Comparar clerk
curl "/api/debug-clerk-session" > old_clerk.json
curl "/api/debug/unified?module=clerk" > new_clerk.json
diff old_clerk.json new_clerk.json
```

## ⚠️ Consideraciones

1. **Backward Compatibility**: Las rutas antiguas seguirán funcionando durante la transición
2. **Security**: `include_sensitive=false` por defecto para proteger información
3. **Performance**: El módulo `all` puede ser lento, usar módulos específicos cuando sea posible
4. **Logging**: Todos los diagnósticos se registran con el módulo utilizado
5. **Rate Limiting**: Considerar límites para evitar abuso de la API de debug

## 📝 Próximos Pasos

1. Probar la nueva API unificada
2. Migrar herramientas de desarrollo existentes
3. Actualizar scripts de CI/CD que usen debug
4. Documentar en Swagger/OpenAPI
5. Planificar eliminación de rutas antiguas
6. Implementar métricas de uso para monitorear la migración

## 🔗 Enlaces Relacionados

- [API Unificada de Productos Admin](./products/MIGRATION_GUIDE.md)
- [Documentación de Autenticación](../../../docs/auth/README.md)
- [Guía de Troubleshooting](../../../docs/troubleshooting/README.md)
