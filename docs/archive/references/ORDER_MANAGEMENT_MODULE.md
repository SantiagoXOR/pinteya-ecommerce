# 📋 Módulo de Gestión de Órdenes - Pinteya E-commerce

**Basado en:** Vendure Order Management + WooCommerce Orders + Spree Commerce Shipments  
**Estado:** 🔴 No Implementado  
**Prioridad:** 🔥 Crítica  
**Estimación:** 2 semanas

---

## 🎯 **OBJETIVOS DEL MÓDULO**

Crear un sistema completo de gestión de órdenes que permita a los administradores:

- ✅ Visualizar y filtrar órdenes por estado, fecha, cliente
- ✅ Gestionar el ciclo de vida completo de las órdenes
- ✅ Procesar pagos y reembolsos
- ✅ Gestionar envíos y tracking
- ✅ Comunicarse con clientes
- ✅ Generar reportes y analytics
- ✅ Manejar devoluciones y cancelaciones

---

## 🏗️ **ARQUITECTURA DEL MÓDULO**

### **Estructura de Archivos**

```
src/app/admin/orders/
├── page.tsx                     // Lista de órdenes con filtros
├── [id]/
│   ├── page.tsx                 // Vista general de la orden
│   ├── edit/page.tsx            // Editar orden
│   ├── payments/page.tsx        // Gestión de pagos
│   ├── shipments/page.tsx       // Gestión de envíos
│   ├── refunds/page.tsx         // Gestión de reembolsos
│   └── timeline/page.tsx        // Historial de la orden
└── components/
    ├── OrderList.tsx            // Tabla de órdenes
    ├── OrderDetail.tsx          // Vista detallada
    ├── OrderStatusManager.tsx   // Cambio de estados
    ├── OrderPayments.tsx        // Gestión de pagos
    ├── OrderShipments.tsx       // Gestión de envíos
    ├── OrderRefunds.tsx         // Gestión de reembolsos
    ├── OrderTimeline.tsx        // Línea de tiempo
    ├── OrderFilters.tsx         // Filtros avanzados
    └── OrderActions.tsx         // Acciones rápidas
```

### **APIs del Módulo**

```
src/app/api/admin/orders/
├── route.ts                     // GET, POST /api/admin/orders
├── [id]/route.ts                // GET, PUT /api/admin/orders/[id]
├── [id]/fulfill/route.ts        // POST /api/admin/orders/[id]/fulfill
├── [id]/cancel/route.ts         // POST /api/admin/orders/[id]/cancel
├── [id]/refund/route.ts         // POST /api/admin/orders/[id]/refund
├── [id]/ship/route.ts           // POST /api/admin/orders/[id]/ship
├── [id]/payments/route.ts       // Gestión de pagos
├── [id]/notes/route.ts          // Notas internas
├── stats/route.ts               // Estadísticas de órdenes
└── export/route.ts              // Exportar órdenes
```

---

## 🧩 **COMPONENTES PRINCIPALES**

### **1. OrderList Component**

_Inspirado en WooCommerce Orders Table + Spree Commerce Platform API_

