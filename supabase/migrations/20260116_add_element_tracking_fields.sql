-- ===================================
-- AGREGAR CAMPOS DE TRACKING DE ELEMENTOS
-- Permite guardar información detallada de interacciones con elementos
-- ===================================

-- Agregar columnas para tracking de elementos
ALTER TABLE analytics_events_optimized
ADD COLUMN IF NOT EXISTS element_selector VARCHAR(500),
ADD COLUMN IF NOT EXISTS element_x SMALLINT,
ADD COLUMN IF NOT EXISTS element_y SMALLINT,
ADD COLUMN IF NOT EXISTS element_width SMALLINT,
ADD COLUMN IF NOT EXISTS element_height SMALLINT,
ADD COLUMN IF NOT EXISTS device_type VARCHAR(20);

-- Crear índices para mejorar queries de elementos
CREATE INDEX IF NOT EXISTS idx_analytics_events_element_selector 
ON analytics_events_optimized(element_selector) 
WHERE element_selector IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_analytics_events_device_type 
ON analytics_events_optimized(device_type) 
WHERE device_type IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_analytics_events_page_device 
ON analytics_events_optimized(page_id, device_type) 
WHERE device_type IS NOT NULL;

-- Comentarios
COMMENT ON COLUMN analytics_events_optimized.element_selector IS 'Selector único del elemento interactuado';
COMMENT ON COLUMN analytics_events_optimized.element_x IS 'Posición X del elemento en la página';
COMMENT ON COLUMN analytics_events_optimized.element_y IS 'Posición Y del elemento en la página';
COMMENT ON COLUMN analytics_events_optimized.element_width IS 'Ancho del elemento en píxeles';
COMMENT ON COLUMN analytics_events_optimized.element_height IS 'Alto del elemento en píxeles';
COMMENT ON COLUMN analytics_events_optimized.device_type IS 'Tipo de dispositivo: mobile, desktop, tablet';
