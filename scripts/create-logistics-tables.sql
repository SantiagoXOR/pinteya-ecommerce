-- =====================================================
-- SCRIPT: CREACIÓN DE TABLAS DE LOGÍSTICA
-- Descripción: Tablas para sistema de logística enterprise
-- Incluye: Carriers, Shipments, Tracking, Items
-- =====================================================

-- Tabla de Carriers/Couriers
CREATE TABLE IF NOT EXISTS couriers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  logo_url TEXT,
  contact_email VARCHAR(255),
  contact_phone VARCHAR(50),
  website_url TEXT,
  is_active BOOLEAN DEFAULT true,
  services JSONB DEFAULT '[]'::jsonb,
  pricing_config JSONB DEFAULT '{}'::jsonb,
  api_config JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de Envíos
CREATE TABLE IF NOT EXISTS shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_number VARCHAR(100) UNIQUE NOT NULL,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'pending',
  carrier_id INTEGER REFERENCES couriers(id),
  shipping_service VARCHAR(100),
  tracking_number VARCHAR(255),
  
  -- Direcciones
  pickup_address JSONB,
  delivery_address JSONB NOT NULL,
  
  -- Detalles físicos
  weight_kg DECIMAL(10,3),
  dimensions_cm VARCHAR(100),
  declared_value DECIMAL(12,2),
  
  -- Fechas
  estimated_pickup_date TIMESTAMP WITH TIME ZONE,
  estimated_delivery_date TIMESTAMP WITH TIME ZONE,
  actual_pickup_date TIMESTAMP WITH TIME ZONE,
  actual_delivery_date TIMESTAMP WITH TIME ZONE,
  
  -- Costos
  shipping_cost DECIMAL(12,2),
  insurance_cost DECIMAL(12,2),
  total_cost DECIMAL(12,2),
  
  -- Notas e instrucciones
  special_instructions TEXT,
  notes TEXT,
  
  -- Metadatos
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de Items de Envío
CREATE TABLE IF NOT EXISTS shipment_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id UUID NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
  order_item_id UUID NOT NULL REFERENCES order_items(id),
  product_id INTEGER NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  weight_kg DECIMAL(10,3),
  dimensions_cm VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de Eventos de Tracking
CREATE TABLE IF NOT EXISTS tracking_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id UUID NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL,
  description TEXT NOT NULL,
  location VARCHAR(255),
  coordinates POINT,
  occurred_at TIMESTAMP WITH TIME ZONE NOT NULL,
  source VARCHAR(50) DEFAULT 'manual', -- manual, api, webhook
  raw_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de Configuración de Zonas de Envío
