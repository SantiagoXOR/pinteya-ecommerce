-- =====================================================
-- CORRECCIÓN DE FUNCIONES CON SEARCH_PATH MUTABLE - VERSIÓN CORREGIDA
-- Fecha: OCTUBRE 2025
-- Propósito: Resolver problemas de seguridad identificados por Supabase Security Advisor
-- NOTA: Esta versión resuelve conflictos de tipos de retorno con funciones existentes
-- =====================================================

-- PASO 1: ELIMINAR FUNCIONES CONFLICTIVAS EXISTENTES
-- =====================================================

-- Eliminar funciones con conflictos de argumentos/tipos de retorno
DROP FUNCTION IF EXISTS public.get_user_by_account(text, text);
DROP FUNCTION IF EXISTS public.get_user_by_email(text);
DROP FUNCTION IF EXISTS public.create_nextauth_user(uuid, text, text, timestamp with time zone, text);
DROP FUNCTION IF EXISTS public.link_account(json);
DROP FUNCTION IF EXISTS public.get_user_role(text);
DROP FUNCTION IF EXISTS public.assign_user_role(text, text, text);
DROP FUNCTION IF EXISTS public.update_product_stock(integer, integer);
DROP FUNCTION IF EXISTS public.get_product_stats();
DROP FUNCTION IF EXISTS public.get_analytics_stats();
DROP FUNCTION IF EXISTS public.get_admin_performance_stats(integer);
DROP FUNCTION IF EXISTS public.cleanup_old_analytics_events(integer);
DROP FUNCTION IF EXISTS public.insert_analytics_event_optimized(text, text, text, text, numeric, text, text, text, text);
DROP FUNCTION IF EXISTS public.migrate_analytics_data();
DROP FUNCTION IF EXISTS public.migrate_products_data();
DROP FUNCTION IF EXISTS public.schedule_analytics_maintenance();
DROP FUNCTION IF EXISTS public.cleanup_old_analytics_simple(integer);
DROP FUNCTION IF EXISTS public.is_admin();

-- PASO 2: CREAR FUNCIONES CORREGIDAS CON TIPOS COMPATIBLES
-- =====================================================

-- 1. FUNCIONES CRÍTICAS DE AUTENTICACIÓN Y USUARIOS
-- =====================================================

