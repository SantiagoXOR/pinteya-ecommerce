# Panel de Administración de Órdenes - Documentación

> **Última actualización:** 18 de enero de 2026  
> **Versión:** 2.0

## Índice

1. [Descripción General](#descripción-general)
2. [Estructura de Base de Datos](#estructura-de-base-de-datos)
3. [Flujo de Estados](#flujo-de-estados)
4. [Componentes UI](#componentes-ui)
5. [APIs](#apis)
6. [Funcionalidades Implementadas](#funcionalidades-implementadas)
7. [Integraciones](#integraciones)

---

## Descripción General

El panel de administración de órdenes permite gestionar todo el ciclo de vida de los pedidos, desde su creación hasta la entrega. Soporta dos métodos de pago:

- **MercadoPago**: Pagos online con tarjeta, débito, etc.
- **Pago al Recibir (Cash)**: Pago contra entrega

### Características Principales

- Lista de órdenes con columnas redimensionables y ordenamiento
- Expandir órdenes para ver productos con imágenes y atributos
- Acciones rápidas de WhatsApp para comunicación con clientes
- Modal de detalles con información completa
- Cambio de estados (pendiente → preparando → enviado → entregado)
- Generación de links de pago MercadoPago
- Impresión de PDF con código QR de pago
- Métricas y filtros en tiempo real

---

## Estructura de Base de Datos

### Tabla `orders`

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | integer | ID único (usado como `order_number`) |
| `order_number` | text | Número de orden (mismo que `id`) |
| `user_id` | uuid | ID del usuario (null para visitantes) |
| `total` | numeric | Total de la orden |
| `status` | text | Estado: pending, processing, shipped, delivered, cancelled |
| `payment_status` | text | Estado de pago: pending, paid, refunded, failed |
| `payment_method` | varchar | Método: mercadopago, cash |
| `payment_id` | text | ID de pago de MercadoPago |
| `payment_preference_id` | text | ID de preferencia MercadoPago |
| `payment_link` | text | URL del link de pago |
| `shipping_address` | jsonb | Dirección de envío completa |
| `payer_info` | jsonb | Información del pagador |
| `external_reference` | text | Referencia externa |
| `tracking_number` | text | Número de seguimiento |
| `carrier` | text | Transportista |
| `notes` | text | Notas internas |
| `created_at` | timestamptz | Fecha de creación |
| `updated_at` | timestamptz | Última actualización |

### Estructura de `shipping_address` (JSONB)

```json
{
  "street_name": "Manuel Dorrego",
  "street_number": "1680",
  "zip_code": "5000",
  "city_name": "Córdoba",
  "state_name": "Córdoba",
  "apartment": "1C",
  "observations": "Cartel electricista, no entregar en recepción"
}
```

### Estructura de `payer_info` (JSONB)

```json
{
  "name": "Santiago Ariel",
  "surname": "Martinez",
  "email": "email@ejemplo.com",
  "phone": "03547527070",
  "order_number": "387",
  "payment_method": "mercadopago"
}
```

### Tabla `order_items`

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | integer | ID único |
| `order_id` | integer | FK a orders |
| `product_id` | integer | FK a products |
| `variant_id` | integer | FK a product_variants |
| `quantity` | integer | Cantidad |
| `price` | numeric | Precio unitario |
| `product_snapshot` | jsonb | Snapshot del producto al momento de compra |

### Estructura de `product_snapshot` (JSONB)

```json
{
  "id": 448,
  "name": "Aerosol Krylon Tablero",
  "image_url": "/images/products/aerosol-krylon.jpg",
  "color": "Azul",
  "color_hex": "#0000FF",
  "measure": "395ml",
  "finish": "Mate"
}
```

### Tabla `order_status_history`

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | uuid | ID único |
| `order_id` | integer | FK a orders |
| `previous_status` | text | Estado anterior |
| `new_status` | text | Nuevo estado |
| `changed_by` | uuid | Usuario que cambió |
| `note` | text | Nota opcional |
| `created_at` | timestamptz | Fecha del cambio |

---

## Flujo de Estados

### Estados de Orden

```
pending → processing → shipped → delivered
    ↓         ↓           ↓          
cancelled cancelled  cancelled     
```

| Estado | Descripción | Acción de Stock |
|--------|-------------|-----------------|
| `pending` | Orden recibida, pendiente de procesar | - |
| `processing` | En preparación | **Descuenta stock** |
| `shipped` | Enviado al cliente | - |
| `delivered` | Entregado | - |
| `cancelled` | Cancelado | - |

### Estados de Pago

| Estado | Descripción |
|--------|-------------|
| `pending` | Pendiente de pago |
| `paid` | Pagado |
| `refunded` | Reembolsado |
| `failed` | Fallido |

---

## Componentes UI

### Lista de Órdenes (`OrderList.tsx`)

**Columnas:**
- Checkbox de selección
- Acciones (ver, editar, dropdown)
- Número de orden
- Productos (expandible)
- Cliente (nombre, teléfono + WhatsApp)
- Dirección (con botón Google Maps)
- Fecha
- Estado
- Pago (método + estado)
- Total

**Características:**
- Columnas redimensionables
- Ordenamiento ascendente/descendente
- Filas expandibles para ver productos
- Botón WhatsApp con acciones rápidas

### Productos Expandibles (`ExpandableOrderItemsRow`)

Muestra para cada producto:
- Imagen del producto
- Nombre (normalizado)
- ID del producto
- Atributos como pills:
  - Color (con indicador hexadecimal)
  - Medida
  - Terminación
- Cantidad
- Precio

### Modal de Detalles (`OrderDetailsModal.tsx`)

**Tabs:**
1. **Resumen**: Info general, productos, envío
2. **Cliente**: Datos del cliente, WhatsApp, historial
3. **Pago**: Método, estado, acciones de pago
4. **Historial**: Timeline de cambios de estado

**Sección de Envío:**
- Dirección completa
- Piso/Depto (badge)
- Indicaciones del cliente (box destacado)
- Botón "Ver en Google Maps"
- Indicador visual de progreso
- Botones de cambio de estado: Preparando, Enviado, Entregado

**Acciones de Pago:**
- **Si hay link de pago**: Copiar Link, Abrir, Generar nuevo
- **Si no hay link**: Crear Link de Pago
- Marcar como Pagado
- Procesar Reembolso (si está pagado)

### Badge Unificado de Pago (`UnifiedPaymentBadge`)

Muestra método y estado de pago:
- **MercadoPago Pendiente**: Badge azul celeste
- **MercadoPago Pagado**: Badge azul con check
- **Cash Pendiente**: Badge naranja
- **Cash Pagado**: Badge verde

### Acciones de WhatsApp (`WhatsAppQuickActions`)

Mensajes predeterminados:
- 📦 Orden recibida
- 🔧 En preparación
- 🚚 Orden enviada
- 📍 Llegando a destino
- ✅ Orden completada

---

## APIs

### GET `/api/admin/orders`

Lista todas las órdenes con filtros.

**Query Params:**
- `status`: Filtrar por estado
- `payment_status`: Filtrar por estado de pago
- `search`: Buscar por número, cliente, teléfono
- `page`, `limit`: Paginación

**Headers de Cache:**
```
Cache-Control: no-store, no-cache, must-revalidate
Pragma: no-cache
```

### GET/PATCH `/api/admin/orders/[id]`

Obtener o actualizar una orden específica.

**PATCH Body:**
```json
{
  "status": "processing",
  "payment_status": "paid"
}
```

**Lógica de Stock:**
Cuando `status` cambia a `processing`, se ejecuta `decrementStockForOrder()` que llama al RPC `update_product_stock` para cada item.

### GET `/api/admin/orders/[id]/history`

Obtener historial de cambios de estado.

### POST `/api/admin/orders/[id]/payment-link`

Crear link de pago MercadoPago.

**Response:**
```json
{
  "success": true,
  "data": {
    "preference_id": "452711838-xxx",
    "payment_url": "https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=xxx"
  }
}
```

### POST `/api/admin/orders/[id]/mark-paid`

Marcar orden como pagada manualmente.

### GET `/api/admin/orders/stats`

Obtener métricas de órdenes.

---

## Funcionalidades Implementadas

### 1. Creación de Órdenes

**Cash (`/api/orders/create-cash-order`):**
- Valida stock disponible
- Guarda `shipping_address` con apartment/observations
- Guarda `payer_info` completo
- Genera `order_number` = `id`

**MercadoPago (`/api/payments/create-preference`):**
- Crea preferencia en MercadoPago
- Guarda datos de envío y pagador igual que cash
- Genera `order_number` = `id`

### 2. Gestión de Estados

- Cambio desde dropdown de acciones
- Cambio desde botones en modal
- Registro automático en `order_status_history`
- Actualización instantánea de UI (React Query)

### 3. Descuento de Stock

Se ejecuta cuando la orden pasa a estado `processing`:

```typescript
async function decrementStockForOrder(orderId: string) {
  const items = await getOrderItems(orderId)
  for (const item of items) {
    await supabaseAdmin.rpc('update_product_stock', {
      product_id: item.product_id,
      quantity_sold: item.quantity,
    })
  }
}
```

### 4. Links de Pago

- Crear link desde modal de orden
- Link se guarda en columna `payment_link`
- Botones para copiar/abrir link existente
- Opción de regenerar link

### 5. Impresión PDF

Genera PDF con:
- Logo Pinteya (SVG embebido)
- Datos del cliente
- Dirección de envío
- Productos con atributos (nombres normalizados)
- Total
- Código QR de pago (si hay link)

### 6. Integración WhatsApp

- Botón junto al teléfono en lista
- Mensajes predeterminados según estado
- Número normalizado automáticamente

### 7. Integración Google Maps

- Botón en columna de dirección
- Botón en modal de envío
- URL generada con dirección completa

---

## Integraciones

### MercadoPago

- **SDK**: `mercadopago` v2
- **Funciones**: `createPaymentPreference`
- **Circuit Breaker**: Protección contra fallos
- **Retry Logic**: Reintentos automáticos

### Supabase

- **Cliente Admin**: Para operaciones del servidor
- **RPC**: `update_product_stock` para descuento de stock

### React Query

- **Queries**: `admin-orders`, `admin-orders-stats`
- **Cache**: Deshabilitado (`staleTime: 0`, `gcTime: 0`)
- **Refetch**: Instantáneo tras mutaciones

---

## Commits de esta Sesión

1. `66e4d6c0` - fix(checkout): enviar siempre datos de shipping en ordenes MercadoPago
2. `c863d887` - fix(payment-link): corregir columnas de user_profiles en API
3. `143911e1` - feat(payment-link): mejorar UX de link de pago en modal de orden

---

## Archivos Principales

```
src/
├── app/
│   ├── admin/orders/
│   │   └── OrdersPageClient.tsx      # Página principal + PDF
│   └── api/
│       ├── admin/orders/
│       │   ├── route.ts              # Lista de órdenes
│       │   ├── [id]/
│       │   │   ├── route.ts          # GET/PATCH orden
│       │   │   ├── history/route.ts  # Historial
│       │   │   ├── payment-link/route.ts  # Crear link MP
│       │   │   └── mark-paid/route.ts     # Marcar pagado
│       │   └── stats/route.ts        # Métricas
│       ├── orders/
│       │   └── create-cash-order/route.ts  # Crear orden cash
│       └── payments/
│           └── create-preference/route.ts  # Crear orden MP
├── components/admin/orders/
│   ├── OrderList.tsx                 # Lista con columnas
│   ├── OrderDetailsModal.tsx         # Modal de detalles
│   ├── OrderActions.tsx              # Dropdown de acciones
│   ├── OrderFilters.tsx              # Filtros
│   ├── UnifiedPaymentBadge.tsx       # Badge de pago
│   └── WhatsAppQuickActions.tsx      # Acciones WhatsApp
└── hooks/admin/
    └── useOrdersEnterprise.ts        # Hook de datos
```
