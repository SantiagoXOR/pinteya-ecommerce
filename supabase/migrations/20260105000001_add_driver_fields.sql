-- =====================================================
-- MIGRACIÓN: Agregar Campos Faltantes a Tabla Drivers
-- Descripción: Agregar campos necesarios para compatibilidad con código existente
-- Fecha: 2026-01-05
-- =====================================================

-- Agregar campos faltantes a la tabla drivers
ALTER TABLE drivers 
ADD COLUMN IF NOT EXISTS current_location JSONB,
ADD COLUMN IF NOT EXISTS vehicle_type VARCHAR(100),
ADD COLUMN IF NOT EXISTS license_plate VARCHAR(20),
ADD COLUMN IF NOT EXISTS max_capacity INTEGER DEFAULT 50;

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_drivers_current_location 
ON drivers USING GIN (current_location);

CREATE INDEX IF NOT EXISTS idx_drivers_vehicle_type 
ON drivers(vehicle_type);

CREATE INDEX IF NOT EXISTS idx_drivers_license_plate 
ON drivers(license_plate);

-- Comentarios para documentación
COMMENT ON COLUMN drivers.current_location IS 'Ubicación actual del driver en formato JSONB {lat, lng, timestamp, speed, heading, accuracy}';
COMMENT ON COLUMN drivers.vehicle_type IS 'Tipo de vehículo del driver (Furgón, Camioneta, Moto, Camión, etc.)';
COMMENT ON COLUMN drivers.license_plate IS 'Placa del vehículo (para compatibilidad con código legacy)';
COMMENT ON COLUMN drivers.max_capacity IS 'Capacidad máxima de envíos que puede manejar el driver';


