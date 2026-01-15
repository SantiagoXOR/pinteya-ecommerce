-- ===================================
-- LIMPIEZA DE VALORES AIKON_ID ANTES DE MIGRACIÓN
-- Fecha: 2025-01-29
-- Descripción: Script para limpiar y corregir valores problemáticos de aikon_id
-- ===================================

-- Este script identifica y sugiere correcciones para valores problemáticos
-- Se debe ejecutar ANTES de la migración principal

-- ===================================
-- 1. IDENTIFICAR VALORES PROBLEMÁTICOS EN VARIANTES
-- ===================================

-- Variantes con formato "NUMERO-TEXTO" (ej: "4488-ROJO-TEJA")
-- Estrategia: Extraer solo el número inicial
SELECT 
  id,
  product_id,
  aikon_id as valor_actual,
  'Extraer número inicial' as accion_sugerida,
  (regexp_replace(aikon_id, '[^0-9]', '', 'g'))::INTEGER as valor_sugerido
FROM product_variants
WHERE aikon_id !~ '^[0-9]+$'
  AND aikon_id ~ '^[0-9]+'
  AND (regexp_replace(aikon_id, '[^0-9]', '', 'g'))::BIGINT <= 999999;

-- Variantes con formato "TEMP-NUMERO" (ej: "TEMP-317")
-- Estrategia: Extraer solo el número
SELECT 
  id,
  product_id,
  aikon_id as valor_actual,
  'Extraer número de TEMP' as accion_sugerida,
  (regexp_replace(aikon_id, '[^0-9]', '', 'g'))::INTEGER as valor_sugerido
FROM product_variants
WHERE aikon_id LIKE 'TEMP-%'
  AND (regexp_replace(aikon_id, '[^0-9]', '', 'g'))::BIGINT <= 999999;

-- Variantes con otros formatos problemáticos
SELECT 
  id,
  product_id,
  aikon_id as valor_actual,
  'Revisar manualmente' as accion_sugerida
FROM product_variants
WHERE aikon_id !~ '[0-9]'
  OR (aikon_id ~ '[0-9]' AND (regexp_replace(aikon_id, '[^0-9]', '', 'g'))::BIGINT > 999999);

-- ===================================
-- 2. PRODUCTOS SIN VARIANTES Y SIN AIKON_ID
-- ===================================

-- Listar todos los productos que necesitan aikon_id manual
SELECT 
  id,
  name,
  'Asignar aikon_id manualmente' as accion_requerida
FROM products p
WHERE p.aikon_id IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM product_variants pv WHERE pv.product_id = p.id
  )
ORDER BY id;

-- ===================================
-- 3. SCRIPT DE CORRECCIÓN AUTOMÁTICA (OPCIONAL)
-- ===================================

-- Este bloque se puede ejecutar para corregir automáticamente los valores
-- que tienen formato "NUMERO-TEXTO" extrayendo solo el número

/*
BEGIN;

-- Corregir variantes con formato "NUMERO-TEXTO" o "TEMP-NUMERO"
UPDATE product_variants
SET aikon_id = (regexp_replace(aikon_id, '[^0-9]', '', 'g'))
WHERE aikon_id !~ '^[0-9]+$'
  AND aikon_id ~ '[0-9]'
  AND (regexp_replace(aikon_id, '[^0-9]', '', 'g'))::BIGINT <= 999999
  AND (regexp_replace(aikon_id, '[^0-9]', '', 'g'))::BIGINT >= 0;

COMMIT;
*/

-- ===================================
-- NOTAS
-- ===================================

-- Valores identificados que necesitan atención:
-- 1. "4488-ROJO-TEJA" -> 4488 (OK, se extraerá automáticamente)
-- 2. "4487-ROJO-TEJA" -> 4487 (OK, se extraerá automáticamente)
-- 3. "3386-GRIS" -> 3386 (OK, se extraerá automáticamente)
-- 4. "2751-VERDE-CEMENTO" -> 2751 (OK, se extraerá automáticamente)
-- 5. "2750-VERDE-CEMENTO" -> 2750 (OK, se extraerá automáticamente)
-- 6. "2771-GRIS" -> 2771 (OK, se extraerá automáticamente)
-- 7. "2771-VERDE-CEMENTO" -> 2771 (OK, se extraerá automáticamente)
-- 8. "LIJA-87" -> 87 (OK, se extraerá automáticamente)
-- 9. "TEMP-317" -> 317 (OK, se extraerá automáticamente)
-- 10. "TEMP-327" -> 327 (OK, se extraerá automáticamente)
-- 11. "TEMP-335" -> 335 (OK, se extraerá automáticamente)
-- 12. "9-20kg" -> 9 (OK, se extraerá automáticamente)

-- Todos los valores problemáticos se pueden corregir automáticamente
-- extrayendo solo los números. La migración principal manejará esto.
