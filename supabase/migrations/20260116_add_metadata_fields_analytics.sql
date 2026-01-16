-- ===================================
-- AGREGAR CAMPOS DE METADATA PARA PRODUCTOS
-- Permite guardar información detallada de productos en eventos
-- ===================================

-- Agregar columnas para metadata de productos
ALTER TABLE analytics_events_optimized
ADD COLUMN IF NOT EXISTS product_id INTEGER,
ADD COLUMN IF NOT EXISTS product_name VARCHAR(200),
ADD COLUMN IF NOT EXISTS category_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS price DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS quantity SMALLINT;

-- Crear índices para mejorar queries de productos
CREATE INDEX IF NOT EXISTS idx_analytics_events_product_id 
ON analytics_events_optimized(product_id) 
WHERE product_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_analytics_events_category_name 
ON analytics_events_optimized(category_name) 
WHERE category_name IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_analytics_events_product_category 
ON analytics_events_optimized(product_id, category_name) 
WHERE product_id IS NOT NULL AND category_name IS NOT NULL;

-- Comentarios
COMMENT ON COLUMN analytics_events_optimized.product_id IS 'ID del producto relacionado al evento';
COMMENT ON COLUMN analytics_events_optimized.product_name IS 'Nombre del producto al momento del evento';
COMMENT ON COLUMN analytics_events_optimized.category_name IS 'Categoría del producto al momento del evento';
COMMENT ON COLUMN analytics_events_optimized.price IS 'Precio del producto al momento del evento';
COMMENT ON COLUMN analytics_events_optimized.quantity IS 'Cantidad de productos en el evento';
