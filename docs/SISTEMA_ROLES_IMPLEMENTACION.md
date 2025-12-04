# 🔐 Sistema de Roles - Implementación Completada

**Fecha**: 10 Enero 2025  
**Estado**: ✅ Implementado y Listo para Testing

## 📋 Resumen

Se ha implementado un sistema completo de roles integrado con NextAuth.js y Supabase que reemplaza el hardcode de emails administrativos. Ahora los roles se gestionan directamente desde la base de datos.

## 🎯 Administradores Registrados

Los siguientes emails han sido configurados como administradores:

1. ✅ `santiago@xor.com.ar`
2. ✅ `pinturasmascolor@gmail.com`
3. ✅ `pinteya.app@gmail.com`

## 🚀 Pasos para Aplicar las Migraciones

### 1. Ejecutar Migraciones en Supabase

Debes ejecutar las siguientes migraciones en orden:

```bash
# En el dashboard de Supabase SQL Editor, ejecutar en orden:

1. supabase/migrations/20250110_auto_sync_user_profiles.sql
2. supabase/migrations/20250110_register_admin_users.sql
```

**Alternativamente**, si usas Supabase CLI local:

```bash
supabase migration up
```

### 2. Verificar las Migraciones

Después de ejecutar las migraciones, verifica en el SQL Editor:

```sql
-- Ver todos los administradores
SELECT 
  up.email,
  up.is_active,
  ur.role_name,
  ur.display_name
FROM user_profiles up
JOIN user_roles ur ON up.role_id = ur.id
WHERE ur.role_name = 'admin';
```

Deberías ver los 3 emails administrativos listados.

## 🧪 Testing del Sistema

### Test 1: Login con Admin Existente

1. Ir a `/api/auth/signin`
2. Iniciar sesión con uno de los emails admin (ej: `pinturasmascolor@gmail.com`)
3. Intentar acceder a `/admin`
4. **Resultado esperado**: ✅ Acceso concedido al panel admin

### Test 2: Login con Usuario Normal

1. Iniciar sesión con un email que NO sea admin (ej: `usuario.test@gmail.com`)
2. Intentar acceder a `/admin`
3. **Resultado esperado**: ❌ Redirigido a `/access-denied?type=admin`

### Test 3: Bypass en Desarrollo (Opcional)

Si necesitas acceso sin login durante desarrollo:

```bash
# En tu .env.local
NODE_ENV=development
BYPASS_AUTH=true
```

Accede directamente a `/admin` sin login.

### Test 4: Verificar Sincronización Automática

1. Crear un usuario nuevo logueándose con Google
2. Verificar en Supabase que se creó automáticamente su `user_profile`:

```sql
SELECT * FROM user_profiles 
WHERE email = 'tu-nuevo-email@gmail.com';
```

3. **Resultado esperado**: El perfil existe con rol 'customer'

## 🔧 Cambios Implementados

### Archivos Nuevos

1. **`src/lib/auth/role-service.ts`**
   - Funciones para consultar roles desde Supabase
   - `getUserRole()`, `isUserAdmin()`, `getUserProfile()`
   - `upsertUserProfile()` para sincronización

2. **`supabase/migrations/20250110_auto_sync_user_profiles.sql`**
   - Trigger automático para crear `user_profiles` al registrar usuarios
   - Migración one-time de usuarios existentes

3. **`supabase/migrations/20250110_register_admin_users.sql`**
   - Registra los 3 emails como administradores
   - Funciones helper: `add_admin_user()`, `remove_admin_user()`

### Archivos Modificados

1. **`auth.ts`**
   - Callback `signIn`: Sincroniza `user_profiles` al login
   - Callback `jwt`: Carga el rol del usuario en el token
   - Callback `session`: Incluye el rol en la sesión
   - Tipos extendidos para incluir `role`

2. **`middleware.ts`**
   - Eliminado hardcode de `santiago@xor.com.ar`
   - Ahora usa `req.auth?.user?.role` para verificar admin

3. **`src/lib/auth/server-auth-guard.ts`**
   - Eliminado hardcode de email
   - Ahora usa `session.user.role` para verificar admin

## 📚 Gestión de Administradores

### Agregar un Nuevo Administrador

Opción 1 - SQL directo:
```sql
SELECT public.add_admin_user('nuevo.admin@example.com');
```

Opción 2 - Manualmente en Supabase:
```sql
UPDATE user_profiles 
SET role_id = (SELECT id FROM user_roles WHERE role_name = 'admin')
WHERE email = 'nuevo.admin@example.com';
```

### Remover Permisos de Admin

```sql
SELECT public.remove_admin_user('usuario@example.com');
```

### Listar Todos los Admins

```sql
SELECT up.email, up.is_active, up.created_at
FROM user_profiles up
JOIN user_roles ur ON up.role_id = ur.id
WHERE ur.role_name = 'admin'
ORDER BY up.email;
```

## 🔍 Troubleshooting

### Problema: Usuario admin no puede acceder

1. Verificar que el perfil existe:
```sql
SELECT * FROM user_profiles WHERE email = 'tu-email@gmail.com';
```

2. Verificar que tiene rol admin:
```sql
SELECT up.email, ur.role_name 
FROM user_profiles up
JOIN user_roles ur ON up.role_id = ur.id
WHERE up.email = 'tu-email@gmail.com';
```

3. Si el perfil no existe o no tiene rol admin, ejecutar:
```sql
SELECT public.add_admin_user('tu-email@gmail.com');
```

4. Cerrar sesión y volver a iniciar sesión para refrescar el JWT

### Problema: Error de Supabase en login

- Verificar que las variables de entorno están configuradas:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`

- Verificar que las migraciones se ejecutaron correctamente

### Problema: JWT no incluye el rol

- El rol se carga en el callback `jwt` de NextAuth
- Cerrar sesión y volver a iniciar para refrescar el token
- Verificar logs del servidor para errores en `[NextAuth] User role loaded`

## 🎉 Beneficios del Nuevo Sistema

✅ **Escalable**: Agregar/quitar admins sin tocar código  
✅ **Flexible**: Sistema de roles completo listo para expandir  
✅ **Seguro**: Roles gestionados en base de datos con RLS  
✅ **Performante**: Rol cacheado en JWT (30 días)  
✅ **Automático**: Sincronización automática de perfiles  

## 📝 Próximos Pasos (Opcional)

1. **Agregar más roles**: manager, employee, moderator (ya existen en la BD)
2. **Panel de gestión de usuarios**: Interfaz web para agregar/quitar admins
3. **Permisos granulares**: Usar el campo `permissions` del rol
4. **Logs de auditoría**: Registrar cambios de roles

## 🔗 Referencias

- NextAuth.js: https://next-auth.js.org/
- Supabase: https://supabase.com/docs
- Sistema de roles: `supabase/migrations/20250729000001_create_user_roles_system.sql`

