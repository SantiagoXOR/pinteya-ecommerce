-- ===================================
-- Migración: Corregir inconsistencias en productos legacy
-- Fecha: 2025-12-21
-- Objetivo: Normalizar datos de productos para consistencia con nuevos productos desde UI
-- ===================================

-- 1. Normalizar category_id desde product_categories
-- Para productos que tienen product_categories pero category_id = NULL,
-- establecer category_id con la primera categoría (más antigua)
UPDATE products p
SET category_id = (
  SELECT category_id 
  FROM product_categories pc 
  WHERE pc.product_id = p.id 
  ORDER BY pc.created_at ASC, pc.category_id ASC 
  LIMIT 1
),
updated_at = NOW()
WHERE p.category_id IS NULL 
  AND EXISTS (
    SELECT 1 FROM product_categories pc2 WHERE pc2.product_id = p.id
  );

-- 2. Normalizar terminaciones NULL a array vacío
-- Convertir terminaciones NULL a array vacío para consistencia
UPDATE products
SET terminaciones = '{}'::text[],
    updated_at = NOW()
WHERE terminaciones IS NULL;

-- 3. Verificar productos sin categorías (solo para logging, no modificar)
-- Estos productos deberían ser revisados manualmente
-- SELECT p.id, p.name, p.category_id, COUNT(pc.category_id) as categorias_count
-- FROM products p
-- LEFT JOIN product_categories pc ON pc.product_id = p.id
-- WHERE p.is_active = true
-- GROUP BY p.id, p.name, p.category_id
-- HAVING p.category_id IS NULL AND COUNT(pc.category_id) = 0;

-- Comentarios de documentación
COMMENT ON COLUMN products.category_id IS 'Categoría principal del producto. Para múltiples categorías, usar product_categories. Si product_categories existe, category_id debe coincidir con la primera categoría.';
COMMENT ON COLUMN products.terminaciones IS 'Array de terminaciones disponibles. Si es NULL, se normaliza a array vacío [].';
COMMENT ON COLUMN products.medida IS 'Medida principal del producto (string). Si el producto tiene variantes, puede ser NULL ya que las medidas se toman de las variantes.';
COMMENT ON COLUMN products.price IS 'Precio base del producto. Si el producto tiene variantes, puede ser 0 ya que los precios se manejan en las variantes.';
COMMENT ON COLUMN products.stock IS 'Stock base del producto. Si el producto tiene variantes, puede ser 0 ya que el stock se maneja en las variantes.';
