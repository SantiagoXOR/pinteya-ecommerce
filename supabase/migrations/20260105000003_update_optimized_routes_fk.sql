-- =====================================================
-- MIGRACIÓN: Actualizar Foreign Key en optimized_routes
-- Descripción: Cambiar foreign key de logistics_drivers a drivers
-- Fecha: 2026-01-05
-- =====================================================

-- Eliminar foreign key existente (si referencia a logistics_drivers)
ALTER TABLE optimized_routes 
DROP CONSTRAINT IF EXISTS optimized_routes_driver_id_fkey;

-- Agregar nueva foreign key a drivers
ALTER TABLE optimized_routes 
ADD CONSTRAINT optimized_routes_driver_id_fkey 
FOREIGN KEY (driver_id) 
REFERENCES drivers(id) 
ON DELETE SET NULL;

-- Verificar que la foreign key fue creada correctamente
DO $$
DECLARE
  fk_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'optimized_routes_driver_id_fkey'
    AND table_name = 'optimized_routes'
    AND constraint_type = 'FOREIGN KEY'
  ) INTO fk_exists;
  
  IF fk_exists THEN
    RAISE NOTICE 'Foreign key actualizada correctamente: optimized_routes.driver_id -> drivers.id';
  ELSE
    RAISE WARNING 'No se pudo verificar la creación de la foreign key';
  END IF;
END $$;






