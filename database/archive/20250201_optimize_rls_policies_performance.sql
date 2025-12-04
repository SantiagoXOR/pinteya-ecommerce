-- =====================================================
-- MIGRACIÓN: OPTIMIZACIÓN PERFORMANCE POLÍTICAS RLS
-- Fecha: OCTUBRE 2025
-- Propósito: Resolver warnings de performance en políticas RLS
-- Problema: auth.<function>() se re-evalúa para cada fila
-- Solución: Usar (select auth.<function>()) para evaluar una sola vez
-- =====================================================

-- TABLA: user_roles
-- Optimizar política: Allow admin modify user_roles
DROP POLICY IF EXISTS "Allow admin modify user_roles" ON public.user_roles;

CREATE POLICY "Allow admin modify user_roles" ON public.user_roles
FOR ALL
TO public
USING (
    EXISTS (
        SELECT 1
        FROM (user_profiles up
            JOIN user_roles ur ON ((up.role_id = ur.id)))
        WHERE (((up.email)::text = ((select auth.jwt()) ->> 'email'::text)) 
            AND ((ur.role_name)::text = 'admin'::text) 
            AND (up.is_active = true))
    )
);

-- TABLA: user_profiles
-- Optimizar política: Allow users read own profile
DROP POLICY IF EXISTS "Allow users read own profile" ON public.user_profiles;

CREATE POLICY "Allow users read own profile" ON public.user_profiles
FOR SELECT
TO public
USING (
    (((email)::text = ((select auth.jwt()) ->> 'email'::text)) 
    OR (EXISTS (
        SELECT 1
        FROM (user_profiles up
            JOIN user_roles ur ON ((up.role_id = ur.id)))
        WHERE (((up.email)::text = ((select auth.jwt()) ->> 'email'::text)) 
            AND ((ur.role_name)::text = ANY ((ARRAY['admin'::character varying, 'moderator'::character varying])::text[])) 
            AND (up.is_active = true))
    )))
);

-- Optimizar política: Allow users update own profile
DROP POLICY IF EXISTS "Allow users update own profile" ON public.user_profiles;

CREATE POLICY "Allow users update own profile" ON public.user_profiles
FOR UPDATE
TO public
USING (((email)::text = ((select auth.jwt()) ->> 'email'::text)))
WITH CHECK (
    (((email)::text = ((select auth.jwt()) ->> 'email'::text)) 
    AND (role_id = (
        SELECT user_profiles_1.role_id
        FROM user_profiles user_profiles_1
        WHERE ((user_profiles_1.email)::text = ((select auth.jwt()) ->> 'email'::text))
    )))
);

-- Optimizar política: Allow admin insert profiles
DROP POLICY IF EXISTS "Allow admin insert profiles" ON public.user_profiles;

CREATE POLICY "Allow admin insert profiles" ON public.user_profiles
FOR INSERT
TO public
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM (user_profiles up
            JOIN user_roles ur ON ((up.role_id = ur.id)))
        WHERE (((up.email)::text = ((select auth.jwt()) ->> 'email'::text)) 
            AND ((ur.role_name)::text = 'admin'::text) 
            AND (up.is_active = true))
    )
);

-- Optimizar política: Allow admin delete profiles
DROP POLICY IF EXISTS "Allow admin delete profiles" ON public.user_profiles;

CREATE POLICY "Allow admin delete profiles" ON public.user_profiles
FOR DELETE
TO public
USING (
    EXISTS (
        SELECT 1
        FROM (user_profiles up
            JOIN user_roles ur ON ((up.role_id = ur.id)))
        WHERE (((up.email)::text = ((select auth.jwt()) ->> 'email'::text)) 
            AND ((ur.role_name)::text = 'admin'::text) 
            AND (up.is_active = true))
    )
);

-- TABLA: user_preferences
-- Optimizar política: Users can view own preferences
DROP POLICY IF EXISTS "Users can view own preferences" ON public.user_preferences;

