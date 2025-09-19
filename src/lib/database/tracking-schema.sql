-- Schema para el sistema de tracking GPS de drivers
-- Incluye tablas para ubicaciones, historial y notificaciones

-- Tabla para drivers (si no existe)
CREATE TABLE IF NOT EXISTS drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  license_number TEXT,
  vehicle_type TEXT DEFAULT 'car',
  vehicle_plate TEXT,
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'busy', 'offline', 'suspended')),
  rating DECIMAL(3,2) DEFAULT 5.00,
  total_deliveries INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla para ubicaciones actuales de drivers
CREATE TABLE IF NOT EXISTS driver_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  speed DECIMAL(5, 2) DEFAULT 0, -- km/h
  heading DECIMAL(5, 2) DEFAULT 0, -- grados (0-360)
  accuracy DECIMAL(6, 2) DEFAULT 0, -- metros
  status TEXT DEFAULT 'en_route' CHECK (status IN ('en_route', 'arrived', 'delayed', 'offline')),
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Índices para consultas eficientes
  UNIQUE(driver_id, order_id)
);

-- Tabla para historial de tracking
CREATE TABLE IF NOT EXISTS tracking_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  speed DECIMAL(5, 2) DEFAULT 0,
  heading DECIMAL(5, 2) DEFAULT 0,
  accuracy DECIMAL(6, 2) DEFAULT 0,
  status TEXT DEFAULT 'en_route' CHECK (status IN ('en_route', 'arrived', 'delayed', 'offline')),
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla para notificaciones
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info' CHECK (type IN ('info', 'warning', 'error', 'success', 'delivery_update')),
  data JSONB DEFAULT '{}',
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla para métricas de delivery
CREATE TABLE IF NOT EXISTS delivery_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  total_distance DECIMAL(8, 2), -- kilómetros
  total_duration INTEGER, -- segundos
  average_speed DECIMAL(5, 2), -- km/h
  max_speed DECIMAL(5, 2), -- km/h
  route_deviations INTEGER DEFAULT 0,
  traffic_delays INTEGER DEFAULT 0, -- minutos
  fuel_efficiency DECIMAL(5, 2), -- km/l (opcional)
  customer_rating INTEGER CHECK (customer_rating >= 1 AND customer_rating <= 5),
  delivery_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_driver_locations_driver_id ON driver_locations(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_locations_order_id ON driver_locations(order_id);
CREATE INDEX IF NOT EXISTS idx_driver_locations_timestamp ON driver_locations(timestamp);

CREATE INDEX IF NOT EXISTS idx_tracking_history_driver_id ON tracking_history(driver_id);
CREATE INDEX IF NOT EXISTS idx_tracking_history_order_id ON tracking_history(order_id);
CREATE INDEX IF NOT EXISTS idx_tracking_history_timestamp ON tracking_history(timestamp);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

CREATE INDEX IF NOT EXISTS idx_delivery_metrics_driver_id ON delivery_metrics(driver_id);
CREATE INDEX IF NOT EXISTS idx_delivery_metrics_order_id ON delivery_metrics(order_id);
CREATE INDEX IF NOT EXISTS idx_delivery_metrics_start_time ON delivery_metrics(start_time);

-- Función para actualizar timestamp automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para actualizar updated_at automáticamente
CREATE TRIGGER update_drivers_updated_at BEFORE UPDATE ON drivers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_driver_locations_updated_at BEFORE UPDATE ON driver_locations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON notifications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Función para limpiar historial antiguo (opcional)
CREATE OR REPLACE FUNCTION cleanup_old_tracking_data()
RETURNS void AS $$
BEGIN
    -- Eliminar registros de tracking_history más antiguos que 30 días
    DELETE FROM tracking_history 
    WHERE created_at < NOW() - INTERVAL '30 days';
    
    -- Eliminar notificaciones leídas más antiguas que 7 días
    DELETE FROM notifications 
    WHERE read = TRUE AND created_at < NOW() - INTERVAL '7 days';
END;
$$ language 'plpgsql';

-- Políticas de seguridad RLS (Row Level Security)
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracking_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_metrics ENABLE ROW LEVEL SECURITY;

-- Política para drivers: solo pueden ver/editar sus propios datos
CREATE POLICY "Drivers can view own data" ON drivers
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Drivers can update own data" ON drivers
    FOR UPDATE USING (auth.uid()::text = user_id);

-- Política para ubicaciones: drivers solo pueden ver/editar sus ubicaciones
CREATE POLICY "Drivers can manage own locations" ON driver_locations
    FOR ALL USING (
        driver_id IN (
            SELECT id FROM drivers WHERE user_id = auth.uid()::text
        )
    );

-- Política para historial: drivers pueden ver su historial, admins pueden ver todo
CREATE POLICY "Drivers can view own tracking history" ON tracking_history
    FOR SELECT USING (
        driver_id IN (
            SELECT id FROM drivers WHERE user_id = auth.uid()::text
        )
        OR EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid()::text AND role = 'admin'
        )
    );

-- Política para notificaciones: usuarios solo pueden ver sus notificaciones
CREATE POLICY "Users can view own notifications" ON notifications
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can update own notifications" ON notifications
    FOR UPDATE USING (auth.uid()::text = user_id);

-- Política para métricas: drivers pueden ver sus métricas, admins pueden ver todo
CREATE POLICY "Drivers can view own metrics" ON delivery_metrics
    FOR SELECT USING (
        driver_id IN (
            SELECT id FROM drivers WHERE user_id = auth.uid()::text
        )
        OR EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid()::text AND role = 'admin'
        )
    );

-- Insertar drivers de prueba si no existen
INSERT INTO drivers (user_id, name, email, phone, license_number, vehicle_type, vehicle_plate)
VALUES 
    ('carlos-driver-uuid', 'Carlos Rodríguez', 'carlos@pinteya.com', '+54 11 1234-5678', 'B12345678', 'car', 'ABC123'),
    ('maria-driver-uuid', 'María González', 'maria@pinteya.com', '+54 11 2345-6789', 'B23456789', 'motorcycle', 'DEF456'),
    ('juan-driver-uuid', 'Juan Pérez', 'juan@pinteya.com', '+54 11 3456-7890', 'B34567890', 'car', 'GHI789')
ON CONFLICT (user_id) DO NOTHING;

-- Comentarios para documentación
COMMENT ON TABLE drivers IS 'Información de drivers registrados en el sistema';
COMMENT ON TABLE driver_locations IS 'Ubicaciones actuales de drivers durante entregas';
COMMENT ON TABLE tracking_history IS 'Historial completo de ubicaciones para análisis y auditoría';
COMMENT ON TABLE notifications IS 'Sistema de notificaciones para usuarios y drivers';
COMMENT ON TABLE delivery_metrics IS 'Métricas de rendimiento y eficiencia de entregas';

COMMENT ON COLUMN driver_locations.accuracy IS 'Precisión del GPS en metros';
COMMENT ON COLUMN driver_locations.heading IS 'Dirección del movimiento en grados (0-360)';
COMMENT ON COLUMN tracking_history.timestamp IS 'Momento exacto de la ubicación registrada';
COMMENT ON COLUMN delivery_metrics.route_deviations IS 'Número de veces que el driver se desvió de la ruta planificada';
COMMENT ON COLUMN delivery_metrics.traffic_delays IS 'Tiempo total de demoras por tráfico en minutos';
