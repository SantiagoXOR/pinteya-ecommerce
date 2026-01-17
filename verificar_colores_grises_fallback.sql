-- ===================================
-- VERIFICACIÓN: Colores Grises (Fallback) en Base de Datos
-- ===================================
-- Este script verifica si hay variantes con colores grises de fallback
-- que no tienen un color_name seleccionado correctamente
-- ===================================

-- Colores grises de fallback detectados en el código:
-- - #9CA3AF (gris por defecto en color-utils.ts)
-- - #E5E7EB (gris por defecto en ShopDetailModal)
-- - #808080 (gris genérico)

-- ===================================
-- CONSULTA 1: Variantes con color_hex gris pero sin color_name
-- ===================================
SELECT 
  pv.id as variant_id,
  pv.product_id,
  p.name as product_name,
  pv.aikon_id,
  pv.color_name,
  pv.color_hex,
  pv.measure,
  pv.finish,
  pv.is_active,
  pv.is_default,
  CASE 
    WHEN pv.color_hex = '#9CA3AF' THEN 'Fallback ProductCard (#9CA3AF)'
    WHEN pv.color_hex = '#E5E7EB' THEN 'Fallback ShopDetailModal (#E5E7EB)'
    WHEN pv.color_hex = '#808080' THEN 'Gris genérico (#808080)'
    ELSE 'Otro gris'
  END as tipo_fallback
FROM product_variants pv
INNER JOIN products p ON p.id = pv.product_id
WHERE 
  pv.color_hex IN ('#9CA3AF', '#E5E7EB', '#808080')
  AND (pv.color_name IS NULL OR pv.color_name = '' OR TRIM(pv.color_name) = '')
ORDER BY pv.product_id, pv.id;

-- ===================================
-- CONSULTA 2: Variantes con color_name pero color_hex gris (fallback)
-- ===================================
SELECT 
  pv.id as variant_id,
  pv.product_id,
  p.name as product_name,
  pv.aikon_id,
  pv.color_name,
  pv.color_hex,
  pv.measure,
  pv.finish,
  pv.is_active,
  pv.is_default,
  CASE 
    WHEN pv.color_hex = '#9CA3AF' THEN 'Fallback ProductCard (#9CA3AF)'
    WHEN pv.color_hex = '#E5E7EB' THEN 'Fallback ShopDetailModal (#E5E7EB)'
    WHEN pv.color_hex = '#808080' THEN 'Gris genérico (#808080)'
    ELSE 'Otro gris'
  END as tipo_fallback,
  'Tiene color_name pero color_hex es fallback' as observacion
FROM product_variants pv
INNER JOIN products p ON p.id = pv.product_id
WHERE 
  pv.color_hex IN ('#9CA3AF', '#E5E7EB', '#808080')
  AND pv.color_name IS NOT NULL 
  AND pv.color_name != ''
  AND TRIM(pv.color_name) != ''
ORDER BY pv.product_id, pv.id;

-- ===================================
-- CONSULTA 3: Resumen estadístico
-- ===================================
SELECT 
  'Variantes con color_hex gris sin color_name' as tipo,
  COUNT(*) as cantidad
FROM product_variants
WHERE 
  color_hex IN ('#9CA3AF', '#E5E7EB', '#808080')
  AND (color_name IS NULL OR color_name = '' OR TRIM(color_name) = '')

UNION ALL

SELECT 
  'Variantes con color_hex gris CON color_name' as tipo,
  COUNT(*) as cantidad
FROM product_variants
WHERE 
  color_hex IN ('#9CA3AF', '#E5E7EB', '#808080')
  AND color_name IS NOT NULL 
  AND color_name != ''
  AND TRIM(color_name) != ''

UNION ALL

SELECT 
  'Total variantes con color_hex gris' as tipo,
  COUNT(*) as cantidad
FROM product_variants
WHERE color_hex IN ('#9CA3AF', '#E5E7EB', '#808080')

UNION ALL

SELECT 
  'Variantes sin color_hex (NULL)' as tipo,
  COUNT(*) as cantidad
FROM product_variants
WHERE color_hex IS NULL

UNION ALL

SELECT 
  'Variantes sin color_name (NULL)' as tipo,
  COUNT(*) as cantidad
FROM product_variants
WHERE color_name IS NULL OR color_name = '' OR TRIM(color_name) = '';

-- ===================================
-- CONSULTA 4: Variantes sin color_hex ni color_name
-- ===================================
SELECT 
  pv.id as variant_id,
  pv.product_id,
  p.name as product_name,
  pv.aikon_id,
  pv.color_name,
  pv.color_hex,
  pv.measure,
  pv.finish,
  pv.is_active,
  pv.is_default,
  'Sin color definido' as observacion
FROM product_variants pv
INNER JOIN products p ON p.id = pv.product_id
WHERE 
  (pv.color_hex IS NULL OR pv.color_hex = '')
  AND (pv.color_name IS NULL OR pv.color_name = '' OR TRIM(pv.color_name) = '')
ORDER BY pv.product_id, pv.id;

-- ===================================
-- CONSULTA 5: Distribución de colores grises por tipo
-- ===================================
SELECT 
  pv.color_hex,
  CASE 
    WHEN pv.color_hex = '#9CA3AF' THEN 'Fallback ProductCard'
    WHEN pv.color_hex = '#E5E7EB' THEN 'Fallback ShopDetailModal'
    WHEN pv.color_hex = '#808080' THEN 'Gris genérico'
    ELSE 'Otro'
  END as tipo_gris,
  COUNT(*) as cantidad_variantes,
  COUNT(CASE WHEN pv.color_name IS NULL OR pv.color_name = '' OR TRIM(pv.color_name) = '' THEN 1 END) as sin_color_name,
  COUNT(CASE WHEN pv.color_name IS NOT NULL AND pv.color_name != '' AND TRIM(pv.color_name) != '' THEN 1 END) as con_color_name
FROM product_variants pv
WHERE pv.color_hex IN ('#9CA3AF', '#E5E7EB', '#808080')
GROUP BY pv.color_hex
ORDER BY cantidad_variantes DESC;
