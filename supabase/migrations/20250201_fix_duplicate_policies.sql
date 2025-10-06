-- Migration: Fix Duplicate Policies Conflict
-- Date: OCTUBRE 2025
-- Description: Resuelve conflictos de políticas duplicadas en tablas de analytics

-- =====================================================
-- ELIMINAR POLÍTICAS EXISTENTES ANTES DE RECREAR
-- =====================================================

-- Eliminar políticas existentes en analytics_categories
DROP POLICY IF EXISTS "Public can view analytics categories" ON public.analytics_categories;
DROP POLICY IF EXISTS "Only admins can modify analytics categories" ON public.analytics_categories;

-- Eliminar políticas existentes en analytics_actions
DROP POLICY IF EXISTS "Public can view analytics actions" ON public.analytics_actions;
DROP POLICY IF EXISTS "Only admins can modify analytics actions" ON public.analytics_actions;

-- Eliminar políticas existentes en analytics_pages
DROP POLICY IF EXISTS "Public can view analytics pages" ON public.analytics_pages;
DROP POLICY IF EXISTS "Only admins can modify analytics pages" ON public.analytics_pages;

-- Eliminar políticas existentes en analytics_browsers
DROP POLICY IF EXISTS "Public can view analytics browsers" ON public.analytics_browsers;
DROP POLICY IF EXISTS "Only admins can modify analytics browsers" ON public.analytics_browsers;

-- Eliminar políticas existentes en analytics_events_optimized
DROP POLICY IF EXISTS "Users can view own analytics events" ON public.analytics_events_optimized;
DROP POLICY IF EXISTS "Admins and moderators can view all analytics events" ON public.analytics_events_optimized;
DROP POLICY IF EXISTS "Users can create own analytics events" ON public.analytics_events_optimized;
DROP POLICY IF EXISTS "Only admins can modify analytics events" ON public.analytics_events_optimized;
DROP POLICY IF EXISTS "Only admins can delete analytics events" ON public.analytics_events_optimized;

-- =====================================================
-- RECREAR POLÍTICAS CON NOMBRES ÚNICOS Y MEJORADOS
-- =====================================================

-- Políticas para analytics_categories
CREATE POLICY "analytics_categories_public_select" ON public.analytics_categories
    FOR SELECT USING (true);

CREATE POLICY "analytics_categories_admin_all" ON public.analytics_categories
    FOR ALL USING (
        public.is_admin()
    );

-- Políticas para analytics_actions
CREATE POLICY "analytics_actions_public_select" ON public.analytics_actions
    FOR SELECT USING (true);

CREATE POLICY "analytics_actions_admin_all" ON public.analytics_actions
    FOR ALL USING (
        public.is_admin()
    );

-- Políticas para analytics_pages
CREATE POLICY "analytics_pages_public_select" ON public.analytics_pages
    FOR SELECT USING (true);

CREATE POLICY "analytics_pages_admin_all" ON public.analytics_pages
    FOR ALL USING (
        public.is_admin()
    );

-- Políticas para analytics_browsers
CREATE POLICY "analytics_browsers_public_select" ON public.analytics_browsers
    FOR SELECT USING (true);

CREATE POLICY "analytics_browsers_admin_all" ON public.analytics_browsers
    FOR ALL USING (
        public.is_admin()
    );

-- Políticas para analytics_events_optimized
-- Política de SELECT: usuarios ven sus eventos, admins/moderadores ven todos
CREATE POLICY "analytics_events_user_select" ON public.analytics_events_optimized
    FOR SELECT USING (
        user_id::text = public.get_current_user_id()::text
        OR public.is_moderator_or_admin()
    );

-- Política de INSERT: usuarios pueden crear sus propios eventos
CREATE POLICY "analytics_events_user_insert" ON public.analytics_events_optimized
    FOR INSERT WITH CHECK (
        user_id::text = public.get_current_user_id()::text
    );

-- Política de UPDATE: solo admins pueden modificar eventos
CREATE POLICY "analytics_events_admin_update" ON public.analytics_events_optimized
    FOR UPDATE USING (
        public.is_admin()
    );

-- Política de DELETE: solo admins pueden eliminar eventos
CREATE POLICY "analytics_events_admin_delete" ON public.analytics_events_optimized
    FOR DELETE USING (
        public.is_admin()
    );

-- =====================================================
-- VERIFICAR QUE RLS ESTÉ HABILITADO
-- =====================================================

-- Verificar y habilitar RLS si no está activo
DO $$
BEGIN
    -- analytics_categories
    IF NOT (SELECT relrowsecurity FROM pg_class WHERE relname = 'analytics_categories') THEN
        ALTER TABLE public.analytics_categories ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'RLS habilitado en analytics_categories';
    END IF;
    
    -- analytics_actions
    IF NOT (SELECT relrowsecurity FROM pg_class WHERE relname = 'analytics_actions') THEN
        ALTER TABLE public.analytics_actions ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'RLS habilitado en analytics_actions';
    END IF;
    
    -- analytics_pages
    IF NOT (SELECT relrowsecurity FROM pg_class WHERE relname = 'analytics_pages') THEN
        ALTER TABLE public.analytics_pages ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'RLS habilitado en analytics_pages';
    END IF;
    
    -- analytics_browsers
    IF NOT (SELECT relrowsecurity FROM pg_class WHERE relname = 'analytics_browsers') THEN
        ALTER TABLE public.analytics_browsers ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'RLS habilitado en analytics_browsers';
    END IF;
    
    -- analytics_events_optimized
    IF NOT (SELECT relrowsecurity FROM pg_class WHERE relname = 'analytics_events_optimized') THEN
        ALTER TABLE public.analytics_events_optimized ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'RLS habilitado en analytics_events_optimized';
    END IF;
    
    RAISE NOTICE 'Verificación de RLS completada para todas las tablas de analytics';
END;
$$;

-- =====================================================
-- COMENTARIOS DE DOCUMENTACIÓN ACTUALIZADOS
-- =====================================================

COMMENT ON TABLE public.analytics_categories IS 'Tabla de categorías de analytics con RLS y políticas optimizadas';
COMMENT ON TABLE public.analytics_actions IS 'Tabla de acciones de analytics con RLS y políticas optimizadas';
COMMENT ON TABLE public.analytics_pages IS 'Tabla de páginas de analytics con RLS y políticas optimizadas';
COMMENT ON TABLE public.analytics_browsers IS 'Tabla de navegadores de analytics con RLS y políticas optimizadas';
COMMENT ON TABLE public.analytics_events_optimized IS 'Tabla de eventos de analytics optimizada con RLS y políticas granulares';

-- =====================================================
-- VERIFICACIÓN FINAL
-- =====================================================

-- Verificar que todas las políticas se crearon correctamente
DO $$
DECLARE
    policy_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename IN ('analytics_categories', 'analytics_actions', 'analytics_pages', 'analytics_browsers', 'analytics_events_optimized');
    
    IF policy_count < 12 THEN
        RAISE EXCEPTION 'Error: No se crearon todas las políticas esperadas. Encontradas: %', policy_count;
    END IF;
    
    RAISE NOTICE 'Migración completada exitosamente. Políticas creadas: %', policy_count;
END;
$$;