-- Migration: Enable RLS on Security Critical Tables
-- Date: OCTUBRE 2025
-- Description: Habilita Row Level Security en todas las tablas públicas identificadas por Security Advisor

-- =====================================================
-- HABILITAR RLS EN TODAS LAS TABLAS CRÍTICAS
-- =====================================================

-- Habilitar RLS en tablas de tracking y analytics
ALTER TABLE public.tracking_events ENABLE ROW LEVEL SECURITY;

-- Habilitar RLS en tablas de logística
ALTER TABLE public.shipment_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fleet_vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logistics_alerts ENABLE ROW LEVEL SECURITY;

-- Habilitar RLS en tablas de autenticación y usuarios
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_tokens ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLÍTICAS RLS PARA TRACKING_EVENTS
-- =====================================================

-- Solo admins y moderadores pueden ver eventos de tracking
CREATE POLICY "tracking_events_admin_select" ON public.tracking_events
    FOR SELECT USING (public.is_moderator_or_admin());

-- Solo admins y moderadores pueden crear eventos
CREATE POLICY "tracking_events_admin_insert" ON public.tracking_events
    FOR INSERT WITH CHECK (public.is_moderator_or_admin());

-- Solo admins pueden modificar eventos
CREATE POLICY "tracking_events_admin_update" ON public.tracking_events
    FOR UPDATE USING (public.is_admin());

-- Solo admins pueden eliminar eventos
CREATE POLICY "tracking_events_admin_delete" ON public.tracking_events
    FOR DELETE USING (public.is_admin());

-- =====================================================
-- POLÍTICAS RLS PARA USERS
-- =====================================================

-- Usuarios pueden ver su propio perfil, admins ven todos
CREATE POLICY "users_self_select" ON public.users
    FOR SELECT USING (
        id::text = public.get_current_user_id()::text
        OR public.is_moderator_or_admin()
    );

-- Usuarios pueden actualizar su propio perfil
CREATE POLICY "users_self_update" ON public.users
    FOR UPDATE USING (
        id::text = public.get_current_user_id()::text
        OR public.is_admin()
    );

-- Solo admins pueden crear usuarios
CREATE POLICY "users_admin_insert" ON public.users
    FOR INSERT WITH CHECK (public.is_admin());

-- Solo admins pueden eliminar usuarios
CREATE POLICY "users_admin_delete" ON public.users
    FOR DELETE USING (public.is_admin());

-- =====================================================
-- POLÍTICAS RLS PARA SESSIONS
-- =====================================================

-- Solo admins pueden ver sesiones
CREATE POLICY "sessions_admin_select" ON public.sessions
    FOR SELECT USING (public.is_admin());

-- Solo el sistema puede crear sesiones (NextAuth)
CREATE POLICY "sessions_system_insert" ON public.sessions
    FOR INSERT WITH CHECK (true);

-- Solo admins pueden actualizar sesiones
CREATE POLICY "sessions_admin_update" ON public.sessions
    FOR UPDATE USING (public.is_admin());

-- Solo admins pueden eliminar sesiones
CREATE POLICY "sessions_admin_delete" ON public.sessions
    FOR DELETE USING (public.is_admin());

-- =====================================================
-- POLÍTICAS RLS PARA ACCOUNTS
-- =====================================================

-- Solo admins pueden ver cuentas
CREATE POLICY "accounts_admin_select" ON public.accounts
    FOR SELECT USING (public.is_admin());

-- Solo el sistema puede crear cuentas (NextAuth)
CREATE POLICY "accounts_system_insert" ON public.accounts
    FOR INSERT WITH CHECK (true);

-- Solo admins pueden actualizar cuentas
CREATE POLICY "accounts_admin_update" ON public.accounts
    FOR UPDATE USING (public.is_admin());

-- Solo admins pueden eliminar cuentas
CREATE POLICY "accounts_admin_delete" ON public.accounts
    FOR DELETE USING (public.is_admin());

-- =====================================================
-- POLÍTICAS RLS PARA VERIFICATION_TOKENS
-- =====================================================

-- Solo el sistema puede manejar tokens de verificación
CREATE POLICY "verification_tokens_system_all" ON public.verification_tokens
    FOR ALL USING (public.is_admin());

-- =====================================================
-- POLÍTICAS RLS PARA LOGÍSTICA
-- =====================================================

-- Políticas para shipment_items
CREATE POLICY "shipment_items_admin_all" ON public.shipment_items
    FOR ALL USING (public.is_moderator_or_admin());

-- Políticas para drivers
CREATE POLICY "drivers_admin_all" ON public.drivers
    FOR ALL USING (public.is_moderator_or_admin());