```typescript
interface OrderListProps {
  filters?: OrderFilters;
  pagination?: PaginationConfig;
  selection?: SelectionConfig;
  actions?: BulkAction[];
}

interface OrderFilters {
  search?: string;
  status?: OrderStatus[];
  paymentStatus?: PaymentStatus[];
  fulfillmentStatus?: FulfillmentStatus[];
  dateRange?: [Date, Date];
  customer?: string;
  total?: [number, number];
}

const OrderList: React.FC<OrderListProps> = ({
  filters,
  pagination,
  selection,
  actions
}) => {
  const { data, loading, error } = useOrderList({
    filters,
    pagination
  });

  return (
    <AdminDataTable
      data={data?.orders || []}
      columns={orderColumns}
      loading={loading}
      error={error}
      pagination={pagination}
      selection={selection}
      bulkActions={actions}
      filters={<OrderFilters />}
    />
  );
};

// Columnas de la tabla de órdenes
const orderColumns: ColumnDef<Order>[] = [
  {
    accessorKey: 'number',
    header: 'Número',
    cell: ({ row }) => (
      <div>
        <Link
          href={`/admin/orders/${row.original.id}`}
          className="font-medium text-blue-600 hover:text-blue-800"
        >
          #{row.original.number}
        </Link>
        <div className="text-sm text-gray-500">
          {formatDate(row.original.createdAt)}
        </div>
      </div>
    ),
  },
  {
    accessorKey: 'customer',
    header: 'Cliente',
    cell: ({ row }) => (
      <div>
        <div className="font-medium">
          {row.original.customer?.firstName} {row.original.customer?.lastName}
        </div>
        <div className="text-sm text-gray-500">
          {row.original.customer?.email}
        </div>
      </div>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Estado',
    cell: ({ row }) => (
      <OrderStatusBadge status={row.original.status} />
    ),
  },
  {
    accessorKey: 'paymentStatus',
    header: 'Pago',
    cell: ({ row }) => (
      <PaymentStatusBadge status={row.original.paymentStatus} />
    ),
  },
  {
    accessorKey: 'fulfillmentStatus',
    header: 'Envío',
    cell: ({ row }) => (
      <FulfillmentStatusBadge status={row.original.fulfillmentStatus} />
    ),
  },
  {
    accessorKey: 'total',
    header: 'Total',
    cell: ({ row }) => (
      <div className="text-right font-medium">
        {formatCurrency(row.original.total, 'ARS')}
      </div>
    ),
  },
  {
    id: 'actions',
    header: 'Acciones',
    cell: ({ row }) => (
      <OrderActions order={row.original} />
    ),
    enableSorting: false,
  },
];
```

### **2. OrderDetail Component**

_Basado en Vendure Order Detail + WooCommerce Order Edit_

```typescript
interface OrderDetailProps {
  orderId: string;
}

const OrderDetail: React.FC<OrderDetailProps> = ({ orderId }) => {
  const { data: order, loading, error } = useOrder(orderId);
  const [activeTab, setActiveTab] = useState('overview');

  if (loading) return <OrderDetailSkeleton />;
  if (error) return <ErrorMessage error={error} />;
  if (!order) return <NotFound />;

  return (
    <AdminPageLayout
      title={`Orden #${order.number}`}
      breadcrumbs={[
        { label: 'Órdenes', href: '/admin/orders' },
        { label: `#${order.number}` }
      ]}
      actions={<OrderDetailActions order={order} />}
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna principal */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="overview">Resumen</TabsTrigger>
              <TabsTrigger value="items">Productos</TabsTrigger>
              <TabsTrigger value="payments">Pagos</TabsTrigger>
              <TabsTrigger value="shipments">Envíos</TabsTrigger>
              <TabsTrigger value="timeline">Historial</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <OrderOverview order={order} />
            </TabsContent>

            <TabsContent value="items">
              <OrderItems order={order} />
            </TabsContent>

            <TabsContent value="payments">
              <OrderPayments order={order} />
            </TabsContent>

            <TabsContent value="shipments">
              <OrderShipments order={order} />
            </TabsContent>

            <TabsContent value="timeline">
              <OrderTimeline order={order} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <AdminCard title="Estado de la Orden">
            <OrderStatusManager order={order} />
          </AdminCard>

          <AdminCard title="Información del Cliente">
            <OrderCustomerInfo order={order} />
          </AdminCard>

          <AdminCard title="Direcciones">
            <OrderAddresses order={order} />
          </AdminCard>

          <AdminCard title="Resumen de Pagos">
            <OrderPaymentSummary order={order} />
          </AdminCard>

          <AdminCard title="Notas Internas">
            <OrderNotes order={order} />
          </AdminCard>
        </div>
      </div>
    </AdminPageLayout>
  );
};
```

### **3. OrderStatusManager Component**

_Inspirado en Spree Commerce Shipment State Management_

```typescript
interface OrderStatusManagerProps {
  order: Order;
  onStatusChange?: (newStatus: OrderStatus) => void;
}

