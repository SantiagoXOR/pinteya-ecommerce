-- ===================================
-- MIGRACIÓN: CONVERTIR AIKON_ID DE VARCHAR A INTEGER
-- Fecha: 2025-01-29
-- Descripción: Convierte aikon_id de VARCHAR a INTEGER con validación de 6 dígitos (0-999999)
-- ===================================

BEGIN;

-- ===================================
-- PASO 1: CREAR COLUMNAS TEMPORALES
-- ===================================

ALTER TABLE products ADD COLUMN IF NOT EXISTS aikon_id_new INTEGER;
ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS aikon_id_new INTEGER;

-- ===================================
-- PASO 2: CONVERTIR VALORES STRING A INTEGER
-- ===================================

-- Convertir en products: limpiar y normalizar valores
UPDATE products 
SET aikon_id_new = CASE 
  WHEN aikon_id IS NULL THEN NULL
  -- Si es puramente numérico, convertir directamente
  WHEN aikon_id ~ '^[0-9]+$' THEN 
    CASE 
      WHEN aikon_id::BIGINT > 999999 THEN NULL  -- Marcar para revisión manual
      ELSE aikon_id::INTEGER
    END
  -- Si contiene números pero también otros caracteres, extraer solo números
  WHEN aikon_id ~ '[0-9]' THEN 
    CASE 
      WHEN (regexp_replace(aikon_id, '[^0-9]', '', 'g'))::BIGINT > 999999 THEN NULL
      WHEN regexp_replace(aikon_id, '[^0-9]', '', 'g') = '' THEN NULL
      ELSE (regexp_replace(aikon_id, '[^0-9]', '', 'g'))::INTEGER
    END
  -- Si no contiene números, NULL (requiere intervención manual)
  ELSE NULL
END
WHERE aikon_id IS NOT NULL;

-- Convertir en product_variants: limpiar y normalizar valores
-- NOTA: product_variants.aikon_id es NOT NULL, así que todos deben tener valor
UPDATE product_variants 
SET aikon_id_new = CASE 
  -- Si es puramente numérico, convertir directamente
  WHEN aikon_id ~ '^[0-9]+$' THEN 
    CASE 
      WHEN aikon_id::BIGINT > 999999 THEN NULL  -- Marcar para revisión manual
      ELSE aikon_id::INTEGER
    END
  -- Si contiene números pero también otros caracteres, extraer solo números
  -- Ejemplos: "4488-ROJO-TEJA" -> 4488, "TEMP-317" -> 317, "3386-GRIS" -> 3386
  WHEN aikon_id ~ '[0-9]' THEN 
    CASE 
      -- Extraer todos los números del string
      WHEN (regexp_replace(aikon_id, '[^0-9]', '', 'g'))::BIGINT > 999999 THEN NULL
      WHEN regexp_replace(aikon_id, '[^0-9]', '', 'g') = '' THEN NULL
      -- Para valores como "TEMP-317", extraer solo "317"
      -- Para valores como "4488-ROJO-TEJA", extraer solo "4488"
      ELSE (regexp_replace(aikon_id, '[^0-9]', '', 'g'))::INTEGER
    END
  -- Si no contiene números, NULL (requiere intervención manual)
  ELSE NULL
END;

-- ===================================
-- PASO 3: IDENTIFICAR VALORES PROBLEMÁTICOS
-- ===================================

-- Crear tabla temporal para registrar problemas
CREATE TEMP TABLE IF NOT EXISTS aikon_id_migration_issues (
  table_name TEXT,
  record_id INTEGER,
  original_value TEXT,
  issue_type TEXT,
  description TEXT
);

-- Registrar productos con valores problemáticos
INSERT INTO aikon_id_migration_issues (table_name, record_id, original_value, issue_type, description)
SELECT 
  'products',
  id,
  aikon_id,
  'EXCEEDS_RANGE',
  'Valor excede 999999'
FROM products
WHERE aikon_id IS NOT NULL 
  AND aikon_id ~ '^[0-9]+$'
  AND aikon_id::BIGINT > 999999;

INSERT INTO aikon_id_migration_issues (table_name, record_id, original_value, issue_type, description)
SELECT 
  'products',
  id,
  aikon_id,
  'NO_NUMBERS',
  'No contiene números válidos'
FROM products
WHERE aikon_id IS NOT NULL 
  AND aikon_id !~ '[0-9]';

-- Registrar variantes con valores problemáticos
INSERT INTO aikon_id_migration_issues (table_name, record_id, original_value, issue_type, description)
SELECT 
  'product_variants',
  id,
  aikon_id,
  'EXCEEDS_RANGE',
  'Valor excede 999999'
FROM product_variants
WHERE aikon_id IS NOT NULL 
  AND aikon_id ~ '^[0-9]+$'
  AND aikon_id::BIGINT > 999999;

INSERT INTO aikon_id_migration_issues (table_name, record_id, original_value, issue_type, description)
SELECT 
  'product_variants',
  id,
  aikon_id,
  'NO_NUMBERS',
  'No contiene números válidos'
FROM product_variants
WHERE aikon_id IS NOT NULL 
  AND aikon_id !~ '[0-9]';

-- Mostrar resumen de problemas (para logging)
SELECT 
  issue_type,
  COUNT(*) as count,
  table_name
