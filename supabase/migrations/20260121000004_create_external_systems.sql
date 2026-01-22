-- ============================================================================
-- MIGRACIÓN: Sistema de Integración con ERPs Externos
-- ============================================================================
-- Descripción: Permite que cada tenant tenga su propio sistema ERP con códigos
-- de producto diferentes (Aikon, SAP, Tango, gestión manual, etc.)
-- ============================================================================

-- Sistemas ERP disponibles en la plataforma
CREATE TABLE IF NOT EXISTS external_systems (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(20) UNIQUE NOT NULL,                  -- "AIKON", "SAP", "TANGO", "MANUAL"
  name VARCHAR(100) NOT NULL,                        -- "Aikon ERP", "SAP Business One"
  description TEXT,
  
  -- Configuración de la integración
  api_base_url TEXT,
  sync_frequency_minutes INTEGER DEFAULT 60,
  
  -- Capacidades del sistema
  supports_stock_sync BOOLEAN DEFAULT false,
  supports_price_sync BOOLEAN DEFAULT false,
  supports_order_push BOOLEAN DEFAULT false,
  supports_product_import BOOLEAN DEFAULT false,
  
  -- Mapeo de campos (configuración genérica)
  field_mappings JSONB DEFAULT '{
    "product_code": "code",
    "stock_field": "stock",
    "price_field": "price"
  }'::jsonb,
  
  -- Documentación
  documentation_url TEXT,
  
  -- Estado
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Instancias de sistemas por tenant
CREATE TABLE IF NOT EXISTS tenant_external_systems (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  external_system_id UUID NOT NULL REFERENCES external_systems(id) ON DELETE CASCADE,
  
  -- Identificador de la instancia
  instance_id VARCHAR(100) NOT NULL,                 -- "AIKON_CORDOBA", "SAP_TENANTX"
  instance_name VARCHAR(255),                        -- Nombre descriptivo
  
  -- Credenciales (encriptadas en producción)
  api_credentials JSONB DEFAULT '{}'::jsonb,
  
  -- Webhooks
  webhook_url TEXT,                                  -- URL para recibir actualizaciones
  webhook_secret TEXT,                               -- Secret para validar webhooks
  
  -- Configuración específica
  sync_config JSONB DEFAULT '{
    "auto_sync_stock": true,
    "auto_sync_prices": false,
    "sync_interval_minutes": 60
  }'::jsonb,
  
  -- Estado de sincronización
  is_active BOOLEAN DEFAULT true,
  is_primary BOOLEAN DEFAULT true,                   -- Sistema principal para este tenant
  last_sync_at TIMESTAMPTZ,
  last_sync_status VARCHAR(50) DEFAULT 'pending',    -- "pending", "success", "error"
  last_sync_error TEXT,
  sync_stats JSONB DEFAULT '{
    "products_synced": 0,
    "last_sync_duration_ms": 0,
    "total_syncs": 0,
    "failed_syncs": 0
  }'::jsonb,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(tenant_id, external_system_id, instance_id)
);

-- Códigos externos de productos por tenant
CREATE TABLE IF NOT EXISTS tenant_product_external_ids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  external_system_id UUID NOT NULL REFERENCES external_systems(id) ON DELETE CASCADE,
  
  -- Código en el sistema externo
  external_code VARCHAR(100) NOT NULL,               -- "50001" (Aikon), "MAT-123" (SAP)
  
  -- Metadatos del ERP
  external_metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Sincronización
  last_synced_at TIMESTAMPTZ,
  sync_hash VARCHAR(64),                             -- Hash para detectar cambios
  sync_status VARCHAR(20) DEFAULT 'pending',         -- "pending", "synced", "error"
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Un producto puede tener solo un código por sistema ERP por tenant
  UNIQUE(tenant_id, product_id, external_system_id)
);

