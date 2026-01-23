# Skill: Checkout y Pagos

## Descripción

Habilidad especializada para trabajar con el sistema de checkout y pagos, incluyendo integración con MercadoPago, manejo de órdenes, validación de direcciones y flujo de checkout.

## Cuándo Usar

- Implementar mejoras en el flujo de checkout
- Integrar nuevos métodos de pago
- Debuggear problemas de pagos
- Optimizar el proceso de checkout
- Implementar validación de direcciones

## Archivos Clave

- `src/app/checkout/` - Páginas de checkout
- `src/components/Checkout/` - Componentes de checkout
- `src/lib/integrations/mercadopago/` - Integración MercadoPago
- `src/lib/business/orders/` - Lógica de órdenes
- `src/hooks/useCheckout.ts` - Hook de checkout

## Comandos Útiles

```bash
# Probar checkout en desarrollo
npm run dev
# Navegar a /checkout

# Ver logs de MercadoPago
# Revisar console y Network tab en DevTools
```

## Ejemplos de Uso

### Crear Orden desde Checkout

```typescript
import { createOrder } from '@/lib/business/orders/order-service';
import { createPayment } from '@/lib/integrations/mercadopago';

export async function POST(request: NextRequest) {
  const { items, shippingAddress, paymentMethod } = await request.json();
  
  // 1. Crear orden
  const order = await createOrder({
    items,
    shippingAddress,
    status: 'pending_payment',
  });
  
  // 2. Crear pago en MercadoPago
  const payment = await createPayment({
    transaction_amount: order.total,
    description: `Orden #${order.id}`,
    payer: {
      email: order.customer_email,
    },
  });
  
  // 3. Actualizar orden con payment_id
  await updateOrder(order.id, {
    payment_id: payment.id,
    payment_status: 'pending',
  });
  
  return NextResponse.json({ order, payment });
}
```

### Validar Dirección

```typescript
import { validateAddress } from '@/lib/business/logistics/address-validation';

const address = {
  street: 'Av. Corrientes 1234',
  city: 'Buenos Aires',
  postalCode: 'C1043AAX',
  country: 'AR',
};

const validation = await validateAddress(address);

if (!validation.isValid) {
  // Mostrar errores al usuario
  return { errors: validation.errors };
}
```

### Integrar MercadoPago Wallet Brick

```typescript
import { initMercadoPago, Wallet } from '@mercadopago/sdk-react';

function CheckoutPayment() {
  const [paymentData, setPaymentData] = useState(null);
  
  useEffect(() => {
    initMercadoPago('YOUR_PUBLIC_KEY');
  }, []);
  
  const onSubmit = async (formData: any) => {
    const response = await createPayment(formData);
    setPaymentData(response);
  };
  
  return (
    <Wallet
      initialization={{ preferenceId: paymentData?.preference_id }}
      onSubmit={onSubmit}
    />
  );
}
```

## Estados de Orden

- `pending_payment` - Esperando pago
- `paid` - Pagado
- `processing` - Procesando
- `shipped` - Enviado
- `delivered` - Entregado
- `cancelled` - Cancelado
- `refunded` - Reembolsado

## Checklist de Implementación

- [ ] Validar datos del carrito
- [ ] Validar dirección de envío
- [ ] Crear orden en base de datos
- [ ] Integrar con MercadoPago
- [ ] Manejar webhooks de pago
- [ ] Actualizar estado de orden
- [ ] Enviar confirmación al cliente
- [ ] Trackear evento de conversión
