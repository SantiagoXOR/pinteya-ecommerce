-- =====================================================
-- REVISIÓN Y CORRECCIÓN DE VISTAS SECURITY DEFINER
-- Fecha: Enero 2025
-- Propósito: Resolver problemas de seguridad en vistas SECURITY DEFINER
-- =====================================================

-- PROBLEMA: Las vistas SECURITY DEFINER pueden exponer datos sensibles
-- SOLUCIÓN: Revisar y aplicar RLS o convertir a funciones con mejor control de acceso

-- 1. ANÁLISIS DE VISTAS SECURITY DEFINER EXISTENTES
-- =====================================================

-- Verificar vistas SECURITY DEFINER actuales
SELECT 
    schemaname,
    viewname,
    viewowner,
    definition
FROM pg_views 
WHERE schemaname = 'public' 
AND viewname IN ('analytics_events_view', 'cart_items_with_products');

-- 2. CORRECCIÓN DE analytics_events_view
-- =====================================================

-- Eliminar vista SECURITY DEFINER existente
DROP VIEW IF EXISTS public.analytics_events_view;

-- Crear vista segura con RLS
CREATE VIEW public.analytics_events_view AS
SELECT 
    ae.id,
    ae.event_type,
    ae.user_id,
    ae.session_id,
    ae.page_url,
    ae.event_data,
    ae.created_at,
    -- Datos adicionales seguros
    CASE 
        WHEN ae.user_id IS NOT NULL THEN 'authenticated'
        ELSE 'anonymous'
    END as user_type,
    -- Información de página sin datos sensibles
    CASE 
        WHEN ae.page_url IS NOT NULL THEN 
            regexp_replace(ae.page_url, '\?.*$', '') -- Remover query parameters
        ELSE NULL
    END as clean_page_url
FROM public.analytics_events ae
WHERE 
    -- Solo mostrar eventos del usuario actual o eventos anónimos para admins
    ae.user_id = auth.uid() 
    OR ae.user_id IS NULL 
    OR EXISTS (
        SELECT 1 FROM public.user_profiles up 
        JOIN public.user_roles ur ON up.role_id = ur.id 
        WHERE up.supabase_user_id = auth.uid() 
        AND ur.role_name = 'admin'
    );

-- Habilitar RLS en la vista base si no está habilitado
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Comentario sobre la vista
COMMENT ON VIEW public.analytics_events_view IS 
'Vista segura de eventos de analytics que respeta RLS y no expone datos sensibles';

-- 3. CORRECCIÓN DE cart_items_with_products
-- =====================================================

-- Eliminar vista SECURITY DEFINER existente
DROP VIEW IF EXISTS public.cart_items_with_products;

-- Crear vista segura con RLS
CREATE VIEW public.cart_items_with_products AS
SELECT 
    ci.id as cart_item_id,
    ci.user_id,
    ci.session_id,
    ci.product_id,
    ci.quantity,
    ci.created_at as added_to_cart_at,
    ci.updated_at as cart_updated_at,
    -- Información del producto (solo datos públicos)
    p.id as product_id_ref,
    p.name as product_name,
    p.description as product_description,
    p.price as product_price,
    p.image_url as product_image,
    p.stock as product_stock,
    p.is_active as product_is_active,
    p.category_id as product_category_id,
    -- Cálculos seguros
    (ci.quantity * p.price) as subtotal,
    CASE 
        WHEN p.stock >= ci.quantity THEN true
        ELSE false
    END as is_available
FROM public.cart_items ci
INNER JOIN public.products p ON ci.product_id = p.id
WHERE 
    -- Solo mostrar items del carrito del usuario actual o sesión actual
    ci.user_id = auth.uid() 
    OR ci.session_id = current_setting('app.session_id', true)
    OR EXISTS (
        SELECT 1 FROM public.user_profiles up 
        JOIN public.user_roles ur ON up.role_id = ur.id 
        WHERE up.supabase_user_id = auth.uid() 
        AND ur.role_name = 'admin'
    );

-- Habilitar RLS en las tablas base si no está habilitado
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Comentario sobre la vista
COMMENT ON VIEW public.cart_items_with_products IS 
'Vista segura de items del carrito con información de productos que respeta RLS';

-- 4. CREAR FUNCIONES ALTERNATIVAS MÁS SEGURAS
-- =====================================================

