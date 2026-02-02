-- ============================================================================
-- MIGRACIÓN OPCIONAL: GA4 y Meta Pixel para Pintemas
-- ============================================================================
-- Descripción: Pintemas se creó sin ga4_measurement_id ni meta_pixel_id (NULL).
-- Para habilitar Google Analytics 4 y/o Meta Pixel en www.pintemas.com,
-- ejecute en Supabase SQL (o añada aquí y re-ejecute esta migración):
--
--   UPDATE tenants
--   SET
--     ga4_measurement_id = 'G-XXXXXXXX',  -- ID de medición GA4 de Pintemas
--     meta_pixel_id = 'XXXXXXXX'           -- ID del Pixel de Meta de Pintemas
--   WHERE slug = 'pintemas';
--
-- Sin este UPDATE, el analytics interno (Supabase) sigue funcionando por tenant;
-- solo no se cargarán los scripts de GA4/Meta en el sitio de Pintemas.
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Analytics Pintemas: Para habilitar GA4/Meta en www.pintemas.com, actualice tenants.ga4_measurement_id y meta_pixel_id WHERE slug = ''pintemas''.';
END $$;
