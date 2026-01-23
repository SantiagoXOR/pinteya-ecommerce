-- ============================================================================
-- MIGRACIÓN: Invertir orden del gradiente para Pintemas
-- ============================================================================
-- Descripción: Intercambia los valores de gradient_start y gradient_end
-- para Pintemas, de modo que el morado quede arriba y el amarillo abajo
-- ============================================================================

UPDATE tenants
SET
  -- Invertir gradiente: morado arriba, amarillo abajo
  background_gradient_start = '#841468',  -- Morado Pintemas (arriba)
  background_gradient_end = '#ffe200',    -- Amarillo Pintemas (abajo)
  updated_at = NOW()
WHERE slug = 'pintemas';

-- Verificar actualización
DO $$
DECLARE
  v_gradient_start TEXT;
  v_gradient_end TEXT;
BEGIN
  SELECT background_gradient_start, background_gradient_end
  INTO v_gradient_start, v_gradient_end
  FROM tenants
  WHERE slug = 'pintemas';
  
  IF v_gradient_start = '#841468' AND v_gradient_end = '#ffe200' THEN
    RAISE NOTICE '✅ Gradiente de Pintemas invertido correctamente';
    RAISE NOTICE '   Start (arriba): %', v_gradient_start;
    RAISE NOTICE '   End (abajo): %', v_gradient_end;
  ELSE
    RAISE WARNING '⚠️ El gradiente no se actualizó correctamente';
  END IF;
END $$;
