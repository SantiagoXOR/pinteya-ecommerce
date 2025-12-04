# 🔗 GUÍA COMPLETA: Configuración del Webhook de MercadoPago

## 📋 Resumen de tu Implementación Actual

Tu aplicación ya tiene implementado un sistema de webhook robusto con las siguientes características:

✅ **Endpoint del webhook**: `/api/payments/webhook`  
✅ **Validación de firma HMAC** para seguridad  
✅ **Rate limiting** avanzado (100 req/min)  
✅ **Circuit breaker** para manejo de fallos  
✅ **Logging estructurado** completo  
✅ **Validación de origen** de requests  
✅ **Procesamiento automático** de estados de pago

---

## 🎯 PASO 1: Configurar Webhook en MercadoPago Dashboard

### **1.1 Acceder al Dashboard**

1. Ve a: **https://www.mercadopago.com.ar/developers**
2. Inicia sesión con tu cuenta de MercadoPago
3. Selecciona tu aplicación (o crea una nueva si no tienes)

### **1.2 Navegar a Webhooks**

1. En el menú lateral izquierdo, busca **"Webhooks"**
2. Haz clic en **"Crear webhook"** o **"Nuevo webhook"**

### **1.3 Configurar el Webhook**

Completa los siguientes campos:

```
📍 URL del Webhook:
https://tu-dominio.com/api/payments/webhook

📝 Nombre:
PinteYA E-commerce Webhook

📄 Descripción:
Webhook para procesar notificaciones de pagos del e-commerce PinteYA

⚠️ IMPORTANTE: La URL correcta es /api/payments/webhook
(También funciona /api/mercadopago/webhook como alias)
```

### **1.4 Seleccionar Eventos**

Marca las siguientes casillas:

- ✅ **payment** - Notificaciones de pagos
- ✅ **merchant_order** - Notificaciones de órdenes (opcional pero recomendado)

### **1.5 Configuración Avanzada**

```
🔧 Método HTTP: POST
⏱️ Timeout: 30 segundos
🔄 Reintentos: 3 intentos
🔒 Versión API: v1 (más reciente disponible)
```

### **1.6 Guardar y Obtener Secret**

1. Haz clic en **"Crear"** o **"Guardar"**
2. **¡IMPORTANTE!** Copia el **"Secret"** que aparece
3. Guárdalo en un lugar seguro (lo necesitarás para las variables de entorno)

---

## 🔐 PASO 2: Configurar Variables de Entorno

### **2.1 Variables Requeridas**

Agrega estas variables a tu archivo `.env.local` o `.env`:

```bash
# ===== WEBHOOK CONFIGURATION =====
MERCADOPAGO_WEBHOOK_SECRET=tu_secret_del_dashboard_aqui

# ===== DEBUGGING CONFIGURATION =====
# Habilitar para debugging de webhooks (solo desarrollo)
MERCADOPAGO_WEBHOOK_DEBUG=false

# ===== MERCADOPAGO CREDENTIALS =====
# Para desarrollo (sandbox)
MERCADOPAGO_ACCESS_TOKEN=TEST-tu-access-token-de-prueba
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=TEST-tu-public-key-de-prueba

# Para producción (descomenta cuando vayas a producción)
# MERCADOPAGO_ACCESS_TOKEN=APP_USR-tu-access-token-de-produccion
# NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=APP_USR-tu-public-key-de-produccion

# ===== ENVIRONMENT SETTINGS =====
MERCADOPAGO_ENVIRONMENT=sandbox  # Cambia a 'production' cuando vayas a producción
NODE_ENV=development  # Cambia a 'production' cuando vayas a producción

# ===== APP CONFIGURATION =====
NEXT_PUBLIC_APP_URL=http://localhost:3000  # Tu URL de desarrollo
# NEXT_PUBLIC_APP_URL=https://tu-dominio.com  # Tu URL de producción
```

### **2.2 Verificar Configuración**

Ejecuta este comando para verificar que las variables estén cargadas:

```bash
npm run dev
```

Revisa la consola para asegurarte de que no hay errores de configuración.

---

## 🧪 PASO 3: Probar el Webhook

### **3.1 Prueba Local con ngrok (Desarrollo)**

Si estás desarrollando localmente, necesitas exponer tu servidor:

```bash
# Instalar ngrok si no lo tienes
npm install -g ngrok

# Exponer tu servidor local
ngrok http 3000

# Usar la URL HTTPS que te da ngrok en el dashboard de MercadoPago
# Ejemplo: https://abc123.ngrok.io/api/payments/webhook
```

### **3.2 Prueba Manual del Endpoint**

Puedes probar tu webhook manualmente con este comando:

