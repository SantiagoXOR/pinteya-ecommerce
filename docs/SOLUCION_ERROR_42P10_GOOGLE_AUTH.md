# 🔧 Solución: Error 42P10 en Autenticación Google Auth

**Fecha**: 12 Enero 2026  
**Problema**: Error `42P10` - "there is no unique or exclusion constraint matching the ON CONFLICT specification" al intentar hacer login con Google Auth

## 🐛 El Problema

Al intentar hacer login con Google Auth, se producía el siguiente error:

```
[Role Service] Error upserting user profile: {
  code: '42P10',
  details: null,
  hint: null,
  message: 'there is no unique or exclusion constraint matching the ON CONFLICT specification'
}
```

### Causa Raíz

El error ocurría porque:

1. **Falta de constraint UNIQUE en email**: Aunque la tabla `user_profiles` tenía `email VARCHAR(255) UNIQUE NOT NULL` en la definición de la migración, el constraint UNIQUE no estaba realmente aplicado en la base de datos.

2. **Uso de `ON CONFLICT` sin constraint**: Tanto el código TypeScript como los triggers SQL usaban `ON CONFLICT (email)`, pero PostgreSQL no encontraba una restricción UNIQUE válida para esa columna.

3. **Trigger SQL problemático**: El trigger `auto_create_user_profile()` usaba `ON CONFLICT (email)` que fallaba cuando no existía el constraint.

## ✅ Solución Implementada

### 1. **Migración: Crear Constraint UNIQUE en Email**

**Archivo**: `supabase/migrations/20260112_fix_user_profiles_email_unique.sql`

```sql
-- Crear índice único explícito en email
CREATE UNIQUE INDEX IF NOT EXISTS user_profiles_email_unique_idx 
ON public.user_profiles(email);

-- Asegurar que la restricción UNIQUE existe
ALTER TABLE public.user_profiles 
ADD CONSTRAINT user_profiles_email_unique 
UNIQUE (email);
```

**Resultado**: Se creó el constraint `user_profiles_email_unique` y el índice único `user_profiles_email_unique_idx` en la columna `email`.

### 2. **Actualización del Trigger `auto_create_user_profile()`**

**Archivo**: `supabase/migrations/20250110_auto_sync_user_profiles.sql`

**ANTES** (usando `ON CONFLICT`):
```sql
INSERT INTO public.user_profiles (...)
VALUES (...)
ON CONFLICT (email) 
DO UPDATE SET ...;
```

**DESPUÉS** (usando lógica de verificación):
```sql
-- Usar lógica de verificación primero para evitar problemas con ON CONFLICT
IF EXISTS (SELECT 1 FROM public.user_profiles WHERE email = NEW.email) THEN
  -- Si existe, actualizar
  UPDATE public.user_profiles
  SET ...
  WHERE email = NEW.email;
ELSE
  -- Si no existe, insertar
  INSERT INTO public.user_profiles (...)
  VALUES (...);
END IF;
```

**Beneficios**:
- No depende de constraints UNIQUE para funcionar
- Más robusto y predecible
- Mejor manejo de errores

### 3. **Actualización de la Función `add_admin_user()`**

**Archivo**: `supabase/migrations/20250110_register_admin_users.sql`

Se aplicó la misma lógica de verificación explícita en lugar de `ON CONFLICT`:

```sql
IF EXISTS (SELECT 1 FROM public.user_profiles WHERE email = user_email) THEN
  UPDATE public.user_profiles SET ... WHERE email = user_email;
ELSE
  INSERT INTO public.user_profiles (...) VALUES (...);
END IF;
```

### 4. **Actualización del Código TypeScript**

**Archivo**: `src/lib/auth/role-service.ts`

La función `upsertUserProfile()` ya había sido actualizada previamente para usar lógica manual de verificación en lugar de `.upsert()` con `onConflict`:

