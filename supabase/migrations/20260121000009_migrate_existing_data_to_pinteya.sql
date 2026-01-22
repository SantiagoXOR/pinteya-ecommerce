-- ============================================================================
-- MIGRACIÓN: Migrar Datos Existentes al Tenant Pinteya
-- ============================================================================
-- Descripción: Asigna todos los datos existentes (órdenes, analytics, usuarios,
-- carritos) al tenant Pinteya y crea configuración de productos
-- ============================================================================

-- ============================================================================
-- PASO 1: Obtener ID del tenant Pinteya
-- ============================================================================
DO $$
DECLARE
  v_pinteya_id UUID;
  v_pool_id UUID;
  v_aikon_id UUID;
BEGIN
  -- Obtener ID de Pinteya
  SELECT id INTO v_pinteya_id FROM tenants WHERE slug = 'pinteya';
  
  IF v_pinteya_id IS NULL THEN
    RAISE EXCEPTION 'Tenant Pinteya no encontrado. Ejecutar primero seed_tenants.';
  END IF;
  
  RAISE NOTICE 'Migrando datos al tenant Pinteya: %', v_pinteya_id;
  
  -- ============================================================================
  -- PASO 2: Actualizar órdenes existentes
  -- ============================================================================
  UPDATE orders
  SET tenant_id = v_pinteya_id
  WHERE tenant_id IS NULL;
  
  RAISE NOTICE 'Órdenes actualizadas: %', (SELECT COUNT(*) FROM orders WHERE tenant_id = v_pinteya_id);
  
  -- ============================================================================
  -- PASO 3: Actualizar order_items
  -- ============================================================================
  UPDATE order_items
  SET tenant_id = v_pinteya_id
  WHERE tenant_id IS NULL;
  
  -- ============================================================================
  -- PASO 4: Actualizar analytics
  -- ============================================================================
  UPDATE analytics_events_optimized
  SET tenant_id = v_pinteya_id
  WHERE tenant_id IS NULL;
  
  RAISE NOTICE 'Analytics actualizados: %', (SELECT COUNT(*) FROM analytics_events_optimized WHERE tenant_id = v_pinteya_id);
  
  -- ============================================================================
  -- PASO 5: Actualizar user_profiles
  -- ============================================================================
  UPDATE user_profiles
  SET tenant_id = v_pinteya_id
  WHERE tenant_id IS NULL;
  
  -- ============================================================================
  -- PASO 6: Actualizar cart_items
  -- ============================================================================
  UPDATE cart_items
  SET tenant_id = v_pinteya_id
  WHERE tenant_id IS NULL;
  
  -- ============================================================================
  -- PASO 7: Actualizar shipments
  -- ============================================================================
  UPDATE shipments
  SET tenant_id = v_pinteya_id
  WHERE tenant_id IS NULL;
  
  -- ============================================================================
  -- PASO 8: Obtener Pool de Córdoba
  -- ============================================================================
  SELECT id INTO v_pool_id FROM shared_stock_pools WHERE code = 'POOL-CBA';
  
  -- ============================================================================
  -- PASO 9: Crear tenant_products para todos los productos existentes
  -- ============================================================================
  INSERT INTO tenant_products (
    tenant_id,
    product_id,
    price,
    discounted_price,
    stock,
    shared_pool_id,
    is_visible,
    is_featured
  )
  SELECT 
    v_pinteya_id,
    p.id,
    COALESCE(p.price, 0),
    p.discounted_price,
    COALESCE(p.stock, 0),
    v_pool_id,  -- Usar pool compartido
    true,
    false
  FROM products p
  WHERE NOT EXISTS (
    SELECT 1 FROM tenant_products tp 
    WHERE tp.tenant_id = v_pinteya_id AND tp.product_id = p.id
  );
  
  RAISE NOTICE 'Productos configurados para Pinteya: %', (SELECT COUNT(*) FROM tenant_products WHERE tenant_id = v_pinteya_id);
  
  -- ============================================================================
  -- PASO 10: Copiar stock a shared_pool_stock
  -- ============================================================================
  INSERT INTO shared_pool_stock (
    pool_id,
    product_id,
    stock,
    reserved_stock,
    sync_source
  )
  SELECT 
    v_pool_id,
    p.id,
    COALESCE(p.stock, 0),
    0,
    'MIGRATION'
  FROM products p
  WHERE NOT EXISTS (
    SELECT 1 FROM shared_pool_stock sps 
    WHERE sps.pool_id = v_pool_id AND sps.product_id = p.id
  );
  
  RAISE NOTICE 'Stock migrado al pool: %', (SELECT COUNT(*) FROM shared_pool_stock WHERE pool_id = v_pool_id);
  
  -- ============================================================================
  -- PASO 11: Migrar códigos aikon_id a tenant_product_external_ids
  -- ============================================================================
  SELECT id INTO v_aikon_id FROM external_systems WHERE code = 'AIKON';
  
  IF v_aikon_id IS NOT NULL THEN
    -- Migrar desde products
    INSERT INTO tenant_product_external_ids (
      tenant_id,
      product_id,
      external_system_id,
      external_code,
      sync_status,
      last_synced_at
    )
    SELECT 
      v_pinteya_id,
      p.id,
      v_aikon_id,
      p.aikon_id::text,
      'synced',
      NOW()
    FROM products p
    WHERE p.aikon_id IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM tenant_product_external_ids tpei 
        WHERE tpei.tenant_id = v_pinteya_id 
          AND tpei.product_id = p.id 
          AND tpei.external_system_id = v_aikon_id
      );
    
    RAISE NOTICE 'Códigos Aikon migrados desde products: %', (
      SELECT COUNT(*) FROM tenant_product_external_ids 
      WHERE tenant_id = v_pinteya_id AND external_system_id = v_aikon_id
    );
    
    -- Migrar desde product_variants
    INSERT INTO tenant_product_external_ids (
      tenant_id,
      product_id,
      external_system_id,
      external_code,
      external_metadata,
      sync_status,
      last_synced_at
    )
    SELECT DISTINCT ON (v_pinteya_id, pv.product_id, pv.aikon_id)
      v_pinteya_id,
      pv.product_id,
      v_aikon_id,
      pv.aikon_id::text,
      jsonb_build_object(
        'variant_id', pv.id,
        'color', pv.color,
        'measure', pv.measure
      ),
      'synced',
      NOW()
    FROM product_variants pv
    WHERE pv.aikon_id IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM tenant_product_external_ids tpei 
        WHERE tpei.tenant_id = v_pinteya_id 
          AND tpei.external_system_id = v_aikon_id
          AND tpei.external_code = pv.aikon_id::text
      );
    
    RAISE NOTICE 'Códigos Aikon de variantes migrados: %', (
      SELECT COUNT(*) FROM tenant_product_external_ids 
      WHERE tenant_id = v_pinteya_id AND external_system_id = v_aikon_id
    );
  END IF;
  
  RAISE NOTICE '✅ Migración completada exitosamente';
  
END $$;

-- Comentarios
COMMENT ON TABLE tenant_products IS 'Configuración de productos migrada desde datos existentes';
