-- ===================================
-- MIGRACIÓN: Agregar columna 'brand' a tabla products
-- Fecha: 2025-06-29
-- Descripción: Separar marca del nombre del producto
-- ===================================

-- 1. Agregar columna brand
ALTER TABLE products ADD COLUMN IF NOT EXISTS brand VARCHAR(100);

-- 2. Crear índice para optimizar búsquedas por marca
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);

-- 3. Comentarios para documentación
COMMENT ON COLUMN products.brand IS 'Marca del producto separada del nombre';

-- 4. Verificar estructura actualizada
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'products' 
ORDER BY ordinal_position;
