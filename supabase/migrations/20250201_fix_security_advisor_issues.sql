-- =====================================================
-- MIGRACIÓN: CORRECCIÓN DE PROBLEMAS DE SEGURIDAD
-- Fecha: FEBRERO 2025
-- Propósito: Resolver todos los problemas identificados por Supabase Security Advisor
-- =====================================================

-- PROBLEMA 1: RLS DESHABILITADO EN TABLA SHIPMENTS (ERROR CRÍTICO)
-- =====================================================

-- Habilitar RLS en la tabla shipments
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;

-- Crear políticas RLS para la tabla shipments
-- Política para administradores (acceso completo)
CREATE POLICY "shipments_admin_all" ON public.shipments
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = auth.uid()
            AND ur.role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = auth.uid()
            AND ur.role = 'admin'
        )
    );

-- Política para conductores (solo sus envíos asignados)
CREATE POLICY "shipments_driver_select" ON public.shipments
    FOR SELECT
    TO authenticated
    USING (
        driver_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.drivers d
            WHERE d.user_id = auth.uid()
            AND d.id = shipments.driver_id
        )
    );

-- Política para usuarios (solo sus propios envíos)
CREATE POLICY "shipments_user_select" ON public.shipments
    FOR SELECT
    TO authenticated
    USING (
        user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.orders o
            WHERE o.user_id = auth.uid()
            AND o.id = shipments.order_id
        )
    );

-- PROBLEMA 2: FUNCIONES CON SEARCH_PATH MUTABLE
-- =====================================================

-- Corregir get_logistics_stats
CREATE OR REPLACE FUNCTION public.get_logistics_stats()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    stats json;
BEGIN
    SELECT json_build_object(
        'total_drivers', (SELECT COUNT(*) FROM public.drivers),
        'active_drivers', (SELECT COUNT(*) FROM public.drivers WHERE is_active = true),
        'total_routes', (SELECT COUNT(*) FROM public.optimized_routes),
        'pending_deliveries', (SELECT COUNT(*) FROM public.orders WHERE status = 'pending'),
        'completed_deliveries', (SELECT COUNT(*) FROM public.orders WHERE status = 'delivered'),
        'total_alerts', (SELECT COUNT(*) FROM public.logistics_alerts WHERE resolved = false)
    ) INTO stats;
    
    RETURN stats;
END;
$$;

-- Corregir update_brand_colors_updated_at
CREATE OR REPLACE FUNCTION public.update_brand_colors_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Corregir update_cart_items_updated_at
CREATE OR REPLACE FUNCTION public.update_cart_items_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Corregir update_site_configuration_updated_at
CREATE OR REPLACE FUNCTION public.update_site_configuration_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Corregir _policy_exists
CREATE OR REPLACE FUNCTION public._policy_exists(policy_name text, table_name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    policy_count integer;
BEGIN
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = table_name
    AND policyname = policy_name;
    
    RETURN policy_count > 0;
END;
$$;

-- PROBLEMA 3: VISTA MATERIALIZADA ACCESIBLE POR ROLES ANON/AUTHENTICATED
-- =====================================================

-- Revocar acceso a la vista materializada analytics_daily_stats
REVOKE SELECT ON public.analytics_daily_stats FROM public, anon, authenticated;

-- Otorgar acceso solo a administradores
GRANT SELECT ON public.analytics_daily_stats TO service_role;

-- Crear función segura para acceder a las estadísticas diarias
CREATE OR REPLACE FUNCTION public.get_analytics_daily_stats(
    start_date date DEFAULT NULL,
    end_date date DEFAULT NULL
)
RETURNS TABLE (
    date date,
    total_events bigint,
    unique_users bigint,
    page_views bigint,
    conversions bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    -- Verificar que el usuario es administrador
    IF NOT EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = auth.uid()
        AND ur.role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Access denied. Admin role required.';
    END IF;
    
    RETURN QUERY
    SELECT 
        ads.date,
        ads.total_events,
        ads.unique_users,
        ads.page_views,
        ads.conversions
    FROM public.analytics_daily_stats ads
    WHERE (start_date IS NULL OR ads.date >= start_date)
    AND (end_date IS NULL OR ads.date <= end_date)
    ORDER BY ads.date DESC;
END;
$$;

-- =====================================================
-- VERIFICACIÓN DE CORRECCIONES APLICADAS
-- =====================================================

-- Verificar que RLS está habilitado en shipments
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'shipments' 
        AND rowsecurity = true
    ) THEN
        RAISE EXCEPTION 'ERROR: RLS no está habilitado en la tabla shipments';
    END IF;
    
    RAISE NOTICE 'SUCCESS: RLS habilitado correctamente en la tabla shipments';
END;
$$;

-- Verificar que las políticas RLS fueron creadas
DO $$
DECLARE
    policy_count integer;
BEGIN
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'shipments';
    
    IF policy_count < 3 THEN
        RAISE EXCEPTION 'ERROR: No se crearon suficientes políticas RLS para shipments (esperadas: 3, encontradas: %)', policy_count;
    END IF;
    
    RAISE NOTICE 'SUCCESS: % políticas RLS creadas para la tabla shipments', policy_count;
END;
$$;

-- Verificar que las funciones tienen search_path configurado
DO $$
DECLARE
    func_record record;
    fixed_functions text[] := ARRAY[
        'get_logistics_stats',
        'update_brand_colors_updated_at',
        'update_cart_items_updated_at',
        'update_site_configuration_updated_at',
        '_policy_exists'
    ];
    func_name text;
BEGIN
    FOREACH func_name IN ARRAY fixed_functions
    LOOP
        SELECT prosecdef, proconfig INTO func_record
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
        AND p.proname = func_name;
        
        IF NOT FOUND THEN
            RAISE EXCEPTION 'ERROR: Función % no encontrada', func_name;
        END IF;
        
        IF NOT func_record.prosecdef THEN
            RAISE EXCEPTION 'ERROR: Función % no tiene SECURITY DEFINER', func_name;
        END IF;
        
        IF func_record.proconfig IS NULL OR NOT ('search_path=' = ANY(func_record.proconfig)) THEN
            RAISE EXCEPTION 'ERROR: Función % no tiene search_path configurado', func_name;
        END IF;
        
        RAISE NOTICE 'SUCCESS: Función % corregida correctamente', func_name;
    END LOOP;
END;
$$;

-- Verificar que la vista materializada está protegida
DO $$
DECLARE
    has_anon_access boolean := false;
    has_auth_access boolean := false;
BEGIN
    -- Verificar acceso de anon
    SELECT has_table_privilege('anon', 'public.analytics_daily_stats', 'SELECT') INTO has_anon_access;
    
    -- Verificar acceso de authenticated
    SELECT has_table_privilege('authenticated', 'public.analytics_daily_stats', 'SELECT') INTO has_auth_access;
    
    IF has_anon_access OR has_auth_access THEN
        RAISE EXCEPTION 'ERROR: La vista analytics_daily_stats aún es accesible por roles no autorizados';
    END IF;
    
    RAISE NOTICE 'SUCCESS: Vista materializada analytics_daily_stats protegida correctamente';
END;
$$;

-- Verificar que la función de acceso seguro existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
        AND p.proname = 'get_analytics_daily_stats'
    ) THEN
        RAISE EXCEPTION 'ERROR: Función get_analytics_daily_stats no fue creada';
    END IF;
    
    RAISE NOTICE 'SUCCESS: Función de acceso seguro get_analytics_daily_stats creada correctamente';
