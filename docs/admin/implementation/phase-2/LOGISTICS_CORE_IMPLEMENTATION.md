# 🚚 Fase 2: Implementación del Sistema de Logística Core

**Duración:** 3 semanas  
**Prioridad:** 🔥 Alta  
**Dependencias:** Panel de Órdenes Básico completado  
**Estado:** 🔄 Pendiente  

---

## 🎯 **OBJETIVOS DE LA FASE**

Desarrollar un sistema completo de logística que permita gestionar envíos, tracking y estados de despacho integrado con el sistema de órdenes existente.

### **Entregables Principales**
- ✅ Panel `/admin/logistics` completo
- ✅ Sistema de gestión de envíos
- ✅ Tracking básico de paquetes
- ✅ Estados de despacho automatizados
- ✅ Integración con sistema de órdenes
- ✅ APIs de logística completas
- ✅ Reportes básicos de logística

---

## 🏗️ **ARQUITECTURA TÉCNICA**

### **Esquema de Base de Datos**

#### **Tabla Shipments (Nueva)**
```sql
CREATE TABLE shipments (
  id SERIAL PRIMARY KEY,
  shipment_number VARCHAR(20) UNIQUE NOT NULL,
  order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending',
  carrier VARCHAR(50),
  tracking_number VARCHAR(100),
  tracking_url TEXT,
  shipping_method VARCHAR(50),
  estimated_delivery_date DATE,
  actual_delivery_date DATE,
  shipping_cost DECIMAL(10,2) DEFAULT 0,
  weight_kg DECIMAL(8,2),
  dimensions_cm VARCHAR(50), -- "30x20x15"
  pickup_address JSONB,
  delivery_address JSONB NOT NULL,
  notes TEXT,
  admin_notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  shipped_at TIMESTAMP,
  delivered_at TIMESTAMP
);

-- Índices para performance
CREATE INDEX idx_shipments_order_id ON shipments(order_id);
CREATE INDEX idx_shipments_status ON shipments(status);
CREATE INDEX idx_shipments_tracking_number ON shipments(tracking_number);
CREATE INDEX idx_shipments_created_at ON shipments(created_at);
```

#### **Tabla Shipment Items (Nueva)**
```sql
CREATE TABLE shipment_items (
  id SERIAL PRIMARY KEY,
  shipment_id INTEGER REFERENCES shipments(id) ON DELETE CASCADE,
  order_item_id INTEGER REFERENCES order_items(id),
  product_id INTEGER REFERENCES products(id),
  product_name VARCHAR(255) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  weight_kg DECIMAL(8,2),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_shipment_items_shipment_id ON shipment_items(shipment_id);
CREATE INDEX idx_shipment_items_order_item_id ON shipment_items(order_item_id);
```

#### **Tabla Tracking Events (Nueva)**
```sql
CREATE TABLE tracking_events (
  id SERIAL PRIMARY KEY,
  shipment_id INTEGER REFERENCES shipments(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL, -- 'created', 'picked_up', 'in_transit', 'delivered', 'exception'
  event_description TEXT NOT NULL,
  event_location VARCHAR(255),
  event_date TIMESTAMP NOT NULL,
  carrier_event_id VARCHAR(100),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_tracking_events_shipment_id ON tracking_events(shipment_id);
CREATE INDEX idx_tracking_events_event_date ON tracking_events(event_date);
```

#### **Tabla Couriers (Nueva)**
```sql
CREATE TABLE couriers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(20) UNIQUE NOT NULL, -- 'correo_argentino', 'oca', 'andreani'
  api_endpoint TEXT,
  api_key_encrypted TEXT,
  is_active BOOLEAN DEFAULT true,
  supported_services JSONB, -- ['standard', 'express', 'next_day']
  coverage_areas JSONB, -- ['CABA', 'GBA', 'Interior']
  base_cost DECIMAL(10,2) DEFAULT 0,
  cost_per_kg DECIMAL(10,2) DEFAULT 0,
  free_shipping_threshold DECIMAL(10,2),
  max_weight_kg DECIMAL(8,2),
  max_dimensions_cm VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Datos iniciales de couriers argentinos
INSERT INTO couriers (name, code, supported_services, coverage_areas) VALUES
('Correo Argentino', 'correo_argentino', '["standard", "express"]', '["CABA", "GBA", "Interior"]'),
('OCA', 'oca', '["standard", "express", "next_day"]', '["CABA", "GBA", "Interior"]'),
('Andreani', 'andreani', '["standard", "express"]', '["CABA", "GBA", "Interior"]'),
('MercadoEnvíos', 'mercadoenvios', '["standard", "express"]', '["CABA", "GBA"]');
```

### **APIs a Implementar**

