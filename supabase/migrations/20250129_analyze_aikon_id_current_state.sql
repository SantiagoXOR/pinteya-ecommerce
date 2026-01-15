-- ===================================
-- ANÁLISIS DEL ESTADO ACTUAL DE AIKON_ID
-- Fecha: 2025-01-29
-- Descripción: Script para analizar el estado actual de aikon_id antes de la migración
-- ===================================

-- 1. ANÁLISIS DE PRODUCTS.AIKON_ID
-- ===================================

-- Total de productos
SELECT 
  'Total productos' as metric,
  COUNT(*) as value
FROM products;

-- Productos con aikon_id NULL
SELECT 
  'Productos con aikon_id NULL' as metric,
  COUNT(*) as value
FROM products
WHERE aikon_id IS NULL;

-- Productos con aikon_id no NULL
SELECT 
  'Productos con aikon_id no NULL' as metric,
  COUNT(*) as value
FROM products
WHERE aikon_id IS NOT NULL;

-- Análisis de formato: valores puramente numéricos
SELECT 
  'Valores puramente numéricos' as metric,
  COUNT(*) as value
FROM products
WHERE aikon_id IS NOT NULL 
  AND aikon_id ~ '^[0-9]+$';

-- Análisis de formato: valores con caracteres no numéricos
SELECT 
  'Valores con caracteres no numéricos' as metric,
  COUNT(*) as value
FROM products
WHERE aikon_id IS NOT NULL 
  AND aikon_id !~ '^[0-9]+$';

-- Valores que contienen números pero también otros caracteres
SELECT 
  'Valores mixtos (números + otros caracteres)' as metric,
  COUNT(*) as value
FROM products
WHERE aikon_id IS NOT NULL 
  AND aikon_id ~ '[0-9]'
  AND aikon_id !~ '^[0-9]+$';

-- Valores que NO contienen números
SELECT 
  'Valores sin números' as metric,
  COUNT(*) as value
FROM products
WHERE aikon_id IS NOT NULL 
  AND aikon_id !~ '[0-9]';

-- Longitud de valores
SELECT 
  'Longitud promedio' as metric,
  ROUND(AVG(LENGTH(aikon_id))::numeric, 2) as value
FROM products
WHERE aikon_id IS NOT NULL;

SELECT 
  'Longitud mínima' as metric,
  MIN(LENGTH(aikon_id)) as value
FROM products
WHERE aikon_id IS NOT NULL;

SELECT 
  'Longitud máxima' as metric,
  MAX(LENGTH(aikon_id)) as value
FROM products
WHERE aikon_id IS NOT NULL;

-- Valores que exceden 6 dígitos (cuando se conviertan a número)
SELECT 
  'Valores que exceden 6 dígitos' as metric,
  COUNT(*) as value
FROM products
WHERE aikon_id IS NOT NULL 
  AND aikon_id ~ '^[0-9]+$'
  AND aikon_id::BIGINT > 999999;

-- Ejemplos de valores problemáticos
SELECT 
  'Ejemplos de valores no numéricos' as category,
  id,
  name,
  aikon_id,
  LENGTH(aikon_id) as length
FROM products
WHERE aikon_id IS NOT NULL 
  AND aikon_id !~ '^[0-9]+$'
LIMIT 20;

SELECT 
  'Ejemplos de valores > 999999' as category,
  id,
  name,
  aikon_id,
  aikon_id::BIGINT as numeric_value
FROM products
WHERE aikon_id IS NOT NULL 
  AND aikon_id ~ '^[0-9]+$'
  AND aikon_id::BIGINT > 999999
LIMIT 20;

-- 2. ANÁLISIS DE PRODUCT_VARIANTS.AIKON_ID
-- ===================================

-- Total de variantes
SELECT 
  'Total variantes' as metric,
  COUNT(*) as value
FROM product_variants;

-- Variantes con aikon_id NULL
SELECT 
  'Variantes con aikon_id NULL' as metric,
  COUNT(*) as value
FROM product_variants
WHERE aikon_id IS NULL;

-- Variantes con aikon_id no NULL
SELECT 
  'Variantes con aikon_id no NULL' as metric,
  COUNT(*) as value
FROM product_variants
WHERE aikon_id IS NOT NULL;

-- Análisis de formato: valores puramente numéricos
SELECT 
  'Variantes: valores puramente numéricos' as metric,
  COUNT(*) as value
