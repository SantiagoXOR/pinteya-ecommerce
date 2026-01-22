-- ============================================================================
-- MIGRACIÓN: Optimización de Índices para Multitenant
-- ============================================================================
-- Descripción: Verifica y crea índices compuestos optimizados para queries
-- que filtran por tenant_id junto con otros campos comunes
-- Fecha: 2026-01-23
-- ============================================================================

-- ============================================================================
-- VERIFICAR ÍNDICES EXISTENTES Y CREAR LOS FALTANTES
-- ============================================================================

-- ============================================================================
-- ORDERS - Índices compuestos para queries comunes
-- ============================================================================

-- Índice compuesto para: WHERE tenant_id = ? AND user_id = ?
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'orders' 
    AND indexname = 'idx_orders_tenant_user'
  ) THEN
    CREATE INDEX idx_orders_tenant_user ON orders(tenant_id, user_id);
    RAISE NOTICE 'Created index: idx_orders_tenant_user';
  END IF;
END $$;

-- Índice compuesto para: WHERE tenant_id = ? AND status = ?
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'orders' 
    AND indexname = 'idx_orders_tenant_status'
  ) THEN
    CREATE INDEX idx_orders_tenant_status ON orders(tenant_id, status);
    RAISE NOTICE 'Created index: idx_orders_tenant_status';
  END IF;
END $$;

-- Índice compuesto para: WHERE tenant_id = ? AND created_at DESC (paginación)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'orders' 
    AND indexname = 'idx_orders_tenant_created'
  ) THEN
    CREATE INDEX idx_orders_tenant_created ON orders(tenant_id, created_at DESC);
    RAISE NOTICE 'Created index: idx_orders_tenant_created';
  END IF;
END $$;

-- ============================================================================
-- ORDER_ITEMS - Índices compuestos
-- ============================================================================

-- Índice compuesto para: WHERE tenant_id = ? AND order_id = ?
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'order_items' 
    AND indexname = 'idx_order_items_tenant_order'
  ) THEN
    CREATE INDEX idx_order_items_tenant_order ON order_items(tenant_id, order_id);
    RAISE NOTICE 'Created index: idx_order_items_tenant_order';
  END IF;
END $$;

-- Índice compuesto para: WHERE tenant_id = ? AND product_id = ?
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'order_items' 
    AND indexname = 'idx_order_items_tenant_product'
  ) THEN
    CREATE INDEX idx_order_items_tenant_product ON order_items(tenant_id, product_id);
    RAISE NOTICE 'Created index: idx_order_items_tenant_product';
  END IF;
END $$;

-- ============================================================================
-- CART_ITEMS - Índices compuestos (ya existe idx_cart_items_user_tenant)
-- ============================================================================

-- Verificar que existe el índice compuesto (user_id, tenant_id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'cart_items' 
    AND indexname = 'idx_cart_items_user_tenant'
  ) THEN
    CREATE INDEX idx_cart_items_user_tenant ON cart_items(user_id, tenant_id);
    RAISE NOTICE 'Created index: idx_cart_items_user_tenant';
  END IF;
END $$;

-- Índice compuesto para: WHERE tenant_id = ? AND product_id = ?
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'cart_items' 
    AND indexname = 'idx_cart_items_tenant_product'
  ) THEN
    CREATE INDEX idx_cart_items_tenant_product ON cart_items(tenant_id, product_id);
    RAISE NOTICE 'Created index: idx_cart_items_tenant_product';
  END IF;
END $$;

-- ============================================================================
-- CATEGORIES - Índices compuestos
-- ============================================================================

-- Índice compuesto para: WHERE tenant_id = ? AND slug = ? (ya existe constraint único)
-- Pero agregamos índice para búsquedas por nombre
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'categories' 
    AND indexname = 'idx_categories_tenant_name'
  ) THEN
    CREATE INDEX idx_categories_tenant_name ON categories(tenant_id, name);
    RAISE NOTICE 'Created index: idx_categories_tenant_name';
  END IF;
END $$;

-- ============================================================================
-- COUPONS - Índices compuestos
-- ============================================================================

