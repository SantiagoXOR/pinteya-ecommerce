-- ===================================
-- Migración: Normalizar nombres de colores y separar terminaciones
-- Fecha: 2025-12-21
-- Objetivo: Extraer terminaciones del nombre del color y moverlas al campo `finish`
--           Ejemplo: "BLANCO BRILL" -> color_name: "BLANCO", finish: "BRILLANTE"
-- ===================================

-- Función helper para extraer la terminación de un nombre de color
CREATE OR REPLACE FUNCTION extract_finish_from_color_name(color_name_text TEXT)
RETURNS TEXT AS $$
DECLARE
  color_lower TEXT;
BEGIN
  IF color_name_text IS NULL OR color_name_text = '' THEN
    RETURN NULL;
  END IF;
  
  color_lower := LOWER(TRIM(color_name_text));
  
  -- Detectar terminaciones comunes y sus variantes
  -- BRILLANTE / BRILL
  IF color_lower LIKE '% brill%' OR color_lower LIKE '%brill %' OR color_lower LIKE '%brillante%' THEN
    RETURN 'BRILLANTE';
  END IF;
  
  -- SATINADO / SAT
  IF color_lower LIKE '% sat%' OR color_lower LIKE '%sat %' OR color_lower LIKE '%satinado%' THEN
    RETURN 'SATINADO';
  END IF;
  
  -- MATE / MATTE
  IF color_lower LIKE '% mate%' OR color_lower LIKE '%mate %' OR color_lower LIKE '%matte%' THEN
    RETURN 'MATE';
  END IF;
  
  -- No se encontró terminación
  RETURN NULL;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Función helper para limpiar el nombre del color (remover terminación)
CREATE OR REPLACE FUNCTION clean_color_name(color_name_text TEXT)
RETURNS TEXT AS $$
DECLARE
  cleaned TEXT;
BEGIN
  IF color_name_text IS NULL OR color_name_text = '' THEN
    RETURN NULL;
  END IF;
  
  cleaned := TRIM(color_name_text);
  
  -- Remover terminaciones usando expresiones regulares (case insensitive)
  -- BRILLANTE / BRILL
  cleaned := REGEXP_REPLACE(cleaned, '\s+brill(ante)?\s*$', '', 'i');
  cleaned := REGEXP_REPLACE(cleaned, '^brill(ante)?\s+', '', 'i');
  
  -- SATINADO / SAT
  cleaned := REGEXP_REPLACE(cleaned, '\s+sat(inado)?\s*$', '', 'i');
  cleaned := REGEXP_REPLACE(cleaned, '^sat(inado)?\s+', '', 'i');
  
  -- MATE / MATTE
  cleaned := REGEXP_REPLACE(cleaned, '\s+mate?\s*$', '', 'i');
  cleaned := REGEXP_REPLACE(cleaned, '^mate?\s+', '', 'i');
  
  RETURN TRIM(cleaned);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- PASO 1: Actualizar variantes que tienen terminaciones en el nombre del color
DO $$
DECLARE
  affected_count INTEGER;
BEGIN
  UPDATE product_variants pv
  SET 
    color_name = clean_color_name(pv.color_name),
    finish = CASE
      -- Si ya tiene finish válido, mantenerlo
      WHEN pv.finish IS NOT NULL AND pv.finish != '' THEN pv.finish
      -- Si no, extraer del nombre
      ELSE extract_finish_from_color_name(pv.color_name)
    END,
    updated_at = NOW()
  WHERE 
    pv.color_name IS NOT NULL 
    AND pv.color_name != ''
    AND (
      -- Detectar colores con terminaciones en el nombre
      LOWER(pv.color_name) LIKE '% brill%' OR
      LOWER(pv.color_name) LIKE '%brill %' OR
      LOWER(pv.color_name) LIKE '%brillante%' OR
      LOWER(pv.color_name) LIKE '% sat%' OR
      LOWER(pv.color_name) LIKE '%sat %' OR
      LOWER(pv.color_name) LIKE '%satinado%' OR
      LOWER(pv.color_name) LIKE '% mate%' OR
      LOWER(pv.color_name) LIKE '%mate %' OR
      LOWER(pv.color_name) LIKE '%matte%'
    );
  
  GET DIAGNOSTICS affected_count = ROW_COUNT;
  
  RAISE NOTICE '✅ Normalizados % variantes con terminaciones en el nombre del color', affected_count;
