-- ===================================
-- AGREGAR CAMPO TERMINACIONES A PRODUCTS
-- Fecha: 3 de Febrero, 2025
-- ===================================
-- Este script agrega el campo terminaciones a la tabla products
-- para normalizar el almacenamiento de terminaciones a nivel de producto

-- Agregar columna terminaciones como array de texto
-- Permite almacenar múltiples terminaciones por producto (ej: ['Brillante', 'Mate', 'Satinado'])
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS terminaciones TEXT[] DEFAULT '{}';

-- Crear índice GIN para búsquedas eficientes en arrays
CREATE INDEX IF NOT EXISTS idx_products_terminaciones 
ON products USING GIN (terminaciones);

-- Comentario en la columna
COMMENT ON COLUMN products.terminaciones IS 'Array de terminaciones disponibles para el producto (ej: Brillante, Mate, Satinado). Se complementa con el campo finish en product_variants para mayor granularidad.';

-- Actualizar productos existentes que tengan variantes con terminaciones
-- Esto migra las terminaciones desde product_variants a products
UPDATE products p
SET terminaciones = (
  SELECT ARRAY_AGG(DISTINCT finish)
  FROM product_variants pv
  WHERE pv.product_id = p.id
    AND pv.finish IS NOT NULL
    AND pv.finish != ''
    AND pv.is_active = true
)
WHERE EXISTS (
  SELECT 1
  FROM product_variants pv
  WHERE pv.product_id = p.id
    AND pv.finish IS NOT NULL
    AND pv.finish != ''
);