#### **1. API de Logística Dashboard**
```typescript
// src/app/api/admin/logistics/route.ts

// GET /api/admin/logistics - Dashboard principal
interface LogisticsDashboardResponse {
  data: {
    stats: {
      total_shipments: number;
      pending_shipments: number;
      in_transit_shipments: number;
      delivered_shipments: number;
      average_delivery_time: number; // días
      on_time_delivery_rate: number; // porcentaje
    };
    recent_shipments: Shipment[];
    alerts: LogisticsAlert[];
    performance_metrics: {
      daily_shipments: Array<{ date: string; count: number }>;
      carrier_performance: Array<{ carrier: string; on_time_rate: number }>;
    };
  };
}
```

#### **2. API de Envíos**
```typescript
// src/app/api/admin/logistics/shipments/route.ts

// GET /api/admin/logistics/shipments - Lista de envíos
interface GetShipmentsRequest {
  page?: number;
  limit?: number;
  status?: ShipmentStatus;
  carrier?: string;
  date_from?: string;
  date_to?: string;
  search?: string; // tracking_number, order_id
}

// POST /api/admin/logistics/shipments - Crear envío
interface CreateShipmentRequest {
  order_id: number;
  carrier: string;
  shipping_method: string;
  items: Array<{
    order_item_id: number;
    quantity: number;
  }>;
  pickup_address?: Address;
  delivery_address: Address;
  weight_kg?: number;
  dimensions_cm?: string;
  notes?: string;
}
```

#### **3. API de Tracking**
```typescript
// src/app/api/admin/logistics/tracking/[trackingNumber]/route.ts

// GET /api/admin/logistics/tracking/[trackingNumber] - Info de tracking
interface TrackingResponse {
  data: {
    shipment: Shipment;
    events: TrackingEvent[];
    current_status: string;
    estimated_delivery: string;
    last_update: string;
  };
}

// POST /api/admin/logistics/tracking/sync - Sincronizar con courier
interface SyncTrackingRequest {
  shipment_ids?: number[];
  carrier?: string;
  force_update?: boolean;
}
```

#### **4. API de Couriers**
```typescript
// src/app/api/admin/logistics/couriers/route.ts

// GET /api/admin/logistics/couriers - Lista de couriers
// POST /api/admin/logistics/couriers - Agregar courier
// PUT /api/admin/logistics/couriers/[id] - Actualizar courier

// GET /api/admin/logistics/couriers/[id]/quote - Cotizar envío
interface ShippingQuoteRequest {
  origin_postal_code: string;
  destination_postal_code: string;
  weight_kg: number;
  dimensions_cm: string;
  declared_value: number;
  service_type: string;
}
```

### **Componentes a Desarrollar**

#### **1. LogisticsDashboard Component**
```typescript
// src/app/admin/logistics/page.tsx

// Características:
// - Métricas en tiempo real
// - Gráficos de performance
// - Lista de envíos recientes
// - Alertas y notificaciones
// - Accesos rápidos a funciones
// - Resumen de couriers
```

#### **2. ShipmentList Component**
```typescript
// src/components/admin/logistics/ShipmentList.tsx

interface ShipmentListProps {
  filters?: ShipmentFilters;
  onShipmentSelect?: (shipment: Shipment) => void;
}

// Características:
// - Tabla responsive con filtros
// - Estados visuales con badges
// - Acciones rápidas (tracking, editar)
// - Búsqueda por tracking number
// - Exportación de datos
// - Acciones masivas
```

#### **3. ShipmentDetail Component**
```typescript
// src/components/admin/logistics/ShipmentDetail.tsx

interface ShipmentDetailProps {
  shipmentId: number;
  onUpdate?: (shipment: Shipment) => void;
}

// Características:
// - Información completa del envío
// - Timeline de tracking
// - Mapa de ubicación (opcional)
// - Gestión de estados
// - Notas administrativas
// - Documentos de envío
// - Comunicación con cliente
```

#### **4. CreateShipment Component**
```typescript
// src/components/admin/logistics/CreateShipment.tsx

interface CreateShipmentProps {
  orderId?: number;
  onShipmentCreated?: (shipment: Shipment) => void;
}

// Características:
// - Formulario paso a paso
// - Selección de courier
// - Cotización automática
// - Validación de direcciones
// - Cálculo de peso/dimensiones
// - Preview de etiqueta
```

#### **5. TrackingTimeline Component**
```typescript
// src/components/admin/logistics/TrackingTimeline.tsx

interface TrackingTimelineProps {
  shipmentId: number;
  events: TrackingEvent[];
  realTime?: boolean;
}

// Características:
// - Timeline visual de eventos
// - Estados con iconos
// - Actualización en tiempo real
// - Detalles expandibles
// - Estimaciones de entrega
// - Alertas de problemas
```

---

## 📋 **PLAN DE IMPLEMENTACIÓN DETALLADO**

