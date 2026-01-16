-- ===================================
-- LIMPIEZA DE INCONSISTENCIAS EN PRODUCTOS CON VARIANTES
-- Fecha: 2026-01-16
-- Descripción: Limpia campos inconsistentes en productos que tienen variantes activas
-- ===================================
-- 
-- Cuando un producto tiene variantes, los siguientes campos del producto principal
-- deben ser NULL ya que los valores se definen en las variantes:
-- - price
-- - discounted_price
-- - stock
-- - color
-- - medida
-- - terminaciones
--
-- Este script corrige los 152 productos identificados con estas inconsistencias.
-- ===================================

BEGIN;

-- ===================================
-- 1. REGISTRAR ESTADÍSTICAS ANTES DE LA LIMPIEZA
-- ===================================

DO $$
DECLARE
  v_products_with_price INTEGER;
  v_products_with_discounted_price INTEGER;
  v_products_with_stock INTEGER;
  v_products_with_color INTEGER;
  v_products_with_medida INTEGER;
  v_products_with_terminaciones INTEGER;
BEGIN
  -- Contar productos con inconsistencias
  SELECT COUNT(DISTINCT p.id) INTO v_products_with_price
  FROM products p
  INNER JOIN product_variants pv ON pv.product_id = p.id AND pv.is_active = true
  WHERE p.is_active = true
    AND p.price IS NOT NULL
    AND p.price > 0;

  SELECT COUNT(DISTINCT p.id) INTO v_products_with_discounted_price
  FROM products p
  INNER JOIN product_variants pv ON pv.product_id = p.id AND pv.is_active = true
  WHERE p.is_active = true
    AND p.discounted_price IS NOT NULL
    AND p.discounted_price > 0;

  SELECT COUNT(DISTINCT p.id) INTO v_products_with_stock
  FROM products p
  INNER JOIN product_variants pv ON pv.product_id = p.id AND pv.is_active = true
  WHERE p.is_active = true
    AND p.stock IS NOT NULL
    AND p.stock > 0;

  SELECT COUNT(DISTINCT p.id) INTO v_products_with_color
  FROM products p
  INNER JOIN product_variants pv ON pv.product_id = p.id AND pv.is_active = true
  WHERE p.is_active = true
    AND p.color IS NOT NULL
    AND p.color != '';

  SELECT COUNT(DISTINCT p.id) INTO v_products_with_medida
  FROM products p
  INNER JOIN product_variants pv ON pv.product_id = p.id AND pv.is_active = true
  WHERE p.is_active = true
    AND p.medida IS NOT NULL
    AND p.medida != '';

  SELECT COUNT(DISTINCT p.id) INTO v_products_with_terminaciones
  FROM products p
  INNER JOIN product_variants pv ON pv.product_id = p.id AND pv.is_active = true
  WHERE p.is_active = true
    AND p.terminaciones IS NOT NULL
    AND array_length(p.terminaciones, 1) > 0;

  -- Log de estadísticas
  RAISE NOTICE '=== ESTADÍSTICAS ANTES DE LIMPIEZA ===';
  RAISE NOTICE 'Productos con price inconsistente: %', v_products_with_price;
  RAISE NOTICE 'Productos con discounted_price inconsistente: %', v_products_with_discounted_price;
  RAISE NOTICE 'Productos con stock inconsistente: %', v_products_with_stock;
  RAISE NOTICE 'Productos con color inconsistente: %', v_products_with_color;
  RAISE NOTICE 'Productos con medida inconsistente: %', v_products_with_medida;
  RAISE NOTICE 'Productos con terminaciones inconsistentes: %', v_products_with_terminaciones;
END $$;

-- ===================================
-- 2. LIMPIAR CAMPOS INCONSISTENTES
-- ===================================

-- Limpiar price: productos con variantes no deben tener precio en el producto principal
UPDATE products p
SET 
  price = NULL,
  updated_at = NOW()
WHERE EXISTS (
  SELECT 1 
  FROM product_variants pv 
  WHERE pv.product_id = p.id 
    AND pv.is_active = true
)
  AND p.is_active = true
  AND p.price IS NOT NULL
  AND p.price > 0;

-- Limpiar discounted_price
UPDATE products p
SET 
  discounted_price = NULL,
  updated_at = NOW()
WHERE EXISTS (
  SELECT 1 
  FROM product_variants pv 
  WHERE pv.product_id = p.id 
    AND pv.is_active = true
)
  AND p.is_active = true
  AND p.discounted_price IS NOT NULL
  AND p.discounted_price > 0;

-- Limpiar stock
UPDATE products p
SET 
  stock = NULL,
  updated_at = NOW()
WHERE EXISTS (
  SELECT 1 
  FROM product_variants pv 
  WHERE pv.product_id = p.id 
    AND pv.is_active = true
)
  AND p.is_active = true
  AND p.stock IS NOT NULL
  AND p.stock > 0;

-- Limpiar color
UPDATE products p
SET 
  color = NULL,
  updated_at = NOW()
