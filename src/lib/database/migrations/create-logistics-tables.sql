-- =====================================================
-- MIGRACIÓN: TABLAS DE LOGÍSTICA Y RUTAS OPTIMIZADAS
-- Descripción: Crear tablas para gestión de rutas y drivers
-- Fecha: 2024-12-15
-- =====================================================

-- Tabla de drivers/conductores
CREATE TABLE IF NOT EXISTS drivers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  email VARCHAR(255),
  vehicle_type VARCHAR(100) NOT NULL,
  license_plate VARCHAR(20) NOT NULL UNIQUE,
  status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'busy', 'offline')),
  current_location JSONB,
  max_capacity INTEGER DEFAULT 50,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de rutas optimizadas
CREATE TABLE IF NOT EXISTS optimized_routes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  shipments JSONB NOT NULL DEFAULT '[]',
  total_distance DECIMAL(10,2) DEFAULT 0,
  estimated_time INTEGER DEFAULT 0, -- en minutos
  driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
  status VARCHAR(20) DEFAULT 'planned' CHECK (status IN ('planned', 'active', 'completed')),
  start_location JSONB,
  waypoints JSONB NOT NULL DEFAULT '[]',
  optimization_score INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agregar columna route_id a la tabla shipments si no existe
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'shipments' AND column_name = 'route_id'
  ) THEN
    ALTER TABLE shipments ADD COLUMN route_id UUID REFERENCES optimized_routes(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_drivers_status ON drivers(status);
CREATE INDEX IF NOT EXISTS idx_drivers_vehicle_type ON drivers(vehicle_type);
CREATE INDEX IF NOT EXISTS idx_optimized_routes_status ON optimized_routes(status);
CREATE INDEX IF NOT EXISTS idx_optimized_routes_driver_id ON optimized_routes(driver_id);
CREATE INDEX IF NOT EXISTS idx_shipments_route_id ON shipments(route_id);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para actualizar updated_at
DROP TRIGGER IF EXISTS update_drivers_updated_at ON drivers;
CREATE TRIGGER update_drivers_updated_at
  BEFORE UPDATE ON drivers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_optimized_routes_updated_at ON optimized_routes;
CREATE TRIGGER update_optimized_routes_updated_at
  BEFORE UPDATE ON optimized_routes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insertar datos de prueba para drivers
INSERT INTO drivers (name, phone, email, vehicle_type, license_plate, status, max_capacity) VALUES
  ('Carlos Rodríguez', '+54 11 1234-5678', 'carlos@pinteya.com', 'Camioneta', 'ABC123', 'available', 30),
  ('María González', '+54 11 2345-6789', 'maria@pinteya.com', 'Furgón', 'DEF456', 'available', 50),
  ('Juan Pérez', '+54 11 3456-7890', 'juan@pinteya.com', 'Motocicleta', 'GHI789', 'available', 10),
  ('Ana Martínez', '+54 11 4567-8901', 'ana@pinteya.com', 'Camión', 'JKL012', 'available', 100),
  ('Luis Fernández', '+54 11 5678-9012', 'luis@pinteya.com', 'Camioneta', 'MNO345', 'busy', 30)
ON CONFLICT (license_plate) DO NOTHING;

-- Comentarios para documentación
COMMENT ON TABLE drivers IS 'Tabla de conductores/drivers para logística';
COMMENT ON TABLE optimized_routes IS 'Tabla de rutas optimizadas con algoritmos TSP';
COMMENT ON COLUMN drivers.status IS 'Estado del driver: available, busy, offline';
COMMENT ON COLUMN drivers.current_location IS 'Ubicación actual del driver en formato {lat, lng}';
COMMENT ON COLUMN drivers.max_capacity IS 'Capacidad máxima de envíos que puede manejar';
COMMENT ON COLUMN optimized_routes.shipments IS 'Array de envíos asignados a la ruta';
COMMENT ON COLUMN optimized_routes.waypoints IS 'Array de coordenadas que forman la ruta';
COMMENT ON COLUMN optimized_routes.optimization_score IS 'Score de optimización de la ruta (0-100)';

-- Políticas de seguridad RLS (Row Level Security)
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE optimized_routes ENABLE ROW LEVEL SECURITY;

-- Política para admins (acceso completo)
CREATE POLICY "Admins can manage drivers" ON drivers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE clerk_user_id = auth.uid()::text 
      AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage routes" ON optimized_routes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE clerk_user_id = auth.uid()::text 
      AND role = 'admin'
    )
  );

-- Política para drivers (solo lectura de sus propias rutas)
CREATE POLICY "Drivers can view their routes" ON optimized_routes
  FOR SELECT USING (
    driver_id IN (
      SELECT id FROM drivers 
      WHERE email = (
        SELECT email FROM user_profiles 
        WHERE clerk_user_id = auth.uid()::text
      )
    )
  );

-- Grants de permisos
GRANT ALL ON drivers TO authenticated;
GRANT ALL ON optimized_routes TO authenticated;
GRANT USAGE ON SEQUENCE drivers_id_seq TO authenticated;
GRANT USAGE ON SEQUENCE optimized_routes_id_seq TO authenticated;
