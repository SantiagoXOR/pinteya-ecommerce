# 🔧 Troubleshooting - Webhook MercadoPago

## 🚨 Problemas Más Comunes

### 1. Error 403 - "Invalid Origin" ✅ SOLUCIONADO

**Síntomas:**

- El webhook devuelve status 403
- Logs muestran "Invalid webhook origin detected"

**✅ SOLUCIÓN IMPLEMENTADA:**
La función `validateWebhookOrigin` ha sido mejorada para:

- Detectar simulaciones del dashboard de MercadoPago
- Mantener seguridad para webhooks reales
- Permitir herramientas de testing (Postman, curl, etc.)
- Agregar logging detallado para debugging

**Configuración Requerida:**

```bash
# 1. URL correcta en dashboard MercadoPago
https://tu-dominio.com/api/payments/webhook

# 2. Habilitar debug (desarrollo)
MERCADOPAGO_WEBHOOK_DEBUG=true

# 3. Configurar secret del webhook
MERCADOPAGO_WEBHOOK_SECRET=tu_secret_real_del_dashboard
```

**Verificar Solución:**

```bash
# Ejecutar script de prueba
chmod +x test-webhook-simple.sh
./test-webhook-simple.sh

# O usar curl directamente
curl -X POST http://localhost:3000/api/payments/webhook \
  -H "Content-Type: application/json" \
  -H "User-Agent: MercadoPago-Webhook-Simulator/1.0" \
  -H "Referer: https://www.mercadopago.com/developers" \
  -d '{"action":"payment.updated","type":"payment","data":{"id":"test"}}'
```

**📄 Documentación Completa:** Ver `SOLUCION_ERROR_403_WEBHOOK_MERCADOPAGO.md`

---

### 2. Error 400 - "Missing Headers"

**Síntomas:**

- Status 400 con mensaje "Missing headers"
- Logs indican headers faltantes

**Headers Requeridos:**

- `x-signature`: Firma HMAC del webhook
- `x-request-id`: ID único de la solicitud
- `x-timestamp`: Timestamp de la solicitud

**Verificación:**

```bash
# Verificar headers en el dashboard de MercadoPago
# Configuración > Webhooks > Ver detalles del webhook
```

**Solución Temporal (Solo Development):**

```javascript
// En route.ts, agregar validación condicional
if (process.env.NODE_ENV === 'development') {
  // Permitir headers faltantes en desarrollo
  xSignature = xSignature || 'dev-signature'
  xRequestId = xRequestId || 'dev-request-id'
}
```

---

### 3. Error de Validación de Firma

**Síntomas:**

- "Webhook signature validation failed"
- Status 403 con error de seguridad

**Causas:**

- `MERCADOPAGO_WEBHOOK_SECRET` incorrecto
- Secret no coincide con el dashboard
- Algoritmo de validación incorrecto

**Diagnóstico:**

```bash
# 1. Verificar variable de entorno
echo $MERCADOPAGO_WEBHOOK_SECRET

# 2. Comparar con dashboard MercadoPago
# Dashboard > Configuración > Webhooks > Secret
```

**Solución:**

```bash
# 1. Obtener nuevo secret del dashboard
# 2. Actualizar variable de entorno
MERCADOPAGO_WEBHOOK_SECRET=tu_nuevo_secret_aqui

# 3. Reiniciar aplicación
npm run dev
```

**Debug de Firma:**

```javascript
// Agregar en validateWebhookSignature para debug
console.log('Signature validation debug:', {
  receivedSignature: xSignature?.substring(0, 20) + '...',
  expectedSignature: expectedSignature?.substring(0, 20) + '...',
  secret: process.env.MERCADOPAGO_WEBHOOK_SECRET ? 'SET' : 'NOT_SET',
  dataId: dataId,
  timestamp: timestamp,
})
```

---

### 4. Error 429 - Rate Limiting

**Síntomas:**

- Status 429 "Too Many Requests"
- Headers de rate limit en respuesta

**Configuración Actual:**

```javascript
// En lib/rate-limiter.ts
WEBHOOK_API: {
  windowMs: 60 * 1000, // 1 minuto
  max: 100, // 100 requests por minuto
  message: 'Too many webhook requests'
}
```

**Soluciones:**

```bash
# 1. Verificar si es ataque o uso legítimo
# 2. Ajustar límites si es necesario
# 3. Implementar whitelist para IPs de MercadoPago
```

**IPs de MercadoPago para Whitelist:**

```
209.225.49.0/24
216.33.197.0/24
216.33.196.0/24
```

---

### 5. Webhook No Recibe Notificaciones

**Síntomas:**

- No llegan webhooks de MercadoPago
- Pagos se procesan pero no se actualiza el estado

**Checklist de Verificación:**

✅ **URL del Webhook:**

```bash
# Verificar que la URL sea accesible públicamente
curl -X POST https://tu-dominio.com/api/payments/webhook
```

✅ **Configuración en Dashboard:**

- URL correcta
- Eventos seleccionados (payment.created, payment.updated)
- Webhook activo

✅ **SSL/HTTPS:**

```bash
# MercadoPago requiere HTTPS en producción
# Verificar certificado SSL
ssl-checker tu-dominio.com
```

✅ **Firewall/Proxy:**

- Permitir tráfico desde IPs de MercadoPago
- No bloquear User-Agent de MercadoPago

---

### 6. Errores de Base de Datos

**Síntomas:**

- Webhook recibe notificación pero falla al actualizar orden
- Errores de Supabase en logs

**Diagnóstico:**

```javascript
// Verificar conexión a Supabase
const { data, error } = await supabase.from('orders').select('id').limit(1)

if (error) {
  console.error('Supabase connection error:', error)
}
```

**Soluciones:**

