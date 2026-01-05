-- ===================================
-- Migración: Consolidar productos "Impregnante New House Brillante" y "Impregnante New House Satinado"
-- Fecha: 2025-12-21
-- Objetivo: Consolidar dos productos en uno solo "Impregnante New House" 
--           con variantes que tengan diferentes finishes
-- ===================================

-- NOTA: Esta consolidación es compleja porque implica:
-- 1. Mover todas las variantes de un producto al otro
-- 2. Actualizar referencias en otras tablas (order_items, cart_items, etc.)
-- 3. Eliminar el producto duplicado
-- 4. Actualizar el nombre del producto base

-- Por seguridad, primero verificamos dependencias
DO $$
DECLARE
  product_brillante_id INTEGER := 219;  -- Impregnante New House Brillante
  product_satinado_id INTEGER := 221;   -- Impregnante New House Satinado
  brillante_variants_count INTEGER;
  satinado_variants_count INTEGER;
  has_dependencies BOOLEAN;
BEGIN
  -- Contar variantes
  SELECT COUNT(*) INTO brillante_variants_count
  FROM product_variants
  WHERE product_id = product_brillante_id;
  
  SELECT COUNT(*) INTO satinado_variants_count
  FROM product_variants
  WHERE product_id = product_satinado_id;
  
  -- Verificar dependencias en order_items (si existe la columna variant_id)
  -- NOTA: order_items no tiene variant_id según estructura previa, pero verificamos product_id
  SELECT EXISTS (
    SELECT 1 FROM order_items
    WHERE product_id IN (product_brillante_id, product_satinado_id)
    LIMIT 1
  ) INTO has_dependencies;
  
  RAISE NOTICE '📊 Preparación para consolidación:';
  RAISE NOTICE '   - Producto Brillante (ID %): % variantes', product_brillante_id, brillante_variants_count;
  RAISE NOTICE '   - Producto Satinado (ID %): % variantes', product_satinado_id, satinado_variants_count;
  RAISE NOTICE '   - Tiene dependencias en order_items: %', has_dependencies;
  
  IF has_dependencies THEN
    RAISE WARNING '⚠️ ADVERTENCIA: Estos productos tienen dependencias en order_items. La consolidación puede afectar órdenes históricas.';
  END IF;
END $$;

-- PASO 1: Verificar que ambos productos tienen las mismas variantes (solo difieren en finish)
-- Si tienen las mismas combinaciones color/medida, podemos proceder
SELECT 
  'Verificación de variantes' as tipo,
  pv1.color_name,
  pv1.measure,
  pv1.finish as finish_brillante,
  pv2.finish as finish_satinado,
  CASE 
    WHEN pv1.color_name = pv2.color_name AND pv1.measure = pv2.measure THEN '✅ Coincide'
    ELSE '❌ Diferente'
  END as estado
FROM product_variants pv1
FULL OUTER JOIN product_variants pv2 ON 
  pv1.color_name = pv2.color_name 
  AND pv1.measure = pv2.measure
WHERE pv1.product_id = 219 AND pv2.product_id = 221
ORDER BY pv1.color_name, pv1.measure;

-- DECISIÓN: Como ambos productos ya tienen finish asignado correctamente en las variantes,
-- la consolidación sería:
-- 1. Renombrar producto 219 a "Impregnante New House"
-- 2. Mover todas las variantes de 221 a 219 (actualizando product_id)
-- 3. Eliminar producto 221

-- PASO 2: Renombrar producto base (ID 219) a "Impregnante New House" (sin terminación)
UPDATE products
SET 
  name = 'Impregnante New House',
  updated_at = NOW()
WHERE id = 219;

-- PASO 3: Mover variantes del producto 221 al producto 219
-- Ya que ambos tienen finish correcto, solo necesitamos cambiar el product_id
UPDATE product_variants
SET 
  product_id = 219,
  updated_at = NOW()
WHERE product_id = 221;

-- PASO 4: Actualizar terminaciones del producto consolidado
UPDATE products
SET 
  terminaciones = ARRAY['Brillante', 'Satinado'],
  updated_at = NOW()
WHERE id = 219;

-- PASO 5: Marcar producto 221 como inactivo (no lo eliminamos por seguridad histórica)
UPDATE products
SET 
  is_active = false,
  updated_at = NOW()
WHERE id = 221;

-- PASO 6: Verificar resultados
DO $$
DECLARE
  consolidated_product_name TEXT;
  consolidated_variants_count INTEGER;
  consolidated_terminaciones TEXT[];
BEGIN
  SELECT name, terminaciones INTO consolidated_product_name, consolidated_terminaciones
  FROM products
  WHERE id = 219;
  
  SELECT COUNT(*) INTO consolidated_variants_count
  FROM product_variants
  WHERE product_id = 219;
  
  RAISE NOTICE '✅ Consolidación completada:';
  RAISE NOTICE '   - Producto consolidado: % (ID 219)', consolidated_product_name;
  RAISE NOTICE '   - Total de variantes: %', consolidated_variants_count;
  RAISE NOTICE '   - Terminaciones: %', consolidated_terminaciones;
  RAISE NOTICE '   - Producto 221 marcado como inactivo (no eliminado para conservar historial)';
END $$;

-- Comentario de documentación
COMMENT ON COLUMN products.is_active IS 'Indica si el producto está activo. Los productos consolidados/duplicados se marcan como inactivos en lugar de eliminarse para conservar el historial.';
