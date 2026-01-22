-- ============================================================================
-- MIGRACIÓN: Crear Tenant Pintemas
-- ============================================================================
-- Descripción: Crea el segundo tenant de ejemplo (Pintemas) que comparte
-- productos y stock con Pinteya
-- ============================================================================

-- ============================================================================
-- TENANT: PINTEMAS
-- ============================================================================
INSERT INTO tenants (
  slug,
  name,
  subdomain,
  custom_domain,
  logo_url,
  logo_dark_url,
  favicon_url,
  -- Colores diferentes para Pintemas (azul/verde)
  primary_color,
  primary_dark,
  primary_light,
  secondary_color,
  accent_color,
  background_gradient_start,
  background_gradient_end,
  header_bg_color,
  theme_config,
  whatsapp_number,
  whatsapp_message_template,
  site_title,
  site_description,
  site_keywords,
  contact_phone,
  contact_address,
  contact_city,
  contact_province,
  contact_country,
  currency,
  timezone,
  locale,
  business_hours,
  is_active
) VALUES (
  'pintemas',
  'Pintemas',
  'pintemas',
  'www.pintemas.com',
  '/tenants/pintemas/logo.svg',
  '/tenants/pintemas/logo-dark.svg',
  '/tenants/pintemas/favicon.svg',
  -- Paleta azul para diferenciar
  '#1e88e5',  -- primary_color (azul)
  '#1565c0',  -- primary_dark
  '#64b5f6',  -- primary_light
  '#4caf50',  -- secondary (verde)
  '#ffc107',  -- accent (amarillo)
  '#0d1b2a',  -- gradient_start
  '#1565c0',  -- gradient_end
  '#1565c0',  -- header_bg
  '{"borderRadius": "0.5rem", "fontFamily": "Plus Jakarta Sans"}'::jsonb,
  '5493516323002',  -- Mismo número que Pinteya (negocio compartido)
  'Hola! Me interesa consultar sobre:',
  'Pintemas - Pinturería Online',
  'Tu pinturería online con los mejores productos. Envíos a toda Argentina.',
  ARRAY['pinturería', 'pintura', 'online', 'Argentina', 'latex', 'esmalte'],
  '5493516323002',
  'Córdoba, Argentina',
  'Córdoba',
  'Córdoba',
  'Argentina',
  'ARS',
  'America/Argentina/Buenos_Aires',
  'es_AR',
  '{
    "monday": {"open": "09:00", "close": "18:00"},
    "tuesday": {"open": "09:00", "close": "18:00"},
    "wednesday": {"open": "09:00", "close": "18:00"},
    "thursday": {"open": "09:00", "close": "18:00"},
    "friday": {"open": "09:00", "close": "18:00"},
    "saturday": {"open": "09:00", "close": "13:00"},
    "sunday": null
  }'::jsonb,
  true
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  primary_color = EXCLUDED.primary_color,
  updated_at = NOW();

-- ============================================================================
-- Configurar productos para Pintemas (comparte stock con Pinteya)
-- ============================================================================
DO $$
DECLARE
  v_pintemas_id UUID;
  v_pool_id UUID;
  v_aikon_id UUID;
  v_pinteya_id UUID;
BEGIN
  SELECT id INTO v_pintemas_id FROM tenants WHERE slug = 'pintemas';
  SELECT id INTO v_pinteya_id FROM tenants WHERE slug = 'pinteya';
  SELECT id INTO v_pool_id FROM shared_stock_pools WHERE code = 'POOL-CBA';
  SELECT id INTO v_aikon_id FROM external_systems WHERE code = 'AIKON';
  
  IF v_pintemas_id IS NULL THEN
    RAISE EXCEPTION 'Tenant Pintemas no encontrado';
  END IF;
  
  -- Copiar productos de Pinteya a Pintemas (mismo precio, mismo pool de stock)
  INSERT INTO tenant_products (
    tenant_id,
    product_id,
    price,
    discounted_price,
    shared_pool_id,
    is_visible,
    is_featured
  )
  SELECT 
    v_pintemas_id,
    tp.product_id,
    tp.price,
    tp.discounted_price,
    v_pool_id,  -- Usa el mismo pool de stock
    true,
    tp.is_featured
  FROM tenant_products tp
  WHERE tp.tenant_id = v_pinteya_id
    AND NOT EXISTS (
      SELECT 1 FROM tenant_products tp2 
      WHERE tp2.tenant_id = v_pintemas_id AND tp2.product_id = tp.product_id
    );
  
  RAISE NOTICE 'Productos configurados para Pintemas: %', (
    SELECT COUNT(*) FROM tenant_products WHERE tenant_id = v_pintemas_id
  );
  
  -- Vincular Pintemas con Aikon (misma instancia que Pinteya)
  IF v_aikon_id IS NOT NULL THEN
    INSERT INTO tenant_external_systems (
      tenant_id,
      external_system_id,
      instance_id,
      instance_name,
      is_active,
      is_primary
    ) VALUES (
      v_pintemas_id,
      v_aikon_id,
      'AIKON_CORDOBA',  -- Misma instancia que Pinteya
      'Aikon ERP - Córdoba',
      true,
      true
    ) ON CONFLICT (tenant_id, external_system_id, instance_id) DO NOTHING;
    
    -- Copiar códigos externos de Pinteya (mismos códigos Aikon)
    INSERT INTO tenant_product_external_ids (
      tenant_id,
      product_id,
      external_system_id,
      external_code,
      sync_status,
      last_synced_at
    )
    SELECT 
      v_pintemas_id,
      tpei.product_id,
      tpei.external_system_id,
      tpei.external_code,
      'synced',
      NOW()
    FROM tenant_product_external_ids tpei
    WHERE tpei.tenant_id = v_pinteya_id
      AND tpei.external_system_id = v_aikon_id
      AND NOT EXISTS (
        SELECT 1 FROM tenant_product_external_ids tpei2 
        WHERE tpei2.tenant_id = v_pintemas_id 
          AND tpei2.product_id = tpei.product_id
          AND tpei2.external_system_id = v_aikon_id
      );
    
    RAISE NOTICE 'Códigos Aikon configurados para Pintemas: %', (
      SELECT COUNT(*) FROM tenant_product_external_ids 
      WHERE tenant_id = v_pintemas_id AND external_system_id = v_aikon_id
    );
  END IF;
  
  RAISE NOTICE '✅ Tenant Pintemas configurado exitosamente';
  
END $$;

-- Comentarios
COMMENT ON TABLE tenants IS 'Tenants Pinteya y Pintemas configurados con stock compartido';