```bash
curl -X POST http://localhost:3000/api/payments/webhook \
  -H "Content-Type: application/json" \
  -H "x-signature: ts=1640995200,v1=test_signature" \
  -H "x-request-id: test-request-123" \
  -d '{
    "action": "payment.created",
    "api_version": "v1",
    "data": {
      "id": "test_payment_id"
    },
    "date_created": "2024-01-01T00:00:00Z",
    "id": 123,
    "live_mode": false,
    "type": "payment",
    "user_id": "123456"
  }'
```

### **3.3 Verificar Logs**

Revisa los logs de tu aplicación para ver si el webhook se está procesando:

```bash
# En tu terminal donde corre la app
# Deberías ver logs como:
# [WEBHOOK] Webhook request received
# [WEBHOOK] Webhook signature validated successfully
# [WEBHOOK] Payment processed successfully
```

---

## 🔍 PASO 4: Verificar Funcionamiento

### **4.1 Realizar una Compra de Prueba**

1. Ve a tu tienda en desarrollo
2. Agrega productos al carrito
3. Procede al checkout
4. Usa las **credenciales de prueba** de MercadoPago:

```
💳 Tarjeta de Prueba APROBADA:
Número: 4509 9535 6623 3704
Código: 123
Vencimiento: 11/25
Nombre: APRO

💳 Tarjeta de Prueba RECHAZADA:
Número: 4013 5406 8274 6260
Código: 123
Vencimiento: 11/25
Nombre: OTHE
```

### **4.2 Monitorear el Proceso**

1. **Completa el pago** en MercadoPago
2. **Revisa los logs** de tu aplicación
3. **Verifica en tu base de datos** que el estado del pedido se actualizó
4. **Confirma** que se envió el email de confirmación (si está configurado)

---

## 🚨 PASO 5: Troubleshooting Común

### **❌ Error: "Missing required headers"**

**Causa**: MercadoPago no está enviando los headers necesarios  
**Solución**: Verifica que la URL del webhook esté correcta y sea accesible públicamente

### **❌ Error: "Invalid signature"**

**Causa**: El secret del webhook no coincide  
**Solución**:

1. Ve al dashboard de MercadoPago
2. Copia nuevamente el secret del webhook
3. Actualiza la variable `MERCADOPAGO_WEBHOOK_SECRET`

### **❌ Error: "Rate limit exceeded"**

**Causa**: Demasiadas requests al webhook  
**Solución**: Esto es normal, el sistema tiene rate limiting. Espera un minuto y reintenta.

### **❌ Error: "Payment not found"**

**Causa**: El ID del pago no existe en MercadoPago  
**Solución**:

1. Verifica que estés usando el entorno correcto (sandbox/production)
2. Confirma que el access token sea válido

### **❌ Webhook no se ejecuta**

**Posibles causas y soluciones**:

1. **URL no accesible**: Usa ngrok para desarrollo local
2. **Firewall bloqueando**: Verifica configuración de red
3. **SSL inválido**: MercadoPago requiere HTTPS válido en producción

---

## 🎯 PASO 6: Ir a Producción

### **6.1 Actualizar Variables de Entorno**

```bash
# Cambiar a credenciales de producción
MERCADOPAGO_ACCESS_TOKEN=APP_USR-tu-access-token-de-produccion
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=APP_USR-tu-public-key-de-produccion
MERCADOPAGO_ENVIRONMENT=production
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://tu-dominio.com
```

### **6.2 Crear Nuevo Webhook en Producción**

1. En el dashboard de MercadoPago, cambia a **"Credenciales de producción"**
2. Crea un nuevo webhook con la URL de producción
3. Actualiza el `MERCADOPAGO_WEBHOOK_SECRET` con el nuevo secret

### **6.3 Verificar Funcionamiento**

1. Realiza una compra real con tarjeta real (monto pequeño)
2. Verifica que todo el flujo funcione correctamente
3. Monitorea los logs durante las primeras horas

---

## 📊 Monitoreo y Métricas

Tu implementación incluye un sistema de monitoreo avanzado:

- **Dashboard de métricas**: `/admin/monitoring`
- **API de métricas**: `/api/metrics`
- **Logs estructurados** con categorías
- **Alertas automáticas** para errores

---

## 🆘 Soporte

Si tienes problemas:

1. **Revisa los logs** de tu aplicación primero
2. **Verifica las variables de entorno**
3. **Prueba con ngrok** en desarrollo
4. **Consulta la documentación** de MercadoPago: https://www.mercadopago.com.ar/developers/es/docs

---

## ✅ Checklist Final

- [ ] Webhook creado en MercadoPago Dashboard
- [ ] Secret copiado y configurado en variables de entorno
- [ ] Eventos `payment` y `merchant_order` seleccionados
- [ ] URL del webhook correcta y accesible
- [ ] Prueba manual exitosa
- [ ] Compra de prueba completada
- [ ] Estados de pedido actualizándose correctamente
- [ ] Emails de confirmación enviándose
- [ ] Logs mostrando procesamiento exitoso

¡Tu webhook de MercadoPago está listo! 🎉
