-- =====================================================
-- CORRECCIÓN FINAL DE FUNCIONES CON MANEJO DE DEPENDENCIAS
-- Fecha: OCTUBRE 2025
-- Propósito: Resolver problemas de seguridad manejando dependencias RLS correctamente
-- =====================================================

-- PASO 1: DESHABILITAR TEMPORALMENTE RLS EN TABLAS AFECTADAS
-- =====================================================

-- Deshabilitar RLS temporalmente para poder recrear funciones
ALTER TABLE public.admin_performance_metrics DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_security_alerts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;

-- PASO 2: ELIMINAR POLÍTICAS QUE DEPENDEN DE FUNCIONES
-- =====================================================

-- Eliminar políticas que usan is_admin()
DROP POLICY IF EXISTS "Allow admin read admin_performance_metrics" ON public.admin_performance_metrics;
DROP POLICY IF EXISTS "Allow admin read admin_security_alerts" ON public.admin_security_alerts;
DROP POLICY IF EXISTS "Allow admin update admin_security_alerts" ON public.admin_security_alerts;
DROP POLICY IF EXISTS "Admin only delete for categories" ON public.categories;
DROP POLICY IF EXISTS "Admin only update for categories" ON public.categories;
DROP POLICY IF EXISTS "Admin only insert for categories" ON public.categories;
DROP POLICY IF EXISTS "Admin only delete for products" ON public.products;
DROP POLICY IF EXISTS "Admin only update for products" ON public.products;
DROP POLICY IF EXISTS "Admin only insert for products" ON public.products;

-- PASO 3: ELIMINAR FUNCIONES CONFLICTIVAS
-- =====================================================

-- Ahora podemos eliminar las funciones sin problemas de dependencias
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

-- PASO 4: CREAR FUNCIONES CORREGIDAS
-- =====================================================

-- 1. Función is_admin corregida (CRÍTICA - debe crearse primero)
CREATE OR REPLACE FUNCTION public.is_admin(user_uuid uuid DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_role text;
    current_user_id uuid;
BEGIN
    -- Si no se proporciona user_uuid, usar el usuario actual de la sesión
    IF user_uuid IS NULL THEN
        -- Intentar obtener el user_id de auth.users() si existe
        SELECT auth.uid() INTO current_user_id;
        IF current_user_id IS NULL THEN
            RETURN false;
        END IF;
    ELSE
        current_user_id := user_uuid;
    END IF;
    
    SELECT role INTO user_role
    FROM public.user_roles
    WHERE user_id = current_user_id;
    
    RETURN (user_role = 'admin');
END;
$$;

-- 2. Función get_user_role corregida
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

-- 3. Funciones de autenticación
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

-- 4. Funciones de productos
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

-- 5. Funciones de analytics
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

-- 6. Funciones adicionales
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

-- Funciones de triggers
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

-- PASO 5: RECREAR POLÍTICAS RLS CON FUNCIONES CORREGIDAS
-- =====================================================

-- Habilitar RLS nuevamente
ALTER TABLE public.admin_performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_security_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Recrear políticas para admin_performance_metrics
CREATE POLICY "Allow admin read admin_performance_metrics" ON public.admin_performance_metrics
    FOR SELECT USING (public.is_admin());

-- Recrear políticas para admin_security_alerts
CREATE POLICY "Allow admin read admin_security_alerts" ON public.admin_security_alerts
    FOR SELECT USING (public.is_admin());

CREATE POLICY "Allow admin update admin_security_alerts" ON public.admin_security_alerts
    FOR UPDATE USING (public.is_admin());

-- Recrear políticas para categories
CREATE POLICY "Admin only insert for categories" ON public.categories
    FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "Admin only update for categories" ON public.categories
    FOR UPDATE USING (public.is_admin());

CREATE POLICY "Admin only delete for categories" ON public.categories
    FOR DELETE USING (public.is_admin());

-- Recrear políticas para products
CREATE POLICY "Admin only insert for products" ON public.products
    FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "Admin only update for products" ON public.products
    FOR UPDATE USING (public.is_admin());

CREATE POLICY "Admin only delete for products" ON public.products
    FOR DELETE USING (public.is_admin());

-- PASO 6: COMENTARIOS Y DOCUMENTACIÓN
-- =====================================================

COMMENT ON FUNCTION public.is_admin(uuid) IS 
'Función segura para verificar si un usuario es admin - CRÍTICA para RLS policies';

COMMENT ON FUNCTION public.get_user_role(uuid) IS 
'Función segura para obtener el rol de un usuario con search_path fijo';

COMMENT ON FUNCTION public.create_nextauth_user(uuid, text, text, text) IS 
'Función segura para crear usuarios de NextAuth.js con search_path fijo';

-- =====================================================
-- SCRIPT COMPLETADO - MANEJO CORRECTO DE DEPENDENCIAS
-- =====================================================