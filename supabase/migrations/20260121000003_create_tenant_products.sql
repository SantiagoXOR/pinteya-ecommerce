-- ============================================================================
-- MIGRACIÓN: Configuración de Productos por Tenant
-- ============================================================================
-- Descripción: Permite que cada tenant tenga precios, stock y visibilidad
-- independientes para cada producto del catálogo global
-- ============================================================================

-- Configuración de producto por tenant
CREATE TABLE IF NOT EXISTS tenant_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  
  -- ¿Usa pool compartido o stock propio?
  -- Si NULL → usa stock propio
  -- Si tiene valor → comparte stock con el pool
  shared_pool_id UUID REFERENCES shared_stock_pools(id) ON DELETE SET NULL,
  
  -- Stock propio (usado solo si shared_pool_id es NULL)
  stock INTEGER DEFAULT 0,
  reserved_stock INTEGER DEFAULT 0,
  min_stock_alert INTEGER DEFAULT 5,
  
  -- Precio (SIEMPRE propio por tenant, aunque comparta stock)
  price DECIMAL(10,2) NOT NULL,
  discounted_price DECIMAL(10,2),
  cost_price DECIMAL(10,2),                          -- Costo para cálculo de margen
  
  -- Visibilidad y ordenamiento
  is_visible BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  is_new BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  
  -- Configuración específica del tenant
  custom_name VARCHAR(255),                          -- Nombre personalizado (si difiere del global)
  custom_description TEXT,                           -- Descripción personalizada
  
  -- Sincronización
  last_price_sync_at TIMESTAMPTZ,
  last_stock_sync_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(tenant_id, product_id)
);

-- Índices para consultas frecuentes
CREATE INDEX IF NOT EXISTS idx_tenant_products_tenant ON tenant_products(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_products_product ON tenant_products(product_id);
CREATE INDEX IF NOT EXISTS idx_tenant_products_pool ON tenant_products(shared_pool_id) WHERE shared_pool_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tenant_products_visible ON tenant_products(tenant_id, is_visible) WHERE is_visible = true;
CREATE INDEX IF NOT EXISTS idx_tenant_products_featured ON tenant_products(tenant_id, is_featured) WHERE is_featured = true;

-- Trigger para updated_at
DROP TRIGGER IF EXISTS trigger_tenant_products_updated_at ON tenant_products;
CREATE TRIGGER trigger_tenant_products_updated_at
  BEFORE UPDATE ON tenant_products
  FOR EACH ROW
  EXECUTE FUNCTION update_tenants_updated_at();

-- RLS
ALTER TABLE tenant_products ENABLE ROW LEVEL SECURITY;

-- Política de lectura pública para productos visibles
CREATE POLICY "Tenant products are publicly readable"
  ON tenant_products
  FOR SELECT
  USING (is_visible = true);

-- Política de escritura solo para service role
CREATE POLICY "Tenant products writable by service role"
  ON tenant_products
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Función para obtener stock efectivo de un producto en un tenant
CREATE OR REPLACE FUNCTION get_tenant_product_stock(p_tenant_id UUID, p_product_id INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_record tenant_products%ROWTYPE;
  v_available INTEGER;
BEGIN
  -- Obtener configuración del producto para este tenant
  SELECT * INTO v_record
  FROM tenant_products
  WHERE tenant_id = p_tenant_id AND product_id = p_product_id;
  
  IF NOT FOUND THEN
    RETURN 0;
  END IF;
  
  -- Si usa pool compartido, obtener stock del pool
  IF v_record.shared_pool_id IS NOT NULL THEN
    v_available := get_pool_available_stock(v_record.shared_pool_id, p_product_id);
  ELSE
    -- Stock propio del tenant
    v_available := COALESCE(v_record.stock, 0) - COALESCE(v_record.reserved_stock, 0);
  END IF;
  
  RETURN COALESCE(v_available, 0);
END;
$$;

-- Función para obtener productos de un tenant con stock resuelto
CREATE OR REPLACE FUNCTION get_tenant_products_with_stock(p_tenant_id UUID)
RETURNS TABLE (
  product_id INTEGER,
  tenant_product_id UUID,
  price DECIMAL(10,2),
  discounted_price DECIMAL(10,2),
  available_stock INTEGER,
  is_shared_stock BOOLEAN,
  is_featured BOOLEAN,
  is_new BOOLEAN,
  custom_name VARCHAR(255)
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    tp.product_id,
    tp.id AS tenant_product_id,
    tp.price,
    tp.discounted_price,
    CASE 
      WHEN tp.shared_pool_id IS NOT NULL THEN
        get_pool_available_stock(tp.shared_pool_id, tp.product_id)
      ELSE
        COALESCE(tp.stock, 0) - COALESCE(tp.reserved_stock, 0)
    END AS available_stock,
    (tp.shared_pool_id IS NOT NULL) AS is_shared_stock,
    tp.is_featured,
    tp.is_new,
    tp.custom_name
  FROM tenant_products tp
  WHERE tp.tenant_id = p_tenant_id
    AND tp.is_visible = true
  ORDER BY tp.sort_order, tp.created_at;
END;
$$;

-- Comentarios
COMMENT ON TABLE tenant_products IS 'Configuración de productos por tenant: precios, stock, visibilidad';
COMMENT ON COLUMN tenant_products.shared_pool_id IS 'Si no es NULL, el stock viene del pool compartido';
COMMENT ON COLUMN tenant_products.stock IS 'Stock propio (solo usado si shared_pool_id es NULL)';
COMMENT ON FUNCTION get_tenant_product_stock IS 'Retorna el stock disponible de un producto para un tenant (resolviendo pool compartido o stock propio)';
