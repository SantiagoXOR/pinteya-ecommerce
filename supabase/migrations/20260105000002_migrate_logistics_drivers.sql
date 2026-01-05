-- =====================================================
-- MIGRACIÓN: Migrar Datos de logistics_drivers a drivers
-- Descripción: Unificar datos de logistics_drivers en tabla drivers
-- Fecha: 2026-01-05
-- =====================================================

-- Función para migrar datos de logistics_drivers a drivers
DO $$
DECLARE
  logistics_driver RECORD;
  driver_id UUID;
  driver_id_new UUID;
  name_parts TEXT[];
  first_part TEXT;
  last_part TEXT;
  old_driver_id UUID;
BEGIN
  FOR logistics_driver IN SELECT * FROM logistics_drivers
  LOOP
    old_driver_id := logistics_driver.id;
    
    -- Buscar driver existente por email
    SELECT id INTO driver_id 
    FROM drivers 
    WHERE email = logistics_driver.email
    LIMIT 1;
    
    IF driver_id IS NOT NULL THEN
      -- Actualizar driver existente con datos de logistics_drivers
      UPDATE drivers SET
        vehicle_type = COALESCE(drivers.vehicle_type, logistics_driver.vehicle_type),
        license_plate = COALESCE(drivers.license_plate, logistics_driver.license_plate),
        current_location = COALESCE(drivers.current_location, logistics_driver.current_location),
        max_capacity = COALESCE(drivers.max_capacity, logistics_driver.max_capacity),
        driver_license = COALESCE(drivers.driver_license, logistics_driver.license_plate),
        updated_at = NOW()
      WHERE id = driver_id;
      
      driver_id_new := driver_id;
    ELSE
      -- Crear nuevo driver desde logistics_drivers
      name_parts := string_to_array(TRIM(logistics_driver.name), ' ');
      
      -- Separar nombre en first_name y last_name
      IF array_length(name_parts, 1) >= 2 THEN
        first_part := name_parts[1];
        last_part := array_to_string(name_parts[2:array_length(name_parts, 1)], ' ');
      ELSIF array_length(name_parts, 1) = 1 THEN
        first_part := name_parts[1];
        last_part := '';
      ELSE
        first_part := 'Driver';
        last_part := '';
      END IF;
      
      -- Insertar nuevo driver
      INSERT INTO drivers (
        first_name, 
        last_name, 
        email, 
        phone,
        driver_license, 
        license_plate,
        vehicle_type, 
        current_location, 
        max_capacity,
        status, 
        created_at, 
        updated_at
      ) VALUES (
        first_part,
        last_part,
        logistics_driver.email,
        logistics_driver.phone,
        logistics_driver.license_plate, -- Usar license_plate como driver_license también
        logistics_driver.license_plate,
        logistics_driver.vehicle_type,
        logistics_driver.current_location,
        logistics_driver.max_capacity,
        logistics_driver.status,
        COALESCE(logistics_driver.created_at, NOW()),
        COALESCE(logistics_driver.updated_at, NOW())
      ) RETURNING id INTO driver_id_new;
    END IF;
    
    -- Actualizar optimized_routes para usar el nuevo driver_id
    -- Mapear el ID antiguo de logistics_drivers al nuevo ID de drivers
    UPDATE optimized_routes 
    SET driver_id = driver_id_new,
        updated_at = NOW()
    WHERE optimized_routes.driver_id = old_driver_id;
    
  END LOOP;
END $$;

-- Verificar migración
DO $$
DECLARE
  migrated_count INTEGER;
  total_logistics_drivers INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_logistics_drivers FROM logistics_drivers;
  SELECT COUNT(*) INTO migrated_count 
  FROM optimized_routes 
  WHERE driver_id IN (SELECT id FROM drivers);
  
  RAISE NOTICE 'Migración completada: % registros procesados, % rutas actualizadas', 
    total_logistics_drivers, migrated_count;
END $$;

