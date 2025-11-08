# 🚀 INSTRUCCIONES: Aplicar Optimización Round 3 - Auth RLS InitPlan

**Fecha**: 20 de Octubre, 2025  
**Migración**: `20251020_fix_auth_rls_initplan_performance.sql`  
**Tiempo estimado**: 2-5 minutos  
**Riesgo**: BAJO (cambio backward-compatible)

---

## 📋 RESUMEN

Esta migración optimiza **6 políticas RLS** que están causando warnings de performance en Supabase Security Advisors. El cambio es simple: usar subqueries para que `auth.uid()` y `auth.role()` se evalúen una sola vez por query en lugar de para cada fila.

**Beneficio esperado**: 40-60% mejora en queries de autenticación y perfiles.

---

## ⚡ APLICACIÓN RÁPIDA

### Opción 1: Supabase Dashboard (RECOMENDADO)

1. **Abrir Supabase Dashboard**
   - Ir a [https://app.supabase.com](https://app.supabase.com)
   - Seleccionar proyecto PinteYA

2. **Ir a SQL Editor**
   - Click en "SQL Editor" en el menú lateral

3. **Copiar y Pegar la Migración**
   - Abrir archivo: `supabase/migrations/20251020_fix_auth_rls_initplan_performance.sql`
   - Copiar TODO el contenido del archivo
   - Pegar en el editor SQL

4. **Ejecutar**
   - Click en "Run" o presionar `Ctrl+Enter`
   - Esperar confirmación de éxito

5. **Verificar**
   - Deberías ver mensaje: "✅ SUCCESS: Las 6 políticas RLS fueron optimizadas correctamente"
   - Deberías ver una tabla con las 6 políticas optimizadas

---

### Opción 2: Supabase CLI

```bash
# Asegurarse de estar en el directorio del proyecto
cd "C:\Users\marti\Desktop\DESARROLLOSW\BOILERPLATTE E-COMMERCE"

# Verificar que Supabase CLI está instalado
supabase --version

# Aplicar migración
supabase db push

# O aplicar migración específica
supabase migration up
```

---

### Opción 3: Conexión Directa a PostgreSQL

```bash
# Conectar a la base de datos
psql <CONNECTION_STRING>

# Ejecutar migración
\i supabase/migrations/20251020_fix_auth_rls_initplan_performance.sql

# Salir
\q
```

---

## ✅ VALIDACIÓN POST-APLICACIÓN

### 1. Verificar Políticas Creadas

**En Supabase Dashboard → SQL Editor**, ejecutar:

```sql
SELECT tablename, policyname
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN ('user_roles', 'user_profiles')
AND policyname IN (
    'user_roles_insert_service',
    'user_roles_update_service',
    'user_roles_delete_service',
    'user_profiles_select_own',
    'user_profiles_insert_service_role',
    'user_profiles_update_own'
)
ORDER BY tablename, policyname;
```

**Resultado esperado**: 6 filas (una por cada política optimizada)

---

### 2. Verificar Security Advisors

**En Supabase Dashboard**:
1. Ir a "Database" → "Advisors" o "Performance"
2. Buscar "Auth RLS InitPlan"
3. **Resultado esperado**: Los 6 warnings deberían haber DESAPARECIDO ✅

---

### 3. Testing Funcional

**Test Básico - Lectura de Perfil**:
```sql
-- Como authenticated user
SET ROLE authenticated;
SET request.jwt.claims.sub = '<TU_USER_UUID>';

SELECT * FROM user_profiles 
WHERE supabase_user_id = '<TU_USER_UUID>';
```

**Resultado esperado**: Debería retornar tu perfil

---

## 🔍 TROUBLESHOOTING

### Error: "Policy already exists"
**Solución**: Las políticas ya fueron optimizadas previamente. No es necesario hacer nada.

### Error: "Permission denied"
**Solución**: Asegurarse de estar usando las credenciales correctas (service_role key en Dashboard).

### Error: "Table does not exist"
**Solución**: Verificar que las tablas `user_roles` y `user_profiles` existen:
```sql
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('user_roles', 'user_profiles');
```

---

## 📊 MONITOREO POST-APLICACIÓN

### Verificar Performance Mejorado

**Opción 1 - Dashboard de Supabase**:
- Ir a "Database" → "Query Performance"
- Buscar queries que involucren `user_roles` o `user_profiles`
- Comparar tiempos de ejecución (deberían ser más rápidos)

**Opción 2 - SQL Manual**:
```sql
-- Ver estadísticas de queries en user_profiles
SELECT 
    calls,
    mean_exec_time,
    max_exec_time,
    stddev_exec_time
FROM pg_stat_statements
WHERE query LIKE '%user_profiles%'
ORDER BY mean_exec_time DESC
LIMIT 10;
```

---

## 🔙 ROLLBACK (Si es necesario)

Si algo sale mal, ejecutar este SQL para revertir:

```sql
-- Restaurar políticas originales de user_roles
DROP POLICY IF EXISTS "user_roles_insert_service" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_update_service" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_delete_service" ON public.user_roles;

CREATE POLICY "user_roles_insert_service" ON public.user_roles
    FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "user_roles_update_service" ON public.user_roles
    FOR UPDATE USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "user_roles_delete_service" ON public.user_roles
    FOR DELETE USING (auth.role() = 'service_role');

-- Restaurar políticas originales de user_profiles
DROP POLICY IF EXISTS "user_profiles_select_own" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_insert_service_role" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_update_own" ON public.user_profiles;

CREATE POLICY "user_profiles_select_own" ON public.user_profiles
    FOR SELECT USING (supabase_user_id = auth.uid());

CREATE POLICY "user_profiles_insert_service_role" ON public.user_profiles
    FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "user_profiles_update_own" ON public.user_profiles
    FOR UPDATE USING (supabase_user_id = auth.uid())
    WITH CHECK (supabase_user_id = auth.uid());
```

---

## 📞 SOPORTE

Si tienes problemas:
1. Revisa logs de Supabase Dashboard
2. Consulta [PERFORMANCE_ROUND_3_SUMMARY.md](./PERFORMANCE_ROUND_3_SUMMARY.md) para más detalles
3. Revisa la documentación oficial de Supabase: [RLS Best Practices](https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select)

---

## ✅ CHECKLIST FINAL

Después de aplicar la migración:

- [ ] Migración ejecutada sin errores
- [ ] 6 políticas visibles en pg_policies
- [ ] 0 warnings "Auth RLS InitPlan" en Security Advisors
- [ ] Test de lectura de perfil funciona
- [ ] No hay errores en logs de Supabase
- [ ] CHANGELOG.md actualizado (ya hecho ✅)
- [ ] RESUMEN_EJECUTIVO_ANALISIS.md actualizado (ya hecho ✅)

---

**¡Listo! La optimización Round 3 está completa.** 🎉

**Siguiente paso**: Monitorear performance durante las próximas 24-48 horas para confirmar mejoras.