WHERE EXISTS (
  SELECT 1 
  FROM product_variants pv 
  WHERE pv.product_id = p.id 
    AND pv.is_active = true
)
  AND p.is_active = true
  AND p.color IS NOT NULL
  AND p.color != '';

-- Limpiar medida
UPDATE products p
SET 
  medida = NULL,
  updated_at = NOW()
WHERE EXISTS (
  SELECT 1 
  FROM product_variants pv 
  WHERE pv.product_id = p.id 
    AND pv.is_active = true
)
  AND p.is_active = true
  AND p.medida IS NOT NULL
  AND p.medida != '';

-- Limpiar terminaciones (array)
UPDATE products p
SET 
  terminaciones = NULL,
  updated_at = NOW()
WHERE EXISTS (
  SELECT 1 
  FROM product_variants pv 
  WHERE pv.product_id = p.id 
    AND pv.is_active = true
)
  AND p.is_active = true
  AND p.terminaciones IS NOT NULL
  AND array_length(p.terminaciones, 1) > 0;

-- ===================================
-- 3. VERIFICAR RESULTADOS
-- ===================================

DO $$
DECLARE
  v_remaining_price INTEGER;
  v_remaining_discounted_price INTEGER;
  v_remaining_stock INTEGER;
  v_remaining_color INTEGER;
  v_remaining_medida INTEGER;
  v_remaining_terminaciones INTEGER;
BEGIN
  -- Verificar que no queden inconsistencias
  SELECT COUNT(DISTINCT p.id) INTO v_remaining_price
  FROM products p
  INNER JOIN product_variants pv ON pv.product_id = p.id AND pv.is_active = true
  WHERE p.is_active = true
    AND p.price IS NOT NULL
    AND p.price > 0;

  SELECT COUNT(DISTINCT p.id) INTO v_remaining_discounted_price
  FROM products p
  INNER JOIN product_variants pv ON pv.product_id = p.id AND pv.is_active = true
  WHERE p.is_active = true
    AND p.discounted_price IS NOT NULL
    AND p.discounted_price > 0;

  SELECT COUNT(DISTINCT p.id) INTO v_remaining_stock
  FROM products p
  INNER JOIN product_variants pv ON pv.product_id = p.id AND pv.is_active = true
  WHERE p.is_active = true
    AND p.stock IS NOT NULL
    AND p.stock > 0;

  SELECT COUNT(DISTINCT p.id) INTO v_remaining_color
  FROM products p
  INNER JOIN product_variants pv ON pv.product_id = p.id AND pv.is_active = true
  WHERE p.is_active = true
    AND p.color IS NOT NULL
    AND p.color != '';

  SELECT COUNT(DISTINCT p.id) INTO v_remaining_medida
  FROM products p
  INNER JOIN product_variants pv ON pv.product_id = p.id AND pv.is_active = true
  WHERE p.is_active = true
    AND p.medida IS NOT NULL
    AND p.medida != '';

  SELECT COUNT(DISTINCT p.id) INTO v_remaining_terminaciones
  FROM products p
  INNER JOIN product_variants pv ON pv.product_id = p.id AND pv.is_active = true
  WHERE p.is_active = true
    AND p.terminaciones IS NOT NULL
    AND array_length(p.terminaciones, 1) > 0;

  -- Log de resultados
  RAISE NOTICE '=== RESULTADOS DESPUÉS DE LIMPIEZA ===';
  RAISE NOTICE 'Productos con price inconsistente restantes: %', v_remaining_price;
  RAISE NOTICE 'Productos con discounted_price inconsistente restantes: %', v_remaining_discounted_price;
  RAISE NOTICE 'Productos con stock inconsistente restantes: %', v_remaining_stock;
  RAISE NOTICE 'Productos con color inconsistente restantes: %', v_remaining_color;
  RAISE NOTICE 'Productos con medida inconsistente restantes: %', v_remaining_medida;
  RAISE NOTICE 'Productos con terminaciones inconsistentes restantes: %', v_remaining_terminaciones;

  IF v_remaining_price > 0 OR v_remaining_discounted_price > 0 OR v_remaining_stock > 0 
     OR v_remaining_color > 0 OR v_remaining_medida > 0 OR v_remaining_terminaciones > 0 THEN
    RAISE WARNING 'Aún quedan inconsistencias. Revisar manualmente.';
  ELSE
    RAISE NOTICE '✅ Todas las inconsistencias han sido corregidas exitosamente.';
  END IF;
END $$;

COMMIT;

-- ===================================
-- NOTAS
-- ===================================
-- 
-- Esta migración corrige automáticamente las inconsistencias identificadas:
-- - 152 productos con price/discounted_price inconsistente
-- - 129 productos con stock inconsistente
-- - 86 productos con medida inconsistente
-- - 64 productos con terminaciones inconsistentes
-- - 31 productos con color inconsistente
--
-- Los campos se establecen a NULL porque los productos con variantes deben
-- obtener estos valores de las variantes activas, no del producto principal.
--
-- Esta migración es idempotente: puede ejecutarse múltiples veces sin efectos secundarios.
