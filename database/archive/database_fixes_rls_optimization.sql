-- =====================================================
-- OPTIMIZACIÓN DE POLÍTICAS RLS CON PROBLEMAS DE PERFORMANCE
-- Fecha: Enero 2025
-- Propósito: Resolver problemas de performance identificados por Supabase Performance Advisor
-- =====================================================

-- PROBLEMA: Las políticas RLS que usan auth.<function>() se re-evalúan para cada fila
-- SOLUCIÓN: Usar (SELECT auth.<function>()) para evaluar una sola vez por consulta

-- 1. OPTIMIZACIÓN DE POLÍTICAS EN user_roles
-- =====================================================

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Users can view their own role" ON public.user_roles;
DROP POLICY IF EXISTS "Users can insert their own role" ON public.user_roles;
DROP POLICY IF EXISTS "Users can update their own role" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;

-- Crear políticas optimizadas
CREATE POLICY "Users can view their own role" ON public.user_roles
    FOR SELECT USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert their own role" ON public.user_roles
    FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update their own role" ON public.user_roles
    FOR UPDATE USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Admins can manage all roles" ON public.user_roles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles up
            JOIN public.user_roles admin_role ON up.role_id = admin_role.id
            WHERE up.supabase_user_id = auth.uid() 
            AND admin_role.role_name = 'admin'
        )
    );

-- 2. OPTIMIZACIÓN DE POLÍTICAS EN user_profiles
-- =====================================================

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.user_profiles;

-- Crear políticas optimizadas
CREATE POLICY "Users can view their own profile" ON public.user_profiles
    FOR SELECT USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert their own profile" ON public.user_profiles
    FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update their own profile" ON public.user_profiles
    FOR UPDATE USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Admins can manage all profiles" ON public.user_profiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles up
            JOIN public.user_roles admin_role ON up.role_id = admin_role.id
            WHERE up.supabase_user_id = auth.uid() 
            AND admin_role.role_name = 'admin'
        )
    );

-- 3. OPTIMIZACIÓN DE POLÍTICAS EN user_preferences
-- =====================================================

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Users can view their own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can insert their own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can update their own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Admins can manage all preferences" ON public.user_preferences;

-- Crear políticas optimizadas
CREATE POLICY "Users can view their own preferences" ON public.user_preferences
    FOR SELECT USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert their own preferences" ON public.user_preferences
    FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update their own preferences" ON public.user_preferences
    FOR UPDATE USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Admins can manage all preferences" ON public.user_preferences
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles up
            JOIN public.user_roles admin_role ON up.role_id = admin_role.id
            WHERE up.supabase_user_id = auth.uid() 
            AND admin_role.role_name = 'admin'
        )
    );

-- 4. OPTIMIZACIÓN DE POLÍTICAS EN user_activity
-- =====================================================

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Users can view their own activity" ON public.user_activity;
DROP POLICY IF EXISTS "Users can insert their own activity" ON public.user_activity;
DROP POLICY IF EXISTS "Admins can view all activity" ON public.user_activity;

-- Crear políticas optimizadas
CREATE POLICY "Users can view their own activity" ON public.user_activity
    FOR SELECT USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert their own activity" ON public.user_activity
    FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Admins can view all activity" ON public.user_activity
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles up
            JOIN public.user_roles admin_role ON up.role_id = admin_role.id
            WHERE up.supabase_user_id = auth.uid() 
            AND admin_role.role_name = 'admin'
        )
    );

-- 5. OPTIMIZACIÓN DE POLÍTICAS EN user_security_settings
-- =====================================================

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Users can view their own security settings" ON public.user_security_settings;
DROP POLICY IF EXISTS "Users can update their own security settings" ON public.user_security_settings;

-- Crear políticas optimizadas
CREATE POLICY "Users can view their own security settings" ON public.user_security_settings
    FOR SELECT USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update their own security settings" ON public.user_security_settings
    FOR UPDATE USING (user_id = (SELECT auth.uid()));

-- 6. OPTIMIZACIÓN DE POLÍTICAS EN user_interactions
-- =====================================================

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Users can view their own interactions" ON public.user_interactions;
DROP POLICY IF EXISTS "Users can insert their own interactions" ON public.user_interactions;
DROP POLICY IF EXISTS "Users can update their own interactions" ON public.user_interactions;
DROP POLICY IF EXISTS "Admins can manage all interactions" ON public.user_interactions;

-- Crear políticas optimizadas
CREATE POLICY "Users can view their own interactions" ON public.user_interactions
    FOR SELECT USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert their own interactions" ON public.user_interactions
    FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update their own interactions" ON public.user_interactions
    FOR UPDATE USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Admins can manage all interactions" ON public.user_interactions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles up
            JOIN public.user_roles admin_role ON up.role_id = admin_role.id
            WHERE up.supabase_user_id = auth.uid() 
            AND admin_role.role_name = 'admin'
        )
    );

-- 7. OPTIMIZACIÓN DE POLÍTICAS EN analytics_events
-- =====================================================

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Users can view their own analytics events" ON public.analytics_events;
DROP POLICY IF EXISTS "Users can insert their own analytics events" ON public.analytics_events;
DROP POLICY IF EXISTS "System can insert analytics events" ON public.analytics_events;
DROP POLICY IF EXISTS "Admins can manage all analytics events" ON public.analytics_events;

-- Crear políticas optimizadas
CREATE POLICY "Users can view their own analytics events" ON public.analytics_events
    FOR SELECT USING (
        user_id = (SELECT auth.uid()) OR 
        user_id IS NULL -- Permitir eventos anónimos
    );

