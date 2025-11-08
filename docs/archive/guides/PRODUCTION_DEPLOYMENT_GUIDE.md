# 🚀 Guía de Despliegue a Producción - Sistema de Pagos MercadoPago

## 📋 Checklist Pre-Producción

### ✅ Configuración Completada

- [x] Sistema de mock funcional para desarrollo
- [x] Credenciales de sandbox configuradas y probadas
- [x] Webhooks implementados y validados
- [x] Tests automatizados E2E funcionando
- [x] Documentación completa de testing

### 🔄 Pendiente para Producción

- [ ] Obtener credenciales de producción de MercadoPago
- [ ] Configurar variables de entorno de producción
- [ ] Configurar webhook URL de producción
- [ ] Validar certificados SSL
- [ ] Configurar monitoreo y alertas

---

## 🏦 Obtener Credenciales de Producción

### 1. Proceso en MercadoPago

1. **Acceder al Dashboard de MercadoPago**:
   - Ir a [https://www.mercadopago.com.ar/developers](https://www.mercadopago.com.ar/developers)
   - Iniciar sesión con tu cuenta de MercadoPago

2. **Crear Aplicación de Producción**:

   ```
   Developers > Mis aplicaciones > Crear aplicación
   - Nombre: "Pinteya E-commerce"
   - Producto: "Checkout Pro"
   - Modelo de integración: "Marketplace"
   ```

3. **Completar Información Requerida**:
   - Información de la empresa
   - Datos fiscales
   - URLs de la aplicación
   - Descripción del negocio

4. **Obtener Credenciales**:
   ```
   Credenciales > Producción
   - Public Key: PROD_PUBLIC_KEY_XXXXXXXX
   - Access Token: PROD_ACCESS_TOKEN_XXXXXXXX
   - Client ID: PROD_CLIENT_ID_XXXXXXXX
   - Client Secret: PROD_CLIENT_SECRET_XXXXXXXX
   ```

### 2. Validaciones Requeridas

MercadoPago requiere validar:

- ✅ **Identidad de la empresa**
- ✅ **Información fiscal (CUIT/CUIL)**
- ✅ **Cuenta bancaria para recibir pagos**
- ✅ **Certificado SSL válido en producción**
- ✅ **Política de privacidad y términos de servicio**

---

## 🔧 Configuración de Variables de Entorno

### Archivo `.env.production`

```bash
# ===================================
# PINTEYA E-COMMERCE - PRODUCCIÓN
# ===================================

# Application
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://pinteya.com
VERCEL_ENV=production

# MercadoPago - PRODUCCIÓN
MERCADOPAGO_ACCESS_TOKEN=PROD_ACCESS_TOKEN_XXXXXXXX
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=PROD_PUBLIC_KEY_XXXXXXXX
MERCADOPAGO_CLIENT_ID=PROD_CLIENT_ID_XXXXXXXX
MERCADOPAGO_CLIENT_SECRET=PROD_CLIENT_SECRET_XXXXXXXX
MERCADOPAGO_WEBHOOK_SECRET=WEBHOOK_SECRET_XXXXXXXX
MERCADOPAGO_ENVIRONMENT=production

# Deshabilitar mock en producción
NEXT_PUBLIC_MOCK_PAYMENTS=false

# Supabase - Producción
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto-prod.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=PROD_ANON_KEY_XXXXXXXX
SUPABASE_SERVICE_ROLE_KEY=PROD_SERVICE_ROLE_KEY_XXXXXXXX

# Seguridad
NEXTAUTH_SECRET=PROD_SECRET_XXXXXXXX
NEXTAUTH_URL=https://pinteya.com

# Redis - Producción
REDIS_URL=redis://prod-redis-url:6379
REDIS_PASSWORD=PROD_REDIS_PASSWORD

# Email - Producción
RESEND_API_KEY=PROD_RESEND_API_KEY
RESEND_FROM_EMAIL=noreply@pinteya.com
RESEND_SUPPORT_EMAIL=soporte@pinteya.com

# Monitoreo
ANALYTICS_ENABLED=true
SENTRY_DSN=https://sentry-dsn-prod
```

### Configuración en Vercel

```bash
# Configurar variables en Vercel Dashboard
vercel env add MERCADOPAGO_ACCESS_TOKEN production
vercel env add NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY production
vercel env add MERCADOPAGO_CLIENT_ID production
vercel env add MERCADOPAGO_CLIENT_SECRET production
vercel env add MERCADOPAGO_WEBHOOK_SECRET production

# O usar CLI
vercel env pull .env.production
```

---

## 🔗 Configuración de Webhooks en Producción

### 1. URL del Webhook

```
https://pinteya.com/api/payments/webhook
```

### 2. Configurar en MercadoPago Dashboard

```
Developers > Webhooks > Crear webhook
- URL: https://pinteya.com/api/payments/webhook
- Eventos: payment, merchant_order
- Versión: v1
```

### 3. Validar Webhook

```bash
# Test del webhook en producción
curl -X POST https://pinteya.com/api/payments/webhook \
  -H "Content-Type: application/json" \
  -H "x-signature: VALID_SIGNATURE" \
  -d '{"type": "payment", "data": {"id": "test"}}'
```

### 4. Monitoreo de Webhooks

```javascript
// Implementado en src/app/api/payments/webhook/route.ts
- ✅ Validación de firma HMAC
- ✅ Rate limiting
- ✅ Logging completo
- ✅ Métricas de performance
- ✅ Circuit breaker
```

---

## 🛡️ Validaciones de Seguridad

### 1. Certificado SSL

```bash
# Verificar SSL en producción
curl -I https://pinteya.com
# Debe retornar: HTTP/2 200

# Verificar certificado
openssl s_client -connect pinteya.com:443 -servername pinteya.com
```

### 2. Headers de Seguridad

```javascript
// next.config.js - Headers de seguridad
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block',
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin',
  },
]
```

### 3. Validación de Entorno

```javascript
// lib/env-config.ts - Validaciones de producción
export function validateProductionEnvironment() {
  const errors = []

  if (!process.env.MERCADOPAGO_ACCESS_TOKEN?.startsWith('APP_USR')) {
    errors.push('Invalid MercadoPago access token for production')
  }

  if (!process.env.NEXT_PUBLIC_APP_URL?.startsWith('https://')) {
    errors.push('HTTPS required in production')
  }

  if (process.env.NEXT_PUBLIC_MOCK_PAYMENTS === 'true') {
    errors.push('Mock payments must be disabled in production')
  }

  return { isValid: errors.length === 0, errors }
}
```

---

## 📊 Monitoreo y Alertas

### 1. Métricas Clave

```javascript
// Métricas a monitorear en producción
const productionMetrics = {
  payments: {
    successRate: '>95%',
    averageResponseTime: '<2s',
    errorRate: '<5%',
  },
  webhooks: {
    processingTime: '<1s',
    successRate: '>99%',
    retryRate: '<10%',
  },
  api: {
    availability: '>99.9%',
    responseTime: '<500ms',
    errorRate: '<1%',
  },
}
```

### 2. Configurar Alertas

```bash
# Sentry para errores
SENTRY_DSN=https://your-sentry-dsn

# Uptime monitoring
UPTIME_ROBOT_API_KEY=your-api-key

# Email alerts
ALERT_EMAIL=admin@pinteya.com
```

### 3. Dashboard de Monitoreo

```
/admin/monitoring - Dashboard interno
- Estado de APIs
- Métricas de pagos
- Logs de errores
- Performance metrics
```

---

## 🚀 Proceso de Despliegue

### 1. Pre-Despliegue

```bash
# 1. Ejecutar tests completos
npm run test:e2e

# 2. Validar build de producción
npm run build

# 3. Verificar variables de entorno
npm run validate:env:production

# 4. Ejecutar tests de integración
npm run test:integration
```

### 2. Despliegue

```bash
# Despliegue automático con Vercel
git push origin main

# O despliegue manual
vercel --prod
```

### 3. Post-Despliegue

```bash
# 1. Verificar aplicación
curl -I https://pinteya.com

# 2. Test de webhook
curl -X POST https://pinteya.com/api/payments/webhook

# 3. Verificar métricas
curl https://pinteya.com/api/health

# 4. Test de pago real (con tarjeta de prueba)
# Realizar compra de $1 ARS para validar flujo completo
```

---

## 🔄 Rollback Plan

### En caso de problemas

```bash
# 1. Rollback inmediato
vercel rollback

# 2. Revertir a versión anterior
git revert HEAD
git push origin main

# 3. Activar modo mantenimiento
# Configurar en Vercel o CDN

# 4. Notificar a usuarios
# Email automático + banner en sitio
```

---

## 📋 Checklist Final

### Antes de ir a producción:

- [ ] **Credenciales de producción** obtenidas y configuradas
- [ ] **Webhook URL** configurada en MercadoPago
- [ ] **Certificado SSL** válido y funcionando
- [ ] **Variables de entorno** de producción configuradas
- [ ] **Tests E2E** pasando al 100%
- [ ] **Monitoreo** configurado y funcionando
- [ ] **Alertas** configuradas para errores críticos
- [ ] **Backup** de base de datos configurado
- [ ] **Plan de rollback** documentado y probado
- [ ] **Equipo** notificado del despliegue

### Post-Producción:

- [ ] **Verificar** que todos los servicios funcionan
- [ ] **Monitorear** métricas por 24-48 horas
- [ ] **Realizar** transacción de prueba real
- [ ] **Documentar** cualquier issue encontrado
- [ ] **Optimizar** basado en métricas reales

---

## 🆘 Contactos de Emergencia

```
MercadoPago Soporte: soporte@mercadopago.com
Vercel Support: support@vercel.com
Supabase Support: support@supabase.io

Equipo Interno:
- DevOps: devops@pinteya.com
- Backend: backend@pinteya.com
- Frontend: frontend@pinteya.com
```

---

**🎯 ¡Tu sistema de pagos está listo para producción!**

Una vez completados todos los pasos de este checklist, tendrás un sistema de pagos robusto, seguro y completamente funcional en producción.
