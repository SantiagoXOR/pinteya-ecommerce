# 🔧 Solución: Acceso Administrativo Denegado

**Fecha**: 10 Enero 2025  
**Problema**: Usuarios admin no pueden acceder al panel después de login

## 🐛 El Problema

Los usuarios con rol admin eran redirigidos a `/access-denied?type=admin` porque:

1. Los perfiles en `user_profiles` tenían `supabase_user_id: null`
2. La función `getUserRole()` buscaba solo por `supabase_user_id`
3. No encontraba el perfil → retornaba `'customer'` por defecto
4. El middleware rechazaba el acceso

## ✅ Solución Implementada

### 1. **Función `getUserRole()` Mejorada**

**Archivo**: `src/lib/auth/role-service.ts` (líneas 98-135)

Ahora hace búsqueda en dos pasos:

```typescript
1. Buscar perfil por supabase_user_id
   ↓ Si no encuentra
2. Buscar en tabla users por id para obtener email
   ↓
3. Buscar perfil por email
   ↓
4. Actualizar supabase_user_id automáticamente
```

**Beneficio**: Los perfiles que se crearon antes del login ahora se sincronizan automáticamente.

### 2. **Función `upsertUserProfile()` Mejorada**

**Archivo**: `src/lib/auth/role-service.ts` (líneas 237-321)

Cambios clave:

```typescript
// ANTES:
- Siempre usaba rol 'customer' al crear perfil
- Sobreescribía roles existentes

// DESPUÉS:
- Verifica si existe perfil previo
- Preserva el rol existente (admin/driver)
- Solo usa 'customer' para perfiles nuevos
- Actualiza supabase_user_id en cada login
```

### 3. **Constraint Único en Email**

Agregado constraint único a `user_profiles.email` para que el upsert funcione correctamente.

## 🔄 Flujo Corregido

### Al Hacer Login:

```
1. Usuario hace login con Google
   ↓
2. NextAuth crea/actualiza usuario en tabla `users`
   ↓
3. Callback signIn ejecuta upsertUserProfile()
   ↓
4. upsertUserProfile busca perfil por email
   ↓
5. Si existe (como admin), PRESERVA el rol
   ↓
6. Actualiza supabase_user_id = user.id
   ↓
7. Callback jwt ejecuta getUserRole()
   ↓
8. getUserRole encuentra el perfil (por userId o email)
   ↓
9. Carga el rol 'admin' en el token
   ↓
10. Middleware verifica rol = 'admin' ✅
    ↓
11. ACCESO CONCEDIDO al panel admin
```

## 🧪 Cómo Probar

### Paso 1: Cerrar Sesión

Si ya estás logueado, cierra sesión completamente:
```
http://localhost:3000/api/auth/signout
```

### Paso 2: Hacer Login Nuevamente

```
http://localhost:3000/api/auth/signin
```

Login con uno de los emails admin:
- `pinturasmascolor@gmail.com`
- `pinteya.app@gmail.com`

### Paso 3: Verificar Logs

En la consola del servidor deberías ver:

```
[Role Service] Profile not found by userId, trying by email: tu-email@gmail.com
[Role Service] Updated supabase_user_id for tu-email@gmail.com
[Role Service] Profile synced for tu-email@gmail.com with role: admin
[NextAuth] User role loaded: admin for user abc-123...
```

### Paso 4: Acceder al Admin

```
http://localhost:3000/admin
```

Deberías tener acceso ✅

## 🔍 Verificar en Base de Datos

Después del login, verifica que se actualizó el `supabase_user_id`:

```sql
SELECT 
  email, 
  supabase_user_id,
  ur.role_name 
FROM user_profiles up
JOIN user_roles ur ON up.role_id = ur.id
WHERE email IN ('pinturasmascolor@gmail.com', 'pinteya.app@gmail.com');
```

Deberías ver que `supabase_user_id` ya NO es `null`.

## ⚠️ Warning de GoTrueClient

El warning `Multiple GoTrueClient instances` que ves es normal y no afecta la funcionalidad. Viene de Supabase auth.

## 📋 Checklist de Solución

- [x] `getUserRole()` busca por email si no encuentra por userId
- [x] `getUserRole()` actualiza supabase_user_id automáticamente
- [x] `upsertUserProfile()` preserva roles existentes
- [x] Constraint único en email agregado
- [x] Warning de SUPABASE_SERVICE_ROLE_KEY eliminado del cliente

## 🚀 Próximos Pasos

1. **Redesplegar** en producción (para aplicar los cambios)
2. **Cerrar sesión** en producción
3. **Hacer login** nuevamente
4. El acceso admin debería funcionar ✅

---

**TL;DR**: El problema era que los perfiles admin no tenían `supabase_user_id` sincronizado. Ahora el sistema lo sincroniza automáticamente al hacer login y busca por email como fallback.

