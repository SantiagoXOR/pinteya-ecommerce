-- ============================================================================
-- MIGRACIÓN: Sistema de Stock Compartido
-- ============================================================================
-- Descripción: Crea las tablas para gestionar pools de stock compartido entre
-- tenants (ej: Pinteya y Pintemas comparten el mismo depósito)
-- ============================================================================

-- Pools de stock compartido (para casos como Pinteya+Pintemas)
CREATE TABLE IF NOT EXISTS shared_stock_pools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,                        -- "Pool Córdoba Central"
  code VARCHAR(20) UNIQUE NOT NULL,                  -- "POOL-CBA"
  description TEXT,
  
  -- Ubicación del depósito
  address TEXT,
  city VARCHAR(100),
  province VARCHAR(100),
  postal_code VARCHAR(20),
  country VARCHAR(100) DEFAULT 'Argentina',
  
  -- Coordenadas (para logística)
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  
  -- Estado
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stock del pool compartido por producto
CREATE TABLE IF NOT EXISTS shared_pool_stock (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pool_id UUID NOT NULL REFERENCES shared_stock_pools(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  
  -- Niveles de stock
  stock INTEGER DEFAULT 0,
  reserved_stock INTEGER DEFAULT 0,                  -- Reservado en carritos/órdenes pendientes
  min_stock_alert INTEGER DEFAULT 5,                 -- Alertar cuando stock < este valor
  
  -- Sincronización con ERP
  last_sync_at TIMESTAMPTZ,
  sync_source VARCHAR(50),                           -- "AIKON", "SAP", "MANUAL"
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(pool_id, product_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_shared_stock_pools_code ON shared_stock_pools(code);
CREATE INDEX IF NOT EXISTS idx_shared_stock_pools_active ON shared_stock_pools(is_active);
CREATE INDEX IF NOT EXISTS idx_shared_pool_stock_pool ON shared_pool_stock(pool_id);
CREATE INDEX IF NOT EXISTS idx_shared_pool_stock_product ON shared_pool_stock(product_id);

-- Triggers para updated_at
CREATE OR REPLACE FUNCTION update_shared_stock_pools_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_shared_stock_pools_updated_at ON shared_stock_pools;
CREATE TRIGGER trigger_shared_stock_pools_updated_at
  BEFORE UPDATE ON shared_stock_pools
  FOR EACH ROW
  EXECUTE FUNCTION update_shared_stock_pools_updated_at();

DROP TRIGGER IF EXISTS trigger_shared_pool_stock_updated_at ON shared_pool_stock;
CREATE TRIGGER trigger_shared_pool_stock_updated_at
  BEFORE UPDATE ON shared_pool_stock
  FOR EACH ROW
  EXECUTE FUNCTION update_shared_stock_pools_updated_at();

-- RLS
ALTER TABLE shared_stock_pools ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_pool_stock ENABLE ROW LEVEL SECURITY;

-- Políticas de lectura pública para stock
CREATE POLICY "Shared stock pools are publicly readable"
  ON shared_stock_pools
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Shared pool stock is publicly readable"
  ON shared_pool_stock
  FOR SELECT
  USING (true);

-- Políticas de escritura solo para service role
CREATE POLICY "Shared stock pools writable by service role"
  ON shared_stock_pools
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Shared pool stock writable by service role"
  ON shared_pool_stock
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Función para obtener stock disponible (stock - reservado)
CREATE OR REPLACE FUNCTION get_pool_available_stock(p_pool_id UUID, p_product_id INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_available INTEGER;
BEGIN
  SELECT COALESCE(stock, 0) - COALESCE(reserved_stock, 0)
  INTO v_available
  FROM shared_pool_stock
  WHERE pool_id = p_pool_id AND product_id = p_product_id;
  
  RETURN COALESCE(v_available, 0);
END;
$$;

-- Comentarios
COMMENT ON TABLE shared_stock_pools IS 'Depósitos/pools de stock que pueden ser compartidos entre múltiples tenants';
COMMENT ON TABLE shared_pool_stock IS 'Niveles de stock por producto en cada pool compartido';
COMMENT ON COLUMN shared_pool_stock.reserved_stock IS 'Stock reservado por carritos o órdenes pendientes de confirmación';
