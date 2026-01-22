-- ============================================================================
-- MIGRACIÓN: Agregar tenant_id a Tablas de Logística
-- ============================================================================
-- Descripción: Agrega la columna tenant_id a las tablas de logística
-- que necesitan aislamiento de datos por tenant
-- ============================================================================

-- ============================================================================
-- DRIVERS / LOGISTICS_DRIVERS
-- ============================================================================
DO $$
BEGIN
  -- Verificar si existe la tabla drivers
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'drivers') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'drivers' AND column_name = 'tenant_id'
    ) THEN
      ALTER TABLE drivers ADD COLUMN tenant_id UUID REFERENCES tenants(id);
      CREATE INDEX IF NOT EXISTS idx_drivers_tenant ON drivers(tenant_id);
    END IF;
  END IF;
  
  -- Verificar si existe logistics_drivers (nombre alternativo)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'logistics_drivers') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'logistics_drivers' AND column_name = 'tenant_id'
    ) THEN
      ALTER TABLE logistics_drivers ADD COLUMN tenant_id UUID REFERENCES tenants(id);
      CREATE INDEX IF NOT EXISTS idx_logistics_drivers_tenant ON logistics_drivers(tenant_id);
    END IF;
  END IF;
END $$;

-- ============================================================================
-- OPTIMIZED_ROUTES
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'optimized_routes') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'optimized_routes' AND column_name = 'tenant_id'
    ) THEN
      ALTER TABLE optimized_routes ADD COLUMN tenant_id UUID REFERENCES tenants(id);
      CREATE INDEX IF NOT EXISTS idx_optimized_routes_tenant ON optimized_routes(tenant_id);
    END IF;
  END IF;
END $$;

-- ============================================================================
-- TRACKING_EVENTS
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tracking_events') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'tracking_events' AND column_name = 'tenant_id'
    ) THEN
      ALTER TABLE tracking_events ADD COLUMN tenant_id UUID REFERENCES tenants(id);
      CREATE INDEX IF NOT EXISTS idx_tracking_events_tenant ON tracking_events(tenant_id);
    END IF;
  END IF;
END $$;

-- Comentarios
COMMENT ON COLUMN drivers.tenant_id IS 'Tenant al que pertenece este conductor';
COMMENT ON COLUMN optimized_routes.tenant_id IS 'Tenant al que pertenece esta ruta';
COMMENT ON COLUMN tracking_events.tenant_id IS 'Tenant al que pertenece este evento de tracking';