```typescript
// Verificar si existe
const { data: existingProfile } = await supabase
  .from('user_profiles')
  .select('id, role_id, supabase_user_id, first_name, last_name')
  .eq('email', userData.email)
  .maybeSingle()

// Si existe, hacer UPDATE
if (existingProfile) {
  await supabase.from('user_profiles').update(...).eq('email', userData.email)
} else {
  // Si no existe, hacer INSERT
  await supabase.from('user_profiles').insert(...)
}
```

## 🔄 Flujo Corregido

### Al Hacer Login con Google Auth:

```
1. Usuario hace login con Google
   ↓
2. NextAuth crea/actualiza usuario en tabla `users`
   ↓
3. Trigger `auto_create_user_profile()` se ejecuta
   ↓
4. Trigger verifica si existe perfil por email
   ↓
5a. Si existe → UPDATE (preserva rol existente, actualiza supabase_user_id)
5b. Si no existe → INSERT (crea nuevo perfil con rol 'customer')
   ↓
6. Callback signIn ejecuta upsertUserProfile() (TypeScript)
   ↓
7. upsertUserProfile verifica y actualiza/crea perfil
   ↓
8. Callback jwt ejecuta getUserRole()
   ↓
9. Usuario es redirigido según su rol (admin → /admin, customer → /)
```

## 📋 Verificación en Base de Datos

Para verificar que el constraint existe:

```sql
-- Verificar constraints UNIQUE en user_profiles
SELECT 
  conname AS constraint_name,
  contype AS constraint_type,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.user_profiles'::regclass
AND contype = 'u';

-- Debe mostrar:
-- user_profiles_email_unique | u | UNIQUE (email)
```

Para verificar el trigger:

```sql
-- Verificar que el trigger existe
SELECT tgname, tgenabled
FROM pg_trigger
WHERE tgname = 'trigger_auto_create_user_profile';

-- Ver la función del trigger
SELECT pg_get_functiondef(oid) 
FROM pg_proc 
WHERE proname = 'auto_create_user_profile';
```

## 🎯 Resultado

✅ **Error 42P10 resuelto**: El constraint UNIQUE ahora existe y está correctamente aplicado  
✅ **Login con Google Auth funciona**: Los usuarios pueden autenticarse correctamente  
✅ **Preservación de roles**: Los roles existentes (especialmente admin) se preservan al hacer login  
✅ **Sincronización automática**: El `supabase_user_id` se actualiza automáticamente en cada login  

## 📝 Archivos Modificados

1. `supabase/migrations/20260112_fix_user_profiles_email_unique.sql` (nuevo)
2. `supabase/migrations/20250110_auto_sync_user_profiles.sql` (actualizado)
3. `supabase/migrations/20250110_register_admin_users.sql` (actualizado)
4. `src/lib/auth/role-service.ts` (ya estaba corregido previamente)

## 🔍 Testing

Para probar que la solución funciona:

1. **Login con usuario existente (admin)**:
   - Email: `santiago@xor.com.ar`
   - Debe preservar el rol `admin`
   - Debe actualizar `supabase_user_id` si es necesario

2. **Login con usuario nuevo**:
   - Debe crear nuevo perfil con rol `customer`
   - Debe asignar `supabase_user_id` correctamente

3. **Verificar en base de datos**:
   ```sql
   SELECT email, role_id, supabase_user_id, is_active
   FROM user_profiles
   WHERE email = 'santiago@xor.com.ar';
   ```

## ⚠️ Notas Importantes

- El constraint UNIQUE en `email` es crítico para la integridad de datos
- La lógica de verificación explícita es más robusta que `ON CONFLICT`
- Los triggers SQL ahora son idempotentes y pueden ejecutarse múltiples veces sin problemas
- El código TypeScript ya no depende de `onConflict` de Supabase

## 🔗 Referencias

- [PostgreSQL ON CONFLICT Documentation](https://www.postgresql.org/docs/current/sql-insert.html#SQL-ON-CONFLICT)
- [Supabase Upsert Documentation](https://supabase.com/docs/reference/javascript/upsert)
- Error PostgreSQL 42P10: `unique_violation` o `exclusion_violation`
