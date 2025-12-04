# Comandos de Prueba para Webhook de MercadoPago

## 🧪 Pruebas Locales del Webhook

### 1. Prueba de Conectividad Básica

```bash
# Verificar que el endpoint responde
curl -X POST http://localhost:3000/api/payments/webhook \
  -H "Content-Type: application/json" \
  -d '{"test": "connectivity"}'
```

### 2. Prueba con Datos de Webhook Simulados

```bash
# Simular webhook de pago aprobado
curl -X POST http://localhost:3000/api/payments/webhook \
  -H "Content-Type: application/json" \
  -H "x-signature: ts=1234567890,v1=test_signature" \
  -H "x-request-id: test-request-123" \
  -H "x-timestamp: $(date +%s)" \
  -d '{
    "type": "payment",
    "action": "payment.updated",
    "data": {
      "id": "123456789"
    },
    "date_created": "2024-01-01T12:00:00Z",
    "id": 12345,
    "live_mode": false,
    "user_id": "123456",
    "api_version": "v1"
  }'
```

### 3. Prueba con ngrok (Para Pruebas con MercadoPago Real)

```bash
# 1. Instalar ngrok si no lo tienes
npm install -g ngrok

# 2. Exponer tu servidor local
ngrok http 3000

# 3. Usar la URL de ngrok en el dashboard de MercadoPago
# Ejemplo: https://abc123.ngrok.io/api/payments/webhook
```

## 🔧 Scripts de PowerShell para Windows

### Script de Prueba Básica

```powershell
# test-webhook-basic.ps1
$uri = "http://localhost:3000/api/payments/webhook"
$headers = @{
    "Content-Type" = "application/json"
    "x-signature" = "ts=1234567890,v1=test_signature"
    "x-request-id" = "test-request-123"
    "x-timestamp" = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds().ToString()
}

$body = @{
    type = "payment"
    action = "payment.updated"
    data = @{
        id = "123456789"
    }
    date_created = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ssZ")
    id = 12345
    live_mode = $false
    user_id = "123456"
    api_version = "v1"
} | ConvertTo-Json -Depth 3

try {
    $response = Invoke-RestMethod -Uri $uri -Method POST -Headers $headers -Body $body
    Write-Host "✅ Webhook test successful:" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 3
} catch {
    Write-Host "❌ Webhook test failed:" -ForegroundColor Red
    Write-Host $_.Exception.Message
}
```

### Script de Prueba de Rate Limiting

```powershell
# test-webhook-rate-limit.ps1
$uri = "http://localhost:3000/api/payments/webhook"
$headers = @{
    "Content-Type" = "application/json"
}

$body = @{
    type = "payment"
    action = "payment.updated"
    data = @{ id = "test" }
} | ConvertTo-Json

Write-Host "Testing rate limiting..." -ForegroundColor Yellow

for ($i = 1; $i -le 20; $i++) {
    try {
        $response = Invoke-RestMethod -Uri $uri -Method POST -Headers $headers -Body $body
        Write-Host "Request $i: ✅ Success" -ForegroundColor Green
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        if ($statusCode -eq 429) {
            Write-Host "Request $i: ⚠️ Rate limited (429)" -ForegroundColor Yellow
        } else {
            Write-Host "Request $i: ❌ Error ($statusCode)" -ForegroundColor Red
        }
    }
    Start-Sleep -Milliseconds 100
}
```

## 🌐 Pruebas con Herramientas Online

### 1. Usando Postman

**Configuración:**

- Method: POST
- URL: `http://localhost:3000/api/payments/webhook`
- Headers:
  ```
  Content-Type: application/json
  x-signature: ts=1234567890,v1=test_signature
  x-request-id: test-request-123
  x-timestamp: {{$timestamp}}
  ```
- Body (JSON):
  ```json
  {
    "type": "payment",
    "action": "payment.updated",
    "data": {
      "id": "123456789"
    },
    "date_created": "2024-01-01T12:00:00Z",
    "id": 12345,
    "live_mode": false,
    "user_id": "123456",
    "api_version": "v1"
  }
  ```

### 2. Usando Insomnia

Similar configuración a Postman, pero con la interfaz de Insomnia.

## 🔍 Verificación de Logs

### Comandos para Verificar Logs

```bash
# Ver logs en tiempo real (si usas PM2)
pm2 logs

# Ver logs del servidor Next.js
npm run dev

# Verificar logs en la consola del navegador
# Abrir DevTools -> Console
```