CREATE POLICY "Users can view own preferences" ON public.user_preferences
FOR SELECT
TO public
USING (((select auth.uid())::text = (user_id)::text));

-- Optimizar otras políticas de user_preferences que también usan auth.uid()
DROP POLICY IF EXISTS "Users can insert own preferences" ON public.user_preferences;

CREATE POLICY "Users can insert own preferences" ON public.user_preferences
FOR INSERT
TO public
WITH CHECK (((select auth.uid())::text = (user_id)::text));

DROP POLICY IF EXISTS "Users can update own preferences" ON public.user_preferences;

CREATE POLICY "Users can update own preferences" ON public.user_preferences
FOR UPDATE
TO public
USING (((select auth.uid())::text = (user_id)::text))
WITH CHECK (((select auth.uid())::text = (user_id)::text));

DROP POLICY IF EXISTS "Users can delete own preferences" ON public.user_preferences;

CREATE POLICY "Users can delete own preferences" ON public.user_preferences
FOR DELETE
TO public
USING (((select auth.uid())::text = (user_id)::text));

-- Verificación de que las políticas fueron creadas correctamente
DO $$
DECLARE
    policy_count integer;
BEGIN
    -- Verificar políticas de user_roles
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'user_roles'
    AND policyname = 'Allow admin modify user_roles';
    
    IF policy_count != 1 THEN
        RAISE EXCEPTION 'Política user_roles no creada correctamente';
    END IF;
    
    -- Verificar políticas de user_profiles
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'user_profiles'
    AND policyname IN (
        'Allow users read own profile',
        'Allow users update own profile', 
        'Allow admin insert profiles',
        'Allow admin delete profiles'
    );
    
    IF policy_count != 4 THEN
        RAISE EXCEPTION 'Políticas user_profiles no creadas correctamente. Encontradas: %', policy_count;
    END IF;
    
    -- Verificar políticas de user_preferences
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'user_preferences'
    AND policyname IN (
        'Users can view own preferences',
        'Users can insert own preferences',
        'Users can update own preferences',
        'Users can delete own preferences'
    );
    
    IF policy_count != 4 THEN
        RAISE EXCEPTION 'Políticas user_preferences no creadas correctamente. Encontradas: %', policy_count;
    END IF;
    
    RAISE NOTICE 'Todas las políticas RLS optimizadas exitosamente';
END;
$$;

-- Comentarios de documentación
COMMENT ON TABLE public.user_roles IS 'Tabla de roles - Políticas RLS optimizadas para performance';
COMMENT ON TABLE public.user_profiles IS 'Tabla de perfiles - Políticas RLS optimizadas para performance';
COMMENT ON TABLE public.user_preferences IS 'Tabla de preferencias - Políticas RLS optimizadas para performance';

-- =====================================================
-- RESUMEN DE OPTIMIZACIÓN
-- =====================================================

/*
PROBLEMAS RESUELTOS:

✅ PERFORMANCE RLS EN user_roles
   - Política "Allow admin modify user_roles" optimizada
   - auth.jwt() → (select auth.jwt())

✅ PERFORMANCE RLS EN user_profiles  
   - 4 políticas optimizadas:
     * Allow users read own profile
     * Allow users update own profile
     * Allow admin insert profiles
     * Allow admin delete profiles
   - auth.jwt() → (select auth.jwt())

✅ PERFORMANCE RLS EN user_preferences
   - 4 políticas optimizadas:
     * Users can view own preferences
     * Users can insert own preferences
     * Users can update own preferences
     * Users can delete own preferences
   - auth.uid() → (select auth.uid())

BENEFICIOS:
- Funciones auth se evalúan una sola vez por query
- Mejora significativa de performance en consultas con muchas filas
- Eliminación de warnings de Supabase Database Linter
- Mantenimiento de la misma funcionalidad de seguridad

ESTADO: WARNINGS DE PERFORMANCE RLS RESUELTOS
*/

-- =====================================================
-- FIN DE MIGRACIÓN
-- =====================================================