-- Índice compuesto para: WHERE tenant_id = ? AND code = ? (ya existe constraint único)
-- Índice para búsquedas por estado y fecha
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'coupons' 
    AND indexname = 'idx_coupons_tenant_active'
  ) THEN
    CREATE INDEX idx_coupons_tenant_active ON coupons(tenant_id, is_active) 
    WHERE is_active = true;
    RAISE NOTICE 'Created index: idx_coupons_tenant_active';
  END IF;
END $$;

-- ============================================================================
-- PROMOTIONS - Índices compuestos
-- ============================================================================

-- Índice compuesto para búsquedas por estado
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'promotions' 
    AND indexname = 'idx_promotions_tenant_active'
  ) THEN
    CREATE INDEX idx_promotions_tenant_active ON promotions(tenant_id, is_active) 
    WHERE is_active = true;
    RAISE NOTICE 'Created index: idx_promotions_tenant_active';
  END IF;
END $$;

-- ============================================================================
-- ANALYTICS_EVENTS_OPTIMIZED - Índices compuestos
-- ============================================================================

-- Índice compuesto para: WHERE tenant_id = ? AND event_type = ?
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'analytics_events_optimized' 
    AND indexname = 'idx_analytics_tenant_event_type'
  ) THEN
    CREATE INDEX idx_analytics_tenant_event_type ON analytics_events_optimized(tenant_id, event_type);
    RAISE NOTICE 'Created index: idx_analytics_tenant_event_type';
  END IF;
END $$;

-- Índice compuesto para: WHERE tenant_id = ? AND created_at BETWEEN ? AND ?
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'analytics_events_optimized' 
    AND indexname = 'idx_analytics_tenant_created'
  ) THEN
    CREATE INDEX idx_analytics_tenant_created ON analytics_events_optimized(tenant_id, created_at DESC);
    RAISE NOTICE 'Created index: idx_analytics_tenant_created';
  END IF;
END $$;

-- ============================================================================
-- DRIVERS - Índices compuestos
-- ============================================================================

-- Índice compuesto para: WHERE tenant_id = ? AND status = ?
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'drivers') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE tablename = 'drivers' 
      AND indexname = 'idx_drivers_tenant_status'
    ) THEN
      CREATE INDEX idx_drivers_tenant_status ON drivers(tenant_id, status);
      RAISE NOTICE 'Created index: idx_drivers_tenant_status';
    END IF;
  END IF;
END $$;

-- ============================================================================
-- OPTIMIZED_ROUTES - Índices compuestos
-- ============================================================================

-- Índice compuesto para: WHERE tenant_id = ? AND status = ?
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'optimized_routes' 
    AND indexname = 'idx_routes_tenant_status'
  ) THEN
    CREATE INDEX idx_routes_tenant_status ON optimized_routes(tenant_id, status);
    RAISE NOTICE 'Created index: idx_routes_tenant_status';
  END IF;
END $$;

-- ============================================================================
-- TRACKING_EVENTS - Índices compuestos
-- ============================================================================

-- Índice compuesto para: WHERE tenant_id = ? AND shipment_id = ?
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tracking_events' 
    AND column_name = 'shipment_id'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE tablename = 'tracking_events' 
      AND indexname = 'idx_tracking_tenant_shipment'
    ) THEN
      CREATE INDEX idx_tracking_tenant_shipment ON tracking_events(tenant_id, shipment_id);
      RAISE NOTICE 'Created index: idx_tracking_tenant_shipment';
    END IF;
  END IF;
END $$;

-- Índice compuesto para: WHERE tenant_id = ? AND created_at BETWEEN ? AND ?
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'tracking_events' 
    AND indexname = 'idx_tracking_tenant_created'
  ) THEN
    CREATE INDEX idx_tracking_tenant_created ON tracking_events(tenant_id, created_at DESC);
    RAISE NOTICE 'Created index: idx_tracking_tenant_created';
  END IF;
END $$;

-- ============================================================================
-- SYSTEM_SETTINGS - Índice compuesto (ya existe constraint único)
-- ============================================================================

-- El constraint único (key, tenant_id) ya actúa como índice
-- No necesitamos índice adicional

-- ============================================================================
-- TENANT_PRODUCTS - Índices compuestos (tabla intermedia)
-- ============================================================================

