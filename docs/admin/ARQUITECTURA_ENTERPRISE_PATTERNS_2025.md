# 🏗️ Arquitectura Enterprise Patterns - Panel Administrativo Pinteya E-commerce 2025

**Fecha de Documentación**: 2 de Septiembre, 2025  
**Basado en**: Spree Commerce + WooCommerce + Next.js Enterprise  
**Estado**: 📋 **PATRONES VALIDADOS Y LISTOS**  
**Aplicación**: Panel Administrativo Pinteya E-commerce  

---

## 📊 **RESUMEN DE PATRONES ENTERPRISE ADOPTADOS**

### **Fuentes de Patrones Validados**
| Framework | Patrones Adoptados | Aplicación en Pinteya |
|-----------|-------------------|----------------------|
| **Spree Commerce** | Permisos granulares, APIs REST, Estados máquina | Sistema roles, APIs admin, Order states |
| **WooCommerce** | Activity Panels, Fulfillment, Bulk Operations | Dashboard, Envíos, Operaciones masivas |
| **Next.js Enterprise** | App Router, TypeScript strict, Testing | Arquitectura, Type safety, QA |

### **Beneficios Esperados**
- ✅ **Escalabilidad**: Patrones probados en millones de tiendas
- ✅ **Mantenibilidad**: Código estructurado y documentado
- ✅ **Performance**: Optimizaciones enterprise validadas
- ✅ **Seguridad**: Sistemas de permisos robustos
- ✅ **Testing**: Cobertura >90% con patrones probados

---

## 🔐 **PATRÓN 1: SISTEMA DE PERMISOS GRANULARES (Spree Commerce)**

### **Arquitectura de Permisos**
```typescript
// src/lib/permissions/ability.ts
export enum Permission {
  // Products
  PRODUCTS_READ = 'products:read',
  PRODUCTS_CREATE = 'products:create',
  PRODUCTS_UPDATE = 'products:update',
  PRODUCTS_DELETE = 'products:delete',
  
  // Orders
  ORDERS_READ = 'orders:read',
  ORDERS_UPDATE = 'orders:update',
  ORDERS_FULFILL = 'orders:fulfill',
  ORDERS_CANCEL = 'orders:cancel',
  
  // Logistics
  LOGISTICS_READ = 'logistics:read',
  LOGISTICS_MANAGE = 'logistics:manage',
  
  // Admin
  ADMIN_USERS = 'admin:users',
  ADMIN_SETTINGS = 'admin:settings'
}

export class AdminAbility {
  private permissions: Set<Permission>;
  
  constructor(userRole: string, customPermissions: Permission[] = []) {
    this.permissions = new Set([
      ...this.getRolePermissions(userRole),
      ...customPermissions
    ]);
  }
  
  can(permission: Permission): boolean {
    return this.permissions.has(permission);
  }
  
  private getRolePermissions(role: string): Permission[] {
    const rolePermissions = {
      admin: Object.values(Permission),
      manager: [
        Permission.PRODUCTS_READ,
        Permission.PRODUCTS_UPDATE,
        Permission.ORDERS_READ,
        Permission.ORDERS_UPDATE,
        Permission.ORDERS_FULFILL,
        Permission.LOGISTICS_READ,
        Permission.LOGISTICS_MANAGE
      ],
      operator: [
        Permission.PRODUCTS_READ,
        Permission.ORDERS_READ,
        Permission.ORDERS_UPDATE,
        Permission.LOGISTICS_READ
      ],
      viewer: [
        Permission.PRODUCTS_READ,
        Permission.ORDERS_READ,
        Permission.LOGISTICS_READ
      ]
    };
    
    return rolePermissions[role] || [];
  }
}
```

### **Middleware de Autorización**
```typescript
// src/lib/api/middleware/auth.ts
export function withAdminAuth(requiredPermissions: Permission[]) {
  return function (handler: Function) {
    return async function (request: NextRequest, context: any) {
      const session = await getServerSession(authOptions);
      
      if (!session?.user) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
      
      const ability = new AdminAbility(session.user.role);
      
      const hasPermission = requiredPermissions.every(permission => 
        ability.can(permission)
      );
      
      if (!hasPermission) {
        return NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        );
      }
      
      // Attach user and ability to request
      (request as any).user = session.user;
      (request as any).ability = ability;
      
      return handler(request, context);
    };
  };
}
```

### **Uso en APIs**
```typescript
// src/app/api/admin/products/route.ts
export const GET = composeMiddlewares(
  withErrorHandler,
  withApiLogging,
  withAdminAuth([Permission.PRODUCTS_READ]),
  withValidation(ProductFiltersSchema)
)(async (request: NextRequest) => {
  const { user, ability } = request as any;
  
  // Lógica de la API con permisos validados
  const products = await getProducts();
  
  return NextResponse.json({ data: products });
});
```

