-- ===================================
-- LIMPIEZA DE TABLAS OBSOLETAS (REVISADA) - PINTEYA E-COMMERCE
-- ===================================
-- Fecha: 8 de Noviembre, 2025
-- Descripción: Eliminar SOLO tablas obsoletas que NO se usan
--
-- ⚠️ IMPORTANTE: Este script elimina datos permanentemente
-- Se recomienda hacer backup antes de ejecutar
--
-- TABLAS A ELIMINAR (CONFIRMADAS COMO OBSOLETAS):
-- 1. profiles (reemplazada por user_profiles con NextAuth)
-- 2. user_sessions, user_activity, user_security_settings, user_security_alerts (Supabase Auth obsoleto)
--
-- TABLAS MANTENIDAS (EN USO ACTIVO):
-- ✅ products_optimized, product_brands - Usadas por APIs de optimización
-- ✅ analytics_events_optimized + tablas lookup - Usadas activamente (4,820 eventos)

-- ===================================
-- PASO 1: VERIFICACIÓN PRE-ELIMINACIÓN
-- ===================================

DO $$
BEGIN
    RAISE NOTICE '=== INICIANDO LIMPIEZA DE TABLAS OBSOLETAS (REVISADA) ===';
    RAISE NOTICE '';
    RAISE NOTICE 'Verificando existencia de tablas obsoletas...';
    
    -- Verificar tabla profiles
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
        RAISE NOTICE '✓ profiles existe - será eliminada (reemplazada por user_profiles)';
    ELSE
        RAISE NOTICE '○ profiles no existe - ya eliminada';
    END IF;
    
    -- Verificar tablas de sesiones y seguridad Supabase Auth
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_sessions') THEN
        RAISE NOTICE '✓ user_sessions existe - será eliminada (Supabase Auth obsoleto)';
    ELSE
        RAISE NOTICE '○ user_sessions no existe - ya eliminada';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_activity') THEN
        RAISE NOTICE '✓ user_activity existe - será eliminada (Supabase Auth obsoleto)';
    ELSE
        RAISE NOTICE '○ user_activity no existe - ya eliminada';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_security_settings') THEN
        RAISE NOTICE '✓ user_security_settings existe - será eliminada (Supabase Auth obsoleto)';
    ELSE
        RAISE NOTICE '○ user_security_settings no existe - ya eliminada';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_security_alerts') THEN
        RAISE NOTICE '✓ user_security_alerts existe - será eliminada (Supabase Auth obsoleto)';
    ELSE
        RAISE NOTICE '○ user_security_alerts no existe - ya eliminada';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '=== TABLAS EN USO ACTIVO (MANTENIDAS) ===';
    RAISE NOTICE '✅ products_optimized - 53 productos, usado por APIs de optimización';
    RAISE NOTICE '✅ product_brands - Tabla lookup activa';
    RAISE NOTICE '✅ analytics_events_optimized - 4,820 eventos, en uso activo';
    RAISE NOTICE '✅ analytics_event_types, analytics_categories, analytics_actions, analytics_pages, analytics_browsers - Tablas lookup activas';
    RAISE NOTICE '';
END $$;

-- ===================================
-- PASO 2: BACKUP DE SEGURIDAD (OPCIONAL)
-- ===================================

DO $$
DECLARE
    profile_count INTEGER := 0;
    sessions_count INTEGER := 0;
    activity_count INTEGER := 0;
    alerts_count INTEGER := 0;
BEGIN
    -- Verificar si profiles tiene datos
    BEGIN
        SELECT COUNT(*) INTO profile_count FROM profiles WHERE true;
        IF profile_count > 0 THEN
            RAISE NOTICE 'ADVERTENCIA: profiles tiene % registros - Considere migrar a user_profiles si son necesarios', profile_count;
        END IF;
    EXCEPTION
        WHEN undefined_table THEN
            RAISE NOTICE 'profiles no existe';
    END;
    
    -- Verificar si user_sessions tiene datos
    BEGIN
        SELECT COUNT(*) INTO sessions_count FROM user_sessions WHERE true;
        IF sessions_count > 0 THEN
            RAISE NOTICE 'ADVERTENCIA: user_sessions tiene % registros', sessions_count;
        END IF;
    EXCEPTION
        WHEN undefined_table THEN
            RAISE NOTICE 'user_sessions no existe';
    END;
    
    -- Verificar si user_activity tiene datos
    BEGIN
        SELECT COUNT(*) INTO activity_count FROM user_activity WHERE true;
        IF activity_count > 0 THEN
            RAISE NOTICE 'INFO: user_activity tiene % registros', activity_count;
        END IF;
    EXCEPTION
        WHEN undefined_table THEN
            RAISE NOTICE 'user_activity no existe';
    END;
    
    -- Verificar si user_security_alerts tiene datos
    BEGIN
        SELECT COUNT(*) INTO alerts_count FROM user_security_alerts WHERE true;
        IF alerts_count > 0 THEN
            RAISE NOTICE 'INFO: user_security_alerts tiene % registros', alerts_count;
        END IF;
    EXCEPTION
        WHEN undefined_table THEN
            RAISE NOTICE 'user_security_alerts no existe';
    END;
    
    RAISE NOTICE '';
END $$;

-- ===================================
-- PASO 3: ELIMINAR TABLA PROFILES OBSOLETA (Supabase Auth)
-- ===================================

-- Eliminar triggers primero
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Eliminar funciones relacionadas
DROP FUNCTION IF EXISTS public.handle_updated_at() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Eliminar políticas RLS
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

