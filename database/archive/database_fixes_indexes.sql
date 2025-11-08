-- =====================================================
-- CREACIÓN DE ÍNDICES PARA FOREIGN KEYS
-- Fecha: Enero 2025
-- Propósito: Resolver problemas de performance identificados por Supabase Performance Advisor
-- =====================================================

-- 1. ÍNDICES PARA FOREIGN KEYS SIN INDEXAR
-- =====================================================

-- Índice para accounts.userId
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_accounts_userId 
ON public.accounts (userId);

-- Índice para categories.parent_id
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_categories_parent_id 
ON public.categories (parent_id);

-- Índice para drivers.user_id
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_drivers_user_id 
ON public.drivers (user_id);

-- Índice para logistics_alerts.courier_id
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_logistics_alerts_courier_id 
ON public.logistics_alerts (courier_id);

-- Índice para logistics_alerts.order_id
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_logistics_alerts_order_id 
ON public.logistics_alerts (order_id);

-- Índice para sessions.userId
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sessions_userId 
ON public.sessions (userId);

-- Índice para shipment_items.product_id
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_shipment_items_product_id 
ON public.shipment_items (product_id);

-- Índice para shipment_items.shipment_id
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_shipment_items_shipment_id 
ON public.shipment_items (shipment_id);

-- Índice para site_configuration.updated_by
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_site_configuration_updated_by 
ON public.site_configuration (updated_by);

-- Índice para user_activity.user_id
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_activity_user_id 
ON public.user_activity (user_id);

-- Índice para user_security_alerts.user_id
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_security_alerts_user_id 
ON public.user_security_alerts (user_id);

-- Índice para vehicle_locations.driver_id
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vehicle_locations_driver_id 
ON public.vehicle_locations (driver_id);

-- 2. ÍNDICES COMPUESTOS ADICIONALES PARA OPTIMIZACIÓN
-- =====================================================

-- Índice compuesto para logistics_alerts (courier_id, order_id) para consultas que filtran por ambos
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_logistics_alerts_courier_order 
ON public.logistics_alerts (courier_id, order_id);

-- Índice compuesto para shipment_items (shipment_id, product_id) para consultas de items por envío
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_shipment_items_shipment_product 
ON public.shipment_items (shipment_id, product_id);

-- Índice para user_activity con timestamp para consultas temporales
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_activity_user_timestamp 
ON public.user_activity (user_id, created_at DESC);

-- Índice para vehicle_locations con timestamp para tracking en tiempo real
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vehicle_locations_driver_timestamp 
ON public.vehicle_locations (driver_id, timestamp DESC);

-- 3. COMENTARIOS Y DOCUMENTACIÓN
-- =====================================================

COMMENT ON INDEX idx_accounts_userId IS 
'Índice para mejorar performance de consultas de cuentas por usuario (NextAuth.js)';

COMMENT ON INDEX idx_categories_parent_id IS 
'Índice para mejorar performance de consultas jerárquicas de categorías';

COMMENT ON INDEX idx_drivers_user_id IS 
'Índice para mejorar performance de consultas de conductores por usuario';

COMMENT ON INDEX idx_logistics_alerts_courier_id IS 
'Índice para mejorar performance de consultas de alertas por courier';

COMMENT ON INDEX idx_logistics_alerts_order_id IS 
'Índice para mejorar performance de consultas de alertas por orden';

COMMENT ON INDEX idx_sessions_userId IS 
'Índice para mejorar performance de consultas de sesiones por usuario (NextAuth.js)';

COMMENT ON INDEX idx_shipment_items_product_id IS 
'Índice para mejorar performance de consultas de items por producto';

COMMENT ON INDEX idx_shipment_items_shipment_id IS 
'Índice para mejorar performance de consultas de items por envío';

COMMENT ON INDEX idx_site_configuration_updated_by IS 
'Índice para mejorar performance de consultas de configuración por usuario que actualizó';

COMMENT ON INDEX idx_user_activity_user_id IS 
'Índice para mejorar performance de consultas de actividad por usuario';

COMMENT ON INDEX idx_user_security_alerts_user_id IS 
'Índice para mejorar performance de consultas de alertas de seguridad por usuario';

COMMENT ON INDEX idx_vehicle_locations_driver_id IS 
'Índice para mejorar performance de consultas de ubicaciones por conductor';

COMMENT ON INDEX idx_logistics_alerts_courier_order IS 
'Índice compuesto para optimizar consultas que filtran por courier y orden simultáneamente';

COMMENT ON INDEX idx_shipment_items_shipment_product IS 
'Índice compuesto para optimizar consultas de items específicos en envíos';

COMMENT ON INDEX idx_user_activity_user_timestamp IS 
'Índice compuesto para optimizar consultas temporales de actividad de usuario';

COMMENT ON INDEX idx_vehicle_locations_driver_timestamp IS 
'Índice compuesto para optimizar tracking en tiempo real de vehículos';

-- =====================================================
-- FIN DE CREACIÓN DE ÍNDICES
-- =====================================================