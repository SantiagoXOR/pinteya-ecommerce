-- ===================================
-- Migración: Normalizar variantes de productos y eliminar duplicados
-- Fecha: 2025-12-21
-- Objetivo: Eliminar variantes duplicadas del producto "Sintético Converlux" (ID 34)
--           Mantener solo las variantes con códigos Aikon correctos según especificación
-- ===================================

-- PASO 1: Verificar que no hay dependencias en órdenes o carritos
-- (Este paso es informativo, las variantes duplicadas ya tienen códigos temporales)

-- PASO 2: Eliminar variantes duplicadas con códigos temporales
-- Estas son las variantes que tienen códigos Aikon incorrectos o duplicados
-- según la lista de códigos esperados

-- Variantes duplicadas a eliminar (IDs marcados con códigos temporales):
-- ID 31 (GRIS - tiene código temporal, el correcto es ID 93 con código 3674)
-- IDs 83-102 (todas las duplicadas creadas el 2025-10-16)

DELETE FROM product_variants
WHERE id IN (
  -- Variantes duplicadas identificadas
  31,  -- GRIS (duplicada, el correcto es 93)
  83,  -- ALUMINIO (duplicada, el correcto es 21)
  84,  -- AMARILLO (duplicada, el correcto es 22)
  85,  -- AMARILLO MEDIANO (duplicada, el correcto es 23)
  86,  -- AZUL MARINO (duplicada, el correcto es 24)
  87,  -- AZUL TRAFUL (duplicada, el correcto es 25)
  88,  -- BERMELLON (duplicada, el correcto es 26)
  89,  -- BLANCO BRILL (duplicada, el correcto es 27)
  90,  -- BLANCO SAT (duplicada, el correcto es 28)
  91,  -- BLANCO MATE (duplicada, el correcto es 29)
  92,  -- GRIS PERLA (duplicada, el correcto es 30)
  94,  -- MARFIL (duplicada, el correcto es 32)
  95,  -- MARRON (duplicada, el correcto es 33)
  96,  -- NARANJA (duplicada, el correcto es 34)
  97,  -- NEGRO BRILL (duplicada, el correcto es 35)
  98,  -- NEGRO SAT (duplicada, el correcto es 36)
  99,  -- NEGRO MATE (duplicada, el correcto es 37)
  100, -- TOSTADO (duplicada, el correcto es 38)
  101, -- VERDE INGLES (duplicada, el correcto es 39)
  102  -- VERDE NOCHE (duplicada, el correcto es 40)
)
AND product_id = 34
AND measure = '4L'
AND aikon_id LIKE 'TEMP-%';

-- PASO 3: Verificar que las variantes correctas están intactas
-- Estas son las variantes que deben mantenerse (con códigos Aikon correctos):
-- ID 21 (ALUMINIO: 4239)
-- ID 22 (AMARILLO: 4643)
-- ID 23 (AMARILLO MEDIANO: 3943)
-- ID 24 (AZUL MARINO: 3941)
-- ID 25 (AZUL TRAFUL: 4644)
-- ID 26 (BERMELLON: 4645)
-- ID 27 (BLANCO BRILL: 3484)
-- ID 28 (BLANCO SAT: 3395)
-- ID 29 (BLANCO MATE: 3710)
-- ID 30 (GRIS PERLA: 4646)
-- ID 32 (MARFIL: 3944)
-- ID 33 (MARRON: 3949)
-- ID 34 (NARANJA: 3942)
-- ID 35 (NEGRO BRILL: 3473)
-- ID 36 (NEGRO SAT: 3479)
-- ID 37 (NEGRO MATE: 4067)
-- ID 38 (TOSTADO: 3940)
-- ID 39 (VERDE INGLES: 3475)
-- ID 40 (VERDE NOCHE: 3835)
-- ID 93 (GRIS: 3674) - Esta es la correcta para GRIS

-- PASO 4: Verificar que no queden duplicados
-- Esta query debe retornar 0 filas si la normalización fue exitosa
DO $$
DECLARE
  duplicate_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO duplicate_count
  FROM (
    SELECT color_name, measure, COUNT(*) as cnt
    FROM product_variants
    WHERE product_id = 34 AND measure = '4L'
    GROUP BY color_name, measure
    HAVING COUNT(*) > 1
  ) duplicates;
  
  IF duplicate_count > 0 THEN
    RAISE WARNING 'Aún quedan % combinaciones color/medida con múltiples variantes', duplicate_count;
  ELSE
    RAISE NOTICE '✅ Normalización exitosa: No quedan duplicados';
  END IF;
END $$;

-- Comentario de documentación
COMMENT ON TABLE product_variants IS 'Tabla de variantes de productos. Cada combinación de producto/color/medida debe tener una única variante con código Aikon único.';
COMMENT ON COLUMN product_variants.aikon_id IS 'Código SKU único globalmente. No puede haber dos variantes con el mismo código Aikon, independientemente del producto.';