-- Eliminar tabla
DROP TABLE IF EXISTS public.profiles CASCADE;

-- ===================================
-- PASO 4: ELIMINAR TABLAS DE SESIONES Y SEGURIDAD OBSOLETAS
-- ===================================

-- Eliminar triggers
DROP TRIGGER IF EXISTS detect_suspicious_activity_trigger ON user_sessions;
DROP TRIGGER IF EXISTS update_user_security_settings_updated_at ON user_security_settings;

-- Eliminar funciones
DROP FUNCTION IF EXISTS detect_suspicious_activity() CASCADE;
DROP FUNCTION IF EXISTS cleanup_expired_sessions() CASCADE;
DROP FUNCTION IF EXISTS cleanup_old_activity() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Eliminar políticas RLS de user_sessions
DROP POLICY IF EXISTS "Users can view their own sessions" ON user_sessions;
DROP POLICY IF EXISTS "Users can insert their own sessions" ON user_sessions;
DROP POLICY IF EXISTS "Users can update their own sessions" ON user_sessions;
DROP POLICY IF EXISTS "Users can delete their own sessions" ON user_sessions;

-- Eliminar políticas RLS de user_activity
DROP POLICY IF EXISTS "Users can view their own activity" ON user_activity;
DROP POLICY IF EXISTS "Users can insert their own activity" ON user_activity;

-- Eliminar políticas RLS de user_security_settings
DROP POLICY IF EXISTS "Users can view their own security settings" ON user_security_settings;
DROP POLICY IF EXISTS "Users can insert their own security settings" ON user_security_settings;
DROP POLICY IF EXISTS "Users can update their own security settings" ON user_security_settings;

-- Eliminar políticas RLS de user_security_alerts
DROP POLICY IF EXISTS "Users can view their own security alerts" ON user_security_alerts;
DROP POLICY IF EXISTS "Users can update their own security alerts" ON user_security_alerts;

-- Eliminar tablas en orden correcto (dependencias primero)
DROP TABLE IF EXISTS user_security_alerts CASCADE;
DROP TABLE IF EXISTS user_activity CASCADE;
DROP TABLE IF EXISTS user_security_settings CASCADE;
DROP TABLE IF EXISTS user_sessions CASCADE;

-- ===================================
-- PASO 5: VERIFICACIÓN POST-ELIMINACIÓN
-- ===================================

DO $$
DECLARE
    remaining_obsolete_tables INTEGER;
    remaining_active_tables INTEGER;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== VERIFICACIÓN POST-ELIMINACIÓN ===';
    RAISE NOTICE '';
    
    -- Verificar que las tablas obsoletas fueron eliminadas
    SELECT COUNT(*) INTO remaining_obsolete_tables
    FROM information_schema.tables 
    WHERE table_schema = 'public'
    AND table_name IN (
        'profiles', 'user_sessions', 'user_activity', 
        'user_security_settings', 'user_security_alerts'
    );
    
    -- Verificar que las tablas activas se mantienen
    SELECT COUNT(*) INTO remaining_active_tables
    FROM information_schema.tables 
    WHERE table_schema = 'public'
    AND table_name IN (
        'products_optimized', 'product_brands', 
        'analytics_events_optimized', 'analytics_event_types',
        'analytics_categories', 'analytics_actions', 
        'analytics_pages', 'analytics_browsers'
    );
    
    IF remaining_obsolete_tables = 0 THEN
        RAISE NOTICE '✓ Todas las tablas obsoletas fueron eliminadas exitosamente';
    ELSE
        RAISE NOTICE '⚠ Quedan % tablas obsoletas sin eliminar', remaining_obsolete_tables;
    END IF;
    
    IF remaining_active_tables >= 8 THEN
        RAISE NOTICE '✓ Todas las tablas activas se mantienen intactas (% tablas)', remaining_active_tables;
    ELSE
        RAISE NOTICE '⚠ ADVERTENCIA: Faltan tablas activas - Se esperaban 8, se encontraron %', remaining_active_tables;
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '=== LIMPIEZA COMPLETADA ===';
    RAISE NOTICE '';
    RAISE NOTICE 'Tablas eliminadas (5 tablas):';
    RAISE NOTICE '  - profiles (Supabase Auth)';
    RAISE NOTICE '  - user_sessions (Supabase Auth)';
    RAISE NOTICE '  - user_activity (Supabase Auth)';
    RAISE NOTICE '  - user_security_settings (Supabase Auth)';
    RAISE NOTICE '  - user_security_alerts (Supabase Auth)';
    RAISE NOTICE '';
    RAISE NOTICE 'Tablas mantenidas (8+ tablas):';
    RAISE NOTICE '  ✅ products_optimized + product_brands (optimización activa)';
    RAISE NOTICE '  ✅ analytics_events_optimized + 5 tablas lookup (analytics activo)';
    RAISE NOTICE '';
    RAISE NOTICE 'Total: 5 tablas obsoletas eliminadas, 8+ tablas activas mantenidas';
END $$;

-- ===================================
-- PASO 6: ANÁLISIS DE ESPACIO LIBERADO
-- ===================================

-- Ejecutar VACUUM para recuperar espacio
VACUUM ANALYZE;

-- ===================================
-- COMENTARIOS FINALES
-- ===================================

COMMENT ON DATABASE postgres IS 'Base de datos Pinteya E-commerce - Limpieza de tablas obsoletas completada (2025-11-08)';

-- Fin del script

