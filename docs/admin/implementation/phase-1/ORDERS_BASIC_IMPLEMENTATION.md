# 📋 Fase 1: Implementación del Panel de Órdenes Básico

**Duración:** 2 semanas  
**Prioridad:** 🔥 Crítica  
**Dependencias:** Panel de Productos completado  
**Estado:** 🔄 Pendiente  

---

## 🎯 **OBJETIVOS DE LA FASE**

Implementar sistema completo de gestión de órdenes con datos reales de Supabase, estados básicos y funcionalidades core de administración.

### **Entregables Principales**
- ✅ Conexión con datos reales de Supabase
- ✅ OrderList component con filtros avanzados
- ✅ OrderDetail component completo
- ✅ Sistema de estados de órdenes
- ✅ APIs CRUD para órdenes
- ✅ Integración con sistema de productos

---

## 🏗️ **ARQUITECTURA TÉCNICA**

### **Esquema de Base de Datos**

#### **Tabla Orders (Actualizada)**
```sql
-- Actualizar tabla orders existente
ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_number VARCHAR(20) UNIQUE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'pending';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS fulfillment_status VARCHAR(20) DEFAULT 'unfulfilled';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_address JSONB;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS billing_address JSONB;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS admin_notes TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_number VARCHAR(100);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS carrier VARCHAR(50);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
```

#### **Tabla Order Items (Nueva)**
```sql
CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id),
  product_name VARCHAR(255) NOT NULL,
  product_price DECIMAL(10,2) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  total_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);
```

### **APIs a Implementar**

#### **1. API de Órdenes Mejorada**
```typescript
// src/app/api/admin/orders/route.ts (Reemplazar mock)

// GET /api/admin/orders - Lista con filtros reales
interface GetOrdersRequest {
  page?: number;
  limit?: number;
  status?: OrderStatus;
  payment_status?: PaymentStatus;
  fulfillment_status?: FulfillmentStatus;
  search?: string; // Por customer, order_number, email
  date_from?: string;
  date_to?: string;
  sort_by?: 'created_at' | 'total' | 'status';
  sort_order?: 'asc' | 'desc';
}

interface GetOrdersResponse {
  data: Order[];
  meta: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  };
  stats: {
    total_orders: number;
    pending_orders: number;
    completed_orders: number;
    total_revenue: number;
  };
}

// POST /api/admin/orders - Crear orden manual
interface CreateOrderRequest {
  customer_id?: string;
  customer_email: string;
  customer_name: string;
  items: OrderItem[];
  shipping_address: Address;
  billing_address?: Address;
  notes?: string;
  admin_notes?: string;
}
```

#### **2. API de Orden Individual**
```typescript
// src/app/api/admin/orders/[id]/route.ts

// GET /api/admin/orders/[id] - Detalle completo
interface GetOrderResponse {
  data: {
    id: string;
    order_number: string;
    status: OrderStatus;
    payment_status: PaymentStatus;
    fulfillment_status: FulfillmentStatus;
    total: number;
    subtotal: number;
    tax: number;
    shipping_cost: number;
    customer: {
      id: string;
      name: string;
      email: string;
      phone?: string;
    };
    items: OrderItem[];
    shipping_address: Address;
    billing_address: Address;
    payment_info: PaymentInfo;
    tracking_number?: string;
    carrier?: string;
    notes?: string;
    admin_notes?: string;
    timeline: OrderEvent[];
    created_at: string;
    updated_at: string;
  };
}

// PUT /api/admin/orders/[id] - Actualizar orden
interface UpdateOrderRequest {
  status?: OrderStatus;
  payment_status?: PaymentStatus;
  fulfillment_status?: FulfillmentStatus;
  tracking_number?: string;
  carrier?: string;
  admin_notes?: string;
}
```

#### **3. API de Estados de Orden**
```typescript
// src/app/api/admin/orders/[id]/status/route.ts

// PATCH /api/admin/orders/[id]/status - Cambiar estado
interface ChangeStatusRequest {
  status: OrderStatus;
  reason?: string;
  notify_customer?: boolean;
  admin_notes?: string;
}
```

### **Componentes a Desarrollar**

#### **1. OrderList Component**
```typescript
// src/components/admin/orders/OrderList.tsx

interface OrderListProps {
  className?: string;
}

// Características:
// - Tabla responsive con paginación
// - Filtros avanzados (estado, fecha, cliente)
// - Búsqueda en tiempo real
// - Acciones masivas (cambiar estado, exportar)
// - Ordenamiento por columnas
// - Estados visuales con badges
// - Métricas en tiempo real
```

#### **2. OrderDetail Component**
```typescript
// src/components/admin/orders/OrderDetail.tsx

interface OrderDetailProps {
  orderId: string;
  onOrderUpdate?: (order: Order) => void;
}

// Características:
// - Vista completa de orden
// - Timeline de eventos
// - Información de cliente
// - Detalles de productos
// - Gestión de estados
// - Notas administrativas
// - Información de envío
// - Historial de pagos
```

#### **3. OrderStatusManager Component**
```typescript
// src/components/admin/orders/OrderStatusManager.tsx

interface OrderStatusManagerProps {
  order: Order;
  onStatusChange: (status: OrderStatus, reason?: string) => Promise<void>;
}

// Características:
// - Flujo de estados visual
// - Validación de transiciones
// - Confirmación de cambios
// - Notificaciones automáticas
// - Logging de cambios
```

