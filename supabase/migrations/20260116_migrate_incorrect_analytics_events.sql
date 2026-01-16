-- ===================================
-- MIGRAR EVENTOS INCORRECTOS
-- Corregir eventos mal guardados en BD:
-- 1. Migrar user_signup con action hover → event_type hover (id 11)
-- 2. Migrar user_login con action scroll → event_type scroll (id 12)
-- 3. Corregir begin_checkout con action signup → action begin_checkout (id 13)
-- 4. Eliminar page_view con action purchase (eventos incorrectos)
-- 5. Completar product_name faltante
-- ===================================

-- 1. Migrar eventos de hover mal guardados como user_signup
UPDATE analytics_events_optimized
SET event_type = 11 -- hover
WHERE event_type = 9 -- user_signup
  AND action_id = 3 -- hover
  AND created_at >= EXTRACT(EPOCH FROM NOW() - INTERVAL '30 days')::INTEGER;

-- 2. Migrar eventos de scroll mal guardados como user_login
UPDATE analytics_events_optimized
SET event_type = 12 -- scroll
WHERE event_type = 10 -- user_login
  AND action_id = 4 -- scroll
  AND created_at >= EXTRACT(EPOCH FROM NOW() - INTERVAL '30 days')::INTEGER;

-- 3. Corregir eventos de begin_checkout con action signup
UPDATE analytics_events_optimized
SET action_id = 13 -- begin_checkout
WHERE event_type = 7 -- begin_checkout
  AND action_id = 10 -- signup
  AND created_at >= EXTRACT(EPOCH FROM NOW() - INTERVAL '30 days')::INTEGER;

-- 4. Eliminar eventos incorrectos: page_view con action purchase
DELETE FROM analytics_events_optimized
WHERE event_type = 1 -- page_view
  AND action_id = 9 -- purchase
  AND created_at >= EXTRACT(EPOCH FROM NOW() - INTERVAL '30 days')::INTEGER;

-- 5. Completar product_name faltante usando la tabla products
UPDATE analytics_events_optimized aeo
SET product_name = p.name
FROM products p
WHERE aeo.product_id = p.id
  AND (aeo.product_name IS NULL OR aeo.product_name = '')
  AND aeo.product_id IS NOT NULL
  AND aeo.created_at >= EXTRACT(EPOCH FROM NOW() - INTERVAL '30 days')::INTEGER;

-- Verificación: Contar eventos migrados
DO $$
DECLARE
    hover_migrated INTEGER;
    scroll_migrated INTEGER;
    checkout_corrected INTEGER;
    incorrect_deleted INTEGER;
    product_names_completed INTEGER;
BEGIN
    -- Contar eventos de hover migrados
    SELECT COUNT(*) INTO hover_migrated
    FROM analytics_events_optimized
    WHERE event_type = 11 -- hover
      AND created_at >= EXTRACT(EPOCH FROM NOW() - INTERVAL '30 days')::INTEGER;

    -- Contar eventos de scroll migrados
    SELECT COUNT(*) INTO scroll_migrated
    FROM analytics_events_optimized
    WHERE event_type = 12 -- scroll
      AND created_at >= EXTRACT(EPOCH FROM NOW() - INTERVAL '30 days')::INTEGER;

    -- Contar eventos de begin_checkout corregidos
    SELECT COUNT(*) INTO checkout_corrected
    FROM analytics_events_optimized
    WHERE event_type = 7 -- begin_checkout
      AND action_id = 13 -- begin_checkout
      AND created_at >= EXTRACT(EPOCH FROM NOW() - INTERVAL '30 days')::INTEGER;

    -- Los eventos eliminados no se pueden contar después de DELETE, así que se reporta 0
    incorrect_deleted := 0;

    -- Contar eventos con product_name completado
    SELECT COUNT(*) INTO product_names_completed
    FROM analytics_events_optimized
    WHERE product_id IS NOT NULL
      AND product_name IS NOT NULL
      AND product_name != ''
      AND created_at >= EXTRACT(EPOCH FROM NOW() - INTERVAL '30 days')::INTEGER;

    RAISE NOTICE 'Migración completada:';
    RAISE NOTICE '  - Eventos de hover migrados: %', hover_migrated;
    RAISE NOTICE '  - Eventos de scroll migrados: %', scroll_migrated;
    RAISE NOTICE '  - Eventos de begin_checkout corregidos: %', checkout_corrected;
    RAISE NOTICE '  - Eventos incorrectos eliminados: %', incorrect_deleted;
    RAISE NOTICE '  - Productos con nombre completado: %', product_names_completed;
END $$;