END $$;

-- PASO 2: Verificar resultados y reportar estado
DO $$
DECLARE
  total_variants INTEGER;
  variants_with_finish INTEGER;
  variants_with_finish_in_color_name INTEGER;
  examples_remaining TEXT;
BEGIN
  SELECT COUNT(*) INTO total_variants 
  FROM product_variants 
  WHERE color_name IS NOT NULL AND color_name != '';
  
  SELECT COUNT(*) INTO variants_with_finish 
  FROM product_variants 
  WHERE finish IS NOT NULL AND finish != '';
  
  SELECT COUNT(*) INTO variants_with_finish_in_color_name 
  FROM product_variants 
  WHERE color_name IS NOT NULL 
    AND color_name != ''
    AND (
      LOWER(color_name) LIKE '% brill%' OR
      LOWER(color_name) LIKE '%brill %' OR
      LOWER(color_name) LIKE '%brillante%' OR
      LOWER(color_name) LIKE '% sat%' OR
      LOWER(color_name) LIKE '%sat %' OR
      LOWER(color_name) LIKE '%satinado%' OR
      LOWER(color_name) LIKE '% mate%' OR
      LOWER(color_name) LIKE '%mate %' OR
      LOWER(color_name) LIKE '%matte%'
    );
  
  -- Obtener ejemplos de variantes que aún tienen terminación en color_name
  IF variants_with_finish_in_color_name > 0 THEN
    SELECT string_agg(DISTINCT color_name, ', ' ORDER BY color_name)
    INTO examples_remaining
    FROM product_variants
    WHERE color_name IS NOT NULL 
      AND color_name != ''
      AND (
        LOWER(color_name) LIKE '% brill%' OR
        LOWER(color_name) LIKE '%brill %' OR
        LOWER(color_name) LIKE '%brillante%' OR
        LOWER(color_name) LIKE '% sat%' OR
        LOWER(color_name) LIKE '%sat %' OR
        LOWER(color_name) LIKE '%satinado%' OR
        LOWER(color_name) LIKE '% mate%' OR
        LOWER(color_name) LIKE '%mate %' OR
        LOWER(color_name) LIKE '%matte%'
      )
    LIMIT 10;
  END IF;
  
  RAISE NOTICE '📊 Resumen de normalización:';
  RAISE NOTICE '   - Total de variantes con color_name: %', total_variants;
  RAISE NOTICE '   - Variantes con finish definido: %', variants_with_finish;
  RAISE NOTICE '   - Variantes que aún tienen terminación en color_name: %', variants_with_finish_in_color_name;
  
  IF variants_with_finish_in_color_name > 0 THEN
    RAISE WARNING '⚠️ Aún quedan % variantes con terminación en el nombre del color. Ejemplos: %', 
      variants_with_finish_in_color_name, 
      COALESCE(examples_remaining, 'N/A');
  ELSE
    RAISE NOTICE '✅ Normalización completada exitosamente';
  END IF;
END $$;

-- Comentarios de documentación
COMMENT ON FUNCTION extract_finish_from_color_name IS 'Extrae la terminación (BRILLANTE, SATINADO, MATE) del nombre de un color. Retorna NULL si no se encuentra terminación.';
COMMENT ON FUNCTION clean_color_name IS 'Limpia el nombre de un color removiendo terminaciones. Ejemplo: "BLANCO BRILL" -> "BLANCO".';
COMMENT ON COLUMN product_variants.color_name IS 'Nombre base del color sin terminación. Ejemplo: "BLANCO", "NEGRO", "GRIS". La terminación debe estar en el campo finish.';
COMMENT ON COLUMN product_variants.finish IS 'Terminación del producto/variante. Valores comunes: "BRILLANTE", "SATINADO", "MATE". Solo aplica para productos que tienen terminaciones (sintéticos, barnices, etc.).';
