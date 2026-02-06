-- ============================================================================
-- Logo para header (proporciones que aprovechan la altura del header)
-- ============================================================================
-- Ejemplo: logosize.svg para Pintemas evita espacios arriba/abajo en el header
-- ============================================================================

ALTER TABLE tenants ADD COLUMN IF NOT EXISTS logo_size_url TEXT;

COMMENT ON COLUMN tenants.logo_size_url IS 'URL del logo para el header (proporciones altas). Si existe, se usa en lugar de logo_url en el header.';

UPDATE tenants SET logo_size_url = '/tenants/pintemas/logosize.svg' WHERE slug = 'pintemas';
