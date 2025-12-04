-- ===================================
-- HABILITAR RLS EN TABLAS DE ANALYTICS
-- Habilitar Row Level Security en tablas de analytics para cumplir con políticas de seguridad
-- Fecha: 2025-02-01
-- ===================================

-- Habilitar RLS en analytics_categories
ALTER TABLE public.analytics_categories ENABLE ROW LEVEL SECURITY;

-- Habilitar RLS en analytics_actions
ALTER TABLE public.analytics_actions ENABLE ROW LEVEL SECURITY;

-- Habilitar RLS en analytics_pages
ALTER TABLE public.analytics_pages ENABLE ROW LEVEL SECURITY;

-- Habilitar RLS en analytics_browsers
ALTER TABLE public.analytics_browsers ENABLE ROW LEVEL SECURITY;

-- Habilitar RLS en analytics_events_optimized
ALTER TABLE public.analytics_events_optimized ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLÍTICAS RLS PARA TABLAS DE ANALYTICS
-- =====================================================

-- Políticas para analytics_categories
-- Solo lectura pública para categorías de analytics
CREATE POLICY "Public can view analytics categories" ON public.analytics_categories
    FOR SELECT USING (true);

-- Solo admins pueden modificar categorías
CREATE POLICY "Only admins can modify analytics categories" ON public.analytics_categories
    FOR ALL USING (
        public.is_admin()
    );

-- Políticas para analytics_actions
-- Solo lectura pública para acciones de analytics
CREATE POLICY "Public can view analytics actions" ON public.analytics_actions
    FOR SELECT USING (true);

-- Solo admins pueden modificar acciones
CREATE POLICY "Only admins can modify analytics actions" ON public.analytics_actions
    FOR ALL USING (
        public.is_admin()
    );

-- Políticas para analytics_pages
-- Solo lectura pública para páginas de analytics
CREATE POLICY "Public can view analytics pages" ON public.analytics_pages
    FOR SELECT USING (true);

-- Solo admins pueden modificar páginas
CREATE POLICY "Only admins can modify analytics pages" ON public.analytics_pages
    FOR ALL USING (
        public.is_admin()
    );

-- Políticas para analytics_browsers
-- Solo lectura pública para navegadores de analytics
CREATE POLICY "Public can view analytics browsers" ON public.analytics_browsers
    FOR SELECT USING (true);

-- Solo admins pueden modificar navegadores
CREATE POLICY "Only admins can modify analytics browsers" ON public.analytics_browsers
    FOR ALL USING (
        public.is_admin()
    );

-- Políticas para analytics_events_optimized
-- Los usuarios pueden ver sus propios eventos (con conversión de tipos)
CREATE POLICY "Users can view own analytics events" ON public.analytics_events_optimized
    FOR SELECT USING (
        user_id::text = public.get_current_user_id()::text
    );

-- Admins y moderadores pueden ver todos los eventos
CREATE POLICY "Admins and moderators can view all analytics events" ON public.analytics_events_optimized
    FOR SELECT USING (
        public.is_moderator_or_admin()
    );

-- Los usuarios pueden crear sus propios eventos (con conversión de tipos)
CREATE POLICY "Users can create own analytics events" ON public.analytics_events_optimized
    FOR INSERT WITH CHECK (
        user_id::text = public.get_current_user_id()::text
    );

-- Solo admins pueden modificar eventos existentes
CREATE POLICY "Only admins can modify analytics events" ON public.analytics_events_optimized
    FOR UPDATE USING (
        public.is_admin()
    );

-- Solo admins pueden eliminar eventos
CREATE POLICY "Only admins can delete analytics events" ON public.analytics_events_optimized
    FOR DELETE USING (
        public.is_admin()
    );

-- Comentarios de documentación
COMMENT ON TABLE public.analytics_categories IS 'Tabla de categorías de analytics con RLS habilitado';
COMMENT ON TABLE public.analytics_actions IS 'Tabla de acciones de analytics con RLS habilitado';
COMMENT ON TABLE public.analytics_pages IS 'Tabla de páginas de analytics con RLS habilitado';
COMMENT ON TABLE public.analytics_browsers IS 'Tabla de navegadores de analytics con RLS habilitado';
COMMENT ON TABLE public.analytics_events_optimized IS 'Tabla de eventos de analytics optimizada con RLS habilitado';