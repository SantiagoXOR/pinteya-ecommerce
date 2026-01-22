-- ============================================================================
-- MIGRACIÓN: Seed de Tenants Iniciales
-- ============================================================================
-- Descripción: Inserta los tenants iniciales (Pinteya y Pintemas) con su
-- configuración completa
-- ============================================================================

-- ============================================================================
-- TENANT: PINTEYA
-- ============================================================================
INSERT INTO tenants (
  slug,
  name,
  subdomain,
  custom_domain,
  logo_url,
  logo_dark_url,
  favicon_url,
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
  'pinteya',
  'Pinteya',
  'pinteya',
  'www.pinteya.com',
  '/tenants/pinteya/logo.svg',
  '/tenants/pinteya/logo-dark.svg',
  '/tenants/pinteya/favicon.svg',
  '#f27a1d',
  '#bd4811',
  '#f9be78',
  '#00f269',
  '#f9a007',
  '#000000',
  '#eb6313',
  '#bd4811',
  '{"borderRadius": "0.5rem", "fontFamily": "Plus Jakarta Sans"}'::jsonb,
  '5493516323002',
  'Hola! Me interesa consultar sobre:',
  'Pinteya - Tu Pinturería Online',
  'Pinturería online especializada en productos de pintura profesional. Envíos a todo Córdoba.',
  ARRAY['pinturería', 'pintura', 'online', 'Córdoba', 'Argentina', 'latex', 'esmalte', 'barniz'],
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
  subdomain = EXCLUDED.subdomain,
  custom_domain = EXCLUDED.custom_domain,
  logo_url = EXCLUDED.logo_url,
  updated_at = NOW();

-- ============================================================================
-- POOL DE STOCK: CÓRDOBA CENTRAL (compartido Pinteya + Pintemas)
-- ============================================================================
INSERT INTO shared_stock_pools (
  code,
  name,
  description,
  city,
  province,
  country,
  is_active
) VALUES (
  'POOL-CBA',
  'Pool Córdoba Central',
  'Depósito central compartido entre Pinteya y Pintemas',
  'Córdoba',
  'Córdoba',
  'Argentina',
  true
) ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- VINCULAR PINTEYA CON AIKON ERP
-- ============================================================================
DO $$
DECLARE
  v_pinteya_id UUID;
  v_aikon_id UUID;
BEGIN
  -- Obtener IDs
  SELECT id INTO v_pinteya_id FROM tenants WHERE slug = 'pinteya';
  SELECT id INTO v_aikon_id FROM external_systems WHERE code = 'AIKON';
  
  -- Crear relación si no existe
  IF v_pinteya_id IS NOT NULL AND v_aikon_id IS NOT NULL THEN
    INSERT INTO tenant_external_systems (
      tenant_id,
      external_system_id,
      instance_id,
      instance_name,
      is_active,
      is_primary
    ) VALUES (
      v_pinteya_id,
      v_aikon_id,
      'AIKON_CORDOBA',
      'Aikon ERP - Córdoba',
      true,
      true
    ) ON CONFLICT (tenant_id, external_system_id, instance_id) DO NOTHING;
  END IF;
END $$;

-- ============================================================================
-- COMENTARIO
-- ============================================================================
COMMENT ON TABLE tenants IS 'Tenant Pinteya creado como tenant inicial de la plataforma PintureríaDigital';
