# 🔧 SOLUCIÓN COMPLETA PARA TESTING DE MERCADOPAGO

## 🎯 **PROBLEMA IDENTIFICADO**

El error "Algo salió mal... No pudimos procesar tu pago" en MercadoPago indica problemas con:

1. **Credenciales de Sandbox incorrectas o expiradas**
2. **Uso de tarjetas de prueba incorrectas**
3. **Configuración de entorno de testing**
4. **URLs de webhook y retorno mal configuradas**

## ✅ **SOLUCIÓN PASO A PASO**

### **1. VERIFICAR CREDENCIALES DE SANDBOX**

Tus credenciales actuales:

```bash
MERCADOPAGO_ACCESS_TOKEN=[TU_MERCADOPAGO_ACCESS_TOKEN]
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=[TU_MERCADOPAGO_PUBLIC_KEY]
```

**Verificación necesaria:**

1. Ir a [MercadoPago Developers](https://www.mercadopago.com.ar/developers/panel/app)
2. Verificar que las credenciales sean de **SANDBOX/TEST**
3. Regenerar credenciales si es necesario

### **2. TARJETAS DE PRUEBA OFICIALES DE MERCADOPAGO**

**Para Argentina (ARS):**

| Tarjeta              | Número                | CVV    | Vencimiento | Resultado   |
| -------------------- | --------------------- | ------ | ----------- | ----------- |
| **Visa**             | `4509 9535 6623 3704` | `123`  | `11/25`     | ✅ Aprobado |
| **Mastercard**       | `5031 7557 3453 0604` | `123`  | `11/25`     | ✅ Aprobado |
| **American Express** | `3711 803032 57522`   | `1234` | `11/25`     | ✅ Aprobado |

**Tarjetas para probar rechazos:**

| Número                | CVV   | Vencimiento | Resultado                 |
| --------------------- | ----- | ----------- | ------------------------- |
| `4013 5406 8274 6260` | `123` | `11/25`     | ❌ Fondos insuficientes   |
| `5031 7557 3453 0604` | `123` | `11/25`     | ❌ Rechazado por el banco |

**Datos del titular para pruebas:**

- **Nombre**: APRO (para aprobado) o OTHE (para rechazado)
- **Apellido**: APRO o OTHE
- **DNI**: 12345678 (Argentina)
- **Email**: test_user_123456@testuser.com

### **3. CREAR USUARIOS DE PRUEBA**

**Paso 1: Crear usuario vendedor**

```bash
curl -X POST \
-H "Content-Type: application/json" \
-H "Authorization: Bearer [TU_MERCADOPAGO_ACCESS_TOKEN]" \
"https://api.mercadopago.com/users/test" \
-d '{
  "site_id": "MLA",
  "description": "Vendedor Test - Pinteya"
}'
```

**Paso 2: Crear usuario comprador**

```bash
curl -X POST \
-H "Content-Type: application/json" \
-H "Authorization: Bearer [TU_MERCADOPAGO_ACCESS_TOKEN]" \
"https://api.mercadopago.com/users/test" \
-d '{
  "site_id": "MLA",
  "description": "Comprador Test - Pinteya"
}'
```

### **4. CONFIGURAR WEBHOOKS CORRECTAMENTE**

**URLs de retorno necesarias:**

```javascript
back_urls: {
  success: "http://localhost:3000/checkout/success",
  failure: "http://localhost:3000/checkout/failure",
  pending: "http://localhost:3000/checkout/pending"
}
```

**URL de webhook:**

```
http://localhost:3000/api/payments/webhook
```

### **5. VERIFICAR CONFIGURACIÓN DE ENTORNO**

**Variables de entorno correctas:**

```bash
# MercadoPago Sandbox
MERCADOPAGO_ACCESS_TOKEN=APP_USR-[TU_ACCESS_TOKEN_TEST]
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=APP_USR-[TU_PUBLIC_KEY_TEST]
MERCADOPAGO_CLIENT_ID=[TU_CLIENT_ID]
MERCADOPAGO_CLIENT_SECRET=[TU_CLIENT_SECRET]

# URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

## 🧪 **PROCESO DE TESTING COMPLETO**

### **Paso 1: Verificar Credenciales**

```bash
# Test de credenciales
curl -X GET \
-H "Authorization: Bearer [TU_MERCADOPAGO_ACCESS_TOKEN]" \
"https://api.mercadopago.com/users/me"
```

### **Paso 2: Probar Creación de Preferencia**

```bash
curl -X POST \
-H "Content-Type: application/json" \
-H "Authorization: Bearer [TU_MERCADOPAGO_ACCESS_TOKEN]" \
"https://api.mercadopago.com/checkout/preferences" \
-d '{
  "items": [
    {
      "title": "Test Product",
      "quantity": 1,
      "unit_price": 100
    }
  ],
  "back_urls": {
    "success": "http://localhost:3000/checkout/success",
    "failure": "http://localhost:3000/checkout/failure",
    "pending": "http://localhost:3000/checkout/pending"
  },
  "auto_return": "approved"
}'
```

### **Paso 3: Testing en la Aplicación**

1. **Ir a checkout**: `http://localhost:3000/checkout`
2. **Llenar formulario** con datos de prueba
3. **Usar tarjeta de prueba**: `4509 9535 6623 3704`
4. **Datos del titular**:
   - Nombre: APRO
   - Apellido: APRO
   - DNI: 12345678
   - Email: test@test.com

## 🔧 **SOLUCIONES ESPECÍFICAS**

### **Si el error persiste:**

1. **Regenerar credenciales** en MercadoPago Dashboard
2. **Verificar que estés en modo Sandbox**
3. **Usar exactamente las tarjetas de prueba oficiales**
4. **Verificar que las URLs de retorno sean accesibles**

### **Debugging adicional:**

1. **Revisar logs del servidor** para errores de API
2. **Verificar network tab** en DevTools
3. **Comprobar respuesta de la API** de preferencias

## 📋 **CHECKLIST DE VERIFICACIÓN**

- [ ] Credenciales de MercadoPago son de SANDBOX
- [ ] Tarjetas de prueba son las oficiales
- [ ] URLs de retorno están configuradas
- [ ] Webhook URL es accesible
- [ ] Usuarios de prueba creados
- [ ] Datos del titular son correctos (APRO/OTHE)
- [ ] Servidor de desarrollo corriendo en puerto 3000

## 🚀 **PRÓXIMOS PASOS**

1. **Verificar credenciales** con el comando curl
2. **Crear usuarios de prueba** si no existen
3. **Probar con tarjetas oficiales** de MercadoPago
4. **Implementar páginas de retorno** (success/failure/pending)
5. **Configurar webhook handler** para notificaciones

---

**💡 NOTA IMPORTANTE**: El entorno de sandbox de MercadoPago es muy estricto. Debes usar exactamente las tarjetas de prueba oficiales y los datos de titular especificados para que funcione correctamente.