FROM product_variants
WHERE aikon_id IS NOT NULL 
  AND aikon_id ~ '^[0-9]+$';

-- Análisis de formato: valores con caracteres no numéricos
SELECT 
  'Variantes: valores con caracteres no numéricos' as metric,
  COUNT(*) as value
FROM product_variants
WHERE aikon_id IS NOT NULL 
  AND aikon_id !~ '^[0-9]+$';

-- Valores que exceden 6 dígitos
SELECT 
  'Variantes: valores que exceden 6 dígitos' as metric,
  COUNT(*) as value
FROM product_variants
WHERE aikon_id IS NOT NULL 
  AND aikon_id ~ '^[0-9]+$'
  AND aikon_id::BIGINT > 999999;

-- Ejemplos de variantes problemáticas
SELECT 
  'Variantes: ejemplos de valores no numéricos' as category,
  id,
  product_id,
  aikon_id,
  color_name,
  measure,
  LENGTH(aikon_id) as length
FROM product_variants
WHERE aikon_id IS NOT NULL 
  AND aikon_id !~ '^[0-9]+$'
LIMIT 20;

-- 3. ANÁLISIS DE RELACIÓN PRODUCTOS-VARIANTES
-- ===================================

-- Productos sin variantes y sin aikon_id (PROBLEMA CRÍTICO)
SELECT 
  'Productos sin variantes y sin aikon_id' as metric,
  COUNT(*) as value
FROM products p
WHERE p.aikon_id IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM product_variants pv WHERE pv.product_id = p.id
  );

-- Productos con variantes pero sin aikon_id en products (OK, se puede copiar de variante)
SELECT 
  'Productos con variantes pero sin aikon_id en products' as metric,
  COUNT(*) as value
FROM products p
WHERE p.aikon_id IS NULL
  AND EXISTS (
    SELECT 1 FROM product_variants pv WHERE pv.product_id = p.id
  );

-- Productos con variantes que tienen aikon_id en products (OK)
SELECT 
  'Productos con variantes que tienen aikon_id en products' as metric,
  COUNT(*) as value
FROM products p
WHERE p.aikon_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM product_variants pv WHERE pv.product_id = p.id
  );

-- 4. RESUMEN EJECUTIVO
-- ===================================

-- Crear vista temporal para resumen
CREATE OR REPLACE VIEW aikon_id_analysis_summary AS
SELECT 
  'RESUMEN' as section,
  'Total productos' as metric,
  COUNT(*)::text as value
FROM products
UNION ALL
SELECT 
  'RESUMEN',
  'Productos con aikon_id NULL',
  COUNT(*)::text
FROM products WHERE aikon_id IS NULL
UNION ALL
SELECT 
  'RESUMEN',
  'Productos sin variantes y sin aikon_id (CRÍTICO)',
  COUNT(*)::text
FROM products p
WHERE p.aikon_id IS NULL
  AND NOT EXISTS (SELECT 1 FROM product_variants pv WHERE pv.product_id = p.id)
UNION ALL
SELECT 
  'RESUMEN',
  'Valores no numéricos en products',
  COUNT(*)::text
FROM products
WHERE aikon_id IS NOT NULL AND aikon_id !~ '^[0-9]+$'
UNION ALL
SELECT 
  'RESUMEN',
  'Valores > 999999 en products',
  COUNT(*)::text
FROM products
WHERE aikon_id IS NOT NULL 
  AND aikon_id ~ '^[0-9]+$'
  AND aikon_id::BIGINT > 999999
UNION ALL
SELECT 
  'RESUMEN',
  'Total variantes',
  COUNT(*)::text
FROM product_variants
UNION ALL
SELECT 
  'RESUMEN',
  'Variantes con aikon_id NULL',
  COUNT(*)::text
FROM product_variants WHERE aikon_id IS NULL
UNION ALL
SELECT 
  'RESUMEN',
  'Valores no numéricos en variantes',
  COUNT(*)::text
FROM product_variants
WHERE aikon_id IS NOT NULL AND aikon_id !~ '^[0-9]+$'
UNION ALL
SELECT 
  'RESUMEN',
  'Valores > 999999 en variantes',
  COUNT(*)::text
FROM product_variants
WHERE aikon_id IS NOT NULL 
  AND aikon_id ~ '^[0-9]+$'
  AND aikon_id::BIGINT > 999999;

-- Mostrar resumen
SELECT * FROM aikon_id_analysis_summary ORDER BY metric;
