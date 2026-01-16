-- ===================================
-- ELIMINAR EVENTOS DUPLICADOS
-- Eliminar eventos duplicados manteniendo solo el primero (menor id) de cada grupo
-- ===================================

-- Eliminar eventos duplicados (mismo event_type, category_id, action_id, session_hash, created_at)
-- Mantener solo el primero (menor id) de cada grupo
WITH duplicates AS (
  SELECT 
    id,
    event_type,
    category_id,
    action_id,
    session_hash,
    created_at,
    ROW_NUMBER() OVER (
      PARTITION BY event_type, category_id, action_id, session_hash, created_at 
      ORDER BY id
    ) as row_num
  FROM analytics_events_optimized
  WHERE created_at >= EXTRACT(EPOCH FROM NOW() - INTERVAL '7 days')::INTEGER
)
DELETE FROM analytics_events_optimized
WHERE id IN (
  SELECT id FROM duplicates WHERE row_num > 1
);

-- Verificación: Contar eventos después de eliminar duplicados
DO $$
DECLARE
    remaining_events INTEGER;
BEGIN
    SELECT COUNT(*) INTO remaining_events
    FROM analytics_events_optimized
    WHERE created_at >= EXTRACT(EPOCH FROM NOW() - INTERVAL '7 days')::INTEGER;

    RAISE NOTICE 'Eventos restantes después de eliminar duplicados: %', remaining_events;
END $$;
