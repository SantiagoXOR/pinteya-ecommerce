-- ===================================
-- CONSOLIDACIÓN DE PRODUCTOS DUPLICADOS
-- Fecha: 27 de Octubre, 2025
-- ===================================

-- CASO A: Látex Eco Painting (IDs 92, 93, 94, 95)
-- Consolidar en producto 92
UPDATE product_variants SET product_id = 92 WHERE product_id IN (93, 94, 95);
DELETE FROM products WHERE id IN (93, 94, 95);
UPDATE products SET 
  slug = 'latex-eco-painting',
  name = 'Látex Eco Painting'
WHERE id = 92;

-- CASO B: Pintura Piletas Acuosa (IDs 61, 62, 63, 64)  
-- Consolidar en producto 61
UPDATE product_variants SET product_id = 61 WHERE product_id IN (62, 63, 64);
DELETE FROM products WHERE id IN (62, 63, 64);
UPDATE products SET 
  slug = 'pintura-piletas-acuosa',
  name = 'Pintura Piletas Acuosa'
WHERE id = 61;

-- CASO C: Sintético Converlux (IDs 34, 38)
-- Consolidar en producto 34
UPDATE product_variants SET product_id = 34 WHERE product_id = 38;
DELETE FROM products WHERE id = 38;
UPDATE products SET 
  slug = 'sintetico-converlux',
  name = 'Sintético Converlux'
WHERE id = 34;

-- Marcar primera variante de cada grupo como default si no existe
UPDATE product_variants pv1
SET is_default = true
WHERE id = (
  SELECT id FROM product_variants pv2 
  WHERE pv2.product_id = pv1.product_id 
  ORDER BY id ASC 
  LIMIT 1
)
AND product_id IN (92, 61, 34)
AND NOT EXISTS (
  SELECT 1 FROM product_variants 
  WHERE product_id = pv1.product_id 
  AND is_default = true
);
