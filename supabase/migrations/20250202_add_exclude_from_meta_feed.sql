-- ===================================
-- AGREGAR CAMPO exclude_from_meta_feed A PRODUCTOS
-- Fecha: 2025-02-02
-- Descripción: Campo para excluir productos del feed XML de Meta Commerce Manager
-- ===================================

-- 1. Agregar columna exclude_from_meta_feed si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'exclude_from_meta_feed'
    ) THEN
        ALTER TABLE products 
        ADD COLUMN exclude_from_meta_feed BOOLEAN NOT NULL DEFAULT false;
        
        -- Agregar comentario descriptivo
        COMMENT ON COLUMN products.exclude_from_meta_feed IS 
            'Indica si el producto debe ser excluido del feed XML de Meta Commerce Manager';
    END IF;
END $$;

-- 2. Crear índice para optimizar consultas del feed (donde exclude_from_meta_feed = false)
CREATE INDEX IF NOT EXISTS idx_products_meta_feed_active 
ON products(is_active, exclude_from_meta_feed) 
WHERE is_active = true AND exclude_from_meta_feed = false;

-- 3. Comentario en la tabla
COMMENT ON TABLE products IS 
    'Tabla de productos - use exclude_from_meta_feed para controlar visibilidad en feed de Meta';

