-- Migration: Fix Function Search Path Security
-- Date: 2025-02-01
-- Description: Corrige el search_path mutable en funciones para cumplir con estándares de seguridad enterprise

-- =====================================================
-- FUNCIÓN: get_logistics_stats
-- =====================================================

-- Recrear función con search_path fijo
CREATE OR REPLACE FUNCTION public.get_logistics_stats()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    result json;
BEGIN
    SELECT json_build_object(
        'total_shipments', (SELECT COUNT(*) FROM public.shipments),
        'pending_shipments', (SELECT COUNT(*) FROM public.shipments WHERE status = 'pending'),
        'in_transit_shipments', (SELECT COUNT(*) FROM public.shipments WHERE status = 'in_transit'),
        'delivered_shipments', (SELECT COUNT(*) FROM public.shipments WHERE status = 'delivered'),
        'total_drivers', (SELECT COUNT(*) FROM public.drivers WHERE is_active = true),
        'available_vehicles', (SELECT COUNT(*) FROM public.fleet_vehicles WHERE status = 'available'),
        'active_alerts', (SELECT COUNT(*) FROM public.logistics_alerts WHERE is_resolved = false)
    ) INTO result;
    
    RETURN result;
END;
$$;

-- =====================================================
-- FUNCIÓN: update_brand_colors_updated_at
-- =====================================================

-- Recrear función con search_path fijo
CREATE OR REPLACE FUNCTION public.update_brand_colors_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

-- =====================================================
-- FUNCIÓN: update_cart_items_updated_at
-- =====================================================

-- Recrear función con search_path fijo
CREATE OR REPLACE FUNCTION public.update_cart_items_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

-- =====================================================
-- FUNCIÓN: update_site_configuration_updated_at
-- =====================================================

-- Recrear función con search_path fijo
CREATE OR REPLACE FUNCTION public.update_site_configuration_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

-- =====================================================
-- FUNCIÓN: _policy_exists
-- =====================================================

-- Recrear función con search_path fijo
CREATE OR REPLACE FUNCTION public._policy_exists(
    table_name text,
    policy_name text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    policy_exists boolean := false;
BEGIN
    SELECT EXISTS (
        SELECT 1 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = table_name 
        AND policyname = policy_name
    ) INTO policy_exists;
    
    RETURN policy_exists;
END;
$$;

-- =====================================================
-- COMENTARIOS DE DOCUMENTACIÓN
-- =====================================================

COMMENT ON FUNCTION public.get_logistics_stats() IS 'Función para obtener estadísticas de logística con search_path fijo para seguridad';
COMMENT ON FUNCTION public.update_brand_colors_updated_at() IS 'Trigger function para actualizar updated_at en brand_colors con search_path fijo';
COMMENT ON FUNCTION public.update_cart_items_updated_at() IS 'Trigger function para actualizar updated_at en cart_items con search_path fijo';
COMMENT ON FUNCTION public.update_site_configuration_updated_at() IS 'Trigger function para actualizar updated_at en site_configuration con search_path fijo';
COMMENT ON FUNCTION public._policy_exists(text, text) IS 'Función helper para verificar existencia de políticas RLS con search_path fijo';

-- =====================================================
-- VERIFICACIÓN DE SEGURIDAD
-- =====================================================

-- Verificar que todas las funciones tienen search_path configurado
DO $$
DECLARE
    func_record RECORD;
    func_count INTEGER := 0;
BEGIN
    FOR func_record IN 
        SELECT proname, prosecdef, proconfig
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
        AND proname IN ('get_logistics_stats', 'update_brand_colors_updated_at', 'update_cart_items_updated_at', 'update_site_configuration_updated_at', '_policy_exists')
    LOOP
        func_count := func_count + 1;
        
        -- Verificar que la función tiene SECURITY DEFINER y search_path configurado
        IF func_record.prosecdef = false THEN
            RAISE WARNING 'Función % no tiene SECURITY DEFINER configurado', func_record.proname;
        END IF;
        
        IF func_record.proconfig IS NULL OR NOT ('search_path=public,pg_temp' = ANY(func_record.proconfig)) THEN
            RAISE WARNING 'Función % no tiene search_path configurado correctamente', func_record.proname;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Verificación completada: % funciones procesadas', func_count;
END;
$$;