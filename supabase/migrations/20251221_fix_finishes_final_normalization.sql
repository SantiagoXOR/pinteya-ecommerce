-- ===================================
-- Migración: Correcciones finales de normalización de finishes
-- Fecha: 2025-12-21
-- Objetivo: 
--   1. Asignar finish por defecto "Brillante" a colores de Sintético Converlux sin finish
--   2. Asignar terminaciones "Cerámico" y "Natural" al producto Sellagres
--   3. Los productos incoloros (barniz/esmalte) deberían tener finish, no color_name (no cambia aquí, solo documenta)
-- ===================================

-- PASO 1: Sintético Converlux - Asignar "Brillante" a colores que no tienen finish
-- Solo BLANCO y NEGRO tienen finishes (Brillante, Satinado, Mate)
-- Los demás colores (GRIS, ALUMINIO, etc.) deberían tener "Brillante" por defecto
UPDATE product_variants pv
SET 
  finish = 'Brillante',
  updated_at = NOW()
FROM products p
WHERE p.id = pv.product_id
  AND p.id = 34  -- Sintético Converlux
  AND pv.color_name IS NOT NULL
  AND pv.color_name != ''
  AND pv.color_name NOT IN ('BLANCO', 'NEGRO')  -- Excluir BLANCO y NEGRO que ya tienen finishes
  AND (pv.finish IS NULL OR pv.finish = '');

-- PASO 2: Sellagres - Asignar terminaciones "Cerámico" y "Natural" según corresponda
-- Necesitamos revisar qué variantes corresponden a cada terminación
-- Por ahora, asignamos "Cerámico" como predeterminado si no tiene finish
-- NOTA: Esto puede necesitar ajuste manual después de revisar los datos específicos
UPDATE product_variants pv
SET 
  finish = CASE
    WHEN pv.finish IS NULL OR pv.finish = '' THEN 'Cerámico'  -- Por defecto, ajustar según datos reales
    ELSE pv.finish
  END,
  updated_at = NOW()
FROM products p
WHERE p.id = pv.product_id
  AND LOWER(p.name) LIKE '%sellagres%'
  AND (pv.finish IS NULL OR pv.finish = '');

-- PASO 3: Actualizar array de terminaciones en products para Sellagres
UPDATE products p
SET 
  terminaciones = ARRAY['Cerámico', 'Natural'],
  updated_at = NOW()
WHERE LOWER(p.name) LIKE '%sellagres%';

-- PASO 4: Actualizar array de terminaciones para Sintético Converlux
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
WHERE p.id = 34;  -- Sintético Converlux

-- PASO 5: Verificar resultados
DO $$
DECLARE
  sintetico_variants_with_finish INTEGER;
  sellagres_variants_with_finish INTEGER;
BEGIN
  -- Sintético Converlux
  SELECT COUNT(*) INTO sintetico_variants_with_finish
  FROM product_variants pv
  WHERE pv.product_id = 34
    AND pv.finish IS NOT NULL
    AND pv.finish != '';
  
  -- Sellagres
  SELECT COUNT(*) INTO sellagres_variants_with_finish
  FROM product_variants pv
  JOIN products p ON p.id = pv.product_id
  WHERE LOWER(p.name) LIKE '%sellagres%'
    AND pv.finish IS NOT NULL
    AND pv.finish != '';
  
  RAISE NOTICE '✅ Normalización de finishes completada:';
  RAISE NOTICE '   - Sintético Converlux: % variantes con finish', sintetico_variants_with_finish;
  RAISE NOTICE '   - Sellagres: % variantes con finish', sellagres_variants_with_finish;
END $$;

-- Comentario de documentación
COMMENT ON COLUMN product_variants.color_name IS 'Nombre del color base. NULL para productos incoloros (barnices, esmaltes sin color). Los productos incoloros deben tener finish definido en lugar de color_name.';
COMMENT ON COLUMN product_variants.finish IS 'Terminación del producto/variante. Para productos sintéticos/barnices sin color_name, el finish es obligatorio. Valores comunes: "Brillante", "Satinado", "Mate", "Cerámico", "Natural".';
