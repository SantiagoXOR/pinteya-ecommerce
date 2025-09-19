-- =====================================================
-- SCRIPT DE CONFIGURACIÓN DE DATOS DE PRUEBA PARA DRIVERS
-- Sistema de Navegación GPS - Pinteya E-commerce
-- =====================================================

-- Insertar drivers de prueba
INSERT INTO drivers (
  id,
  name,
  email,
  phone,
  vehicle_type,
  license_plate,
  status,
  current_location,
  max_capacity,
  created_at,
  updated_at
) VALUES 
(
  'driver-carlos-001',
  'Carlos Rodríguez',
  'carlos@pinteya.com',
  '+54 11 1234-5678',
  'Van',
  'ABC123',
  'available',
  '{"lat": -34.6037, "lng": -58.3816, "timestamp": "2024-01-15T10:00:00.000Z"}',
  50.0,
  NOW(),
  NOW()
),
(
  'driver-maria-002',
  'María González',
  'maria@pinteya.com',
  '+54 11 2345-6789',
  'Camioneta',
  'DEF456',
  'available',
  '{"lat": -34.6118, "lng": -58.3960, "timestamp": "2024-01-15T10:00:00.000Z"}',
  30.0,
  NOW(),
  NOW()
),
(
  'driver-juan-003',
  'Juan Pérez',
  'juan@pinteya.com',
  '+54 11 3456-7890',
  'Moto',
  'GHI789',
  'available',
  '{"lat": -34.5875, "lng": -58.3974, "timestamp": "2024-01-15T10:00:00.000Z"}',
  15.0,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  phone = EXCLUDED.phone,
  vehicle_type = EXCLUDED.vehicle_type,
  license_plate = EXCLUDED.license_plate,
  status = EXCLUDED.status,
  current_location = EXCLUDED.current_location,
  max_capacity = EXCLUDED.max_capacity,
  updated_at = NOW();

-- Insertar rutas optimizadas de prueba para los drivers
INSERT INTO optimized_routes (
  id,
  name,
  driver_id,
  status,
  waypoints,
  shipments,
  total_distance,
  estimated_time,
  optimization_score,
  created_at,
  updated_at
) VALUES 
(
  'route-carlos-001',
  'Ruta Centro - Mañana',
  'driver-carlos-001',
  'planned',
  '[
    {"lat": -34.6037, "lng": -58.3816},
    {"lat": -34.6118, "lng": -58.3960},
    {"lat": -34.6033, "lng": -58.3817}
  ]',
  '[
    {
      "id": "shipment-001",
      "tracking_number": "TRK-001",
      "customer_name": "Ana Martínez",
      "customer_phone": "+54 11 4567-8901",
      "destination": {
        "address": "Av. Corrientes 1234",
        "city": "Buenos Aires",
        "postal_code": "1043",
        "coordinates": {"lat": -34.6037, "lng": -58.3816},
        "notes": "Timbre 2B"
      },
      "items": [
        {"name": "Pintura Látex Blanca 4L", "quantity": 2, "weight": 8.0}
      ],
      "status": "confirmed",
      "estimated_delivery_time": "09:00 - 12:00",
      "special_instructions": "Llamar antes de llegar",
      "requires_signature": true,
      "cash_on_delivery": 15000
    },
    {
      "id": "shipment-002",
      "tracking_number": "TRK-002",
      "customer_name": "Roberto Silva",
      "customer_phone": "+54 11 5678-9012",
      "destination": {
        "address": "Av. 9 de Julio 1500",
        "city": "Buenos Aires",
        "postal_code": "1049",
        "coordinates": {"lat": -34.6118, "lng": -58.3960}
      },
      "items": [
        {"name": "Rodillo Premium", "quantity": 1, "weight": 0.5},
        {"name": "Pincel Set x3", "quantity": 1, "weight": 0.3}
      ],
      "status": "confirmed",
      "estimated_delivery_time": "10:00 - 13:00",
      "requires_signature": false
    }
  ]',
  12.5,
  45,
  87,
  NOW(),
  NOW()
),
(
  'route-maria-002',
  'Ruta Zona Norte',
  'driver-maria-002',
  'planned',
  '[
    {"lat": -34.6118, "lng": -58.3960},
    {"lat": -34.5875, "lng": -58.3974},
    {"lat": -34.5800, "lng": -58.4000}
  ]',
  '[
    {
      "id": "shipment-003",
      "tracking_number": "TRK-003",
      "customer_name": "Laura Fernández",
      "customer_phone": "+54 11 6789-0123",
      "destination": {
        "address": "Av. Santa Fe 2800",
        "city": "Buenos Aires",
        "postal_code": "1425",
        "coordinates": {"lat": -34.5875, "lng": -58.3974}
      },
      "items": [
        {"name": "Pintura Esmalte Azul 1L", "quantity": 3, "weight": 3.0}
      ],
      "status": "confirmed",
      "estimated_delivery_time": "14:00 - 17:00",
      "special_instructions": "Portero en planta baja",
      "requires_signature": true
    }
  ]',
  8.2,
  30,
  92,
  NOW(),
  NOW()
),
(
  'route-juan-003',
  'Ruta Express Microcentro',
  'driver-juan-003',
  'active',
  '[
    {"lat": -34.5875, "lng": -58.3974},
    {"lat": -34.6033, "lng": -58.3817}
  ]',
  '[
    {
      "id": "shipment-004",
      "tracking_number": "TRK-004",
      "customer_name": "Diego Morales",
      "customer_phone": "+54 11 7890-1234",
      "destination": {
        "address": "Florida 500",
        "city": "Buenos Aires",
        "postal_code": "1005",
        "coordinates": {"lat": -34.6033, "lng": -58.3817}
      },
      "items": [
        {"name": "Spray Antióxido", "quantity": 2, "weight": 1.0}
      ],
      "status": "in_transit",
      "estimated_delivery_time": "15:00 - 18:00",
      "requires_signature": false,
      "cash_on_delivery": 8500
    }
  ]',
  5.1,
  20,
  95,
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  driver_id = EXCLUDED.driver_id,
  status = EXCLUDED.status,
  waypoints = EXCLUDED.waypoints,
  shipments = EXCLUDED.shipments,
  total_distance = EXCLUDED.total_distance,
  estimated_time = EXCLUDED.estimated_time,
  optimization_score = EXCLUDED.optimization_score,
  updated_at = NOW();