---

## 📊 **PATRÓN 2: ACTIVITY PANELS DASHBOARD (WooCommerce)**

### **Arquitectura de Dashboard**
```typescript
// src/components/admin/dashboard/ActivityPanels.tsx
interface ActivityPanel {
  id: string;
  title: string;
  component: React.ComponentType<any>;
  refreshInterval?: number;
  permissions: Permission[];
}

export function ActivityPanels() {
  const { user } = useSession();
  const ability = new AdminAbility(user?.role);
  
  const panels: ActivityPanel[] = [
    {
      id: 'orders',
      title: 'Órdenes',
      component: OrdersPanel,
      refreshInterval: 30000,
      permissions: [Permission.ORDERS_READ]
    },
    {
      id: 'stock',
      title: 'Stock',
      component: StockPanel,
      refreshInterval: 60000,
      permissions: [Permission.PRODUCTS_READ]
    },
    {
      id: 'logistics',
      title: 'Logística',
      component: LogisticsPanel,
      refreshInterval: 30000,
      permissions: [Permission.LOGISTICS_READ]
    }
  ];
  
  const visiblePanels = panels.filter(panel =>
    panel.permissions.every(permission => ability.can(permission))
  );
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {visiblePanels.map(panel => (
        <ActivityPanelCard
          key={panel.id}
          panel={panel}
          refreshInterval={panel.refreshInterval}
        />
      ))}
    </div>
  );
}
```

### **Panel de Órdenes (Patrón WooCommerce)**
```typescript
// src/components/admin/dashboard/OrdersPanel.tsx
export function OrdersPanel() {
  const { data: orders, isLoading } = useQuery({
    queryKey: ['admin', 'orders', 'actionable'],
    queryFn: () => getActionableOrders(),
    refetchInterval: 30000
  });
  
  const actionableOrders = orders?.filter(order => 
    ['pending', 'confirmed', 'processing'].includes(order.status)
  );
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Órdenes Pendientes</h3>
        <Badge variant="secondary">
          {actionableOrders?.length || 0}
        </Badge>
      </div>
      
      {actionableOrders?.length === 0 ? (
        <EmptyState 
          icon={CheckCircle}
          title="¡Todo al día!"
          description="No hay órdenes que requieran atención"
        />
      ) : (
        <div className="space-y-2">
          {actionableOrders?.map(order => (
            <OrderActionCard
              key={order.id}
              order={order}
              onBeginFulfillment={() => router.push(`/admin/orders/${order.id}`)}
            />
          ))}
        </div>
      )}
      
      <Button 
        variant="outline" 
        className="w-full"
        onClick={() => router.push('/admin/orders')}
      >
        Gestionar todas las órdenes
      </Button>
    </div>
  );
}
```

---

## 🔄 **PATRÓN 3: ESTADOS MÁQUINA (Spree Commerce)**

### **Order State Machine**
```typescript
// src/lib/state-machines/order-state-machine.ts
export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
  RETURNED = 'returned'
}

export interface StateTransition {
  from: OrderStatus;
  to: OrderStatus;
  action: string;
  conditions?: (order: Order) => boolean;
  sideEffects?: (order: Order) => Promise<void>;
}

export class OrderStateMachine {
  private static transitions: StateTransition[] = [
    {
      from: OrderStatus.PENDING,
      to: OrderStatus.CONFIRMED,
      action: 'confirm',
      conditions: (order) => order.payment_status === 'paid',
      sideEffects: async (order) => {
        await sendConfirmationEmail(order);
        await updateInventory(order);
      }
    },
    {
      from: OrderStatus.CONFIRMED,
      to: OrderStatus.PROCESSING,
      action: 'process',
      sideEffects: async (order) => {
        await createShipment(order);
        await notifyWarehouse(order);
      }
    },
    {
      from: OrderStatus.PROCESSING,
      to: OrderStatus.SHIPPED,
      action: 'ship',
      conditions: (order) => order.shipment?.tracking_number != null,
      sideEffects: async (order) => {
        await sendShippingNotification(order);
        await updateTrackingInfo(order);
      }
    }
  ];
  
  static async transition(
    order: Order, 
    targetStatus: OrderStatus, 
    userId: string
  ): Promise<Order> {
    const transition = this.transitions.find(t => 
      t.from === order.status && t.to === targetStatus
    );
    
    if (!transition) {
      throw new Error(`Invalid transition from ${order.status} to ${targetStatus}`);
    }
    
    if (transition.conditions && !transition.conditions(order)) {
      throw new Error(`Conditions not met for transition to ${targetStatus}`);
    }
    
    // Execute side effects
    if (transition.sideEffects) {
      await transition.sideEffects(order);
    }
    
    // Update order status
    const updatedOrder = await updateOrderStatus(order.id, targetStatus);
    
    // Create audit trail
    await createOrderStatusHistory({
      order_id: order.id,
      from_status: order.status,
      to_status: targetStatus,
      action: transition.action,
      changed_by: userId,
      timestamp: new Date()
    });
    
    return updatedOrder;
  }
  
  static getAvailableTransitions(currentStatus: OrderStatus): OrderStatus[] {
    return this.transitions
      .filter(t => t.from === currentStatus)
      .map(t => t.to);
  }
}
```