### **Semana 1: Base de Datos y APIs Core**

#### **Día 1-2: Esquema de Base de Datos**
```bash
# Tareas específicas:
1. Crear tablas de logística
   - shipments, shipment_items
   - tracking_events, couriers
   - Índices optimizados
   - Relaciones FK

2. Funciones SQL de logística
   - get_logistics_stats()
   - update_shipment_status()
   - sync_tracking_events()
   - calculate_delivery_metrics()

3. Poblar datos iniciales
   - Couriers argentinos
   - Métodos de envío
   - Zonas de cobertura
```

#### **Día 3-4: APIs de Logística**
```bash
# Tareas específicas:
1. API Dashboard de logística
   - Métricas en tiempo real
   - Estadísticas de performance
   - Alertas automáticas

2. API de gestión de envíos
   - CRUD completo
   - Filtros avanzados
   - Integración con órdenes

3. API de tracking
   - Consulta de estados
   - Sincronización con couriers
   - Eventos automáticos
```

#### **Día 5: Testing de APIs**
```bash
# Tareas específicas:
1. Tests unitarios de APIs
2. Tests de integración
3. Tests de performance
4. Validación de datos
```

### **Semana 2: Frontend Core**

#### **Día 6-7: Dashboard de Logística**
```bash
# Tareas específicas:
1. Layout principal del dashboard
   - Métricas visuales
   - Gráficos de performance
   - Navegación intuitiva

2. Componentes de métricas
   - Cards de estadísticas
   - Gráficos con Chart.js
   - Indicadores de performance

3. Integración con APIs
   - Fetch de datos en tiempo real
   - Cache inteligente
   - Error handling
```

#### **Día 8-9: Gestión de Envíos**
```bash
# Tareas específicas:
1. ShipmentList component
   - Tabla responsive
   - Filtros avanzados
   - Estados visuales
   - Acciones rápidas

2. ShipmentDetail component
   - Vista completa de envío
   - Timeline de tracking
   - Gestión de estados
   - Notas administrativas

3. CreateShipment component
   - Formulario paso a paso
   - Validaciones
   - Cotización automática
```

#### **Día 10: Tracking y Timeline**
```bash
# Tareas específicas:
1. TrackingTimeline component
   - Timeline visual
   - Estados con iconos
   - Detalles expandibles

2. Integración completa
   - Navegación entre componentes
   - Estados compartidos
   - Sincronización de datos
```

### **Semana 3: Funcionalidades Avanzadas**

#### **Día 11-12: Sistema de Couriers**
```bash
# Tareas específicas:
1. Gestión de couriers
   - CRUD de couriers
   - Configuración de servicios
   - Zonas de cobertura

2. Sistema de cotizaciones
   - Integración con APIs externas
   - Comparación de precios
   - Selección automática
```

#### **Día 13-14: Reportes y Analytics**
```bash
# Tareas específicas:
1. Reportes de logística
   - Performance de couriers
   - Métricas de entrega
   - Costos de envío

2. Dashboard de analytics
   - Gráficos interactivos
   - Filtros temporales
   - Exportación de datos
```

#### **Día 15: Testing e Integración**
```bash
# Tareas específicas:
1. Testing completo del módulo
2. Integración con sistema de órdenes
3. Testing E2E
4. Optimización de performance
5. Documentación de uso
```

---

## 🧪 **ESTRATEGIA DE TESTING**

### **Unit Tests**
```typescript
describe('LogisticsDashboard', () => {
  it('should display logistics metrics', () => {});
  it('should handle real-time updates', () => {});
});

describe('ShipmentList', () => {
  it('should filter shipments correctly', () => {});
  it('should handle status changes', () => {});
});

describe('TrackingTimeline', () => {
  it('should display tracking events', () => {});
  it('should update in real-time', () => {});
});
```

### **Integration Tests**
```typescript
describe('Logistics APIs', () => {
  it('should create shipment from order', () => {});
  it('should sync tracking events', () => {});
  it('should calculate metrics correctly', () => {});
});
```

---

## 📊 **MÉTRICAS DE ÉXITO**

### **Funcionales**
- ✅ 100% envíos creados desde órdenes
- ✅ Tracking funcionando en tiempo real
- ✅ Estados sincronizados automáticamente
- ✅ Reportes generándose correctamente

### **Performance**
- ✅ Dashboard < 500ms carga inicial
- ✅ Lista de envíos < 300ms
- ✅ Tracking updates < 200ms
- ✅ Sincronización < 1 segundo

---

## 🚀 **SIGUIENTE FASE**

Una vez completada esta fase, proceder con:
- [Fase 3: Funcionalidades Avanzadas](../phase-3/)

---

**Estado:** 🔄 Listo para implementación  
**Dependencia:** Completar Panel de Órdenes Básico primero
