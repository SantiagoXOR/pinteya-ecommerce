# Error: Recursión Infinita en RLS Policy de user_profiles

**Fecha:** 2026-01-23  
**Estado:** ✅ CORREGIDO

---

## 🔴 Problema Detectado

**Error:** `infinite recursion detected in policy for relation "user_profiles"`

**Causa:** La política RLS `User profiles tenant isolation select` tenía una consulta recursiva:

```sql
CREATE POLICY "User profiles tenant isolation select"
  ON user_profiles FOR SELECT
  USING (
    ...
    AND EXISTS (
      SELECT 1 FROM user_profiles up  -- ❌ RECURSIÓN: consulta user_profiles dentro de su propia política
      WHERE up.supabase_user_id = auth.uid()
      AND up.tenant_id = get_current_tenant_id()
    )
  );
```

Cuando PostgreSQL evalúa la política, intenta verificar el `EXISTS`, lo que requiere evaluar la política de nuevo, causando recursión infinita.

---

## ✅ Solución Aplicada

**Migración:** `fix_user_profiles_rls_recursion`

**Cambio:** Se eliminó la verificación recursiva de admin y se simplificó la política:

```sql
CREATE POLICY "User profiles tenant isolation select"
  ON user_profiles FOR SELECT
  USING (
    auth.role() = 'service_role'
    OR
    -- Usuario puede ver su propio perfil
    (supabase_user_id = auth.uid())
    OR
    -- Ver perfiles del tenant actual (sin verificación recursiva)
    (
      get_current_tenant_id() IS NOT NULL 
      AND tenant_id = get_current_tenant_id()
    )
    OR
    -- Ver perfiles sin tenant si no hay tenant en contexto
    (get_current_tenant_id() IS NULL AND tenant_id IS NULL)
  );
```

**Nota:** Si se necesita verificación de rol admin en el futuro, se debe usar una función separada o una tabla de roles que no cause recursión.

---

## 📊 Impacto

**Antes:**
- ❌ Error 500 en todas las queries que involucran `user_profiles`
- ❌ APIs de productos fallando
- ❌ Bestseller products no se pueden obtener

**Después:**
- ✅ Política sin recursión
- ✅ Queries funcionando correctamente
- ✅ Aislamiento por tenant mantenido

---

## 🔍 Verificación

Para verificar que la política está corregida:

```sql
-- Verificar políticas actuales
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'user_profiles'
AND policyname = 'User profiles tenant isolation select';
```

---

**Corrección aplicada:** 2026-01-23  
**Estado:** ✅ RESUELTO