#### **4. OrderFilters Component**
```typescript
// src/components/admin/orders/OrderFilters.tsx

interface OrderFiltersProps {
  filters: OrderFilters;
  onFiltersChange: (filters: OrderFilters) => void;
  onClearFilters: () => void;
}

// Características:
// - Filtros por estado múltiple
// - Rango de fechas
// - Búsqueda por cliente
// - Filtros por monto
// - Guardado de filtros favoritos
```

---

## 📋 **PLAN DE IMPLEMENTACIÓN DETALLADO**

### **Semana 1: Backend y Base de Datos**

#### **Día 1-2: Esquema de Base de Datos**
```bash
# Tareas específicas:
1. Actualizar tabla orders
   - Agregar campos faltantes
   - Crear índices de performance
   - Migrar datos existentes
   - Validar integridad

2. Crear tabla order_items
   - Estructura completa
   - Relaciones FK
   - Índices optimizados
   - Triggers de actualización

3. Crear funciones SQL
   - get_order_stats()
   - update_order_status()
   - calculate_order_totals()
```

#### **Día 3-4: APIs de Órdenes**
```bash
# Tareas específicas:
1. Reemplazar API mock con datos reales
   - Conexión Supabase
   - Queries optimizadas
   - Filtros avanzados
   - Paginación eficiente

2. Implementar API de orden individual
   - Joins optimizados
   - Datos completos
   - Error handling
   - Cache inteligente

3. API de cambio de estados
   - Validación de transiciones
   - Logging de cambios
   - Notificaciones
   - Audit trail
```

#### **Día 5: Testing de APIs**
```bash
# Tareas específicas:
1. Tests unitarios de APIs
2. Tests de integración con DB
3. Tests de performance
4. Validación de datos
```

### **Semana 2: Frontend y Componentes**

#### **Día 6-7: OrderList Component**
```bash
# Tareas específicas:
1. Estructura base de tabla
   - Layout responsive
   - Columnas configurables
   - Paginación
   - Loading states

2. Sistema de filtros
   - Filtros múltiples
   - Búsqueda en tiempo real
   - Persistencia de filtros
   - Reset rápido

3. Integración con APIs
   - Fetch optimizado
   - Cache con React Query
   - Error handling
   - Refresh automático
```

#### **Día 8-9: OrderDetail Component**
```bash
# Tareas específicas:
1. Layout de detalle completo
   - Información de cliente
   - Detalles de productos
   - Timeline de eventos
   - Estados visuales

2. Gestión de estados
   - Cambio de estados
   - Validaciones
   - Confirmaciones
   - Feedback visual

3. Funcionalidades adicionales
   - Notas administrativas
   - Tracking de envío
   - Historial de cambios
```

#### **Día 10: Integración y Testing**
```bash
# Tareas específicas:
1. Integración completa
2. Testing de componentes
3. Testing E2E
4. Optimización de performance
5. Documentación de uso
```

---

## 🧪 **ESTRATEGIA DE TESTING**

### **Unit Tests**
```typescript
describe('OrderList', () => {
  it('should load orders with filters', () => {});
  it('should handle pagination correctly', () => {});
  it('should update order status', () => {});
});

describe('OrderDetail', () => {
  it('should display complete order info', () => {});
  it('should handle status changes', () => {});
  it('should save admin notes', () => {});
});
```

### **Integration Tests**
```typescript
describe('Orders API', () => {
  it('should fetch orders with real data', () => {});
  it('should update order status correctly', () => {});
  it('should maintain data integrity', () => {});
});
```

### **E2E Tests**
```typescript
test('Admin can manage orders end-to-end', async ({ page }) => {
  // Test flujo completo de gestión de órdenes
});
```

---

## 📊 **MÉTRICAS DE ÉXITO**

### **Funcionales**
- ✅ 100% órdenes reales cargando desde Supabase
- ✅ Filtros funcionando en < 500ms
- ✅ Estados de órdenes sincronizados
- ✅ Timeline de eventos completo

### **Performance**
- ✅ Lista de órdenes < 300ms carga inicial
- ✅ Detalle de orden < 200ms
- ✅ Cambio de estado < 100ms
- ✅ Filtros en tiempo real < 300ms

### **UX**
- ✅ Responsive en todos los dispositivos
- ✅ Estados visuales claros
- ✅ Error handling amigable
- ✅ Feedback inmediato en acciones

---

## 🔧 **CONFIGURACIÓN TÉCNICA**

### **Hooks Personalizados**
```typescript
// src/hooks/admin/useOrders.ts
export const useOrders = (filters: OrderFilters) => {
  // React Query para gestión de órdenes
};

// src/hooks/admin/useOrderDetail.ts
export const useOrderDetail = (orderId: string) => {
  // Detalle de orden con cache
};

// src/hooks/admin/useOrderStatus.ts
export const useOrderStatus = () => {
  // Gestión de cambios de estado
};
```

### **Tipos TypeScript**
```typescript
// src/types/admin/orders.ts
export interface Order {
  id: string;
  order_number: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  fulfillment_status: FulfillmentStatus;
  // ... resto de campos
}

export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  RETURNED = 'returned'
}
```

---

## 🚀 **SIGUIENTE FASE**

Una vez completada esta fase, proceder con:
- [Fase 2: Sistema de Logística Core](../phase-2/LOGISTICS_CORE_IMPLEMENTATION.md)

---

**Estado:** 🔄 Listo para implementación  
**Dependencia:** Completar Panel de Productos primero