### Logs Esperados

```
✅ Logs exitosos:
[WEBHOOK] Webhook request received
[WEBHOOK] Webhook data received
[WEBHOOK] Payment processed successfully

❌ Logs de error:
[SECURITY] Invalid webhook origin detected
[SECURITY] Missing required webhook headers
[SECURITY] Webhook signature validation failed
```

## 🧪 Pruebas de Integración

### Script de Prueba Completa

```javascript
// test-webhook-integration.js
const axios = require('axios')

async function testWebhook() {
  const baseURL = 'http://localhost:3000'

  const testCases = [
    {
      name: 'Valid Payment Webhook',
      data: {
        type: 'payment',
        action: 'payment.updated',
        data: { id: '123456789' },
        date_created: new Date().toISOString(),
        id: 12345,
        live_mode: false,
        user_id: '123456',
        api_version: 'v1',
      },
      headers: {
        'x-signature': 'ts=1234567890,v1=test_signature',
        'x-request-id': 'test-request-123',
        'x-timestamp': Math.floor(Date.now() / 1000).toString(),
      },
      expectedStatus: 200,
    },
    {
      name: 'Missing Headers',
      data: {
        type: 'payment',
        action: 'payment.updated',
        data: { id: '123456789' },
      },
      headers: {},
      expectedStatus: 400,
    },
    {
      name: 'Non-Payment Webhook',
      data: {
        type: 'subscription',
        action: 'subscription.updated',
        data: { id: '123456789' },
      },
      headers: {
        'x-signature': 'ts=1234567890,v1=test_signature',
        'x-request-id': 'test-request-123',
        'x-timestamp': Math.floor(Date.now() / 1000).toString(),
      },
      expectedStatus: 200,
    },
  ]

  for (const testCase of testCases) {
    try {
      console.log(`\n🧪 Testing: ${testCase.name}`)

      const response = await axios.post(`${baseURL}/api/payments/webhook`, testCase.data, {
        headers: {
          'Content-Type': 'application/json',
          ...testCase.headers,
        },
        validateStatus: () => true, // No throw on error status
      })

      if (response.status === testCase.expectedStatus) {
        console.log(`✅ PASS: Status ${response.status}`)
      } else {
        console.log(`❌ FAIL: Expected ${testCase.expectedStatus}, got ${response.status}`)
      }

      console.log(`Response:`, response.data)
    } catch (error) {
      console.log(`❌ ERROR: ${error.message}`)
    }
  }
}

// Ejecutar pruebas
testWebhook().catch(console.error)
```

### Ejecutar el Script de Prueba

```bash
# Instalar axios si no lo tienes
npm install axios

# Ejecutar las pruebas
node test-webhook-integration.js
```

## 📊 Monitoreo en Producción

### Verificar Estado del Webhook

```bash
# Verificar que el webhook esté funcionando en producción
curl -X GET https://tu-dominio.com/api/health/webhook

# Verificar logs de webhook en Vercel (si usas Vercel)
vercel logs --follow
```

### Métricas a Monitorear

- ✅ Tasa de éxito de webhooks
- ⏱️ Tiempo de respuesta
- 🔒 Intentos de acceso no autorizados
- 📈 Volumen de webhooks por hora
- ❌ Errores de validación de firma

## 🚨 Troubleshooting

### Problemas Comunes

1. **Error 403 - Invalid Origin**
   - Verificar que la URL del webhook esté correctamente configurada
   - Revisar la función `validateWebhookOrigin`

2. **Error 400 - Missing Headers**
   - Asegurar que MercadoPago esté enviando los headers requeridos
   - Verificar configuración del webhook en el dashboard

3. **Error 429 - Rate Limited**
   - Revisar configuración de rate limiting
   - Verificar si hay demasiadas solicitudes desde la misma IP

4. **Signature Validation Failed**
   - Verificar que `MERCADOPAGO_WEBHOOK_SECRET` esté configurado
   - Revisar que el secret coincida con el del dashboard

### Comandos de Diagnóstico

```bash
# Verificar variables de entorno
echo $MERCADOPAGO_WEBHOOK_SECRET
echo $MERCADOPAGO_ACCESS_TOKEN

# Verificar conectividad
ping mercadopago.com

# Verificar puerto local
netstat -an | grep :3000
```

---

**Nota:** Recuerda reemplazar `localhost:3000` con tu URL real en producción y configurar correctamente todas las variables de entorno antes de ejecutar las pruebas.
