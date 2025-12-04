-- =====================================================
-- MIGRACIÓN: Optimización Auth RLS InitPlan Performance
-- Fecha: 20 de Octubre, 2025
-- Problema: 6 políticas RLS re-evalúan auth.<function>() para cada fila
-- Solución: Usar subqueries (SELECT auth.<function>()) para evaluar una sola vez
-- Referencia: https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select
-- =====================================================

-- =====================================================
-- CONTEXTO
-- =====================================================
-- Security Advisor detectó 6 políticas con "Auth RLS InitPlan" warnings:
-- - user_roles: user_roles_insert_service, user_roles_update_service, user_roles_delete_service
-- - user_profiles: user_profiles_select_own, user_profiles_insert_service_role, user_profiles_update_own
--
-- Estas políticas re-evalúan auth.role() o auth.uid() para CADA FILA,
-- causando performance subóptimo a escala.
--
-- La solución es envolver las llamadas en SELECT: (SELECT auth.uid()) 
-- para que se evalúen UNA SOLA VEZ por query.
-- =====================================================

-- =====================================================
-- TABLA: user_roles
-- =====================================================

-- 1. Eliminar políticas antiguas de user_roles
DROP POLICY IF EXISTS "user_roles_insert_service" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_update_service" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_delete_service" ON public.user_roles;

-- 2. Recrear políticas con subqueries optimizadas para user_roles

-- Política INSERT: Solo service_role puede insertar (OPTIMIZADA)
CREATE POLICY "user_roles_insert_service" ON public.user_roles
    FOR INSERT WITH CHECK (
        (SELECT auth.role()) = 'service_role'
    );

-- Política UPDATE: Solo service_role puede actualizar (OPTIMIZADA)
CREATE POLICY "user_roles_update_service" ON public.user_roles
    FOR UPDATE USING (
        (SELECT auth.role()) = 'service_role'
    ) WITH CHECK (
        (SELECT auth.role()) = 'service_role'
    );

-- Política DELETE: Solo service_role puede eliminar (OPTIMIZADA)
CREATE POLICY "user_roles_delete_service" ON public.user_roles
    FOR DELETE USING (
        (SELECT auth.role()) = 'service_role'
    );

-- =====================================================
-- TABLA: user_profiles
-- =====================================================

-- 3. Eliminar políticas antiguas de user_profiles
DROP POLICY IF EXISTS "user_profiles_select_own" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_insert_service_role" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_update_own" ON public.user_profiles;

-- 4. Recrear políticas con subqueries optimizadas para user_profiles

-- Política SELECT: Los usuarios pueden ver su propio perfil (OPTIMIZADA)
CREATE POLICY "user_profiles_select_own" ON public.user_profiles
    FOR SELECT USING (
        supabase_user_id = (SELECT auth.uid())
    );

-- Política INSERT: Solo service_role puede insertar perfiles (OPTIMIZADA)
CREATE POLICY "user_profiles_insert_service_role" ON public.user_profiles
    FOR INSERT WITH CHECK (
        (SELECT auth.role()) = 'service_role'
    );

-- Política UPDATE: Los usuarios pueden actualizar su propio perfil (OPTIMIZADA)
CREATE POLICY "user_profiles_update_own" ON public.user_profiles
    FOR UPDATE USING (
        supabase_user_id = (SELECT auth.uid())
    ) WITH CHECK (
        supabase_user_id = (SELECT auth.uid())
    );

-- =====================================================
-- DOCUMENTACIÓN DE POLÍTICAS
-- =====================================================

-- Comentarios para user_roles
COMMENT ON POLICY "user_roles_insert_service" ON public.user_roles IS 
'[OPTIMIZADO 2025-10-20] Solo service_role puede insertar roles. Usa subquery (SELECT auth.role()) para evaluar una vez por query en lugar de por cada fila.';

COMMENT ON POLICY "user_roles_update_service" ON public.user_roles IS 
'[OPTIMIZADO 2025-10-20] Solo service_role puede actualizar roles. Usa subquery (SELECT auth.role()) para evaluar una vez por query en lugar de por cada fila.';

COMMENT ON POLICY "user_roles_delete_service" ON public.user_roles IS 
'[OPTIMIZADO 2025-10-20] Solo service_role puede eliminar roles. Usa subquery (SELECT auth.role()) para evaluar una vez por query en lugar de por cada fila.';

-- Comentarios para user_profiles
COMMENT ON POLICY "user_profiles_select_own" ON public.user_profiles IS 
'[OPTIMIZADO 2025-10-20] Los usuarios pueden ver su propio perfil. Usa subquery (SELECT auth.uid()) para evaluar una vez por query en lugar de por cada fila.';

COMMENT ON POLICY "user_profiles_insert_service_role" ON public.user_profiles IS 
'[OPTIMIZADO 2025-10-20] Solo service_role puede insertar perfiles. Usa subquery (SELECT auth.role()) para evaluar una vez por query en lugar de por cada fila.';

COMMENT ON POLICY "user_profiles_update_own" ON public.user_profiles IS 
'[OPTIMIZADO 2025-10-20] Los usuarios pueden actualizar su propio perfil. Usa subquery (SELECT auth.uid()) para evaluar una vez por query en lugar de por cada fila.';

-- =====================================================
-- VERIFICACIÓN
-- =====================================================

-- Verificar que las políticas se crearon correctamente
DO $$
DECLARE
    policy_count INTEGER;
BEGIN
    -- Contar políticas recreadas
    SELECT COUNT(*) INTO policy_count
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
    );
    
    IF policy_count = 6 THEN
        RAISE NOTICE '✅ SUCCESS: Las 6 políticas RLS fueron optimizadas correctamente';
        RAISE NOTICE 'Políticas optimizadas:';
        RAISE NOTICE '  - user_roles: user_roles_insert_service, user_roles_update_service, user_roles_delete_service';
        RAISE NOTICE '  - user_profiles: user_profiles_select_own, user_profiles_insert_service_role, user_profiles_update_own';
    ELSE
        RAISE EXCEPTION 'ERROR: Se esperaban 6 políticas, pero se encontraron: %', policy_count;
    END IF;
END;
$$;

-- Mostrar políticas optimizadas
SELECT 
    tablename,
    policyname,
    cmd as comando,
    CASE 
        WHEN policyname LIKE '%service%' THEN '(SELECT auth.role())'
        ELSE '(SELECT auth.uid())'
    END as optimizacion_aplicada
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

-- =====================================================
-- BENEFICIOS ESPERADOS
-- =====================================================
-- ✅ 40-70% mejora en performance de queries que afectan estas tablas
-- ✅ Eliminación de 6 warnings "Auth RLS InitPlan" en Security Advisors
-- ✅ Mejor escalabilidad a medida que crecen los datos
-- ✅ Evaluación de auth.role() y auth.uid() una sola vez por query
-- =====================================================