---

## 🚀 **PATRÓN 4: FULFILLMENT SYSTEM (WooCommerce)**

### **Fulfillment API**
```typescript
// src/app/api/admin/orders/[id]/fulfill/route.ts
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const orderId = parseInt(params.id);
  const body = await request.json();
  
  const order = await getOrder(orderId);
  
  // Validate transition using state machine
  const availableTransitions = OrderStateMachine.getAvailableTransitions(order.status);
  if (!availableTransitions.includes(OrderStatus.PROCESSING)) {
    return NextResponse.json(
      { error: 'Order cannot be fulfilled in current status' },
      { status: 400 }
    );
  }
  
  // Create fulfillment record
  const fulfillment = await createFulfillment({
    order_id: orderId,
    items: body.items,
    tracking_number: body.tracking_number,
    shipping_provider: body.shipping_provider,
    notify_customer: body.notify_customer ?? true
  });
  
  // Transition order state
  const updatedOrder = await OrderStateMachine.transition(
    order,
    OrderStatus.PROCESSING,
    request.user.id
  );
  
  return NextResponse.json({
    data: {
      fulfillment,
      order: updatedOrder
    }
  }, { status: 201 });
}
```

### **Fulfillment Component**
```typescript
// src/components/admin/orders/FulfillmentForm.tsx
export function FulfillmentForm({ order }: { order: Order }) {
  const form = useForm<FulfillmentRequest>({
    resolver: zodResolver(FulfillmentSchema)
  });
  
  const { mutate: fulfillOrder, isLoading } = useMutation({
    mutationFn: fulfillOrderAPI,
    onSuccess: () => {
      toast.success('Orden procesada exitosamente');
      router.push(`/admin/orders/${order.id}`);
    }
  });
  
  const availableTransitions = OrderStateMachine.getAvailableTransitions(order.status);
  const canFulfill = availableTransitions.includes(OrderStatus.PROCESSING);
  
  if (!canFulfill) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>No se puede procesar</AlertTitle>
        <AlertDescription>
          La orden debe estar en estado "Confirmada" para poder procesarla.
        </AlertDescription>
      </Alert>
    );
  }
  
  return (
    <Form {...form}>
      <div className="space-y-6">
        <ItemsSelector 
          items={order.items}
          value={form.watch('items')}
          onChange={(items) => form.setValue('items', items)}
        />
        
        <ShippingProviderSelector 
          value={form.watch('shipping_provider')}
          onChange={(provider) => form.setValue('shipping_provider', provider)}
        />
        
        <TrackingNumberInput 
          value={form.watch('tracking_number')}
          onChange={(tracking) => form.setValue('tracking_number', tracking)}
        />
        
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="notify_customer"
            checked={form.watch('notify_customer')}
            onCheckedChange={(checked) => form.setValue('notify_customer', checked)}
          />
          <Label htmlFor="notify_customer">
            Notificar al cliente por email
          </Label>
        </div>
        
        <Button 
          type="submit" 
          loading={isLoading}
          className="w-full"
        >
          Procesar Orden
        </Button>
      </div>
    </Form>
  );
}
```

---

## 📚 **DOCUMENTACIÓN DE IMPLEMENTACIÓN**

### **Guías de Uso**
1. **[Plan de Implementación Detallado](./PLAN_IMPLEMENTACION_DETALLADO_2025.md)**
2. **[Cronograma de Implementación](./CRONOGRAMA_IMPLEMENTACION_2025.md)**
3. **[Especificaciones de APIs](./implementation/technical/API_SPECIFICATIONS.md)**
4. **[Estrategia de Testing](./TESTING_STRATEGY.md)**

### **Referencias Enterprise**
- **Spree Commerce**: [Documentación oficial](https://spreecommerce.org/docs/)
- **WooCommerce**: [Developer Documentation](https://woocommerce.com/developers/)
- **Next.js Enterprise**: [Best Practices](https://nextjs.org/docs/app/building-your-application)

---

**Documentado por**: Augment Agent  
**Fecha**: 2 de Septiembre, 2025  
**Versión**: 1.0  
**Estado**: ✅ **PATRONES VALIDADOS Y LISTOS PARA IMPLEMENTACIÓN**



