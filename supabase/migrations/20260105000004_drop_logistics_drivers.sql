-- =====================================================
-- MIGRACIÓN: Eliminar Tabla logistics_drivers
-- Descripción: Eliminar tabla antigua después de migrar datos a drivers
-- Fecha: 2026-01-05
-- =====================================================

-- Eliminar tabla logistics_drivers (ya no se usa)
-- CASCADE eliminará automáticamente las foreign keys que la referencian
DROP TABLE IF EXISTS logistics_drivers CASCADE;

-- Verificar que la tabla fue eliminada
DO $$
DECLARE
  table_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'logistics_drivers'
  ) INTO table_exists;
  
  IF table_exists THEN
    RAISE WARNING 'La tabla logistics_drivers aún existe';
  ELSE
    RAISE NOTICE 'Tabla logistics_drivers eliminada correctamente';
  END IF;
END $$;


