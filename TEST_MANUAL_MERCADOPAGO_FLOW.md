# Guía de Pruebas Manuales - Flujo de MercadoPago Mejorado

## ✅ Implementación Completada

La implementación del flujo mejorado de Mercado Pago ha sido completada exitosamente. Todos los cambios necesarios están en su lugar.

## 🎯 Cambios Implementados

### 1. API de Creación de Preferencia
**Archivo**: `src/app/api/payments/create-preference/route.ts`

✅ **Cambios aplicados**:
- El costo de envío se distribuye proporcionalmente entre todos los productos
- Se eliminó la sección `shipments` para que no aparezca como ítem separado en MercadoPago
- La URL de éxito cambió a `/checkout/mercadopago-success`

### 2. Función Helper WhatsApp
**Archivo**: `src/lib/integrations/whatsapp/whatsapp-utils.ts`

✅ **Nueva función agregada**: `generateMercadoPagoWhatsAppMessage()`
- Genera mensajes específicos para órdenes de MercadoPago
- Incluye detalles completos del pedido
- Formato consistente con el flujo de pago contra entrega

### 3. Página de Éxito de MercadoPago
**Archivo**: `src/app/(site)/(pages)/checkout/mercadopago-success/page.tsx`

✅ **Nueva página creada** con:
- Redirección automática a WhatsApp con countdown de 5 segundos
- Mensaje pre-cargado con detalles del pedido
- Fallbacks múltiples (copiar mensaje, llamar, email)
- UI consistente y responsive

### 4. Tests E2E Actualizados
**Archivo**: `tests/e2e/checkout-mercadopago.spec.ts`

✅ **Nuevos tests agregados**:
- Verificación de que el envío no aparece como ítem separado
- Test de la página de éxito y redirección a WhatsApp
- Interceptación de API para validar estructura

## 📋 Pruebas Manuales Recomendadas

### Prueba 1: Verificar que el envío no aparece en MercadoPago

1. **Navegar a**: `http://localhost:3000/products`
2. **Agregar un producto al carrito**
3. **Ir a**: `http://localhost:3000/checkout`
4. **Seleccionar**: Método de pago "MercadoPago"
5. **Completar el formulario** con datos de prueba
6. **Hacer clic en**: "Confirmar Pedido"
7. **Verificar en MercadoPago**:
   - ✅ NO debe aparecer una línea separada para "Costo de envío"
   - ✅ El total debe ser correcto (productos + envío incluido)
   - ✅ Solo deben aparecer los productos con sus precios ajustados

### Prueba 2: Verificar redirección a WhatsApp

1. **Acceder directamente a**: `http://localhost:3000/checkout/mercadopago-success?order_id=123`
2. **Verificar que aparece**:
   - ✅ Mensaje "¡Pago Exitoso!"
   - ✅ Detalles del pedido
   - ✅ Contador de redirección (5... 4... 3... 2... 1...)
   - ✅ Botón "Ir a WhatsApp Ahora"
   - ✅ Botones de fallback (Copiar, Llamar, Email)
3. **Esperar 5 segundos** o hacer clic en el botón
4. **Verificar**:
   - ✅ Se abre WhatsApp en una nueva pestaña
   - ✅ El mensaje está pre-cargado con los detalles de la orden
   - ✅ El mensaje incluye: orden, cliente, productos, total, método de pago

### Prueba 3: Flujo completo de compra

1. **Añadir productos al carrito**
2. **Ir al checkout**
3. **Seleccionar MercadoPago**
4. **Completar formulario**
5. **Proceder a MercadoPago**
6. **Completar el pago** (en sandbox si es posible)
7. **Verificar redirección a**: `/checkout/mercadopago-success?order_id=X`
8. **Verificar redirección automática a WhatsApp**

## 🔍 Puntos de Verificación

### En MercadoPago:
- [ ] No aparece "Costo de envío" como ítem separado
- [ ] El total mostrado es correcto
- [ ] Los precios de productos incluyen el envío distribuido

### En la Página de Éxito:
- [ ] Muestra correctamente los detalles del pedido
- [ ] El contador funciona correctamente
- [ ] La redirección automática funciona
- [ ] El botón manual de WhatsApp funciona
- [ ] Los botones de fallback funcionan

### En WhatsApp:
- [ ] El mensaje incluye todos los detalles del pedido
- [ ] El formato es claro y legible
- [ ] El número de teléfono del negocio es correcto

## 🐛 Problemas Conocidos

### Problema con Tests E2E
**Error**: El servidor de Playwright tiene problemas con `required-server-files.json`

**Solución temporal**: Realizar pruebas manuales en lugar de automatizadas

**Para resolver**:
1. Asegurarse de que el build está completo: `npm run build`
2. Usar el servidor de desarrollo: `npm run dev`
3. Probar manualmente en el navegador

## 📝 Notas para Producción

Antes de desplegar a producción:

1. **Verificar variables de entorno**:
   - `NEXT_PUBLIC_APP_URL` debe apuntar a la URL de producción
   - Las credenciales de MercadoPago deben ser de producción (no sandbox)

2. **Probar en Mercado Pago sandbox primero**:
   - Confirmar que el total es correcto
   - Verificar que no hay ítems duplicados de envío

3. **Configurar número de WhatsApp**:
   - Actualizar `businessPhone` en `mercadopago-success/page.tsx` si es necesario
   - Verificar que el número está en formato internacional

4. **Monitorear primeras transacciones**:
   - Verificar que los totales en la base de datos coinciden con MercadoPago
   - Confirmar que la redirección a WhatsApp funciona en móviles

## 🎉 Resultado Esperado

Con esta implementación, el flujo de MercadoPago ahora es **consistente** con el flujo de pago contra entrega:

- ❌ **Antes**: Envío como ítem separado confuso + sin redirección a WhatsApp
- ✅ **Ahora**: Envío incluido en precio + redirección automática a WhatsApp

El usuario tiene una experiencia fluida y natural que termina en WhatsApp para confirmar su pedido con el negocio.

---

**Estado**: ✅ **IMPLEMENTACIÓN COMPLETADA - LISTA PARA PRUEBAS MANUALES**
**Fecha**: 2025-10-16
**Desarrollador**: AI Assistant
