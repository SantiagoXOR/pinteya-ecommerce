-- =====================================================
-- MIGRACIÓN: MÓDULO DE LOGÍSTICA ENTERPRISE
-- Fecha: 2 de Septiembre, 2025
-- Descripción: Implementación completa del sistema de logística
-- Basado en: Patrones Spree Commerce + WooCommerce
-- =====================================================

-- Crear enum para estados de envío
CREATE TYPE shipment_status_enum AS ENUM (
  'pending',
  'confirmed', 
  'picked_up',
  'in_transit',
  'out_for_delivery',
  'delivered',
  'exception',
  'cancelled',
  'returned'
);

-- Crear enum para servicios de envío
CREATE TYPE shipping_service_enum AS ENUM (
  'standard',
  'express',
  'next_day',
  'same_day'
);

-- =====================================================
-- TABLA: COURIERS (Proveedores de envío)
-- =====================================================
CREATE TABLE couriers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(20) UNIQUE NOT NULL,
  api_endpoint TEXT,
  api_key_encrypted TEXT,
  is_active BOOLEAN DEFAULT true,
  supported_services JSONB DEFAULT '[]'::jsonb,
  coverage_areas JSONB DEFAULT '[]'::jsonb,
  base_cost DECIMAL(10,2) DEFAULT 0,
  cost_per_kg DECIMAL(10,2) DEFAULT 0,
  free_shipping_threshold DECIMAL(10,2),
  max_weight_kg DECIMAL(8,2),
  max_dimensions_cm VARCHAR(50),
  logo_url TEXT,
  website_url TEXT,
  contact_phone VARCHAR(20),
  contact_email VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- TABLA: SHIPMENTS (Envíos)
-- =====================================================
CREATE TABLE shipments (
  id SERIAL PRIMARY KEY,
  shipment_number VARCHAR(20) UNIQUE NOT NULL,
  order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
  status shipment_status_enum DEFAULT 'pending',
  carrier_id INTEGER REFERENCES couriers(id),
  tracking_number VARCHAR(100),
  tracking_url TEXT,
  shipping_method VARCHAR(50),
  shipping_service shipping_service_enum DEFAULT 'standard',
  estimated_delivery_date DATE,
  actual_delivery_date DATE,
  shipping_cost DECIMAL(10,2) DEFAULT 0,
  insurance_cost DECIMAL(10,2) DEFAULT 0,
  total_cost DECIMAL(10,2) GENERATED ALWAYS AS (shipping_cost + insurance_cost) STORED,
  weight_kg DECIMAL(8,2),
  dimensions_cm VARCHAR(50), -- formato: "LxWxH"
  pickup_address JSONB,
  delivery_address JSONB NOT NULL,
  special_instructions TEXT,
  notes TEXT,
  admin_notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  confirmed_at TIMESTAMP,
  picked_up_at TIMESTAMP,
  shipped_at TIMESTAMP,
  delivered_at TIMESTAMP,
  cancelled_at TIMESTAMP
);

