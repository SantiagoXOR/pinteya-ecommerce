-- ===================================
-- MIGRACIÓN: CORREGIR SLUGS CON TIMESTAMPS
-- Fecha: 2025-01-29
-- Descripción: Limpia slugs de productos que tienen timestamps (13 dígitos) al final
-- ===================================

BEGIN;

-- ===================================
-- PASO 1: CREAR FUNCIÓN HELPER PARA GENERAR SLUG LIMPIO
-- ===================================

-- Función para generar slug limpio desde el nombre
CREATE OR REPLACE FUNCTION generate_clean_slug(product_name TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN lower(
    regexp_replace(
      regexp_replace(
        regexp_replace(
          regexp_replace(
            unaccent(product_name),
            '[^a-z0-9\s-]', '', 'g'
          ),
          '\s+', '-', 'g'
        ),
        '-+', '-', 'g'
      ),
      '^-|-$', '', 'g'
    )
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ===================================
-- PASO 2: IDENTIFICAR PRODUCTOS CON SLUGS CON TIMESTAMP
-- ===================================

-- Crear tabla temporal para almacenar los cambios
CREATE TEMP TABLE IF NOT EXISTS slug_corrections (
  product_id INTEGER,
  old_slug TEXT,
  new_slug TEXT,
  needs_suffix BOOLEAN DEFAULT false
);

-- Identificar productos con slugs que terminan en -{13 dígitos}
INSERT INTO slug_corrections (product_id, old_slug, new_slug)
SELECT 
  id,
  slug,
  regexp_replace(slug, '-\d{13}$', '') as cleaned_slug
FROM products
WHERE slug ~ '-\d{13}$'
  AND slug IS NOT NULL;

-- ===================================
-- PASO 3: VERIFICAR UNICIDAD Y AGREGAR SUFIJOS SI ES NECESARIO
-- ===================================

-- Para cada slug limpio, verificar si ya existe (excluyendo el producto actual)
DO $$
DECLARE
  rec RECORD;
  base_slug TEXT;
  test_slug TEXT;
  counter INTEGER;
  exists_count INTEGER;
BEGIN
  FOR rec IN SELECT * FROM slug_corrections LOOP
    base_slug := rec.new_slug;
    counter := 1;
    test_slug := base_slug;
    
    -- Verificar si el slug base ya existe (excluyendo el producto actual)
    SELECT COUNT(*) INTO exists_count
    FROM products
    WHERE slug = test_slug
      AND id != rec.product_id;
    
    -- Si existe, agregar sufijo numérico
    WHILE exists_count > 0 LOOP
      test_slug := base_slug || '-' || counter::TEXT;
      
      SELECT COUNT(*) INTO exists_count
      FROM products
      WHERE slug = test_slug
        AND id != rec.product_id;
      
      counter := counter + 1;
      
      -- Protección contra loops infinitos
      IF counter > 1000 THEN
        RAISE WARNING 'No se pudo generar slug único para producto % después de 1000 intentos', rec.product_id;
        EXIT;
      END IF;
    END LOOP;
    
    -- Actualizar el slug en la tabla temporal
    UPDATE slug_corrections
    SET new_slug = test_slug,
        needs_suffix = (counter > 1)
    WHERE product_id = rec.product_id;
  END LOOP;
END $$;

-- ===================================
-- PASO 4: ACTUALIZAR SLUGS EN LA TABLA PRODUCTS
-- ===================================

-- Actualizar todos los slugs corregidos
UPDATE products p
SET slug = sc.new_slug,
    updated_at = NOW()
FROM slug_corrections sc
WHERE p.id = sc.product_id;

-- ===================================
-- PASO 5: VERIFICACIÓN Y REPORTE
-- ===================================

-- Mostrar resumen de correcciones
DO $$
DECLARE
  total_corrected INTEGER;
  with_suffix INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_corrected FROM slug_corrections;
  SELECT COUNT(*) INTO with_suffix FROM slug_corrections WHERE needs_suffix = true;
  
  RAISE NOTICE 'Migración de slugs completada:';
  RAISE NOTICE '  - Total de slugs corregidos: %', total_corrected;
  RAISE NOTICE '  - Slugs que requirieron sufijo numérico: %', with_suffix;
END $$;

-- Mostrar algunos ejemplos de correcciones
SELECT 
  product_id,
  old_slug,
  new_slug,
  needs_suffix
FROM slug_corrections
ORDER BY product_id
LIMIT 10;

-- ===================================
-- PASO 6: VERIFICAR QUE NO QUEDEN SLUGS CON TIMESTAMP
-- ===================================

DO $$
DECLARE
  remaining_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO remaining_count
  FROM products
  WHERE slug ~ '-\d{13}$';
  
  IF remaining_count > 0 THEN
    RAISE WARNING 'Aún quedan % productos con slugs con timestamp. Revisar manualmente.', remaining_count;
  ELSE
    RAISE NOTICE 'Todos los slugs con timestamp han sido corregidos.';
  END IF;
END $$;

-- ===================================
-- PASO 7: LIMPIAR FUNCIÓN TEMPORAL
-- ===================================

DROP FUNCTION IF EXISTS generate_clean_slug(TEXT);

COMMIT;

-- ===================================
-- NOTAS POST-MIGRACIÓN
-- ===================================

-- Los slugs han sido limpiados de timestamps
-- Si un slug limpio ya existía, se agregó un sufijo numérico (-1, -2, etc.)
-- La tabla temporal slug_corrections contiene el registro de todos los cambios
-- Verificar que las URLs públicas funcionen correctamente después de la migración