CREATE POLICY "Users can insert their own analytics events" ON public.analytics_events
    FOR INSERT WITH CHECK (
        user_id = (SELECT auth.uid()) OR 
        user_id IS NULL -- Permitir eventos anónimos
    );

CREATE POLICY "System can insert analytics events" ON public.analytics_events
    FOR INSERT WITH CHECK (true); -- Para eventos del sistema

CREATE POLICY "Admins can manage all analytics events" ON public.analytics_events
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles up
            JOIN public.user_roles admin_role ON up.role_id = admin_role.id
            WHERE up.supabase_user_id = auth.uid() 
            AND admin_role.role_name = 'admin'
        )
    );

-- 8. OPTIMIZACIÓN DE POLÍTICAS EN cart_items
-- =====================================================

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Users can view their own cart items" ON public.cart_items;
DROP POLICY IF EXISTS "Users can insert their own cart items" ON public.cart_items;
DROP POLICY IF EXISTS "Users can update their own cart items" ON public.cart_items;
DROP POLICY IF EXISTS "Users can delete their own cart items" ON public.cart_items;

-- Crear políticas optimizadas
CREATE POLICY "Users can view their own cart items" ON public.cart_items
    FOR SELECT USING (
        user_id = (SELECT auth.uid()) OR
        session_id = (SELECT current_setting('app.session_id', true))
    );

CREATE POLICY "Users can insert their own cart items" ON public.cart_items
    FOR INSERT WITH CHECK (
        user_id = (SELECT auth.uid()) OR
        session_id = (SELECT current_setting('app.session_id', true))
    );

CREATE POLICY "Users can update their own cart items" ON public.cart_items
    FOR UPDATE USING (
        user_id = (SELECT auth.uid()) OR
        session_id = (SELECT current_setting('app.session_id', true))
    );

CREATE POLICY "Users can delete their own cart items" ON public.cart_items
    FOR DELETE USING (
        user_id = (SELECT auth.uid()) OR
        session_id = (SELECT current_setting('app.session_id', true))
    );

-- 9. CREAR ÍNDICES PARA MEJORAR PERFORMANCE DE RLS
-- =====================================================

-- Índices para user_roles (usado frecuentemente en políticas RLS)
CREATE INDEX IF NOT EXISTS idx_user_roles_id_role_name ON public.user_roles(id, role_name);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_name ON public.user_roles(role_name) WHERE role_name = 'admin';

-- Índices para mejorar consultas de autenticación
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON public.user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_user_id ON public.user_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_user_security_settings_user_id ON public.user_security_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_interactions_user_id ON public.user_interactions(user_id);

-- Índices para analytics_events
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON public.analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_session_id ON public.analytics_events(session_id);

-- Índices para cart_items
CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON public.cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_session_id ON public.cart_items(session_id);

-- 10. FUNCIONES AUXILIARES PARA OPTIMIZACIÓN
-- =====================================================

-- Función para verificar si el usuario actual es admin (optimizada)
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.user_profiles up
        JOIN public.user_roles ur ON up.role_id = ur.id
        WHERE up.supabase_user_id = auth.uid() 
        AND ur.role_name = 'admin'
    );
$$;

-- Función para obtener el ID del usuario actual (optimizada)
CREATE OR REPLACE FUNCTION public.get_current_user_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT auth.uid();
$$;

-- 11. COMENTARIOS Y DOCUMENTACIÓN
-- =====================================================

COMMENT ON FUNCTION public.is_current_user_admin() IS 
'Función optimizada para verificar si el usuario actual es administrador. Marcada como STABLE para mejor performance en RLS.';

COMMENT ON FUNCTION public.get_current_user_id() IS 
'Función optimizada para obtener el ID del usuario actual. Marcada como STABLE para mejor performance en RLS.';

-- Comentarios sobre las optimizaciones realizadas
COMMENT ON POLICY "Users can view their own role" ON public.user_roles IS 
'Política optimizada usando (SELECT auth.uid()) para evaluar una sola vez por consulta';

COMMENT ON POLICY "Users can view their own profile" ON public.user_profiles IS 
'Política optimizada usando (SELECT auth.uid()) para evaluar una sola vez por consulta';

COMMENT ON POLICY "Users can view their own preferences" ON public.user_preferences IS 
'Política optimizada usando (SELECT auth.uid()) para evaluar una sola vez por consulta';

-- 12. ANÁLISIS DE PERFORMANCE POST-OPTIMIZACIÓN
-- =====================================================

-- Crear vista para monitorear performance de RLS
CREATE OR REPLACE VIEW public.rls_performance_monitor AS
SELECT 
    schemaname,
    tablename,
    n_tup_ins as inserts,
    n_tup_upd as updates,
    n_tup_del as deletes,
    n_tup_hot_upd as hot_updates,
    seq_scan,
    seq_tup_read,
    idx_scan,
    idx_tup_fetch
FROM pg_stat_user_tables
WHERE schemaname = 'public'
AND tablename IN (
    'user_roles', 'user_profiles', 'user_preferences', 
    'user_activity', 'user_security_settings', 'user_interactions',
    'analytics_events', 'cart_items'
);

COMMENT ON VIEW public.rls_performance_monitor IS 
'Vista para monitorear el performance de las tablas con políticas RLS optimizadas';

-- =====================================================
-- FIN DE OPTIMIZACIONES RLS
-- =====================================================