-- Crear tabla de historial de ubicaciones si no existe
CREATE TABLE IF NOT EXISTS driver_location_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  driver_id TEXT NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  location JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_driver_location_history_driver_id 
ON driver_location_history(driver_id);

CREATE INDEX IF NOT EXISTS idx_driver_location_history_created_at 
ON driver_location_history(created_at);

CREATE INDEX IF NOT EXISTS idx_drivers_email 
ON drivers(email);

CREATE INDEX IF NOT EXISTS idx_drivers_status 
ON drivers(status);

CREATE INDEX IF NOT EXISTS idx_optimized_routes_driver_id 
ON optimized_routes(driver_id);

CREATE INDEX IF NOT EXISTS idx_optimized_routes_status 
ON optimized_routes(status);

-- Insertar algunos registros de historial de ubicaciones
INSERT INTO driver_location_history (driver_id, location) VALUES
('driver-carlos-001', '{"lat": -34.6037, "lng": -58.3816, "timestamp": "2024-01-15T09:00:00.000Z", "speed": 0, "heading": 0, "accuracy": 5}'),
('driver-carlos-001', '{"lat": -34.6040, "lng": -58.3820, "timestamp": "2024-01-15T09:05:00.000Z", "speed": 25, "heading": 45, "accuracy": 3}'),
('driver-maria-002', '{"lat": -34.6118, "lng": -58.3960, "timestamp": "2024-01-15T09:00:00.000Z", "speed": 0, "heading": 0, "accuracy": 4}'),
('driver-juan-003', '{"lat": -34.5875, "lng": -58.3974, "timestamp": "2024-01-15T09:00:00.000Z", "speed": 35, "heading": 180, "accuracy": 2}');

-- Verificar que los datos se insertaron correctamente
SELECT 
  d.name,
  d.email,
  d.vehicle_type,
  d.status,
  COUNT(r.id) as assigned_routes
FROM drivers d
LEFT JOIN optimized_routes r ON d.id = r.driver_id
GROUP BY d.id, d.name, d.email, d.vehicle_type, d.status
ORDER BY d.name;