const OrderStatusManager: React.FC<OrderStatusManagerProps> = ({
  order,
  onStatusChange
}) => {
  const [isChanging, setIsChanging] = useState(false);
  const { mutate: updateOrderStatus } = useUpdateOrderStatus();

  const availableTransitions = getAvailableOrderTransitions(order.status);

  const handleStatusChange = async (newStatus: OrderStatus) => {
    setIsChanging(true);
    try {
      await updateOrderStatus({
        orderId: order.id,
        status: newStatus,
        reason: `Estado cambiado de ${order.status} a ${newStatus}`
      });
      onStatusChange?.(newStatus);
      toast.success('Estado de la orden actualizado');
    } catch (error) {
      toast.error('Error al actualizar el estado');
    } finally {
      setIsChanging(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <OrderStatusBadge status={order.status} />
        <span className="text-sm text-gray-500">
          Actualizado {formatRelativeTime(order.updatedAt)}
        </span>
      </div>

      {availableTransitions.length > 0 && (
        <div className="space-y-2">
          <Label>Cambiar Estado</Label>
          <div className="grid grid-cols-1 gap-2">
            {availableTransitions.map((transition) => (
              <Button
                key={transition.to}
                variant="outline"
                size="sm"
                disabled={isChanging}
                onClick={() => handleStatusChange(transition.to)}
                className="justify-start"
              >
                <ArrowRight className="h-4 w-4 mr-2" />
                {transition.label}
              </Button>
            ))}
          </div>
        </div>
      )}

      <Separator />

      <div className="space-y-2">
        <Label>Acciones Rápidas</Label>
        <div className="grid grid-cols-1 gap-2">
          {order.status === 'pending' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleStatusChange('confirmed')}
              disabled={isChanging}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Confirmar Orden
            </Button>
          )}

          {order.status === 'confirmed' && order.paymentStatus === 'paid' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleStatusChange('processing')}
              disabled={isChanging}
            >
              <Package className="h-4 w-4 mr-2" />
              Comenzar Preparación
            </Button>
          )}

          {order.status === 'processing' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleStatusChange('shipped')}
              disabled={isChanging}
            >
              <Truck className="h-4 w-4 mr-2" />
              Marcar como Enviado
            </Button>
          )}

          {['pending', 'confirmed'].includes(order.status) && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleStatusChange('cancelled')}
              disabled={isChanging}
            >
              <X className="h-4 w-4 mr-2" />
              Cancelar Orden
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

// Estados de orden y transiciones permitidas
const orderStateTransitions: Record<OrderStatus, OrderTransition[]> = {
  pending: [
    { to: 'confirmed', label: 'Confirmar Orden' },
    { to: 'cancelled', label: 'Cancelar Orden' }
  ],
  confirmed: [
    { to: 'processing', label: 'Comenzar Preparación' },
    { to: 'cancelled', label: 'Cancelar Orden' }
  ],
  processing: [
    { to: 'shipped', label: 'Marcar como Enviado' },
    { to: 'cancelled', label: 'Cancelar Orden' }
  ],
  shipped: [
    { to: 'delivered', label: 'Marcar como Entregado' },
    { to: 'returned', label: 'Marcar como Devuelto' }
  ],
  delivered: [
    { to: 'returned', label: 'Procesar Devolución' }
  ],
  cancelled: [],
  returned: []
};
```

### **4. OrderShipments Component**

_Basado en Spree Commerce Shipments API_

```typescript
interface OrderShipmentsProps {
  order: Order;
}

