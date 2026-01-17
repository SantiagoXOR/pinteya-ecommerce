-- ===================================
-- FIX: Actualizar color_hex faltantes basándose en color_name
-- ===================================
-- Este script actualiza las 355 variantes que tienen color_name
-- pero no tienen color_hex, usando el mapeo de colores existente
-- ===================================

-- Crear función auxiliar para mapear nombres de colores a códigos hexadecimales
CREATE OR REPLACE FUNCTION get_color_hex_from_name(color_name_input TEXT)
RETURNS TEXT AS $$
DECLARE
  normalized_name TEXT;
BEGIN
  -- Normalizar el nombre: convertir a minúsculas, eliminar espacios múltiples, y trim
  normalized_name := LOWER(TRIM(color_name_input));
  normalized_name := REGEXP_REPLACE(normalized_name, '\s+', ' ', 'g');
  
  -- Mapeo de colores basado en product-utils.ts y paint-colors.ts
  -- Ordenado por especificidad (más específicos primero)
  
  -- Blancos
  IF normalized_name IN ('blanco brillante', 'blanco brill', 'blanco-brillante', 'blanco-brill') THEN
    RETURN '#FFFFFF';
  ELSIF normalized_name IN ('blanco satinado', 'blanco sat', 'blanco-satinado', 'blanco-sat') THEN
    RETURN '#F8F8FF';
  ELSIF normalized_name IN ('blanco mate', 'blanco-mate', 'blanco puro', 'blanco-puro') THEN
    RETURN '#F5F5F5';
  ELSIF normalized_name = 'blanco' THEN
    RETURN '#FFFFFF';
  
  -- Negros
  ELSIF normalized_name IN ('negro brillante', 'negro brill', 'negro-brillante', 'negro-brill', 
                            'negro satinado', 'negro sat', 'negro-satinado', 'negro-sat',
                            'negro mate', 'negro-mate', 'negro') THEN
    RETURN '#000000';
  
  -- Rojos y teja
  ELSIF normalized_name IN ('rojo teja', 'rojo-teja', 'teja') THEN
    RETURN '#A63A2B';
  ELSIF normalized_name = 'rojo' THEN
    RETURN '#FF0000';
  
  -- Azules
  ELSIF normalized_name IN ('azul traful', 'azul-traful') THEN
    RETURN '#4682B4';
  ELSIF normalized_name IN ('azul marino', 'azul-marino') THEN
    RETURN '#000080';
  ELSIF normalized_name = 'azul' THEN
    RETURN '#0000FF';
  
  -- Amarillos
  ELSIF normalized_name IN ('amarillo mediano', 'amarillo-mediano') THEN
    RETURN '#FFD700';
  ELSIF normalized_name = 'amarillo' THEN
    RETURN '#FFFF00';
  
  -- Verdes
  ELSIF normalized_name IN ('verde noche', 'verde-noche') THEN
    RETURN '#013220';
  ELSIF normalized_name IN ('verde ingles', 'verde-ingles', 'verde inglés', 'verde-inglés') THEN
    RETURN '#355E3B';
  ELSIF normalized_name IN ('verde claro', 'verde-claro') THEN
    RETURN '#90EE90';
  ELSIF normalized_name IN ('verde oscuro', 'verde-oscuro') THEN
    RETURN '#006400';
  ELSIF normalized_name = 'verde' THEN
    RETURN '#008000';
  
  -- Grises
  ELSIF normalized_name IN ('gris perla', 'gris-perla') THEN
    RETURN '#C0C0C0';
  ELSIF normalized_name IN ('gris espacial', 'gris-espacial') THEN
    RETURN '#696969';
  ELSIF normalized_name = 'gris' THEN
    RETURN '#808080';
  
  -- Colores sintéticos Converlux
  ELSIF normalized_name = 'aluminio' THEN
    RETURN '#A8A8A8';
  ELSIF normalized_name IN ('bermellon', 'bermellón') THEN
    RETURN '#E34234';
  ELSIF normalized_name = 'marfil' THEN
    RETURN '#FFFFF0';
  ELSIF normalized_name = 'tostado' THEN
    RETURN '#D2B48C';
  
  -- Colores de madera
  ELSIF normalized_name IN ('roble claro', 'roble-claro') THEN
    RETURN '#D4A76A';
  ELSIF normalized_name IN ('roble oscuro', 'roble-oscuro') THEN
    RETURN '#5C4033';
  ELSIF normalized_name = 'roble' THEN
    RETURN '#C7955B';
  ELSIF normalized_name = 'caoba' THEN
    RETURN '#8E3B1F';
  ELSIF normalized_name = 'cedro' THEN
    RETURN '#C26A2B';
  ELSIF normalized_name = 'nogal' THEN
    RETURN '#5C3A1A';
  ELSIF normalized_name = 'pino' THEN
    RETURN '#E5B57E';
  ELSIF normalized_name = 'natural' THEN
    RETURN '#DEB887';
  
  -- Otros colores
  ELSIF normalized_name = 'naranja' THEN
    RETURN '#FF8C00';
  ELSIF normalized_name IN ('marrón', 'marron') THEN
    RETURN '#8B4513';
  ELSIF normalized_name = 'ocre' THEN
    RETURN '#CC7722';
  ELSIF normalized_name = 'siena' THEN
    RETURN '#A0522D';
  ELSIF normalized_name = 'arena' THEN
    RETURN '#F4A460';
  ELSIF normalized_name = 'celeste' THEN
    RETURN '#87CEEB';
  ELSIF normalized_name IN ('turquesa', 'turquesa antiguo') THEN
    RETURN '#40E0D0';
  ELSIF normalized_name = 'violeta' THEN
    RETURN '#8A2BE2';
  ELSIF normalized_name = 'incoloro' THEN
    RETURN '#F5F5F5';
  
  -- Colores especiales
  ELSIF normalized_name IN ('rosa claro', 'rosa palido') THEN
    RETURN '#FFB6C1';
  ELSIF normalized_name = 'rosa' THEN
    RETURN '#FFC0CB';
  ELSIF normalized_name = 'cafe' THEN
    RETURN '#8B4513';
  ELSIF normalized_name = 'coral' THEN
    RETURN '#FF7F50';
  ELSIF normalized_name = 'lila' THEN
    RETURN '#C8A2C8';
  ELSIF normalized_name = 'borravino' THEN
    RETURN '#800020';
  ELSIF normalized_name = 'acero inoxidable' THEN
    RETURN '#71797E';
  
  ELSE
    RETURN NULL;
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Actualizar todas las variantes que tienen color_name pero no color_hex
UPDATE product_variants
SET 
  color_hex = get_color_hex_from_name(color_name),
  updated_at = NOW()
