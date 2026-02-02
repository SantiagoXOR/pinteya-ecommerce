-- ============================================================================
-- MIGRACIÓN: GA4 y verificación de sitio (Pintemas)
-- ============================================================================
-- Descripción: Configura GA4 y Google Site Verification para Pintemas:
-- - Measurement ID (G-RMP27V7YXW) y Property ID (13402616880): tracking GA4.
-- - google_site_verification: meta tag para Merchant Center / Search Console.
-- ============================================================================

UPDATE tenants
SET
  ga4_measurement_id = 'G-RMP27V7YXW',
  ga4_property_id = '13402616880',
  google_site_verification = 'Wjn5ui83xg3CxriEi7VVBw5H4eSAGiUp7ugxcLD5KiU',
  updated_at = NOW()
WHERE slug = 'pintemas';