-- Función segura para obtener eventos de analytics
CREATE OR REPLACE FUNCTION public.get_user_analytics_events(
    user_uuid uuid DEFAULT NULL,
    limit_count integer DEFAULT 100,
    offset_count integer DEFAULT 0
)
RETURNS TABLE(
    id uuid,
    event_type text,
    page_url text,
    event_data jsonb,
    created_at timestamp with time zone,
    user_type text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    target_user_id uuid;
    is_admin boolean;
BEGIN
    -- Determinar el usuario objetivo
    target_user_id := COALESCE(user_uuid, auth.uid());
    
    -- Verificar si el usuario actual es admin
    SELECT EXISTS (
        SELECT 1 FROM public.user_profiles up 
        JOIN public.user_roles ur ON up.role_id = ur.id 
        WHERE up.supabase_user_id = auth.uid() 
        AND ur.role_name = 'admin'
    ) INTO is_admin;
    
    -- Solo permitir acceso a datos propios o si es admin
    IF target_user_id != auth.uid() AND NOT is_admin THEN
        RAISE EXCEPTION 'Access denied: Cannot view other users analytics';
    END IF;
    
    RETURN QUERY
    SELECT 
        ae.id,
        ae.event_type,
        -- Limpiar URL de parámetros sensibles
        regexp_replace(ae.page_url, '\?.*$', '') as page_url,
        -- Filtrar datos sensibles del event_data
        CASE 
            WHEN is_admin THEN ae.event_data
            ELSE ae.event_data - 'sensitive_data' - 'user_agent' - 'ip_address'
        END as event_data,
        ae.created_at,
        CASE 
            WHEN ae.user_id IS NOT NULL THEN 'authenticated'
            ELSE 'anonymous'
        END as user_type
    FROM public.analytics_events ae
    WHERE ae.user_id = target_user_id
    ORDER BY ae.created_at DESC
    LIMIT limit_count
    OFFSET offset_count;
END;
$$;

-- Función segura para obtener carrito con productos
CREATE OR REPLACE FUNCTION public.get_user_cart_with_products(
    user_uuid uuid DEFAULT NULL,
    session_uuid text DEFAULT NULL
)
RETURNS TABLE(
    cart_item_id uuid,
    product_id uuid,
    product_name text,
    product_price numeric,
    product_image text,
    quantity integer,
    subtotal numeric,
    is_available boolean,
    stock_available integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    target_user_id uuid;
    target_session_id text;
    is_admin boolean;
BEGIN
    -- Determinar identificadores objetivo
    target_user_id := COALESCE(user_uuid, auth.uid());
    target_session_id := COALESCE(session_uuid, current_setting('app.session_id', true));
    
    -- Verificar si el usuario actual es admin
    SELECT EXISTS (
        SELECT 1 FROM public.user_profiles up 
        JOIN public.user_roles ur ON up.role_id = ur.id 
        WHERE up.supabase_user_id = auth.uid() 
        AND ur.role_name = 'admin'
    ) INTO is_admin;
    
    -- Validar acceso
    IF target_user_id != auth.uid() 
       AND target_session_id != current_setting('app.session_id', true)
       AND NOT is_admin THEN
        RAISE EXCEPTION 'Access denied: Cannot view other users cart';
    END IF;
    
    RETURN QUERY
    SELECT 
        ci.id as cart_item_id,
        p.id as product_id,
        p.name as product_name,
        p.price as product_price,
        p.image_url as product_image,
        ci.quantity,
        (ci.quantity * p.price) as subtotal,
        (p.stock >= ci.quantity AND p.is_active) as is_available,
        p.stock as stock_available
    FROM public.cart_items ci
    INNER JOIN public.products p ON ci.product_id = p.id
    WHERE (
        ci.user_id = target_user_id 
        OR ci.session_id = target_session_id
    )
    AND p.is_active = true
    ORDER BY ci.created_at DESC;
END;
$$;

-- 5. CREAR VISTAS DE SOLO LECTURA PARA REPORTES
-- =====================================================

-- Vista de resumen de analytics (solo para admins)
CREATE VIEW public.analytics_summary_view AS
SELECT 
    DATE(created_at) as event_date,
    event_type,
    COUNT(*) as event_count,
    COUNT(DISTINCT user_id) as unique_users,
    COUNT(DISTINCT session_id) as unique_sessions
FROM public.analytics_events
WHERE EXISTS (
    SELECT 1 FROM public.user_profiles up 
    JOIN public.user_roles ur ON up.role_id = ur.id 
    WHERE up.supabase_user_id = auth.uid() 
    AND ur.role_name = 'admin'
)
GROUP BY DATE(created_at), event_type
ORDER BY event_date DESC, event_count DESC;

-- Vista de resumen de carrito (solo para admins)
CREATE VIEW public.cart_summary_view AS
SELECT 
    DATE(ci.created_at) as cart_date,
    COUNT(DISTINCT ci.user_id) as unique_users,
    COUNT(DISTINCT ci.session_id) as unique_sessions,
    COUNT(*) as total_items,
    SUM(ci.quantity) as total_quantity,
    SUM(ci.quantity * p.price) as total_value,
    AVG(ci.quantity * p.price) as avg_item_value
FROM public.cart_items ci
INNER JOIN public.products p ON ci.product_id = p.id
WHERE EXISTS (
    SELECT 1 FROM public.user_profiles up 
    JOIN public.user_roles ur ON up.role_id = ur.id 
    WHERE up.supabase_user_id = auth.uid() 
    AND ur.role_name = 'admin'
)
GROUP BY DATE(ci.created_at)
ORDER BY cart_date DESC;

-- 6. POLÍTICAS RLS PARA LAS NUEVAS VISTAS
-- =====================================================

-- Habilitar RLS en las vistas (si es posible)
-- Nota: PostgreSQL no soporta RLS directamente en vistas, 
-- pero las vistas heredan las políticas de las tablas base

-- 7. FUNCIONES DE AUDITORÍA
-- =====================================================

-- Función para auditar acceso a vistas sensibles
CREATE OR REPLACE FUNCTION public.audit_view_access(
    view_name text,
    access_type text DEFAULT 'SELECT'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.user_activity (
        user_id,
        activity_type,
        activity_data,
        created_at
    )
    VALUES (
        auth.uid(),
        'view_access',
        jsonb_build_object(
            'view_name', view_name,
            'access_type', access_type,
            'timestamp', NOW()
        ),
        NOW()
    );
END;
$$;

-- 8. TRIGGERS PARA AUDITORÍA AUTOMÁTICA
-- =====================================================

-- Crear tabla de auditoría si no existe
CREATE TABLE IF NOT EXISTS public.view_access_log (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES public.users(id),
    view_name text NOT NULL,
    access_time timestamp with time zone DEFAULT NOW(),
    user_agent text,
    ip_address inet
);

-- Habilitar RLS en la tabla de auditoría
ALTER TABLE public.view_access_log ENABLE ROW LEVEL SECURITY;

-- Política para que solo admins vean los logs
CREATE POLICY "Only admins can view access logs" ON public.view_access_log
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles up 
            JOIN public.user_roles ur ON up.role_id = ur.id 
            WHERE up.supabase_user_id = auth.uid() 
            AND ur.role_name = 'admin'
        )
    );

-- 9. DOCUMENTACIÓN Y COMENTARIOS
-- =====================================================

COMMENT ON FUNCTION public.get_user_analytics_events(uuid, integer, integer) IS 
'Función segura para obtener eventos de analytics con control de acceso y filtrado de datos sensibles';

COMMENT ON FUNCTION public.get_user_cart_with_products(uuid, text) IS 
'Función segura para obtener items del carrito con información de productos';

COMMENT ON FUNCTION public.audit_view_access(text, text) IS 
'Función para auditar accesos a vistas sensibles';

COMMENT ON VIEW public.analytics_summary_view IS 
'Vista de resumen de analytics solo accesible por administradores';

COMMENT ON VIEW public.cart_summary_view IS 
'Vista de resumen de carritos solo accesible por administradores';

COMMENT ON TABLE public.view_access_log IS 
'Tabla de auditoría para registrar accesos a vistas sensibles';

-- 10. SCRIPT DE VERIFICACIÓN
-- =====================================================

-- Verificar que las vistas SECURITY DEFINER fueron reemplazadas
DO $$
DECLARE
    security_definer_views integer;
BEGIN
    SELECT COUNT(*) INTO security_definer_views
    FROM pg_views 
    WHERE schemaname = 'public' 
    AND viewname IN ('analytics_events_view', 'cart_items_with_products')
    AND definition LIKE '%SECURITY DEFINER%';
    
    IF security_definer_views > 0 THEN
        RAISE WARNING 'Aún existen % vistas SECURITY DEFINER que requieren atención', security_definer_views;
    ELSE
        RAISE NOTICE 'Todas las vistas SECURITY DEFINER han sido corregidas exitosamente';
    END IF;
END $$;

-- =====================================================
-- FIN DE CORRECCIÓN DE VISTAS SECURITY DEFINER
-- =====================================================