WHERE 
  color_name IS NOT NULL 
  AND color_name != ''
  AND TRIM(color_name) != ''
  AND (color_hex IS NULL OR color_hex = '')
  AND get_color_hex_from_name(color_name) IS NOT NULL;

-- Mostrar estadísticas de la actualización
DO $$
DECLARE
  updated_count INTEGER;
  remaining_count INTEGER;
BEGIN
  -- Contar cuántas se actualizaron
  SELECT COUNT(*) INTO updated_count
  FROM product_variants
  WHERE 
    color_name IS NOT NULL 
    AND color_name != ''
    AND TRIM(color_name) != ''
    AND color_hex IS NOT NULL
    AND color_hex != '';
  
  -- Contar cuántas quedan sin actualizar
  SELECT COUNT(*) INTO remaining_count
  FROM product_variants
  WHERE 
    color_name IS NOT NULL 
    AND color_name != ''
    AND TRIM(color_name) != ''
    AND (color_hex IS NULL OR color_hex = '');
  
  RAISE NOTICE '✅ Variantes con color_hex actualizado: %', updated_count;
  RAISE NOTICE '⚠️ Variantes que aún necesitan color_hex: %', remaining_count;
END $$;

-- Limpiar la función auxiliar (opcional, puede dejarse para uso futuro)
-- DROP FUNCTION IF EXISTS get_color_hex_from_name(TEXT);