-- Corregir get_user_role (cambiar argumentos para evitar conflicto)
CREATE OR REPLACE FUNCTION public.get_user_role(user_uuid uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_role text;
BEGIN
    SELECT role INTO user_role
    FROM public.user_roles
    WHERE user_id = user_uuid;
    
    RETURN COALESCE(user_role, 'customer');
END;
$$;

-- Corregir create_nextauth_user (cambiar argumentos para evitar conflicto)
CREATE OR REPLACE FUNCTION public.create_nextauth_user(
    user_id uuid,
    email text,
    name text DEFAULT NULL,
    image text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.users (id, email, name, image, created_at, updated_at)
    VALUES (user_id, email, name, image, NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        name = EXCLUDED.name,
        image = EXCLUDED.image,
        updated_at = NOW();
    
    RETURN user_id;
END;
$$;

-- Corregir get_user_by_account (cambiar argumentos para evitar conflicto)
CREATE OR REPLACE FUNCTION public.get_user_by_account(
    provider_id text,
    provider_account_id text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_uuid uuid;
BEGIN
    SELECT userId INTO user_uuid
    FROM public.accounts
    WHERE provider = provider_id
    AND providerAccountId = provider_account_id;
    
    RETURN user_uuid;
END;
$$;

-- Corregir get_user_by_email (cambiar argumentos para evitar conflicto)
CREATE OR REPLACE FUNCTION public.get_user_by_email(user_email text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_uuid uuid;
BEGIN
    SELECT id INTO user_uuid
    FROM public.users
    WHERE email = user_email;
    
    RETURN user_uuid;
END;
$$;

-- Corregir assign_user_role (cambiar argumentos para evitar conflicto)
CREATE OR REPLACE FUNCTION public.assign_user_role(
    user_uuid uuid,
    new_role text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.user_roles (user_id, role, created_at, updated_at)
    VALUES (user_uuid, new_role, NOW(), NOW())
    ON CONFLICT (user_id) DO UPDATE SET
        role = EXCLUDED.role,
        updated_at = NOW();
    
    RETURN true;
END;
$$;

-- Corregir is_admin (cambiar argumentos para evitar conflicto)
CREATE OR REPLACE FUNCTION public.is_admin(user_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_role text;
BEGIN
    SELECT role INTO user_role
    FROM public.user_roles
    WHERE user_id = user_uuid;
    
    RETURN (user_role = 'admin');
END;
$$;

-- Corregir link_account (cambiar argumentos para evitar conflicto)
CREATE OR REPLACE FUNCTION public.link_account(
    user_uuid uuid,
    provider_name text,
    provider_account_id text,
    access_token text DEFAULT NULL,
    refresh_token text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    account_id uuid;
BEGIN
    INSERT INTO public.accounts (
        id, userId, type, provider, providerAccountId,
        access_token, refresh_token, created_at, updated_at
    )
    VALUES (
        gen_random_uuid(), user_uuid, 'oauth', provider_name, provider_account_id,
        access_token, refresh_token, NOW(), NOW()
    )
    RETURNING id INTO account_id;
    
    RETURN account_id;
END;
$$;

-- 2. FUNCIONES DE PRODUCTOS Y STOCK
-- =====================================================

-- Corregir update_product_stock (cambiar argumentos para evitar conflicto)
CREATE OR REPLACE FUNCTION public.update_product_stock(
    product_uuid uuid,
    quantity_change integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.products
    SET 
        stock = stock + quantity_change,
        updated_at = NOW()
    WHERE id = product_uuid
    AND (stock + quantity_change) >= 0;
    
    RETURN FOUND;
END;
$$;

-- Corregir get_product_stats (cambiar tipo de retorno para evitar conflicto)
CREATE OR REPLACE FUNCTION public.get_product_stats()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    stats json;
BEGIN
    SELECT json_build_object(
        'total_products', COUNT(*),
        'active_products', COUNT(*) FILTER (WHERE is_active = true),
        'out_of_stock', COUNT(*) FILTER (WHERE stock = 0),
        'low_stock', COUNT(*) FILTER (WHERE stock > 0 AND stock <= 10),
        'avg_price', ROUND(AVG(price), 2),
        'total_value', ROUND(SUM(price * stock), 2)
    ) INTO stats
    FROM public.products;
    
    RETURN stats;
END;
$$;

-- Corregir migrate_products_data (cambiar tipo de retorno para evitar conflicto)
CREATE OR REPLACE FUNCTION public.migrate_products_data()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Migración de datos de productos si es necesario
    -- Esta función se puede personalizar según las necesidades específicas
    
    UPDATE public.products
    SET updated_at = NOW()
    WHERE updated_at IS NULL;
    
    RETURN true;
END;
$$;

-- 3. FUNCIONES DE ANALYTICS
-- =====================================================

-- Corregir insert_analytics_event_optimized (cambiar argumentos para evitar conflicto)
CREATE OR REPLACE FUNCTION public.insert_analytics_event_optimized(
    event_type text,
    user_uuid uuid DEFAULT NULL,
    session_id text DEFAULT NULL,
    page_url text DEFAULT NULL,
    event_data jsonb DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    event_id uuid;
BEGIN
    INSERT INTO public.analytics_events (
        id, event_type, user_id, session_id, page_url, event_data, created_at
    )
    VALUES (
        gen_random_uuid(), event_type, user_uuid, session_id, page_url, event_data, NOW()
    )
    RETURNING id INTO event_id;
    
    RETURN event_id;
END;
$$;

-- Corregir get_analytics_stats (cambiar argumentos para evitar conflicto)
CREATE OR REPLACE FUNCTION public.get_analytics_stats(
    start_date timestamp DEFAULT NULL,
    end_date timestamp DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    stats json;
    date_filter_start timestamp;
    date_filter_end timestamp;
BEGIN
    date_filter_start := COALESCE(start_date, NOW() - INTERVAL '30 days');
    date_filter_end := COALESCE(end_date, NOW());
    
    SELECT json_build_object(
        'total_events', COUNT(*),
        'unique_users', COUNT(DISTINCT user_id),
        'unique_sessions', COUNT(DISTINCT session_id),
        'page_views', COUNT(*) FILTER (WHERE event_type = 'page_view'),
        'clicks', COUNT(*) FILTER (WHERE event_type = 'click'),
        'conversions', COUNT(*) FILTER (WHERE event_type = 'conversion')
    ) INTO stats
    FROM public.analytics_events
    WHERE created_at BETWEEN date_filter_start AND date_filter_end;
    
    RETURN stats;
END;
$$;

-- Corregir cleanup_old_analytics_events (cambiar argumentos para evitar conflicto)
CREATE OR REPLACE FUNCTION public.cleanup_old_analytics_events(
    days_to_keep integer DEFAULT 90
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    deleted_count integer;
BEGIN
    DELETE FROM public.analytics_events
    WHERE created_at < NOW() - (days_to_keep || ' days')::interval;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$;

-- Corregir cleanup_old_analytics_simple (cambiar argumentos para evitar conflicto)
CREATE OR REPLACE FUNCTION public.cleanup_old_analytics_simple()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN public.cleanup_old_analytics_events(90);
END;
$$;

-- Corregir migrate_analytics_data (cambiar tipo de retorno para evitar conflicto)
CREATE OR REPLACE FUNCTION public.migrate_analytics_data()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Migración de datos de analytics si es necesario
    -- Esta función se puede personalizar según las necesidades específicas
    
    UPDATE public.analytics_events
    SET created_at = COALESCE(created_at, NOW())
    WHERE created_at IS NULL;
    
    RETURN true;
END;
$$;

-- Corregir schedule_analytics_maintenance (cambiar tipo de retorno para evitar conflicto)
CREATE OR REPLACE FUNCTION public.schedule_analytics_maintenance()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Programar mantenimiento de analytics
    PERFORM public.cleanup_old_analytics_events(90);
    
    -- Actualizar estadísticas de tablas
    ANALYZE public.analytics_events;
    ANALYZE public.analytics_metrics_daily;
    
    RETURN true;
END;
$$;

-- 4. FUNCIONES DE LOGÍSTICA
-- =====================================================

-- Corregir get_logistics_stats (mantener tipo json que ya coincide)
CREATE OR REPLACE FUNCTION public.get_logistics_stats()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    stats json;
BEGIN
    SELECT json_build_object(
        'total_drivers', (SELECT COUNT(*) FROM public.logistics_drivers),
        'active_drivers', (SELECT COUNT(*) FROM public.logistics_drivers WHERE is_active = true),
        'total_routes', (SELECT COUNT(*) FROM public.optimized_routes),
        'pending_deliveries', (SELECT COUNT(*) FROM public.orders WHERE status = 'pending'),
        'completed_deliveries', (SELECT COUNT(*) FROM public.orders WHERE status = 'delivered'),
        'total_alerts', (SELECT COUNT(*) FROM public.logistics_alerts WHERE resolved = false)
    ) INTO stats;
    
    RETURN stats;
END;
$$;

-- 5. FUNCIONES DE CONFIGURACIÓN Y TRIGGERS (mantener como están - ya son trigger)
-- =====================================================

-- Corregir update_updated_at_column (mantener trigger)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Corregir update_site_configuration_updated_at (mantener trigger)
CREATE OR REPLACE FUNCTION public.update_site_configuration_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Corregir update_cart_items_updated_at (mantener trigger)
CREATE OR REPLACE FUNCTION public.update_cart_items_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Corregir update_brand_colors_updated_at (mantener trigger)
CREATE OR REPLACE FUNCTION public.update_brand_colors_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- 6. FUNCIONES DE PERFORMANCE Y ESTADÍSTICAS
-- =====================================================

-- Corregir get_admin_performance_stats (cambiar argumentos para evitar conflicto)
CREATE OR REPLACE FUNCTION public.get_admin_performance_stats()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    stats json;
BEGIN
    SELECT json_build_object(
        'database_size', pg_size_pretty(pg_database_size(current_database())),
        'total_tables', (
            SELECT COUNT(*) 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        ),
        'total_functions', (
            SELECT COUNT(*) 
            FROM information_schema.routines 
            WHERE routine_schema = 'public'
        ),
        'active_connections', (
            SELECT COUNT(*) 
            FROM pg_stat_activity 
            WHERE state = 'active'
        )
    ) INTO stats;
    
    RETURN stats;
END;
$$;

-- 7. COMENTARIOS Y DOCUMENTACIÓN
-- =====================================================

COMMENT ON FUNCTION public.get_user_role(uuid) IS 
'Función segura para obtener el rol de un usuario con search_path fijo';

COMMENT ON FUNCTION public.create_nextauth_user(uuid, text, text, text) IS 
'Función segura para crear usuarios de NextAuth.js con search_path fijo';

COMMENT ON FUNCTION public.update_product_stock(uuid, integer) IS 
'Función segura para actualizar stock de productos con search_path fijo';

COMMENT ON FUNCTION public.insert_analytics_event_optimized(text, uuid, text, text, jsonb) IS 
'Función segura para insertar eventos de analytics con search_path fijo';

COMMENT ON FUNCTION public.get_logistics_stats() IS 
'Función segura para obtener estadísticas de logística con search_path fijo';

-- =====================================================
-- FIN DE CORRECCIONES DE FUNCIONES - VERSIÓN CORREGIDA
-- =====================================================