```bash
# 1. Verificar variables de entorno de Supabase
echo $NEXT_PUBLIC_SUPABASE_URL
echo $SUPABASE_SERVICE_ROLE_KEY

# 2. Verificar permisos RLS
# 3. Revisar estructura de tabla orders
```

---

### 7. Timeouts y Performance

**Síntomas:**

- Webhook tarda mucho en responder
- MercadoPago reintenta múltiples veces
- Errores de timeout

**Optimizaciones:**

```javascript
// 1. Procesar webhook de forma asíncrona
export async function POST(request: NextRequest) {
  // Responder rápido a MercadoPago
  const response = NextResponse.json({ status: 'received' });

  // Procesar en background
  setImmediate(async () => {
    await processWebhookData(webhookData);
  });

  return response;
}
```

**Monitoreo de Performance:**

```javascript
// Agregar métricas de tiempo
const startTime = Date.now()
// ... procesamiento ...
const processingTime = Date.now() - startTime

if (processingTime > 5000) {
  logger.warn('Slow webhook processing', { processingTime })
}
```

---

## 🔍 Herramientas de Diagnóstico

### 1. Script de Verificación Completa

```javascript
// webhook-health-check.js
const axios = require('axios')

async function healthCheck() {
  const checks = [
    {
      name: 'Webhook Endpoint Accessibility',
      test: async () => {
        const response = await axios.post(
          'https://tu-dominio.com/api/payments/webhook',
          {
            test: true,
          },
          { timeout: 5000 }
        )
        return response.status < 500
      },
    },
    {
      name: 'Environment Variables',
      test: () => {
        return !!(process.env.MERCADOPAGO_WEBHOOK_SECRET && process.env.MERCADOPAGO_ACCESS_TOKEN)
      },
    },
    {
      name: 'Database Connection',
      test: async () => {
        // Test Supabase connection
        return true // Implementar test real
      },
    },
  ]

  for (const check of checks) {
    try {
      const result = await check.test()
      console.log(`${result ? '✅' : '❌'} ${check.name}`)
    } catch (error) {
      console.log(`❌ ${check.name}: ${error.message}`)
    }
  }
}

healthCheck()
```

### 2. Monitor de Logs en Tiempo Real

```bash
# Para desarrollo local
tail -f .next/server.log | grep WEBHOOK

# Para producción (Vercel)
vercel logs --follow | grep webhook

# Para producción (otros)
journalctl -u tu-app -f | grep webhook
```

### 3. Test de Carga del Webhook

```bash
# Usando Apache Bench
ab -n 100 -c 10 -p webhook-payload.json -T application/json \
   https://tu-dominio.com/api/payments/webhook

# Usando curl en loop
for i in {1..50}; do
  curl -X POST https://tu-dominio.com/api/payments/webhook \
    -H "Content-Type: application/json" \
    -d @webhook-payload.json &
done
wait
```

---

## 📊 Monitoreo y Alertas

### Métricas Clave a Monitorear

1. **Tasa de Éxito:**
   - Target: >99%
   - Alerta si <95%

2. **Tiempo de Respuesta:**
   - Target: <2 segundos
   - Alerta si >5 segundos

3. **Errores de Validación:**
   - Target: <1%
   - Alerta inmediata si >5%

4. **Rate Limiting:**
   - Monitorear 429 responses
   - Alerta si >10 por hora

### Configuración de Alertas

```javascript
// En tu sistema de monitoreo
const webhookAlerts = {
  errorRate: {
    threshold: 0.05, // 5%
    window: '5m',
    action: 'email + slack',
  },
  responseTime: {
    threshold: 5000, // 5 segundos
    window: '1m',
    action: 'slack',
  },
  signatureFailures: {
    threshold: 10,
    window: '1h',
    action: 'email + pagerduty',
  },
}
```

---

## 🛠️ Comandos de Emergencia

### Deshabilitar Webhook Temporalmente

```javascript
// Agregar al inicio de route.ts
if (process.env.DISABLE_WEBHOOK === 'true') {
  return NextResponse.json({ status: 'disabled' }, { status: 503 })
}
```

```bash
# Deshabilitar
export DISABLE_WEBHOOK=true

# Rehabilitar
unset DISABLE_WEBHOOK
```

### Bypass de Validaciones (Solo Emergencia)

```javascript
// Solo para debugging crítico
if (process.env.WEBHOOK_DEBUG_MODE === 'true') {
  // Saltear validaciones
  logger.warn('WEBHOOK DEBUG MODE ACTIVE - SECURITY BYPASSED')
}
```

### Rollback Rápido

```bash
# Si el webhook está causando problemas
# 1. Revertir a versión anterior
git revert HEAD
git push

# 2. O deshabilitar en MercadoPago dashboard
# Dashboard > Webhooks > Desactivar

# 3. Implementar webhook de emergencia
cp webhook-backup.js src/app/api/payments/webhook/route.ts
```

---

## 📞 Contactos de Soporte

### MercadoPago

- **Soporte Técnico:** https://www.mercadopago.com.ar/developers/es/support
- **Documentación:** https://www.mercadopago.com.ar/developers/es/docs
- **Status Page:** https://status.mercadopago.com/

### Logs de Referencia

```bash
# Logs exitosos esperados
[INFO] Webhook request received
[INFO] Webhook data received - type: payment
[INFO] Payment processed successfully
[INFO] Order updated: order_123

# Logs de error que requieren atención
[ERROR] Invalid webhook origin detected
[ERROR] Webhook signature validation failed
[ERROR] Database update failed
[WARN] Slow webhook processing: 8000ms
```

---

**⚠️ Importante:** Siempre probar cambios en ambiente de desarrollo antes de aplicar en producción. Mantener backups de configuraciones funcionando correctamente.