const OrderShipments: React.FC<OrderShipmentsProps> = ({ order }) => {
  const [isCreatingShipment, setIsCreatingShipment] = useState(false);
  const { mutate: createShipment } = useCreateShipment();
  const { mutate: updateShipment } = useUpdateShipment();

  const handleCreateShipment = async (items: OrderLineItem[]) => {
    setIsCreatingShipment(true);
    try {
      await createShipment({
        orderId: order.id,
        items: items.map(item => ({
          orderLineId: item.id,
          quantity: item.quantity
        }))
      });
      toast.success('Envío creado exitosamente');
    } catch (error) {
      toast.error('Error al crear el envío');
    } finally {
      setIsCreatingShipment(false);
    }
  };

  const handleShipmentAction = async (
    shipmentId: string,
    action: 'ready' | 'ship' | 'cancel'
  ) => {
    try {
      await updateShipment({
        shipmentId,
        action,
        ...(action === 'ship' && {
          trackingNumber: prompt('Número de tracking:'),
          carrier: prompt('Transportista:')
        })
      });
      toast.success(`Envío ${action === 'ship' ? 'enviado' : action === 'ready' ? 'preparado' : 'cancelado'}`);
    } catch (error) {
      toast.error('Error al actualizar el envío');
    }
  };

  return (
    <AdminCard title="Gestión de Envíos">
      <div className="space-y-6">
        {/* Envíos existentes */}
        {order.shipments?.map((shipment) => (
          <div key={shipment.id} className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="font-medium">Envío #{shipment.number}</h4>
                <p className="text-sm text-gray-500">
                  Estado: <ShipmentStatusBadge status={shipment.state} />
                </p>
              </div>
              <ShipmentActions
                shipment={shipment}
                onAction={handleShipmentAction}
              />
            </div>

            <div className="space-y-2">
              <h5 className="text-sm font-medium">Productos:</h5>
              {shipment.items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span>{item.productVariant.name}</span>
                  <span>Cantidad: {item.quantity}</span>
                </div>
              ))}
            </div>

            {shipment.trackingNumber && (
              <div className="mt-4 p-3 bg-blue-50 rounded">
                <p className="text-sm">
                  <strong>Tracking:</strong> {shipment.trackingNumber}
                </p>
                {shipment.trackingUrl && (
                  <a
                    href={shipment.trackingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Rastrear envío →
                  </a>
                )}
              </div>
            )}
          </div>
        ))}

        {/* Crear nuevo envío */}
        {order.status === 'processing' && (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <Package className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <h4 className="font-medium mb-2">Crear Nuevo Envío</h4>
            <p className="text-sm text-gray-500 mb-4">
              Selecciona los productos que deseas enviar
            </p>
            <CreateShipmentDialog
              order={order}
              onCreateShipment={handleCreateShipment}
              loading={isCreatingShipment}
            />
          </div>
        )}
      </div>
    </AdminCard>
  );
};
```

---

## 🔌 **APIS Y ENDPOINTS**

### **Endpoints Principales**

```typescript
// GET /api/admin/orders
interface GetOrdersResponse {
  data: Order[]
  meta: {
    count: number
    total_count: number
    total_pages: number
    current_page: number
  }
  links: {
    self: string
    next?: string
    prev?: string
    first: string
    last: string
  }
}

// POST /api/admin/orders/[id]/fulfill
interface FulfillOrderRequest {
  items: {
    orderLineId: string
    quantity: number
  }[]
  trackingNumber?: string
  carrier?: string
  notifyCustomer?: boolean
}

// POST /api/admin/orders/[id]/refund
interface RefundOrderRequest {
  amount: number
  reason: string
  items?: {
    orderLineId: string
    quantity: number
  }[]
  refundShipping?: boolean
  notifyCustomer?: boolean
}

// PATCH /api/admin/orders/[id]/ship
interface ShipOrderRequest {
  shipmentId: string
  trackingNumber: string
  carrier: string
  notifyCustomer?: boolean
}
```

---

## 📊 **ESTADOS Y FLUJOS DE TRABAJO**

### **Estados de Orden**

```typescript
enum OrderStatus {
  PENDING = 'pending', // Orden creada, esperando confirmación
  CONFIRMED = 'confirmed', // Orden confirmada, esperando pago
  PROCESSING = 'processing', // Orden en preparación
  SHIPPED = 'shipped', // Orden enviada
  DELIVERED = 'delivered', // Orden entregada
  CANCELLED = 'cancelled', // Orden cancelada
  RETURNED = 'returned', // Orden devuelta
}

enum PaymentStatus {
  PENDING = 'pending', // Pago pendiente
  AUTHORIZED = 'authorized', // Pago autorizado
  PAID = 'paid', // Pago completado
  FAILED = 'failed', // Pago fallido
  REFUNDED = 'refunded', // Pago reembolsado
  PARTIALLY_REFUNDED = 'partially_refunded',
}

enum FulfillmentStatus {
  UNFULFILLED = 'unfulfilled', // Sin cumplir
  PARTIAL = 'partial', // Parcialmente cumplido
  FULFILLED = 'fulfilled', // Completamente cumplido
}
```

---

## 🧪 **TESTING STRATEGY**

### **Unit Tests**

```typescript
describe('OrderStatusManager', () => {
  it('should show available transitions', () => {
    // Test state transitions
  })

  it('should handle status changes', () => {
    // Test status updates
  })
})
```

### **Integration Tests**

```typescript
describe('Orders API', () => {
  it('should fulfill order correctly', async () => {
    // Test order fulfillment
  })

  it('should process refunds', async () => {
    // Test refund processing
  })
})
```

---

## 📈 **MÉTRICAS DE ÉXITO**

- **Tiempo de procesamiento de orden:** < 5 minutos
- **Precisión de estados:** 99.9%
- **Tiempo de respuesta API:** < 300ms
- **Satisfacción del administrador:** > 4.7/5

---

_Próxima actualización: Implementación de OrderList component_
