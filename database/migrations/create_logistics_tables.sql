-- =====================================================
-- MIGRACIÓN: TABLAS PARA SISTEMA DE LOGÍSTICA AVANZADO
-- Descripción: Creación de tablas para rutas optimizadas y drivers
-- Fecha: 2024-01-15
-- =====================================================

-- Tabla de drivers/conductores
CREATE TABLE IF NOT EXISTS drivers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  email VARCHAR(255),
  vehicle_type VARCHAR(100) NOT NULL,
  license_plate VARCHAR(20) NOT NULL UNIQUE,
  license_number VARCHAR(50),
  status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'busy', 'offline')),
  current_location JSONB, -- {lat: number, lng: number}
  max_capacity INTEGER NOT NULL DEFAULT 10,
  hire_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de rutas optimizadas
CREATE TABLE IF NOT EXISTS optimized_routes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  shipments JSONB NOT NULL DEFAULT '[]', -- Array de shipments con toda su información
  total_distance DECIMAL(10,2) NOT NULL DEFAULT 0,
  estimated_time INTEGER NOT NULL DEFAULT 0, -- en minutos
  driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
  vehicle VARCHAR(100),
  status VARCHAR(20) DEFAULT 'planned' CHECK (status IN ('planned', 'active', 'completed')),
  start_location JSONB, -- {lat: number, lng: number}
  waypoints JSONB DEFAULT '[]', -- Array de coordenadas [{lat, lng}, ...]
  optimization_score INTEGER DEFAULT 0, -- Score de 0-100
  notes TEXT,
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

-- Índices para optimización
CREATE INDEX IF NOT EXISTS idx_drivers_status ON drivers(status);
CREATE INDEX IF NOT EXISTS idx_drivers_vehicle_type ON drivers(vehicle_type);
CREATE INDEX IF NOT EXISTS idx_optimized_routes_status ON optimized_routes(status);
CREATE INDEX IF NOT EXISTS idx_optimized_routes_driver_id ON optimized_routes(driver_id);
CREATE INDEX IF NOT EXISTS idx_optimized_routes_created_at ON optimized_routes(created_at);
CREATE INDEX IF NOT EXISTS idx_shipments_route_id ON shipments(route_id);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
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

-- Políticas RLS (Row Level Security)
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE optimized_routes ENABLE ROW LEVEL SECURITY;

-- Política para drivers: solo admins pueden acceder
CREATE POLICY "Admin access to drivers" ON drivers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.clerk_user_id = auth.jwt() ->> 'sub'
      AND user_profiles.role = 'admin'
    )
  );

-- Política para rutas optimizadas: solo admins pueden acceder
CREATE POLICY "Admin access to optimized_routes" ON optimized_routes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.clerk_user_id = auth.jwt() ->> 'sub'
      AND user_profiles.role = 'admin'
    )
  );

-- Insertar datos de ejemplo para drivers
INSERT INTO drivers (name, phone, email, vehicle_type, license_plate, max_capacity, status) VALUES
  ('Carlos Rodríguez', '+54 11 1234-5678', 'carlos@pinteya.com', 'Furgón', 'ABC123', 20, 'available'),
  ('María González', '+54 11 2345-6789', 'maria@pinteya.com', 'Camioneta', 'DEF456', 15, 'available'),
  ('Juan Pérez', '+54 11 3456-7890', 'juan@pinteya.com', 'Moto', 'GHI789', 5, 'available'),
  ('Ana Martínez', '+54 11 4567-8901', 'ana@pinteya.com', 'Furgón', 'JKL012', 25, 'busy'),
  ('Luis Fernández', '+54 11 5678-9012', 'luis@pinteya.com', 'Camión', 'MNO345', 50, 'available')
ON CONFLICT (license_plate) DO NOTHING;

-- Comentarios para documentación
COMMENT ON TABLE drivers IS 'Tabla de conductores/drivers para la flota propia';
COMMENT ON TABLE optimized_routes IS 'Tabla de rutas optimizadas para envíos diarios';
COMMENT ON COLUMN drivers.status IS 'Estado del driver: available, busy, offline';
COMMENT ON COLUMN drivers.current_location IS 'Ubicación actual del driver en formato {lat, lng}';
COMMENT ON COLUMN drivers.max_capacity IS 'Capacidad máxima de envíos que puede manejar';
COMMENT ON COLUMN optimized_routes.shipments IS 'Array JSON con información completa de los envíos';
COMMENT ON COLUMN optimized_routes.waypoints IS 'Array de coordenadas para la ruta optimizada';
COMMENT ON COLUMN optimized_routes.optimization_score IS 'Score de optimización de 0-100';

-- Verificar que las tablas se crearon correctamente
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name IN ('drivers', 'optimized_routes')
ORDER BY table_name, ordinal_position;
