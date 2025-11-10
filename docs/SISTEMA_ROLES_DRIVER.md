# 🚗 Sistema de Roles Driver - Implementación

**Fecha**: 10 Enero 2025  
**Estado**: ✅ Implementado

## 📋 Resumen

Se ha eliminado completamente el hardcode de emails para drivers y se ha implementado el sistema de roles de Supabase.

## 🔧 Cambios Realizados

### 1. **Rol 'driver' Creado en Supabase**

Se agregó el rol 'driver' a la tabla `user_roles`:

```sql
role_name: 'driver'
description: 'Conductor/Repartidor con acceso al sistema de logística'
permissions: {
  "deliveries": { "read": true, "update": true, "complete": true },
  "routes": { "read": true, "update_status": true },
  "tracking": { "update": true, "view": true }
}
```

### 2. **Archivos Actualizados**

#### `src/lib/auth/server-auth-guard.ts`

**Función `requireDriverAuth()` (líneas 54-72):**
```typescript
// ANTES:
const allowedDrivers = ['driver@pinteya.com', 'santiago@xor.com.ar']
const isDriver = allowedDrivers.includes(session.user.email || '')

// DESPUÉS:
const userRole = session.user.role || 'customer'
const isDriver = userRole === 'driver' || userRole === 'admin'
```

**Función `isDriver()` (líneas 107-111):**
```typescript
// ANTES:
const allowedDrivers = ['driver@pinteya.com', 'santiago@xor.com.ar']
return allowedDrivers.includes(session?.user?.email || '')

// DESPUÉS:
const userRole = session?.user?.role || 'customer'
return userRole === 'driver' || userRole === 'admin'
```

#### `middleware.ts`

**Verificación de driver (líneas 94-110):**
```typescript
// ANTES:
const userEmail = req.auth?.user?.email
const isDriver = userEmail === 'driver@pinteya.com' || userEmail === 'santiago@xor.com.ar'

// DESPUÉS:
const userRole = req.auth?.user?.role || 'customer'
const isDriver = userRole === 'driver' || userRole === 'admin'
```

## 🎯 Consistencia Completa

Ahora **TODAS** las verificaciones de autenticación usan el sistema de roles:

### Admin
- ✅ `requireAdminAuth()` - usa roles
- ✅ `isAdmin()` - usa roles
- ✅ Middleware admin - usa roles

### Driver
- ✅ `requireDriverAuth()` - usa roles ← **CORREGIDO**
- ✅ `isDriver()` - usa roles ← **CORREGIDO**
- ✅ Middleware driver - usa roles ← **CORREGIDO**

## 👥 Gestión de Drivers

### Agregar un Driver

```sql
-- Opción 1: Usando la función helper
SELECT public.add_admin_user('driver@example.com');
-- Luego cambiar el rol manualmente a 'driver'

-- Opción 2: Directo
UPDATE user_profiles 
SET role_id = (SELECT id FROM user_roles WHERE role_name = 'driver')
WHERE email = 'driver@example.com';
```

### Crear Función Helper para Drivers

Podemos crear una función similar a `add_admin_user`:

```sql
CREATE OR REPLACE FUNCTION public.add_driver_user(user_email TEXT)
RETURNS VOID AS $$
DECLARE
  driver_role_id UUID;
  existing_profile_id UUID;
BEGIN
  SELECT id INTO driver_role_id
  FROM public.user_roles
  WHERE role_name = 'driver'
  LIMIT 1;

  SELECT id INTO existing_profile_id
  FROM public.user_profiles
  WHERE email = user_email
  LIMIT 1;

  IF existing_profile_id IS NOT NULL THEN
    UPDATE public.user_profiles
    SET role_id = driver_role_id,
        is_active = true,
        updated_at = NOW()
    WHERE id = existing_profile_id;
    RAISE NOTICE '✅ Usuario actualizado a driver: %', user_email;
  ELSE
    INSERT INTO public.user_profiles (
      email, role_id, is_active, first_name, last_name
    ) VALUES (
      user_email, driver_role_id, true, 'Driver', 'User'
    );
    RAISE NOTICE '✅ Usuario driver creado: %', user_email;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
```

## 🎉 Beneficios

- ✅ **Sin hardcode**: Todos los roles desde base de datos
- ✅ **Escalable**: Fácil agregar/quitar drivers
- ✅ **Consistente**: Mismo sistema para todos los roles
- ✅ **Flexible**: Admin puede acceder a rutas de driver
- ✅ **Seguro**: Verificación en múltiples capas

## 📝 Roles Disponibles

Actualmente en la base de datos:

1. **admin** - Acceso completo al sistema
2. **driver** - Acceso al sistema de logística ← **NUEVO**
3. **customer** - Cliente estándar
4. **moderator** - Acceso intermedio

## 🔐 Permisos del Rol Driver

```json
{
  "deliveries": {
    "read": true,
    "update": true,
    "complete": true
  },
  "routes": {
    "read": true,
    "update_status": true
  },
  "tracking": {
    "update": true,
    "view": true
  }
}
```

---

**Conclusión**: El sistema de roles ahora está **100% libre de hardcode** y completamente integrado para admin, driver y cualquier otro rol futuro.