CREATE TABLE IF NOT EXISTS shipping_zones (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  countries JSONB DEFAULT '[]'::jsonb,
  states JSONB DEFAULT '[]'::jsonb,
  cities JSONB DEFAULT '[]'::jsonb,
  zip_codes JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de Tarifas de Envío
CREATE TABLE IF NOT EXISTS shipping_rates (
  id SERIAL PRIMARY KEY,
  zone_id INTEGER REFERENCES shipping_zones(id),
  carrier_id INTEGER REFERENCES couriers(id),
  service_type VARCHAR(100),
  weight_from_kg DECIMAL(10,3) DEFAULT 0,
  weight_to_kg DECIMAL(10,3),
  base_cost DECIMAL(12,2) NOT NULL,
  cost_per_kg DECIMAL(12,2) DEFAULT 0,
  cost_per_km DECIMAL(12,2) DEFAULT 0,
  min_cost DECIMAL(12,2),
  max_cost DECIMAL(12,2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índices para shipments
CREATE INDEX IF NOT EXISTS idx_shipments_order_id ON shipments(order_id);
CREATE INDEX IF NOT EXISTS idx_shipments_carrier_id ON shipments(carrier_id);
CREATE INDEX IF NOT EXISTS idx_shipments_status ON shipments(status);
CREATE INDEX IF NOT EXISTS idx_shipments_tracking_number ON shipments(tracking_number);
CREATE INDEX IF NOT EXISTS idx_shipments_created_at ON shipments(created_at);

-- Índices para shipment_items
CREATE INDEX IF NOT EXISTS idx_shipment_items_shipment_id ON shipment_items(shipment_id);
CREATE INDEX IF NOT EXISTS idx_shipment_items_order_item_id ON shipment_items(order_item_id);
CREATE INDEX IF NOT EXISTS idx_shipment_items_product_id ON shipment_items(product_id);

-- Índices para tracking_events
CREATE INDEX IF NOT EXISTS idx_tracking_events_shipment_id ON tracking_events(shipment_id);
CREATE INDEX IF NOT EXISTS idx_tracking_events_status ON tracking_events(status);
CREATE INDEX IF NOT EXISTS idx_tracking_events_occurred_at ON tracking_events(occurred_at);

-- Índices para couriers
CREATE INDEX IF NOT EXISTS idx_couriers_code ON couriers(code);
CREATE INDEX IF NOT EXISTS idx_couriers_is_active ON couriers(is_active);

-- =====================================================
-- TRIGGERS PARA UPDATED_AT
-- =====================================================

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
CREATE TRIGGER update_couriers_updated_at BEFORE UPDATE ON couriers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_shipments_updated_at BEFORE UPDATE ON shipments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_shipping_zones_updated_at BEFORE UPDATE ON shipping_zones FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_shipping_rates_updated_at BEFORE UPDATE ON shipping_rates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- DATOS INICIALES - CARRIERS
-- =====================================================

INSERT INTO couriers (name, code, logo_url, contact_email, services, is_active) VALUES
('OCA', 'OCA', 'https://www.oca.com.ar/images/logo.png', 'info@oca.com.ar', '["standard", "express", "next_day"]', true),
('Andreani', 'ANDREANI', 'https://www.andreani.com/images/logo.png', 'info@andreani.com', '["standard", "express", "sucursal"]', true),
('Correo Argentino', 'CORREO_AR', 'https://www.correoargentino.com.ar/images/logo.png', 'info@correoargentino.com.ar', '["standard", "express"]', true),
('MercadoEnvíos', 'MELI', 'https://http2.mlstatic.com/frontend-assets/ui-navigation/5.18.9/mercadolibre/logo__large_plus.png', 'envios@mercadolibre.com.ar', '["flex", "full"]', true),
('Cruz del Sur', 'CDS', null, 'info@cruzdelsur.com.ar', '["standard"]', true)
ON CONFLICT (code) DO NOTHING;

-- =====================================================
-- DATOS INICIALES - ZONAS DE ENVÍO
-- =====================================================

INSERT INTO shipping_zones (name, description, countries, states, cities) VALUES
('CABA', 'Ciudad Autónoma de Buenos Aires', '["Argentina"]', '["CABA"]', '[]'),
('GBA', 'Gran Buenos Aires', '["Argentina"]', '["Buenos Aires"]', '["La Plata", "Quilmes", "Avellaneda", "Lanús", "San Isidro"]'),
('Interior Buenos Aires', 'Interior de Buenos Aires', '["Argentina"]', '["Buenos Aires"]', '[]'),
('Córdoba', 'Provincia de Córdoba', '["Argentina"]', '["Córdoba"]', '[]'),
('Santa Fe', 'Provincia de Santa Fe', '["Argentina"]', '["Santa Fe"]', '[]'),
('Resto del País', 'Resto de Argentina', '["Argentina"]', '[]', '[]')
ON CONFLICT DO NOTHING;

-- =====================================================
-- DATOS INICIALES - TARIFAS BÁSICAS
-- =====================================================

-- Tarifas para OCA
INSERT INTO shipping_rates (zone_id, carrier_id, service_type, weight_to_kg, base_cost, cost_per_kg) VALUES
(1, 1, 'standard', 5.0, 800.00, 150.00),
(1, 1, 'express', 5.0, 1200.00, 200.00),
(2, 1, 'standard', 5.0, 1000.00, 180.00),
(2, 1, 'express', 5.0, 1500.00, 250.00),
(6, 1, 'standard', 5.0, 1500.00, 300.00)
ON CONFLICT DO NOTHING;

-- Tarifas para Andreani
INSERT INTO shipping_rates (zone_id, carrier_id, service_type, weight_to_kg, base_cost, cost_per_kg) VALUES
(1, 2, 'standard', 5.0, 750.00, 140.00),
(1, 2, 'express', 5.0, 1100.00, 190.00),
(2, 2, 'standard', 5.0, 950.00, 170.00),
(2, 2, 'express', 5.0, 1400.00, 240.00),
(6, 2, 'standard', 5.0, 1400.00, 280.00)
ON CONFLICT DO NOTHING;

-- =====================================================
-- POLÍTICAS RLS (ROW LEVEL SECURITY)
-- =====================================================

-- Habilitar RLS en las tablas principales
ALTER TABLE couriers ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipment_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracking_events ENABLE ROW LEVEL SECURITY;

-- Políticas para couriers (lectura pública, escritura admin)
CREATE POLICY "Couriers are viewable by everyone" ON couriers FOR SELECT USING (true);
CREATE POLICY "Couriers are editable by authenticated users" ON couriers FOR ALL USING (auth.role() = 'authenticated');

-- Políticas para shipments (acceso basado en orden)
CREATE POLICY "Shipments are viewable by order owner or admin" ON shipments FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM orders 
    WHERE orders.id = shipments.order_id 
    AND (orders.user_id = auth.uid() OR auth.role() = 'service_role')
  )
);

CREATE POLICY "Shipments are editable by admin" ON shipments FOR ALL USING (auth.role() = 'service_role');

-- Políticas similares para shipment_items y tracking_events
CREATE POLICY "Shipment items are viewable by shipment owner" ON shipment_items FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM shipments s
    JOIN orders o ON o.id = s.order_id
    WHERE s.id = shipment_items.shipment_id 
    AND (o.user_id = auth.uid() OR auth.role() = 'service_role')
  )
);

CREATE POLICY "Tracking events are viewable by shipment owner" ON tracking_events FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM shipments s
    JOIN orders o ON o.id = s.order_id
    WHERE s.id = tracking_events.shipment_id 
    AND (o.user_id = auth.uid() OR auth.role() = 'service_role')
  )
);

-- =====================================================
-- COMENTARIOS PARA DOCUMENTACIÓN
-- =====================================================

COMMENT ON TABLE couriers IS 'Empresas de transporte y logística';
COMMENT ON TABLE shipments IS 'Envíos creados desde órdenes';
COMMENT ON TABLE shipment_items IS 'Items específicos incluidos en cada envío';
COMMENT ON TABLE tracking_events IS 'Eventos de seguimiento de envíos';
COMMENT ON TABLE shipping_zones IS 'Zonas geográficas para cálculo de tarifas';
COMMENT ON TABLE shipping_rates IS 'Tarifas de envío por zona y carrier';

COMMENT ON COLUMN shipments.status IS 'Estados: pending, confirmed, picked_up, in_transit, out_for_delivery, delivered, exception, cancelled';
COMMENT ON COLUMN tracking_events.source IS 'Origen del evento: manual, api, webhook';
COMMENT ON COLUMN couriers.services IS 'Array de servicios disponibles: ["standard", "express", "next_day"]';