-- Índice compuesto para: WHERE tenant_id = ? AND product_id = ?
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'tenant_products'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE tablename = 'tenant_products' 
      AND indexname = 'idx_tenant_products_tenant_product'
    ) THEN
      CREATE INDEX idx_tenant_products_tenant_product ON tenant_products(tenant_id, product_id);
      RAISE NOTICE 'Created index: idx_tenant_products_tenant_product';
    END IF;
  END IF;
END $$;

-- Índice compuesto para: WHERE tenant_id = ? AND is_visible = true
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'tenant_products'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE tablename = 'tenant_products' 
      AND indexname = 'idx_tenant_products_tenant_visible'
    ) THEN
      CREATE INDEX idx_tenant_products_tenant_visible ON tenant_products(tenant_id, is_visible) 
      WHERE is_visible = true;
      RAISE NOTICE 'Created index: idx_tenant_products_tenant_visible';
    END IF;
  END IF;
END $$;

-- Índice compuesto para: WHERE tenant_id = ? AND is_featured = true
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'tenant_products'
    AND EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'tenant_products' 
      AND column_name = 'is_featured'
    )
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE tablename = 'tenant_products' 
      AND indexname = 'idx_tenant_products_tenant_featured'
    ) THEN
      CREATE INDEX idx_tenant_products_tenant_featured ON tenant_products(tenant_id, is_featured) 
      WHERE is_featured = true;
      RAISE NOTICE 'Created index: idx_tenant_products_tenant_featured';
    END IF;
  END IF;
END $$;

-- ============================================================================
-- USER_PROFILES - Índice compuesto (si tiene tenant_id)
-- ============================================================================

-- Índice compuesto para: WHERE tenant_id = ? AND email = ?
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' 
    AND column_name = 'tenant_id'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE tablename = 'user_profiles' 
      AND indexname = 'idx_user_profiles_tenant_email'
    ) THEN
      CREATE INDEX idx_user_profiles_tenant_email ON user_profiles(tenant_id, email);
      RAISE NOTICE 'Created index: idx_user_profiles_tenant_email';
    END IF;
  END IF;
END $$;

-- ============================================================================
-- COMENTARIOS Y DOCUMENTACIÓN
-- ============================================================================

COMMENT ON INDEX idx_orders_tenant_user IS 
  'Índice compuesto para queries que filtran órdenes por tenant y usuario';
COMMENT ON INDEX idx_orders_tenant_status IS 
  'Índice compuesto para queries que filtran órdenes por tenant y estado';
COMMENT ON INDEX idx_orders_tenant_created IS 
  'Índice compuesto para paginación de órdenes por tenant ordenadas por fecha';
COMMENT ON INDEX idx_order_items_tenant_order IS 
  'Índice compuesto para obtener items de una orden específica del tenant';
COMMENT ON INDEX idx_cart_items_tenant_product IS 
  'Índice compuesto para queries de carrito por tenant y producto';
COMMENT ON INDEX idx_categories_tenant_name IS 
  'Índice compuesto para búsquedas de categorías por tenant y nombre';
COMMENT ON INDEX idx_analytics_tenant_event_type IS 
  'Índice compuesto para analytics filtrados por tenant y tipo de evento';
COMMENT ON INDEX idx_analytics_tenant_created IS 
  'Índice compuesto para analytics filtrados por tenant y rango de fechas';
COMMENT ON INDEX idx_tenant_products_tenant_visible IS 
  'Índice parcial para productos visibles del tenant (mejora performance en APIs públicas)';
COMMENT ON INDEX idx_tenant_products_tenant_featured IS 
  'Índice parcial para productos destacados del tenant';

-- ============================================================================
-- ANÁLISIS DE ÍNDICES EXISTENTES
-- ============================================================================

-- Query para verificar todos los índices relacionados con tenant_id
-- (Para ejecutar manualmente y verificar)
/*
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename IN (
  'orders', 'order_items', 'cart_items', 'categories', 
  'coupons', 'promotions', 'analytics_events_optimized',
  'drivers', 'optimized_routes', 'tracking_events',
  'system_settings', 'tenant_products', 'user_profiles'
)
AND indexdef LIKE '%tenant_id%'
ORDER BY tablename, indexname;
*/