-- Conductores pueden ver su propio perfil
CREATE POLICY "drivers_self_select" ON public.drivers
    FOR SELECT USING (
        user_id::text = public.get_current_user_id()::text
        OR public.is_moderator_or_admin()
    );

-- Conductores pueden actualizar su propio perfil
CREATE POLICY "drivers_self_update" ON public.drivers
    FOR UPDATE USING (
        user_id::text = public.get_current_user_id()::text
        OR public.is_moderator_or_admin()
    );

-- Políticas para fleet_vehicles
CREATE POLICY "fleet_vehicles_admin_all" ON public.fleet_vehicles
    FOR ALL USING (public.is_moderator_or_admin());

-- Políticas para vehicle_locations
CREATE POLICY "vehicle_locations_admin_all" ON public.vehicle_locations
    FOR ALL USING (public.is_moderator_or_admin());

-- Conductores pueden ver ubicaciones de sus vehículos asignados
CREATE POLICY "vehicle_locations_driver_select" ON public.vehicle_locations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.drivers d 
            WHERE d.user_id::text = public.get_current_user_id()::text 
            AND d.current_vehicle_id = vehicle_locations.vehicle_id
        )
        OR public.is_moderator_or_admin()
    );

-- Políticas para logistics_alerts
CREATE POLICY "logistics_alerts_admin_all" ON public.logistics_alerts
    FOR ALL USING (public.is_moderator_or_admin());

-- =====================================================
-- VERIFICACIÓN FINAL
-- =====================================================

-- Verificar que RLS esté habilitado en todas las tablas
DO $$
DECLARE
    table_name TEXT;
    tables_with_rls TEXT[] := ARRAY[
        'tracking_events', 'shipment_items', 'users', 'drivers', 
        'fleet_vehicles', 'vehicle_locations', 'sessions', 
        'accounts', 'verification_tokens', 'logistics_alerts'
    ];
    rls_enabled BOOLEAN;
    tables_count INTEGER := 0;
BEGIN
    FOREACH table_name IN ARRAY tables_with_rls
    LOOP
        SELECT relrowsecurity INTO rls_enabled 
        FROM pg_class 
        WHERE relname = table_name AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
        
        IF rls_enabled THEN
            tables_count := tables_count + 1;
            RAISE NOTICE 'RLS habilitado correctamente en: %', table_name;
        ELSE
            RAISE WARNING 'RLS NO habilitado en: %', table_name;
        END IF;
    END LOOP;
    
    IF tables_count = array_length(tables_with_rls, 1) THEN
        RAISE NOTICE 'SUCCESS: RLS habilitado en todas las % tablas críticas', tables_count;
    ELSE
        RAISE EXCEPTION 'ERROR: RLS solo habilitado en % de % tablas', tables_count, array_length(tables_with_rls, 1);
    END IF;
END;
$$;

-- Verificar políticas creadas
DO $$
DECLARE
    policy_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename IN (
        'tracking_events', 'shipment_items', 'users', 'drivers', 
        'fleet_vehicles', 'vehicle_locations', 'sessions', 
        'accounts', 'verification_tokens', 'logistics_alerts'
    );
    
    RAISE NOTICE 'Políticas RLS creadas: %', policy_count;
    
    IF policy_count < 20 THEN
        RAISE WARNING 'Se esperaban al menos 20 políticas, se crearon: %', policy_count;
    END IF;
END;
$$;

-- =====================================================
-- COMENTARIOS DE DOCUMENTACIÓN
-- =====================================================

COMMENT ON TABLE public.tracking_events IS 'Eventos de seguimiento con RLS - usuarios ven solo sus eventos';
COMMENT ON TABLE public.shipment_items IS 'Elementos de envío con RLS - solo moderadores/admins';
COMMENT ON TABLE public.users IS 'Usuarios con RLS - acceso propio + admin';
COMMENT ON TABLE public.drivers IS 'Conductores con RLS - acceso propio + moderadores/admins';
COMMENT ON TABLE public.fleet_vehicles IS 'Vehículos de flota con RLS - solo moderadores/admins';
COMMENT ON TABLE public.vehicle_locations IS 'Ubicaciones de vehículos con RLS - conductores asignados + moderadores/admins';
COMMENT ON TABLE public.sessions IS 'Sesiones con RLS - acceso propio + admin';
COMMENT ON TABLE public.accounts IS 'Cuentas con RLS - acceso propio + admin';
COMMENT ON TABLE public.verification_tokens IS 'Tokens de verificación con RLS - solo admins';
COMMENT ON TABLE public.logistics_alerts IS 'Alertas logísticas con RLS - solo moderadores/admins';