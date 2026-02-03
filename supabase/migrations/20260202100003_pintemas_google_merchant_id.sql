-- ============================================================================
-- MIGRACIÓN: Google Merchant Center ID para Pintemas
-- ============================================================================
-- Descripción: Configura el ID de Merchant Center (5719774255) para el
-- tenant Pintemas. Usado para preconnect y referencias a Google Ads/Merchant.
-- ============================================================================

UPDATE tenants
SET
  google_merchant_id = '5719774255',
  updated_at = NOW()
WHERE slug = 'pintemas';
