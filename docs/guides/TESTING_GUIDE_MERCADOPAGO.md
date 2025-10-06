# 🧪 GUÍA COMPLETA DE TESTING MERCADOPAGO

## ✅ **CONFIGURACIÓN VERIFICADA**

Tu configuración de MercadoPago está **100% funcional**:

- ✅ **Credenciales válidas**: Sandbox/Test configurado correctamente
- ✅ **API funcionando**: Conexión exitosa con MercadoPago
- ✅ **Preferencias**: Se pueden crear correctamente
- ✅ **Usuario de prueba**: Test Test (test_user_1456236357@testuser.com)
- ✅ **País**: Argentina (MLA)

## 🎯 **PROBLEMA IDENTIFICADO Y SOLUCIONADO**

El error "No pudimos procesar tu pago" se debía a:

1. **Uso de tarjetas incorrectas** (no las oficiales de MercadoPago)
2. **Datos del titular incorrectos** (no usar APRO/OTHE)
3. **Falta de páginas de retorno** (success/failure/pending)

**TODAS ESTAS ISSUES HAN SIDO CORREGIDAS** ✅

## 💳 **TARJETAS DE PRUEBA OFICIALES**

### **Para Pagos Aprobados:**

| Tarjeta              | Número                | CVV    | Vencimiento |
| -------------------- | --------------------- | ------ | ----------- |
| **Visa**             | `4509 9535 6623 3704` | `123`  | `11/25`     |
| **Mastercard**       | `5031 7557 3453 0604` | `123`  | `11/25`     |
| **American Express** | `3711 803032 57522`   | `1234` | `11/25`     |

### **Para Pagos Rechazados (Testing):**

| Tarjeta  | Número                | CVV   | Vencimiento | Error                |
| -------- | --------------------- | ----- | ----------- | -------------------- |
| **Visa** | `4013 5406 8274 6260` | `123` | `11/25`     | Fondos insuficientes |

### **Datos del Titular:**

| Campo        | Valor para Aprobado | Valor para Rechazado |
| ------------ | ------------------- | -------------------- |
| **Nombre**   | `APRO`              | `OTHE`               |
| **Apellido** | `APRO`              | `OTHE`               |
| **DNI**      | `12345678`          | `12345678`           |
| **Email**    | `test@test.com`     | `test@test.com`      |

## 🧪 **PROCESO DE TESTING PASO A PASO**

### **Paso 1: Preparar el Entorno**

```bash
# Verificar que el servidor esté corriendo
npm run dev

# Verificar configuración (opcional)
node scripts/test-mercadopago.js
```

### **Paso 2: Agregar Producto al Carrito**

1. Ir a `http://localhost:3000`
2. Agregar cualquier producto al carrito
3. Ir al carrito y verificar que el producto esté ahí

### **Paso 3: Iniciar Checkout**

1. Hacer clic en "Finalizar Compra"
2. Ir a `http://localhost:3000/checkout`
3. Verificar que el formulario se carga sin errores

### **Paso 4: Llenar Formulario de Checkout**

```
Email: test@test.com
Nombre: APRO
Apellido: APRO
DNI: 12345678
Teléfono: 351 123 4567
Dirección: Av. Corrientes 1234, Córdoba
```

### **Paso 5: Procesar Pago**

1. Hacer clic en "Pagar $[MONTO]"
2. Verificar que se redirige a MercadoPago
3. **IMPORTANTE**: Usar las tarjetas de prueba oficiales

### **Paso 6: Completar Pago en MercadoPago**

1. En la página de MercadoPago, seleccionar "Tarjeta"
2. Ingresar datos de la tarjeta de prueba:
   - **Número**: `4509 9535 6623 3704`
   - **Vencimiento**: `11/25`
   - **CVV**: `123`
   - **Titular**: `APRO APRO`
   - **DNI**: `12345678`
3. Hacer clic en "Pagar"

### **Paso 7: Verificar Resultado**

- **Pago Exitoso**: Redirige a `/checkout/success`
- **Pago Fallido**: Redirige a `/checkout/failure`
- **Pago Pendiente**: Redirige a `/checkout/pending`

## 🔧 **SOLUCIÓN A PROBLEMAS COMUNES**

### **"No pudimos procesar tu pago"**

✅ **SOLUCIONADO**: Usar exactamente las tarjetas de prueba oficiales

### **"Datos de tarjeta inválidos"**

✅ **SOLUCIONADO**: Usar datos del titular APRO/APRO/12345678

### **"Error de conexión"**

- Verificar que el servidor esté corriendo en puerto 3000
- Verificar conexión a internet

### **"Página no encontrada después del pago"**

✅ **SOLUCIONADO**: Páginas de retorno creadas (success/failure/pending)

## 🎯 **CASOS DE PRUEBA ESPECÍFICOS**

### **Caso 1: Pago Exitoso**

```
Tarjeta: 4509 9535 6623 3704
CVV: 123
Vencimiento: 11/25
Titular: APRO APRO
DNI: 12345678
Resultado Esperado: ✅ Pago aprobado → /checkout/success
```

### **Caso 2: Pago Rechazado**

```
Tarjeta: 4013 5406 8274 6260
CVV: 123
Vencimiento: 11/25
Titular: OTHE OTHE
DNI: 12345678
Resultado Esperado: ❌ Pago rechazado → /checkout/failure
```

### **Caso 3: Datos Incorrectos**

```
Tarjeta: 1234 5678 9012 3456 (inventada)
Resultado Esperado: ❌ Error de validación
```

## 📋 **CHECKLIST DE VERIFICACIÓN**

- [ ] Servidor corriendo en puerto 3000
- [ ] Producto agregado al carrito
- [ ] Formulario de checkout completado
- [ ] Tarjeta de prueba oficial utilizada
- [ ] Datos del titular correctos (APRO/APRO/12345678)
- [ ] Redirección a MercadoPago exitosa
- [ ] Pago procesado correctamente
- [ ] Redirección de vuelta a la aplicación
- [ ] Página de resultado mostrada correctamente

## 🚀 **PRÓXIMOS PASOS DESPUÉS DEL TESTING**

1. **Implementar webhook handler** para notificaciones
2. **Configurar emails de confirmación**
3. **Implementar gestión de pedidos**
4. **Configurar credenciales de producción** (cuando esté listo)

## 📞 **SOPORTE**

Si encuentras algún problema:

1. Verificar que uses exactamente las tarjetas de prueba oficiales
2. Verificar que los datos del titular sean APRO/APRO/12345678
3. Revisar los logs del navegador (F12 → Console)
4. Ejecutar `node scripts/test-mercadopago.js` para verificar configuración

---

**🎉 ¡Tu configuración de MercadoPago está lista para testing!**

Usa las tarjetas de prueba oficiales y los datos del titular especificados para obtener resultados exitosos.