FROM aikon_id_migration_issues
GROUP BY issue_type, table_name;

-- ===================================
-- PASO 4: COPIAR AIKON_ID DE VARIANTE PREDETERMINADA A PRODUCTS
-- ===================================

-- Para productos con variantes pero sin aikon_id, copiar de la variante predeterminada
UPDATE products p
SET aikon_id_new = (
  SELECT aikon_id_new 
  FROM product_variants pv 
  WHERE pv.product_id = p.id 
    AND pv.is_default = true 
    AND pv.aikon_id_new IS NOT NULL
  LIMIT 1
)
WHERE p.aikon_id_new IS NULL
  AND EXISTS (
    SELECT 1 
    FROM product_variants pv2 
    WHERE pv2.product_id = p.id 
      AND pv2.aikon_id_new IS NOT NULL
  );

-- ===================================
-- PASO 5: VALIDAR QUE NO HAY VARIANTES CON AIKON_ID_NEW NULL
-- ===================================

-- Verificar variantes sin aikon_id (esto no debería pasar después de la conversión)
DO $$
DECLARE
  null_variants_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO null_variants_count
  FROM product_variants
  WHERE aikon_id_new IS NULL;
  
  IF null_variants_count > 0 THEN
    RAISE WARNING 'Hay % variantes con aikon_id_new NULL. Estas necesitan intervención manual.', null_variants_count;
  END IF;
END $$;

-- ===================================
-- PASO 6: REEMPLAZAR COLUMNAS ANTIGUAS
-- ===================================

-- Eliminar índices antiguos
DROP INDEX IF EXISTS idx_products_aikon_id;
DROP INDEX IF EXISTS idx_product_variants_aikon_id;

-- Eliminar columnas antiguas
ALTER TABLE products DROP COLUMN IF EXISTS aikon_id;
ALTER TABLE product_variants DROP COLUMN IF EXISTS aikon_id;

-- Renombrar columnas nuevas
ALTER TABLE products RENAME COLUMN aikon_id_new TO aikon_id;
ALTER TABLE product_variants RENAME COLUMN aikon_id_new TO aikon_id;

-- ===================================
-- PASO 7: AGREGAR CONSTRAINTS
-- ===================================

-- Constraint para validar rango de 6 dígitos (0-999999) en products
ALTER TABLE products 
ADD CONSTRAINT check_aikon_id_range 
CHECK (aikon_id IS NULL OR (aikon_id >= 0 AND aikon_id <= 999999));

-- Constraint para validar rango de 6 dígitos (0-999999) en product_variants
ALTER TABLE product_variants 
ADD CONSTRAINT check_variant_aikon_id_range 
CHECK (aikon_id >= 0 AND aikon_id <= 999999);

-- Constraint NOT NULL con validación condicional para products
-- Permite NULL solo si el producto tiene variantes
-- NOTA: Si hay productos sin variantes y sin aikon_id, este constraint fallará
-- Se debe asignar aikon_id a esos productos primero o usar DEFERRABLE
ALTER TABLE products 
ADD CONSTRAINT check_aikon_id_required 
CHECK (
  (aikon_id IS NOT NULL) OR 
  (EXISTS (SELECT 1 FROM product_variants WHERE product_id = products.id))
);

-- NOT NULL obligatorio para product_variants
ALTER TABLE product_variants 
ALTER COLUMN aikon_id SET NOT NULL;

-- ===================================
-- PASO 8: RECREAR ÍNDICES
-- ===================================

CREATE INDEX IF NOT EXISTS idx_products_aikon_id ON products(aikon_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_aikon_id ON product_variants(aikon_id);

-- ===================================
-- PASO 9: VERIFICACIÓN FINAL
-- ===================================

-- Verificar que no hay productos sin variantes y sin aikon_id
DO $$
DECLARE
  problematic_products_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO problematic_products_count
  FROM products p
  WHERE p.aikon_id IS NULL
    AND NOT EXISTS (
      SELECT 1 FROM product_variants pv WHERE pv.product_id = p.id
    );
  
  IF problematic_products_count > 0 THEN
    RAISE WARNING 'Hay % productos sin variantes y sin aikon_id. Estos necesitan intervención manual.', problematic_products_count;
  ELSE
    RAISE NOTICE 'Migración completada exitosamente. Todos los productos tienen aikon_id o variantes.';
  END IF;
END $$;

-- Mostrar resumen final
SELECT 
  'Productos con aikon_id' as metric,
  COUNT(*) as count
FROM products
WHERE aikon_id IS NOT NULL
UNION ALL
SELECT 
  'Productos sin aikon_id (con variantes)',
  COUNT(*)
FROM products p
WHERE p.aikon_id IS NULL
  AND EXISTS (SELECT 1 FROM product_variants pv WHERE pv.product_id = p.id)
UNION ALL
SELECT 
  'Variantes con aikon_id',
  COUNT(*)
FROM product_variants
WHERE aikon_id IS NOT NULL;

COMMIT;

-- ===================================
-- NOTAS POST-MIGRACIÓN
-- ===================================

-- Los valores problemáticos se registraron en la tabla temporal aikon_id_migration_issues
-- Revisar manualmente los registros que quedaron con NULL después de la migración
-- Los valores se almacenan como INTEGER pero se formatean con 6 dígitos en la aplicación
