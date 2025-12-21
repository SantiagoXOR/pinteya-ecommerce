-- ===================================
-- Migración: Normalizar nombres de productos y extraer terminaciones a variantes
-- Fecha: 2025-12-21
-- Objetivo: Extraer terminaciones del nombre del producto y asignarlas a las variantes
--           Ejemplo: "Barniz New House Brillante" -> finish: "Brillante" en todas las variantes
-- ===================================

-- PASO 1: Normalizar productos "Impregnante New House Brillante" y "Impregnante New House Satinado"
-- Extraer "Brillante" y "Satinado" del nombre del producto y asignarlo a todas sus variantes
UPDATE product_variants pv
SET 
  finish = CASE
    WHEN LOWER((SELECT name FROM products WHERE id = pv.product_id)) LIKE '%brillante%' THEN 'Brillante'
    WHEN LOWER((SELECT name FROM products WHERE id = pv.product_id)) LIKE '%satinado%' THEN 'Satinado'
    WHEN LOWER((SELECT name FROM products WHERE id = pv.product_id)) LIKE '%mate%' THEN 'Mate'
    ELSE pv.finish
  END,
  updated_at = NOW()
FROM products p
WHERE p.id = pv.product_id
  AND (
    LOWER(p.name) LIKE '%new house brillante%' OR
    LOWER(p.name) LIKE '%new house satinado%' OR
    LOWER(p.name) LIKE '%new house mate%'
  )
  AND (pv.finish IS NULL OR pv.finish = '');

-- PASO 2: Normalizar productos "Barniz New House Brillante" y similares
UPDATE product_variants pv
SET 
  finish = CASE
    WHEN LOWER((SELECT name FROM products WHERE id = pv.product_id)) LIKE '%brillante%' THEN 'Brillante'
    WHEN LOWER((SELECT name FROM products WHERE id = pv.product_id)) LIKE '%satinado%' THEN 'Satinado'
    WHEN LOWER((SELECT name FROM products WHERE id = pv.product_id)) LIKE '%mate%' THEN 'Mate'
    ELSE pv.finish
  END,
  updated_at = NOW()
FROM products p
WHERE p.id = pv.product_id
  AND (
    LOWER(p.name) LIKE '%barniz%brillante%' OR
    LOWER(p.name) LIKE '%barniz%satinado%' OR
    LOWER(p.name) LIKE '%barniz%mate%' OR
    LOWER(p.name) LIKE '%esmalte%brillante%' OR
    LOWER(p.name) LIKE '%esmalte%satinado%' OR
    LOWER(p.name) LIKE '%laca%brillante%' OR
    LOWER(p.name) LIKE '%laca%satinado%'
  )
  AND (pv.finish IS NULL OR pv.finish = '');

-- PASO 3: Actualizar array de terminaciones en products para productos que tienen finishes
UPDATE products p
SET 
  terminaciones = (
    SELECT ARRAY_AGG(DISTINCT finish)
    FROM product_variants pv
    WHERE pv.product_id = p.id
      AND pv.finish IS NOT NULL
      AND pv.finish != ''
  ),
  updated_at = NOW()
WHERE EXISTS (
  SELECT 1
  FROM product_variants pv2
  WHERE pv2.product_id = p.id
    AND pv2.finish IS NOT NULL
    AND pv2.finish != ''
);

-- PASO 4: Verificar resultados
DO $$
DECLARE
  products_updated INTEGER;
  variants_with_finish INTEGER;
BEGIN
  SELECT COUNT(DISTINCT p.id) INTO products_updated
  FROM products p
  JOIN product_variants pv ON pv.product_id = p.id
  WHERE (
    LOWER(p.name) LIKE '%new house brillante%' OR
    LOWER(p.name) LIKE '%new house satinado%' OR
    LOWER(p.name) LIKE '%barniz%brillante%' OR
    LOWER(p.name) LIKE '%barniz%satinado%'
  )
  AND pv.finish IS NOT NULL AND pv.finish != '';
  
  SELECT COUNT(*) INTO variants_with_finish
  FROM product_variants
  WHERE finish IS NOT NULL AND finish != '';
  
  RAISE NOTICE '✅ Normalización de productos completada:';
  RAISE NOTICE '   - Productos con terminaciones en el nombre normalizados: %', products_updated;
  RAISE NOTICE '   - Total de variantes con finish: %', variants_with_finish;
END $$;

-- Comentario de documentación
COMMENT ON COLUMN products.name IS 'Nombre del producto sin terminación. La terminación debe estar en el campo terminaciones (array) y en product_variants.finish (específico por variante).';