-- Índice adicional para búsqueda por código externo
CREATE INDEX IF NOT EXISTS idx_tpei_external_code ON tenant_product_external_ids(external_code);
CREATE INDEX IF NOT EXISTS idx_tpei_tenant ON tenant_product_external_ids(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tpei_system ON tenant_product_external_ids(external_system_id);
CREATE INDEX IF NOT EXISTS idx_tpei_tenant_system ON tenant_product_external_ids(tenant_id, external_system_id);
CREATE INDEX IF NOT EXISTS idx_tes_tenant ON tenant_external_systems(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tes_system ON tenant_external_systems(external_system_id);
CREATE INDEX IF NOT EXISTS idx_external_systems_code ON external_systems(code);

-- Triggers para updated_at
DROP TRIGGER IF EXISTS trigger_external_systems_updated_at ON external_systems;
CREATE TRIGGER trigger_external_systems_updated_at
  BEFORE UPDATE ON external_systems
  FOR EACH ROW
  EXECUTE FUNCTION update_tenants_updated_at();

DROP TRIGGER IF EXISTS trigger_tes_updated_at ON tenant_external_systems;
CREATE TRIGGER trigger_tes_updated_at
  BEFORE UPDATE ON tenant_external_systems
  FOR EACH ROW
  EXECUTE FUNCTION update_tenants_updated_at();

DROP TRIGGER IF EXISTS trigger_tpei_updated_at ON tenant_product_external_ids;
CREATE TRIGGER trigger_tpei_updated_at
  BEFORE UPDATE ON tenant_product_external_ids
  FOR EACH ROW
  EXECUTE FUNCTION update_tenants_updated_at();

-- RLS
ALTER TABLE external_systems ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_external_systems ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_product_external_ids ENABLE ROW LEVEL SECURITY;

-- Políticas de lectura pública para sistemas externos
CREATE POLICY "External systems are publicly readable"
  ON external_systems FOR SELECT USING (is_active = true);

CREATE POLICY "External systems writable by service role"
  ON external_systems FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Tenant external systems - más restrictivo
CREATE POLICY "Tenant external systems readable by service role"
  ON tenant_external_systems FOR SELECT
  USING (auth.role() = 'service_role');

CREATE POLICY "Tenant external systems writable by service role"
  ON tenant_external_systems FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Códigos externos - lectura por service role
CREATE POLICY "Tenant product external ids readable by service role"
  ON tenant_product_external_ids FOR SELECT
  USING (auth.role() = 'service_role');

CREATE POLICY "Tenant product external ids writable by service role"
  ON tenant_product_external_ids FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Función para buscar producto por código externo
CREATE OR REPLACE FUNCTION find_product_by_external_code(
  p_tenant_id UUID,
  p_system_code VARCHAR(20),
  p_external_code VARCHAR(100)
)
RETURNS TABLE (
  product_id INTEGER,
  external_id UUID,
  tenant_product_id UUID,
  price DECIMAL(10,2),
  available_stock INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    tpei.product_id,
    tpei.id AS external_id,
    tp.id AS tenant_product_id,
    tp.price,
    get_tenant_product_stock(p_tenant_id, tpei.product_id) AS available_stock
  FROM tenant_product_external_ids tpei
  JOIN external_systems es ON es.id = tpei.external_system_id
  LEFT JOIN tenant_products tp ON tp.tenant_id = tpei.tenant_id AND tp.product_id = tpei.product_id
  WHERE tpei.tenant_id = p_tenant_id
    AND es.code = p_system_code
    AND tpei.external_code = p_external_code;
END;
$$;

-- Insertar sistemas predefinidos
INSERT INTO external_systems (code, name, description, supports_stock_sync, supports_price_sync, supports_order_push) VALUES
  ('AIKON', 'Aikon ERP', 'Sistema de gestión empresarial Aikon', true, true, true),
  ('SAP_B1', 'SAP Business One', 'SAP Business One para PyMEs', true, true, true),
  ('TANGO', 'Tango Gestión', 'Sistema de gestión contable Tango', true, true, false),
  ('MANUAL', 'Gestión Manual', 'Sin integración - gestión manual de stock y precios', false, false, false)
ON CONFLICT (code) DO NOTHING;

-- Comentarios
COMMENT ON TABLE external_systems IS 'Sistemas ERP/externos disponibles para integración';
COMMENT ON TABLE tenant_external_systems IS 'Instancias de sistemas externos configuradas por tenant';
COMMENT ON TABLE tenant_product_external_ids IS 'Mapeo de productos a códigos en sistemas externos por tenant';
COMMENT ON FUNCTION find_product_by_external_code IS 'Busca un producto por su código en un sistema externo para un tenant específico';
