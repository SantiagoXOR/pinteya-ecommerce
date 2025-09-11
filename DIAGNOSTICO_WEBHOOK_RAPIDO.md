# 🔧 DIAGNÓSTICO RÁPIDO - WEBHOOK MERCADOPAGO

## ❌ PROBLEMA IDENTIFICADO Y SOLUCIONADO

### **Error Original:**
- **Código**: 307 - Temporary Redirect
- **Causa**: El archivo alias `/api/mercadopago/webhook/route.ts` intentaba exportar una función `GET` que no existe
- **Síntoma**: MercadoPago no podía procesar las notificaciones correctamente

### **Solución Aplicada:**
✅ **Corregido el archivo alias** - Removida exportación de función `GET` inexistente
✅ **Actualizada la URL del webhook** - Usar `/api/mercadopago/webhook` en lugar de `/api/payments/webhook`

---

## 🧪 PRUEBAS RÁPIDAS POST-CORRECCIÓN

### **1. Verificar Endpoint Localmente**
```bash
# Probar que el endpoint responde correctamente
curl -X POST http://localhost:3000/api/mercadopago/webhook \
  -H "Content-Type: application/json" \
  -H "x-signature: test" \
  -H "x-request-id: test-123" \
  -d '{
    "type": "payment",
    "action": "payment.updated",
    "data": {
      "id": "123456789"
    }
  }'
```

**Respuesta Esperada:**
- ❌ Status 400 (Missing headers) - CORRECTO, significa que el endpoint funciona
- ❌ Status 401 (Invalid signature) - CORRECTO, significa que la validación funciona
- ✅ NO debe devolver 307 (Redirect)

### **2. Verificar en MercadoPago Dashboard**
1. Ir a: https://www.mercadopago.com.ar/developers
2. Seleccionar tu aplicación
3. Ir a **Webhooks**
4. **ACTUALIZAR la URL del webhook a:**
   ```
   https://tu-dominio.com/api/mercadopago/webhook
   ```

### **3. Probar con Simulación Real**
```bash
# Usar ngrok para exponer tu servidor local
ngrok http 3000

# Configurar webhook temporal con la URL de ngrok:
# https://abc123.ngrok.io/api/mercadopago/webhook
```

---

## 📊 VERIFICACIÓN DE LOGS

### **Logs a Monitorear:**
```bash
# En tu aplicación, buscar estos logs:
✅ "Webhook request received" - Confirma que llegan las notificaciones
✅ "Webhook signature validated successfully" - Confirma validación de seguridad
✅ "Payment webhook processed" - Confirma procesamiento exitoso

❌ "Invalid webhook origin detected" - Problema de origen
❌ "Webhook signature validation failed" - Problema de firma
❌ "Rate limit exceeded" - Demasiadas requests
```

### **Comandos de Monitoreo:**
```bash
# Ver logs en tiempo real (si usas PM2)
pm2 logs --lines 50

# Ver logs de Next.js en desarrollo
npm run dev

# Filtrar solo logs de webhook
grep "webhook" logs/app.log
```

---

## 🚨 CHECKLIST POST-CORRECCIÓN

### **Inmediato (Hacer AHORA):**
- [ ] ✅ Reiniciar la aplicación/servidor
- [ ] ✅ Actualizar URL del webhook en MercadoPago Dashboard
- [ ] ✅ Probar endpoint con curl (comando arriba)
- [ ] ✅ Verificar que no devuelve 307

### **Verificación Completa:**
- [ ] Crear un pago de prueba en MercadoPago
- [ ] Verificar que el webhook recibe la notificación
- [ ] Confirmar que el estado del pago se actualiza en la base de datos
- [ ] Revisar logs para errores

### **Monitoreo Continuo:**
- [ ] Configurar alertas para errores 4xx/5xx en webhook
- [ ] Monitorear latencia de procesamiento
- [ ] Verificar rate limiting no bloquee requests legítimos

---

## 📞 SOPORTE RÁPIDO

### **Si Persisten Problemas:**

1. **Verificar Variables de Entorno:**
   ```bash
   echo $MERCADOPAGO_WEBHOOK_SECRET
   echo $MERCADOPAGO_ACCESS_TOKEN
   ```

2. **Revisar Configuración de Red:**
   - Firewall permite tráfico desde IPs de MercadoPago
   - SSL/HTTPS configurado correctamente
   - No hay proxy bloqueando requests

3. **Contactar Soporte:**
   - MercadoPago: developers@mercadopago.com
   - Documentación: https://www.mercadopago.com.ar/developers/es/docs/your-integrations/webhooks

---

## 🎯 PRÓXIMOS PASOS

1. **Probar la corrección** con los comandos de arriba
2. **Actualizar webhook URL** en MercadoPago Dashboard
3. **Monitorear logs** durante las próximas transacciones
4. **Documentar** cualquier problema adicional

**¡El problema del 307 debería estar resuelto!** 🎉