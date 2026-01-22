# Guía de Configuración de MercadoPago por Tenant

**Fecha**: 8 de Enero, 2026  
**Versión**: 1.0.0

## 📋 Resumen

Esta guía explica cómo configurar las credenciales de MercadoPago para cada tenant en el sistema multitenant.

## 🔑 Credenciales Necesarias

Para cada tenant necesitas:

1. **Access Token** - Token de acceso para operaciones server-side
2. **Public Key** - Clave pública para el frontend (SDK de MercadoPago)
3. **Webhook Secret** - Secret para validar webhooks de MercadoPago

## 📝 Pasos de Configuración

### 1. Obtener Credenciales de MercadoPago

1. Accede al [Dashboard de MercadoPago](https://www.mercadopago.com.ar/developers/panel)
2. Selecciona tu aplicación
3. Ve a la sección "Credenciales"
4. Copia:
   - **Access Token** (Producción o Test)
   - **Public Key**
   - **Webhook Secret** (en Configuración de Webhooks)

### 2. Actualizar en Base de Datos

#### Opción A: Usando SQL Directo

```sql
UPDATE tenants
SET 
  mercadopago_access_token = 'APP_USR_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
  mercadopago_public_key = 'APP_USR_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
  mercadopago_webhook_secret = 'tu_webhook_secret_aqui'
WHERE slug = 'nombre-del-tenant';
```

#### Opción B: Usando Supabase Dashboard

1. Ve a la tabla `tenants`
2. Busca el tenant por `slug`
3. Edita los campos:
   - `mercadopago_access_token`
   - `mercadopago_public_key`
   - `mercadopago_webhook_secret`
4. Guarda los cambios

### 3. Verificar Configuración

```sql
SELECT 
  slug,
  name,
  CASE WHEN mercadopago_access_token IS NOT NULL THEN '✅' ELSE '❌' END as access_token,
  CASE WHEN mercadopago_public_key IS NOT NULL THEN '✅' ELSE '❌' END as public_key,
  CASE WHEN mercadopago_webhook_secret IS NOT NULL THEN '✅' ELSE '❌' END as webhook_secret
FROM tenants
WHERE slug = 'nombre-del-tenant';
```

### 4. Configurar Webhook en MercadoPago

1. Ve a Configuración → Webhooks en el Dashboard de MercadoPago
2. Agrega la URL del webhook:
   ```
   https://tu-dominio.com/api/payments/webhook
   ```
3. Selecciona los eventos a recibir:
   - `payment`
4. Guarda el **Webhook Secret** generado
5. Actualiza el campo `mercadopago_webhook_secret` en la base de datos

## 🧪 Testing

### Verificar Credenciales en Código

```typescript
import { getTenantConfig } from '@/lib/tenant/tenant-service'

const tenant = await getTenantConfig()

console.log('Access Token:', tenant.mercadopagoAccessToken ? '✅ Configurado' : '❌ No configurado')
console.log('Public Key:', tenant.mercadopagoPublicKey ? '✅ Configurado' : '❌ No configurado')
console.log('Webhook Secret:', tenant.mercadopagoWebhookSecret ? '✅ Configurado' : '❌ No configurado')
```

### Probar Creación de Preferencia

```bash
curl -X POST https://tu-dominio.com/api/payments/create-preference \
  -H "Content-Type: application/json" \
  -d '{
    "items": [{
      "id": "1",
      "quantity": 1
    }],
    "payer": {
      "name": "Test",
      "surname": "User",
      "email": "test@example.com"
    }
  }'
```

Si las credenciales están configuradas correctamente, deberías recibir una respuesta con `init_point`.

## 🔒 Seguridad

### Buenas Prácticas

1. **Nunca expongas el Access Token** en el frontend
2. **Usa diferentes credenciales** para producción y test
3. **Rota las credenciales** periódicamente
4. **Valida el Webhook Secret** en cada webhook recibido
5. **Usa HTTPS** para todas las comunicaciones

### Variables de Entorno (Fallback)

En desarrollo, si un tenant no tiene credenciales configuradas, el sistema puede usar variables de entorno como fallback:

```env
MERCADOPAGO_ACCESS_TOKEN=APP_USR_...
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=APP_USR_...
MERCADOPAGO_WEBHOOK_SECRET=...
```

⚠️ **Nota**: En producción, siempre usa credenciales del tenant en la base de datos.

## 📊 Estado de Configuración

### Verificar Todos los Tenants

```sql
SELECT 
  slug,
  name,
  CASE WHEN mercadopago_access_token IS NOT NULL THEN '✅' ELSE '❌' END as access_token,
  CASE WHEN mercadopago_public_key IS NOT NULL THEN '✅' ELSE '❌' END as public_key,
  CASE WHEN mercadopago_webhook_secret IS NOT NULL THEN '✅' ELSE '❌' END as webhook_secret,
  is_active
FROM tenants
ORDER BY slug;
```

### Health Check

El sistema incluye un health check que verifica las credenciales de todos los tenants:

```typescript
// Verificar en /api/health o usando el sistema de health checks
const healthCheck = await checkMercadoPagoHealth()
console.log(healthCheck.details.tenants)
```

## 🐛 Troubleshooting

### Error: "MercadoPago no configurado para este tenant"

**Causa**: El tenant no tiene credenciales configuradas.

**Solución**:
1. Verifica que el tenant existe en la base de datos
2. Verifica que los campos de MercadoPago no son NULL
3. Actualiza las credenciales siguiendo los pasos anteriores

### Error: "Invalid webhook signature"

**Causa**: El webhook secret no coincide.

**Solución**:
1. Verifica que el `mercadopago_webhook_secret` en la BD coincide con el configurado en MercadoPago
2. Verifica que estás usando el secret del tenant correcto
3. Re-genera el webhook secret en MercadoPago si es necesario

### Error: "Payment preference creation failed"

**Causa**: El access token es inválido o expirado.

**Solución**:
1. Verifica que el access token es válido
2. Verifica que estás usando el token correcto (producción vs test)
3. Genera un nuevo access token en MercadoPago si es necesario

## 📚 Referencias

- [Documentación de Migración](./MIGRACION_MERCADOPAGO_MULTITENANT.md)
- [Documentación de MercadoPago](https://www.mercadopago.com.ar/developers/es/docs)
- [Sistema Multitenant](./MULTITENANCY.md)

---

**Última actualización**: 8 de Enero, 2026
