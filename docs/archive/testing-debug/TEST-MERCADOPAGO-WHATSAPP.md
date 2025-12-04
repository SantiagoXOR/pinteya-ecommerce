# Test Local: MercadoPago WhatsApp Redirection

Este directorio contiene scripts para probar localmente la funcionalidad de redirección a WhatsApp después del pago con MercadoPago.

## 🚀 Configuración Rápida

### 1. Instalar dependencias de test
```bash
node setup-test.js
```

### 2. Configurar variables de entorno
Edita el archivo `.env.local` y configura:
```bash
# Base de datos Supabase
NEXT_PUBLIC_SUPABASE_URL=tu_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_supabase_service_role_key

# MercadoPago (usar tokens de TEST)
MERCADOPAGO_ACCESS_TOKEN=TEST-tu_access_token
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=TEST-tu_public_key

# WhatsApp
WHATSAPP_BUSINESS_NUMBER=5493513411796

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Iniciar servidor de desarrollo
```bash
npm run dev
```

### 4. Ejecutar tests (en otra terminal)
```bash
node run-mercadopago-test.js
```

## 📋 Tests Disponibles

### Test 1: Generación de Mensaje WhatsApp
```bash
node test-whatsapp-message.js
```
- ✅ Verifica que la función de generación de mensaje funcione
- ✅ No requiere servidor ni base de datos
- ✅ Muestra el contenido del mensaje generado

### Test 2: Test Completo con API
```bash
node test-mercadopago-whatsapp.js
```
- ✅ Crea una preferencia de pago real
- ✅ Verifica que se genere el WhatsApp link
- ✅ Prueba la página de éxito
- ⚠️ Requiere servidor corriendo y base de datos

### Test 3: Test Completo con Servidor
```bash
node run-mercadopago-test.js
```
- ✅ Ejecuta todos los tests
- ✅ Inicia el servidor automáticamente si es necesario
- ✅ Verifica todo el flujo completo

## 🔍 Qué Verifica Cada Test

### ✅ Generación de Mensaje
- [x] Mensaje contiene "MercadoPago"
- [x] Mensaje contiene "Pinteya"
- [x] Mensaje contiene número de orden
- [x] Mensaje contiene total formateado
- [x] Mensaje contiene datos personales
- [x] Mensaje contiene lista de productos
- [x] Mensaje contiene datos de envío
- [x] Mensaje termina con confirmación

### ✅ API de MercadoPago
- [x] Preferencia se crea correctamente
- [x] Orden se guarda en base de datos
- [x] WhatsApp link se genera y guarda
- [x] URLs de retorno están configuradas
- [x] Página de éxito es accesible

### ✅ Flujo Completo
- [x] Servidor local funciona
- [x] APIs responden correctamente
- [x] Base de datos está conectada
- [x] Variables de entorno están configuradas

## 🐛 Solución de Problemas

### Error: "Servidor local no está corriendo"
```bash
# Iniciar servidor manualmente
npm run dev

# En otra terminal, ejecutar test
node run-mercadopago-test.js
```

### Error: "Database service unavailable"
- Verificar variables de Supabase en `.env.local`
- Verificar que la base de datos esté accesible
- Verificar que las tablas `orders` y `order_items` existan

### Error: "Error creando preferencia"
- Verificar tokens de MercadoPago en `.env.local`
- Usar tokens de TEST, no de producción
- Verificar que `NEXT_PUBLIC_APP_URL` esté configurado

### Error: "Orden no encontrada"
- Verificar que el endpoint `/api/orders/[id]` funcione
- Verificar que la orden se esté creando correctamente
- Revisar logs del servidor para más detalles

## 📊 Interpretación de Resultados

### ✅ Test Exitoso
```
🎉 ¡TEST EXITOSO! El mensaje de WhatsApp se genera correctamente
📊 RESULTADO: 10/10 verificaciones pasaron
```

### ⚠️ Test con Advertencias
```
⚠️ Algunas verificaciones fallaron. Revisar el código.
📊 RESULTADO: 8/10 verificaciones pasaron
```

### ❌ Test Fallido
```
❌ ERROR EN EL TEST: Error creando preferencia: 500 - Internal Server Error
```

## 🚀 Deploy a Producción

Una vez que todos los tests pasen localmente:

1. **Hacer commit de los cambios**
```bash
git add .
git commit -m "feat: add WhatsApp redirection for MercadoPago payments"
```

2. **Deploy a producción**
```bash
git push origin main
# O el comando de deploy que uses
```

3. **Verificar en producción**
- Crear una orden de prueba
- Pagar con MercadoPago
- Verificar que redirija a WhatsApp

## 📝 Logs Importantes

En los logs de Vercel, buscar:
- `[MERCADOPAGO] URLs de retorno configuradas:`
- `[WHATSAPP] Generando link de WhatsApp:`
- `[WHATSAPP] WhatsApp link guardado exitosamente`

## 🔧 Archivos Modificados

- `src/app/api/payments/create-preference/route.ts` - Generación de WhatsApp link
- `src/app/(site)/(pages)/checkout/mercadopago-success/page.tsx` - Página de éxito
- `src/lib/integrations/whatsapp/whatsapp-utils.ts` - Utilidades de WhatsApp

## 📞 Soporte

Si encuentras problemas:
1. Revisar logs del servidor
2. Verificar variables de entorno
3. Ejecutar tests individuales para aislar el problema
4. Revisar la documentación de MercadoPago
