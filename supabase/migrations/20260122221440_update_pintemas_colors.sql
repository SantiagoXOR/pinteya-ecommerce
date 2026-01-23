-- ============================================================================
-- MIGRACIÓN: Actualizar Colores de Pintemas
-- ============================================================================
-- Descripción: Actualiza la paleta de colores de Pintemas de azul a morado
-- (#841468) y amarillo (#ffe200) según especificación de marca
-- ============================================================================

UPDATE tenants
SET
  -- Colores primarios morados
  primary_color = '#841468',        -- Morado Pintemas
  primary_dark = '#6a0f54',         -- Morado oscuro (tono más oscuro)
  primary_light = '#a01a7c',        -- Morado claro (tono más claro)
  
  -- Color de acento amarillo Pintemas
  accent_color = '#ffe200',         -- Amarillo Pintemas
  
  -- Header con morado
  header_bg_color = '#841468',      -- Morado Pintemas
  
  -- Gradientes con tonos morados
  background_gradient_start = '#841468',  -- Morado base
  background_gradient_end = '#a01a7c',   -- Morado claro
  
  updated_at = NOW()
WHERE slug = 'pintemas';

-- Verificar actualización
DO $$
DECLARE
  v_primary_color TEXT;
  v_accent_color TEXT;
  v_header_bg TEXT;
BEGIN
  SELECT primary_color, accent_color, header_bg_color
  INTO v_primary_color, v_accent_color, v_header_bg
  FROM tenants
  WHERE slug = 'pintemas';
  
  IF v_primary_color = '#841468' AND v_accent_color = '#ffe200' AND v_header_bg = '#841468' THEN
    RAISE NOTICE '✅ Colores de Pintemas actualizados correctamente';
    RAISE NOTICE '   Primary: %', v_primary_color;
    RAISE NOTICE '   Accent: %', v_accent_color;
    RAISE NOTICE '   Header BG: %', v_header_bg;
  ELSE
    RAISE WARNING '⚠️ Los colores no se actualizaron correctamente';
  END IF;
END $$;

-- Comentarios
COMMENT ON COLUMN tenants.primary_color IS 'Color primario del tenant (morado #841468 para Pintemas)';
COMMENT ON COLUMN tenants.accent_color IS 'Color de acento del tenant (amarillo #ffe200 para Pintemas)';
