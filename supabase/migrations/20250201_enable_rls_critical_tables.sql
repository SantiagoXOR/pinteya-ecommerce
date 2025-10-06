-- Migration: Enable RLS on Critical Tables
-- Date: 2025-02-01
-- Description: Habilita Row Level Security en tablas críticas para cumplir con estándares de seguridad enterprise

-- =====================================================
-- TABLAS DE AUTENTICACIÓN
-- =====================================================

-- Habilitar RLS en tabla users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Política para users: solo el usuario puede ver/modificar sus propios datos
CREATE POLICY "users_own_data" ON public.users
    FOR ALL USING (
        auth.uid()::text = id::text OR 
        (SELECT role FROM public.users WHERE id::text = auth.uid()::text) = 'admin'
    );

-- Habilitar RLS en tabla sessions
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

-- Política para sessions: solo el usuario propietario puede acceder
CREATE POLICY "sessions_own_data" ON public.sessions
    FOR ALL USING (
        auth.uid()::text = user_id::text OR
        (SELECT role FROM public.users WHERE id::text = auth.uid()::text) = 'admin'
    );

-- Habilitar RLS en tabla accounts
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;

-- Política para accounts: solo el usuario propietario puede acceder
CREATE POLICY "accounts_own_data" ON public.accounts
    FOR ALL USING (
        auth.uid()::text = user_id::text OR
        (SELECT role FROM public.users WHERE id::text = auth.uid()::text) = 'admin'
    );

-- Habilitar RLS en tabla verification_tokens
ALTER TABLE public.verification_tokens ENABLE ROW LEVEL SECURITY;

-- Política para verification_tokens: solo admins pueden gestionar tokens
CREATE POLICY "verification_tokens_admin_only" ON public.verification_tokens
    FOR ALL USING (
        (SELECT role FROM public.users WHERE id::text = auth.uid()::text) = 'admin'
    );

-- =====================================================
-- TABLAS DE LOGÍSTICA
-- =====================================================

-- Habilitar RLS en tabla shipments
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;

-- Política para shipments: admins y usuarios relacionados con la orden
CREATE POLICY "shipments_access" ON public.shipments
    FOR ALL USING (
        (SELECT role FROM public.users WHERE id::text = auth.uid()::text) = 'admin' OR
        EXISTS (
            SELECT 1 FROM public.orders o 
            WHERE o.id = shipments.order_id 
            AND o.user_id::text = auth.uid()::text
        )
    );

-- Habilitar RLS en tabla shipment_items
ALTER TABLE public.shipment_items ENABLE ROW LEVEL SECURITY;

-- Política para shipment_items: admins y usuarios relacionados
CREATE POLICY "shipment_items_access" ON public.shipment_items
    FOR ALL USING (
        (SELECT role FROM public.users WHERE id::text = auth.uid()::text) = 'admin' OR
        EXISTS (
            SELECT 1 FROM public.shipments s
            JOIN public.orders o ON o.id = s.order_id
            WHERE s.id = shipment_items.shipment_id 
            AND o.user_id::text = auth.uid()::text
        )
    );

-- Habilitar RLS en tabla drivers
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;

-- Política para drivers: solo admins pueden gestionar conductores
CREATE POLICY "drivers_admin_only" ON public.drivers
    FOR ALL USING (
        (SELECT role FROM public.users WHERE id::text = auth.uid()::text) = 'admin'
    );

-- Habilitar RLS en tabla fleet_vehicles
ALTER TABLE public.fleet_vehicles ENABLE ROW LEVEL SECURITY;

-- Política para fleet_vehicles: solo admins pueden gestionar vehículos
CREATE POLICY "fleet_vehicles_admin_only" ON public.fleet_vehicles
    FOR ALL USING (
        (SELECT role FROM public.users WHERE id::text = auth.uid()::text) = 'admin'
    );

-- Habilitar RLS en tabla vehicle_locations
ALTER TABLE public.vehicle_locations ENABLE ROW LEVEL SECURITY;

-- Política para vehicle_locations: admins y conductores asignados
CREATE POLICY "vehicle_locations_access" ON public.vehicle_locations
    FOR ALL USING (
        (SELECT role FROM public.users WHERE id::text = auth.uid()::text) = 'admin' OR
        EXISTS (
            SELECT 1 FROM public.drivers d
            WHERE d.user_id::text = auth.uid()::text
            AND d.vehicle_id = vehicle_locations.vehicle_id
        )
    );

-- Habilitar RLS en tabla logistics_alerts
ALTER TABLE public.logistics_alerts ENABLE ROW LEVEL SECURITY;

-- Política para logistics_alerts: solo admins pueden gestionar alertas
CREATE POLICY "logistics_alerts_admin_only" ON public.logistics_alerts
    FOR ALL USING (
        (SELECT role FROM public.users WHERE id::text = auth.uid()::text) = 'admin'
    );

-- =====================================================
-- TABLA DE ANALYTICS
-- =====================================================

-- Habilitar RLS en tabla tracking_events
ALTER TABLE public.tracking_events ENABLE ROW LEVEL SECURITY;

-- Política para tracking_events: usuarios pueden ver sus propios eventos, admins todo
CREATE POLICY "tracking_events_access" ON public.tracking_events
    FOR ALL USING (
        (SELECT role FROM public.users WHERE id::text = auth.uid()::text) = 'admin' OR
        user_id::text = auth.uid()::text
    );

-- =====================================================
-- COMENTARIOS DE DOCUMENTACIÓN
-- =====================================================

COMMENT ON TABLE public.users IS 'Tabla de usuarios con RLS habilitado - Solo acceso a datos propios o admin';
COMMENT ON TABLE public.sessions IS 'Tabla de sesiones con RLS habilitado - Solo acceso a sesiones propias o admin';
COMMENT ON TABLE public.accounts IS 'Tabla de cuentas con RLS habilitado - Solo acceso a cuentas propias o admin';
COMMENT ON TABLE public.verification_tokens IS 'Tabla de tokens de verificación con RLS habilitado - Solo admins';
COMMENT ON TABLE public.shipments IS 'Tabla de envíos con RLS habilitado - Acceso basado en propiedad de orden';
COMMENT ON TABLE public.shipment_items IS 'Tabla de items de envío con RLS habilitado - Acceso basado en propiedad';
COMMENT ON TABLE public.drivers IS 'Tabla de conductores con RLS habilitado - Solo admins';
COMMENT ON TABLE public.fleet_vehicles IS 'Tabla de vehículos con RLS habilitado - Solo admins';
COMMENT ON TABLE public.vehicle_locations IS 'Tabla de ubicaciones de vehículos con RLS habilitado - Admins y conductores asignados';
COMMENT ON TABLE public.logistics_alerts IS 'Tabla de alertas logísticas con RLS habilitado - Solo admins';
COMMENT ON TABLE public.tracking_events IS 'Tabla de eventos de tracking con RLS habilitado - Acceso a eventos propios o admin';