END;
$$;

-- =====================================================
-- DOCUMENTACIÓN DE CORRECCIONES
-- =====================================================

COMMENT ON TABLE public.shipments IS 'Tabla de envíos con RLS habilitado. Políticas: admin (ALL), driver (SELECT propios), user (SELECT propios)';

COMMENT ON FUNCTION public.get_logistics_stats() IS 'Función corregida con search_path='''' para prevenir ataques de inyección de esquema';

COMMENT ON FUNCTION public.update_brand_colors_updated_at() IS 'Trigger function corregida con search_path='''' para seguridad';

COMMENT ON FUNCTION public.update_cart_items_updated_at() IS 'Trigger function corregida con search_path='''' para seguridad';

COMMENT ON FUNCTION public.update_site_configuration_updated_at() IS 'Trigger function corregida con search_path='''' para seguridad';

COMMENT ON FUNCTION public._policy_exists(text, text) IS 'Función utilitaria corregida con search_path='''' para seguridad';

COMMENT ON FUNCTION public.get_analytics_daily_stats(date, date) IS 'Función segura para acceder a analytics_daily_stats - solo administradores';

-- =====================================================
-- RESUMEN DE CORRECCIONES APLICADAS
-- =====================================================

/*
PROBLEMAS RESUELTOS:

1. ✅ RLS DESHABILITADO EN PUBLIC.SHIPMENTS (ERROR CRÍTICO)
   - RLS habilitado en la tabla shipments
   - 3 políticas RLS creadas: admin_all, driver_select, user_select
   - Acceso controlado por roles y relaciones

2. ✅ FUNCIONES CON SEARCH_PATH MUTABLE (5 WARNINGS)
   - get_logistics_stats: search_path='' configurado
   - update_brand_colors_updated_at: search_path='' configurado
   - update_cart_items_updated_at: search_path='' configurado
   - update_site_configuration_updated_at: search_path='' configurado
   - _policy_exists: search_path='' configurado

3. ✅ VISTA MATERIALIZADA ACCESIBLE POR ANON/AUTHENTICATED (WARNING)
   - Acceso revocado para roles anon y authenticated
   - Función segura get_analytics_daily_stats() creada
   - Solo administradores pueden acceder a los datos

ESTADO: TODOS LOS PROBLEMAS DE SEGURIDAD RESUELTOS
PRÓXIMO PASO: Ejecutar esta migración en el entorno de producción
*/