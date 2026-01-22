-- ============================================================================
-- MIGRACIÓN: Agregar tenant_id a Tablas Existentes
-- ============================================================================
-- Descripción: Agrega la columna tenant_id a las tablas que necesitan
-- aislamiento de datos por tenant
-- ============================================================================

-- ============================================================================
-- ORDERS
-- ============================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'tenant_id'
  ) THEN
    ALTER TABLE orders ADD COLUMN tenant_id UUID REFERENCES tenants(id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_orders_tenant ON orders(tenant_id);

-- ============================================================================
-- ORDER_ITEMS
-- ============================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'order_items' AND column_name = 'tenant_id'
  ) THEN
    ALTER TABLE order_items ADD COLUMN tenant_id UUID REFERENCES tenants(id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_order_items_tenant ON order_items(tenant_id);

-- ============================================================================
-- ANALYTICS_EVENTS_OPTIMIZED
-- ============================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'analytics_events_optimized' AND column_name = 'tenant_id'
  ) THEN
    ALTER TABLE analytics_events_optimized ADD COLUMN tenant_id UUID REFERENCES tenants(id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_analytics_events_tenant ON analytics_events_optimized(tenant_id);

-- ============================================================================
-- USER_PROFILES
-- ============================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'tenant_id'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN tenant_id UUID REFERENCES tenants(id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_user_profiles_tenant ON user_profiles(tenant_id);

-- ============================================================================
-- CART_ITEMS
-- ============================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cart_items' AND column_name = 'tenant_id'
  ) THEN
    ALTER TABLE cart_items ADD COLUMN tenant_id UUID REFERENCES tenants(id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_cart_items_tenant ON cart_items(tenant_id);

-- ============================================================================
-- USER_ADDRESSES
-- ============================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_addresses' AND column_name = 'tenant_id'
  ) THEN
    ALTER TABLE user_addresses ADD COLUMN tenant_id UUID REFERENCES tenants(id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_user_addresses_tenant ON user_addresses(tenant_id);

-- ============================================================================
-- USER_PREFERENCES
-- ============================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_preferences' AND column_name = 'tenant_id'
  ) THEN
    ALTER TABLE user_preferences ADD COLUMN tenant_id UUID REFERENCES tenants(id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_user_preferences_tenant ON user_preferences(tenant_id);

-- ============================================================================
-- SHIPMENTS
-- ============================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'shipments' AND column_name = 'tenant_id'
  ) THEN
    ALTER TABLE shipments ADD COLUMN tenant_id UUID REFERENCES tenants(id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_shipments_tenant ON shipments(tenant_id);

-- Comentarios
COMMENT ON COLUMN orders.tenant_id IS 'Tenant al que pertenece esta orden';
COMMENT ON COLUMN order_items.tenant_id IS 'Tenant al que pertenece este item (denormalizado para RLS)';
COMMENT ON COLUMN analytics_events_optimized.tenant_id IS 'Tenant que generó este evento de analytics';
COMMENT ON COLUMN user_profiles.tenant_id IS 'Tenant principal del usuario (puede tener acceso a múltiples)';
COMMENT ON COLUMN cart_items.tenant_id IS 'Tenant del carrito';
