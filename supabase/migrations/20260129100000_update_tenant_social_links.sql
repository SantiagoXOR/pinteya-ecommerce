-- =====================================================
-- ACTUALIZAR REDES SOCIALES POR TENANT
-- Renombrar a: 20260129100000_update_tenant_social_links.sql
-- y mover a: supabase/migrations/
-- Pintemas y Pinteya con Instagram y Facebook
-- =====================================================

-- Pintemas: Instagram y Facebook
UPDATE tenants
SET social_links = COALESCE(social_links, '{}'::jsonb) || '{
  "facebook": "https://www.facebook.com/pintureriapintemas/",
  "instagram": "https://www.instagram.com/pintureriaspintemas/?hl=es",
  "twitter": null,
  "youtube": null
}'::jsonb
WHERE slug = 'pintemas';

-- Pinteya: Instagram y Facebook
UPDATE tenants
SET social_links = COALESCE(social_links, '{}'::jsonb) || '{
  "facebook": "https://www.facebook.com/people/PinteYa/61577972353392/",
  "instagram": "https://www.instagram.com/pinteya.app/?hl=es",
  "twitter": null,
  "youtube": null
}'::jsonb
WHERE slug = 'pinteya';
