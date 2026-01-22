-- ============================================================================
-- MIGRACIÓN: Sistema Multitenant - Tabla Principal de Tenants
-- ============================================================================
-- Descripción: Crea la tabla principal de configuración por tenant para la
-- plataforma PintureríaDigital
-- ============================================================================

-- Tabla principal de configuración por tenant
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  
  -- Dominios
  subdomain VARCHAR(100),                            -- pinteya (para pinteya.pintureriadigital.com)
  custom_domain VARCHAR(255),                        -- www.pinteya.com
  
  -- Branding
  logo_url TEXT,
  logo_dark_url TEXT,
  favicon_url TEXT,
  
  -- Paleta de colores (CSS variables)
  primary_color VARCHAR(7) DEFAULT '#f27a1d',
  primary_dark VARCHAR(7) DEFAULT '#bd4811',
  primary_light VARCHAR(7) DEFAULT '#f9be78',
  secondary_color VARCHAR(7) DEFAULT '#00f269',
  accent_color VARCHAR(7) DEFAULT '#f9a007',
  background_gradient_start VARCHAR(7) DEFAULT '#000000',
  background_gradient_end VARCHAR(7) DEFAULT '#eb6313',
  header_bg_color VARCHAR(7) DEFAULT '#bd4811',
  
  -- Configuración de tema extendida
  theme_config JSONB DEFAULT '{
    "borderRadius": "0.5rem",
    "fontFamily": "Plus Jakarta Sans"
  }'::jsonb,
  
  -- Google Analytics
  ga4_measurement_id VARCHAR(50),
  ga4_property_id VARCHAR(50),
  google_credentials_json TEXT,
  google_merchant_id VARCHAR(50),
  google_site_verification VARCHAR(100),
  
  -- Meta/Facebook
  meta_pixel_id VARCHAR(50),
  meta_access_token TEXT,
  meta_ad_account_id VARCHAR(50),
  meta_catalog_id VARCHAR(50),
  
  -- MercadoPago
  mercadopago_access_token TEXT,
  mercadopago_public_key VARCHAR(255),
  mercadopago_webhook_secret TEXT,
  
  -- Email (Resend)
  resend_api_key TEXT,
  from_email VARCHAR(255),
  support_email VARCHAR(255),
  
  -- WhatsApp
  whatsapp_number VARCHAR(20),
  whatsapp_message_template TEXT DEFAULT 'Hola! Me interesa consultar sobre:',
  
  -- SEO y Metadata
  site_title VARCHAR(255),
  site_description TEXT,
  site_keywords TEXT[],
  og_image_url TEXT,
  
  -- Redes Sociales
  social_links JSONB DEFAULT '{
    "facebook": null,
    "instagram": null,
    "twitter": null,
    "youtube": null
  }'::jsonb,
  
  -- Información de contacto
  contact_phone VARCHAR(30),
  contact_address TEXT,
  contact_city VARCHAR(100),
  contact_province VARCHAR(100),
  contact_postal_code VARCHAR(20),
  contact_country VARCHAR(100) DEFAULT 'Argentina',
  
  -- Configuración regional
  currency VARCHAR(3) DEFAULT 'ARS',
  timezone VARCHAR(50) DEFAULT 'America/Argentina/Buenos_Aires',
  locale VARCHAR(10) DEFAULT 'es_AR',
  
  -- Configuración de negocio
  business_hours JSONB DEFAULT '{
    "monday": {"open": "09:00", "close": "18:00"},
    "tuesday": {"open": "09:00", "close": "18:00"},
    "wednesday": {"open": "09:00", "close": "18:00"},
    "thursday": {"open": "09:00", "close": "18:00"},
    "friday": {"open": "09:00", "close": "18:00"},
    "saturday": {"open": "09:00", "close": "13:00"},
    "sunday": null
  }'::jsonb,
  
  -- Estado
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para búsqueda rápida por dominio
CREATE INDEX IF NOT EXISTS idx_tenants_subdomain ON tenants(subdomain) WHERE subdomain IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tenants_custom_domain ON tenants(custom_domain) WHERE custom_domain IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tenants_slug ON tenants(slug);
CREATE INDEX IF NOT EXISTS idx_tenants_active ON tenants(is_active);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_tenants_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_tenants_updated_at ON tenants;
CREATE TRIGGER trigger_tenants_updated_at
  BEFORE UPDATE ON tenants
  FOR EACH ROW
  EXECUTE FUNCTION update_tenants_updated_at();

-- RLS básico para tenants (administrado por super admins)
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

-- Política de lectura pública (necesaria para detección de tenant)
CREATE POLICY "Tenants are publicly readable"
  ON tenants
  FOR SELECT
  USING (is_active = true);

-- Política de escritura solo para service role
CREATE POLICY "Tenants writable by service role"
  ON tenants
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Comentarios
COMMENT ON TABLE tenants IS 'Configuración principal de cada tenant en la plataforma PintureríaDigital';
COMMENT ON COLUMN tenants.slug IS 'Identificador único URL-friendly del tenant';
COMMENT ON COLUMN tenants.subdomain IS 'Subdominio para pintureriadigital.com (ej: pinteya)';
COMMENT ON COLUMN tenants.custom_domain IS 'Dominio personalizado (ej: www.pinteya.com)';
