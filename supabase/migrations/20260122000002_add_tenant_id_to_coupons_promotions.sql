-- ============================================================================
-- MIGRACIÓN: Agregar tenant_id a Cupones y Promociones
-- ============================================================================
-- Descripción: Agrega la columna tenant_id a las tablas de cupones y promociones
-- para aislamiento de datos por tenant
-- ============================================================================

-- ============================================================================
-- COUPONS
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'coupons') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'coupons' AND column_name = 'tenant_id'
    ) THEN
      ALTER TABLE coupons ADD COLUMN tenant_id UUID REFERENCES tenants(id);
      CREATE INDEX IF NOT EXISTS idx_coupons_tenant ON coupons(tenant_id);
    END IF;
  END IF;
END $$;

-- ============================================================================
-- PROMOTIONS
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'promotions') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'promotions' AND column_name = 'tenant_id'
    ) THEN
      ALTER TABLE promotions ADD COLUMN tenant_id UUID REFERENCES tenants(id);
      CREATE INDEX IF NOT EXISTS idx_promotions_tenant ON promotions(tenant_id);
    END IF;
  END IF;
END $$;

-- Comentarios
COMMENT ON COLUMN coupons.tenant_id IS 'Tenant al que pertenece este cupón';
COMMENT ON COLUMN promotions.tenant_id IS 'Tenant al que pertenece esta promoción';
