# API de Sincronización con ERPs

## Descripción General

La API de sincronización permite que sistemas externos (ERPs como Aikon, SAP, Tango) envíen actualizaciones de stock, precios y otros datos a la plataforma PintureríaDigital.

## Endpoint Base

```
POST /api/sync/[system]
GET  /api/sync/[system]
```

Donde `[system]` es el código del sistema externo en minúsculas:
- `aikon` - Aikon ERP
- `sap` - SAP Business One
- `tango` - Tango Gestión
- `custom` - Sistema personalizado

---

## Autenticación

### API Key

Todas las peticiones deben incluir una API Key válida en el header:

```
X-API-Key: tu-api-key-aqui
```

La API Key se configura en la tabla `tenant_external_systems.api_credentials`:

```json
{
  "api_key": "STRIPE_API_KEY_PLACEHOLDER"
}
```

### Generación de API Key

Las API Keys deben ser generadas de forma segura. Recomendación:

```bash
openssl rand -base64 32
```

---

## Endpoints

### GET /api/sync/[system]

Verifica el estado de la conexión con el sistema externo.

**Request:**

```bash
curl -X GET https://pintureriadigital.com/api/sync/aikon \
  -H "X-API-Key: tu-api-key"
```

**Response (200 OK):**

```json
{
  "status": "connected",
  "system": "AIKON",
  "tenant": "pinteya",
  "lastSync": "2026-01-21T15:30:00Z",
  "capabilities": ["stock_sync", "price_sync", "order_export"]
}
```

**Response (401 Unauthorized):**

```json
{
  "error": "Invalid or missing API key"
}
```

---

### POST /api/sync/[system]

Envía actualizaciones de productos (stock, precios).

**Request:**

```bash
curl -X POST https://pintureriadigital.com/api/sync/aikon \
  -H "X-API-Key: tu-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "products": [
      {
        "external_code": "LAT-INT-20L",
        "stock": 150,
        "price": 45000,
        "discounted_price": 42000
      },
      {
        "external_code": "LAT-EXT-4L",
        "stock": 75
      }
    ]
  }'
```

**Campos del producto:**

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `external_code` | string | Sí | Código del producto en el ERP |
| `stock` | number | No | Cantidad en stock |
| `price` | number | No | Precio sin descuento (centavos) |
| `discounted_price` | number | No | Precio con descuento (centavos) |

**Response (200 OK):**

```json
{
  "success": true,
  "processed": 2,
  "updated": 2,
  "failed": 0,
  "errors": [],
  "details": [
    {
      "external_code": "LAT-INT-20L",
      "product_id": 123,
      "status": "updated",
      "changes": {
        "stock": { "from": 100, "to": 150 },
        "price": { "from": 44000, "to": 45000 }
      }
    },
    {
      "external_code": "LAT-EXT-4L",
      "product_id": 456,
      "status": "updated",
      "changes": {
        "stock": { "from": 50, "to": 75 }
      }
    }
  ]
}
```

**Response con errores parciales (200 OK):**

```json
{
  "success": true,
  "processed": 3,
  "updated": 2,
  "failed": 1,
  "errors": [
    {
      "external_code": "PROD-INEXISTENTE",
      "error": "Product not found in catalog"
    }
  ]
}
```

**Response (400 Bad Request):**

```json
{
  "error": "Invalid request body",
  "details": "products array is required"
}
```

**Response (401 Unauthorized):**

```json
{
  "error": "Unauthorized",
  "message": "Invalid API key or system not configured for this tenant"
}
```

---

## Lógica de Actualización de Stock

### Stock Compartido (Shared Pool)

Si el tenant usa un pool de stock compartido (ej: Pinteya y Pintemas comparten depósito):

1. Se actualiza la tabla `shared_pool_stock`
2. Todos los tenants conectados al pool ven el nuevo stock

```sql
UPDATE shared_pool_stock 
SET stock = 150, last_sync_at = NOW(), sync_source = 'AIKON'
WHERE pool_id = 'pool-uuid' AND product_id = 123;
```

### Stock Independiente

Si el tenant tiene stock propio:

1. Se actualiza la tabla `tenant_products`
2. Solo el tenant específico ve el cambio

```sql
UPDATE tenant_products 
SET stock = 150
WHERE tenant_id = 'tenant-uuid' AND product_id = 123;
```

---

## Mapeo de Códigos Externos

Los códigos de producto del ERP se mapean a productos globales mediante la tabla `tenant_product_external_ids`:

| tenant_id | product_id | external_system_id | external_code |
|-----------|------------|-------------------|---------------|
| pinteya-uuid | 123 | aikon-uuid | LAT-INT-20L |
| pintemas-uuid | 123 | aikon-uuid | LAT-INT-20L |

Para buscar un producto por código externo:

```sql
SELECT p.*, tp.*
FROM products p
JOIN tenant_product_external_ids tpei ON p.id = tpei.product_id
JOIN tenant_products tp ON p.id = tp.product_id
WHERE tpei.external_code = 'LAT-INT-20L'
  AND tpei.tenant_id = 'pinteya-uuid';
```

---

## Webhooks (Opcional)

Para recibir notificaciones de eventos, configura webhooks en `tenant_external_systems`:

```json
{
  "webhook_url": "https://tu-erp.com/webhook/pintureria",
  "webhook_secret": "whsec_xxxxxxxx",
  "webhook_events": ["order.created", "order.paid", "order.shipped"]
}
```

### Eventos Disponibles

| Evento | Descripción |
|--------|-------------|
| `order.created` | Nueva orden creada |
| `order.paid` | Orden pagada |
| `order.shipped` | Orden enviada |
| `order.cancelled` | Orden cancelada |
| `product.low_stock` | Stock bajo mínimo |

### Formato del Webhook

```json
{
  "event": "order.created",
  "timestamp": "2026-01-21T15:30:00Z",
  "tenant": "pinteya",
  "data": {
    "order_id": "ORD-12345",
    "total": 125000,
    "items": [...]
  },
  "signature": "sha256=xxxxxxxx"
}
```

### Verificación de Firma

```javascript
const crypto = require('crypto');

function verifyWebhook(payload, signature, secret) {
  const expected = 'sha256=' + crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}
```

---

## Rate Limits

| Plan | Requests/minuto | Requests/día |
|------|-----------------|--------------|
| Básico | 60 | 10,000 |
| Pro | 300 | 100,000 |
| Enterprise | Sin límite | Sin límite |

Headers de respuesta:

```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1642780800
```

---

## Ejemplos de Integración

### Aikon ERP (Node.js)

```javascript
const axios = require('axios');

async function syncStockToPlataforma(products) {
  try {
    const response = await axios.post(
      'https://pintureriadigital.com/api/sync/aikon',
      { products },
      {
        headers: {
          'X-API-Key': process.env.PINTURERIA_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log(`Sincronizados: ${response.data.updated} productos`);
    
    if (response.data.errors.length > 0) {
      console.error('Errores:', response.data.errors);
    }
  } catch (error) {
    console.error('Error de sincronización:', error.response?.data);
  }
}

// Uso
syncStockToPlataforma([
  { external_code: 'LAT-INT-20L', stock: 150, price: 45000 },
  { external_code: 'LAT-EXT-4L', stock: 75 }
]);
```

### SAP Business One (C#)

```csharp
using System.Net.Http;
using System.Text.Json;

public class PintureriaSync
{
    private readonly HttpClient _client;
    private readonly string _apiKey;

    public PintureriaSync(string apiKey)
    {
        _client = new HttpClient();
        _apiKey = apiKey;
    }

    public async Task<SyncResult> SyncProducts(List<ProductUpdate> products)
    {
        var request = new HttpRequestMessage(
            HttpMethod.Post,
            "https://pintureriadigital.com/api/sync/sap"
        );
        
        request.Headers.Add("X-API-Key", _apiKey);
        request.Content = new StringContent(
            JsonSerializer.Serialize(new { products }),
            Encoding.UTF8,
            "application/json"
        );

        var response = await _client.SendAsync(request);
        var content = await response.Content.ReadAsStringAsync();
        
        return JsonSerializer.Deserialize<SyncResult>(content);
    }
}
```

### Python

```python
import requests

def sync_stock(api_key: str, products: list):
    response = requests.post(
        'https://pintureriadigital.com/api/sync/aikon',
        headers={
            'X-API-Key': api_key,
            'Content-Type': 'application/json'
        },
        json={'products': products}
    )
    
    result = response.json()
    
    if result.get('success'):
        print(f"Sincronizados: {result['updated']} productos")
    else:
        print(f"Error: {result.get('error')}")
    
    return result

# Uso
sync_stock(
    api_key='STRIPE_API_KEY_PLACEHOLDER',
    products=[
        {'external_code': 'LAT-INT-20L', 'stock': 150},
        {'external_code': 'LAT-EXT-4L', 'stock': 75}
    ]
)
```

---

## Errores Comunes

| Código | Error | Solución |
|--------|-------|----------|
| 401 | Invalid API key | Verificar API key en header |
| 404 | System not found | Usar código de sistema válido |
| 400 | Invalid request body | Verificar formato JSON |
| 422 | Product not found | El external_code no está mapeado |
| 429 | Rate limit exceeded | Reducir frecuencia de requests |
| 500 | Internal server error | Contactar soporte |

---

## Contacto

Para soporte técnico o nuevas integraciones:
- Email: dev@pintureriadigital.com
- Documentación: https://docs.pintureriadigital.com