-- =====================================================
-- TABLA: TRACKING_EVENTS (Eventos de seguimiento)
-- =====================================================
CREATE TABLE tracking_events (
  id SERIAL PRIMARY KEY,
  shipment_id INTEGER REFERENCES shipments(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL,
  description TEXT NOT NULL,
  location VARCHAR(255),
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  occurred_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  external_event_id VARCHAR(100), -- ID del evento en el sistema del courier
  raw_data JSONB -- Datos completos del evento del courier
);

-- =====================================================
-- TABLA: SHIPMENT_ITEMS (Items por envío)
-- =====================================================
CREATE TABLE shipment_items (
  id SERIAL PRIMARY KEY,
  shipment_id INTEGER REFERENCES shipments(id) ON DELETE CASCADE,
  order_item_id INTEGER REFERENCES order_items(id),
  product_id INTEGER REFERENCES products(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  weight_kg DECIMAL(8,2),
  created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- ÍNDICES OPTIMIZADOS PARA PERFORMANCE
-- =====================================================

-- Índices para shipments
CREATE INDEX idx_shipments_order_id ON shipments(order_id);
CREATE INDEX idx_shipments_status ON shipments(status);
CREATE INDEX idx_shipments_carrier_id ON shipments(carrier_id);
CREATE INDEX idx_shipments_tracking_number ON shipments(tracking_number);
CREATE INDEX idx_shipments_created_at ON shipments(created_at DESC);
CREATE INDEX idx_shipments_delivery_date ON shipments(estimated_delivery_date);

-- Índices para tracking_events
CREATE INDEX idx_tracking_events_shipment_id ON tracking_events(shipment_id);
CREATE INDEX idx_tracking_events_occurred_at ON tracking_events(occurred_at DESC);
CREATE INDEX idx_tracking_events_status ON tracking_events(status);

-- Índices para couriers
CREATE INDEX idx_couriers_active ON couriers(is_active);
CREATE INDEX idx_couriers_code ON couriers(code);

-- Índices para shipment_items
CREATE INDEX idx_shipment_items_shipment_id ON shipment_items(shipment_id);
CREATE INDEX idx_shipment_items_order_item_id ON shipment_items(order_item_id);

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
CREATE TRIGGER update_couriers_updated_at 
  BEFORE UPDATE ON couriers 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shipments_updated_at 
  BEFORE UPDATE ON shipments 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FUNCIÓN PARA GENERAR SHIPMENT_NUMBER
-- =====================================================
CREATE OR REPLACE FUNCTION generate_shipment_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.shipment_number IS NULL THEN
    NEW.shipment_number := 'SH' || TO_CHAR(NOW(), 'YYYYMMDD') || LPAD(nextval('shipments_id_seq')::text, 6, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_shipment_number_trigger
  BEFORE INSERT ON shipments
  FOR EACH ROW EXECUTE FUNCTION generate_shipment_number();

-- =====================================================
-- DATOS INICIALES: COURIERS ARGENTINOS
-- =====================================================
INSERT INTO couriers (name, code, supported_services, coverage_areas, base_cost, cost_per_kg, free_shipping_threshold, max_weight_kg, contact_phone, contact_email) VALUES
('Correo Argentino', 'correo_argentino', 
 '["standard", "express"]', 
 '["CABA", "GBA", "Buenos Aires", "Córdoba", "Santa Fe", "Mendoza", "Tucumán", "Entre Ríos", "Salta", "Misiones", "Chaco", "Corrientes", "Santiago del Estero", "San Juan", "Jujuy", "Río Negro", "Neuquén", "Formosa", "Chubut", "San Luis", "Catamarca", "La Rioja", "La Pampa", "Santa Cruz", "Tierra del Fuego"]',
 150.00, 25.00, 5000.00, 30.0, '0800-444-4020', 'atencion@correoargentino.com.ar'),

('OCA', 'oca', 
 '["standard", "express", "next_day"]', 
 '["CABA", "GBA", "Buenos Aires", "Córdoba", "Santa Fe", "Mendoza", "Tucumán", "Entre Ríos", "Salta", "Misiones", "Chaco", "Corrientes", "Santiago del Estero", "San Juan", "Jujuy", "Río Negro", "Neuquén", "Formosa", "Chubut", "San Luis", "Catamarca", "La Rioja", "La Pampa"]',
 180.00, 30.00, 8000.00, 50.0, '0810-999-6222', 'contacto@oca.com.ar'),

('Andreani', 'andreani', 
 '["standard", "express"]', 
 '["CABA", "GBA", "Buenos Aires", "Córdoba", "Santa Fe", "Mendoza", "Tucumán", "Entre Ríos", "Salta", "Misiones", "Chaco", "Corrientes", "Santiago del Estero", "San Juan", "Jujuy", "Río Negro", "Neuquén"]',
 200.00, 35.00, 10000.00, 40.0, '0810-122-1111', 'info@andreani.com'),

('MercadoEnvíos', 'mercadoenvios', 
 '["standard", "express"]', 
 '["CABA", "GBA", "Buenos Aires", "Córdoba", "Santa Fe", "Mendoza"]',
 120.00, 20.00, 6000.00, 25.0, '0800-666-8300', 'soporte@mercadolibre.com.ar');

-- =====================================================
-- RLS POLICIES PARA SEGURIDAD
-- =====================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE couriers ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracking_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipment_items ENABLE ROW LEVEL SECURITY;

-- Políticas para administradores (acceso completo)
CREATE POLICY "Admin full access to couriers" ON couriers
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admin full access to shipments" ON shipments
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admin full access to tracking_events" ON tracking_events
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admin full access to shipment_items" ON shipment_items
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Políticas para usuarios autenticados (solo lectura)
CREATE POLICY "Authenticated users can view active couriers" ON couriers
  FOR SELECT USING (auth.role() = 'authenticated' AND is_active = true);

-- =====================================================
-- COMENTARIOS PARA DOCUMENTACIÓN
-- =====================================================
COMMENT ON TABLE couriers IS 'Proveedores de envío (Correo Argentino, OCA, Andreani, etc.)';
COMMENT ON TABLE shipments IS 'Envíos asociados a órdenes con tracking completo';
COMMENT ON TABLE tracking_events IS 'Eventos de seguimiento de envíos en tiempo real';
COMMENT ON TABLE shipment_items IS 'Items específicos incluidos en cada envío';

COMMENT ON COLUMN shipments.shipment_number IS 'Número único de envío generado automáticamente (formato: SHYYYYMMDDNNNNNN)';
COMMENT ON COLUMN shipments.dimensions_cm IS 'Dimensiones en formato "LxWxH" (ej: "30x20x15")';
COMMENT ON COLUMN tracking_events.raw_data IS 'Datos completos del evento del courier para debugging';
