# 🔗 CONFIGURACIÓN DE WEBHOOK DE PRODUCCIÓN - MERCADOPAGO

## 📋 Información del Webhook

### **URL del Webhook de Producción:**

```
https://pinteya.com/api/payments/webhook
```

### **Método HTTP:**

```
POST
```

### **Eventos a Configurar:**

- `payment` - Notificaciones de pagos
- `merchant_order` - Notificaciones de órdenes

---

## 🛠️ Pasos para Configurar en MercadoPago Dashboard

### **1. Acceder al Dashboard de MercadoPago**

1. Ir a: https://www.mercadopago.com.ar/developers
2. Iniciar sesión con las credenciales de producción
3. Seleccionar la aplicación de producción

### **2. Configurar Webhook**

1. En el menú lateral, ir a **"Webhooks"**
2. Hacer clic en **"Crear webhook"**
3. Configurar los siguientes campos:

#### **Configuración del Webhook:**

```
URL: https://pinteya.com/api/payments/webhook
Nombre: Pinteya E-commerce Production Webhook
Descripción: Webhook para procesar notificaciones de pagos en producción
```

#### **Eventos a Seleccionar:**

- ✅ `payment` - Pagos
- ✅ `merchant_order` - Órdenes de comercio

#### **Configuración Avanzada:**

```
Método HTTP: POST
Timeout: 30 segundos
Reintentos: 3 intentos
```

### **3. Obtener Secret del Webhook**

1. Después de crear el webhook, copiar el **"Secret"** generado
2. Actualizar la variable de entorno:
   ```bash
   MERCADOPAGO_WEBHOOK_SECRET=el_secret_generado_por_mercadopago
   ```

---

## 🔐 Configuración de Seguridad

### **Variables de Entorno Requeridas:**

```bash
# Webhook Secret (obtenido del dashboard de MercadoPago)
MERCADOPAGO_WEBHOOK_SECRET=webhook_secret_from_dashboard

# Credenciales de Producción
MERCADOPAGO_ACCESS_TOKEN=[TU_MERCADOPAGO_ACCESS_TOKEN]
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=[TU_MERCADOPAGO_PUBLIC_KEY]
MERCADOPAGO_CLIENT_ID=[TU_MERCADOPAGO_CLIENT_ID]
MERCADOPAGO_CLIENT_SECRET=kCyTlavw8B2l9zJ7T5IMeR3nOhLOHrTm

# Entorno de Producción
MERCADOPAGO_ENVIRONMENT=production
NODE_ENV=production
```

### **Validaciones de Seguridad Implementadas:**

- ✅ Validación de firma HMAC
- ✅ Validación de origen de IP
- ✅ Rate limiting avanzado
- ✅ Logging de seguridad
- ✅ Circuit breaker para fallos

---

## 🧪 Validación del Webhook

### **1. Test de Conectividad**

```bash
curl -X POST https://pinteya.com/api/payments/webhook \
  -H "Content-Type: application/json" \
  -H "x-signature: test" \
  -H "x-request-id: test-123" \
  -d '{"action":"payment.created","api_version":"v1","data":{"id":"test"},"date_created":"2024-01-01T00:00:00Z","id":123,"live_mode":true,"type":"payment","user_id":"123456"}'
```

### **2. Verificar Logs**

```bash
# En el servidor de producción
tail -f /var/log/pinteya/webhook.log
```

### **3. Monitoreo de Webhook**

- Dashboard: `https://pinteya.com/admin/monitoring`
- Métricas: `https://pinteya.com/api/admin/monitoring/metrics`
- Alertas: Configuradas para fallos > 5%

---

## 📊 Métricas y Monitoreo

### **Métricas Clave:**

- **Tasa de éxito**: > 99%
- **Tiempo de respuesta**: < 2 segundos
- **Rate limit**: 100 requests/minuto
- **Reintentos**: Máximo 3 por evento

### **Alertas Configuradas:**

- Fallos consecutivos > 5
- Tiempo de respuesta > 5 segundos
- Rate limit excedido
- Errores de validación de firma

---

## 🚨 Troubleshooting

### **Problemas Comunes:**

#### **1. Error 401 - Unauthorized**

```
Causa: Secret del webhook incorrecto
Solución: Verificar MERCADOPAGO_WEBHOOK_SECRET
```

#### **2. Error 429 - Rate Limit**

```
Causa: Demasiadas requests
Solución: Implementar backoff exponencial en MercadoPago
```

#### **3. Error 500 - Internal Server Error**

```
Causa: Error en procesamiento interno
Solución: Revisar logs en /admin/monitoring
```

### **Comandos de Diagnóstico:**

```bash
# Verificar configuración
curl https://pinteya.com/api/health

# Verificar webhook específicamente
curl https://pinteya.com/api/admin/monitoring/health

# Ver métricas en tiempo real
curl https://pinteya.com/api/admin/monitoring/metrics
```

---

## ✅ Checklist de Configuración

### **Pre-Despliegue:**

- [ ] Credenciales de producción configuradas
- [ ] Webhook URL configurada en MercadoPago Dashboard
- [ ] Secret del webhook actualizado en variables de entorno
- [ ] SSL certificado válido en https://pinteya.com
- [ ] Rate limiting configurado
- [ ] Monitoreo activo

### **Post-Despliegue:**

- [ ] Test de conectividad exitoso
- [ ] Primer pago de prueba procesado
- [ ] Logs sin errores
- [ ] Métricas dentro de rangos esperados
- [ ] Alertas funcionando

---

## 📞 Contacto de Soporte

**En caso de problemas:**

- Email: soporte@pinteya.com
- Dashboard: https://pinteya.com/admin/monitoring
- Logs: https://pinteya.com/admin/monitoring/reports

---

**🎯 Estado:** Listo para configuración en producción
**📅 Última actualización:** 2024-01-09
**👤 Responsable:** Santiago XOR (santiago@xor.com.ar)
