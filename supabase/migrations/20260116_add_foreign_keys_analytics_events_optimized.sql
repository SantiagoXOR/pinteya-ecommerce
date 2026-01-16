-- =====================================================
-- MIGRACIÓN: Agregar Foreign Keys a analytics_events_optimized
-- Descripción: Agregar claves foráneas para que PostgREST pueda hacer JOINs
-- Fecha: 2026-01-16
-- =====================================================

-- Eliminar foreign keys existentes si existen (para recrearlas)
ALTER TABLE analytics_events_optimized
DROP CONSTRAINT IF EXISTS fk_analytics_events_optimized_event_type;

ALTER TABLE analytics_events_optimized
DROP CONSTRAINT IF EXISTS fk_analytics_events_optimized_category_id;

ALTER TABLE analytics_events_optimized
DROP CONSTRAINT IF EXISTS fk_analytics_events_optimized_action_id;

ALTER TABLE analytics_events_optimized
DROP CONSTRAINT IF EXISTS fk_analytics_events_optimized_page_id;

-- Agregar foreign key para event_type
ALTER TABLE analytics_events_optimized
ADD CONSTRAINT fk_analytics_events_optimized_event_type
FOREIGN KEY (event_type)
REFERENCES analytics_event_types(id)
ON DELETE RESTRICT;

-- Agregar foreign key para category_id
ALTER TABLE analytics_events_optimized
ADD CONSTRAINT fk_analytics_events_optimized_category_id
FOREIGN KEY (category_id)
REFERENCES analytics_categories(id)
ON DELETE RESTRICT;

-- Agregar foreign key para action_id
ALTER TABLE analytics_events_optimized
ADD CONSTRAINT fk_analytics_events_optimized_action_id
FOREIGN KEY (action_id)
REFERENCES analytics_actions(id)
ON DELETE RESTRICT;

-- Agregar foreign key para page_id
ALTER TABLE analytics_events_optimized
ADD CONSTRAINT fk_analytics_events_optimized_page_id
FOREIGN KEY (page_id)
REFERENCES analytics_pages(id)
ON DELETE RESTRICT;

-- Verificar que las foreign keys fueron creadas
DO $$
DECLARE
  fk_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO fk_count
  FROM information_schema.table_constraints
  WHERE table_name = 'analytics_events_optimized'
    AND constraint_type = 'FOREIGN KEY';
  
  IF fk_count >= 4 THEN
    RAISE NOTICE 'Foreign keys agregadas correctamente: % claves foráneas encontradas', fk_count;
  ELSE
    RAISE WARNING 'Solo se encontraron % foreign keys, se esperaban al menos 4', fk_count;
  END IF;
END $$;
