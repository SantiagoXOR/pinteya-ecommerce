# 🚀 DESPLIEGUE DE PRODUCCIÓN EN VERCEL - PINTEYA E-COMMERCE

## 📋 Variables de Entorno para Vercel Dashboard

### **🔧 Configuración de Aplicación**
```bash
# Entorno de Producción
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://pinteya.com
VERCEL_ENV=production

# Autenticación
BYPASS_AUTH=false
NEXTAUTH_SECRET=PRODUCTION_SECRET_MUST_BE_GENERATED_CRYPTO_RANDOM_BYTES_32_CHARACTERS_LONG
NEXTAUTH_URL=https://pinteya.com
```

### **🗄️ Base de Datos - Supabase**
```bash
NEXT_PUBLIC_SUPABASE_URL=[TU_SUPABASE_PROJECT_URL]
NEXT_PUBLIC_SUPABASE_ANON_KEY=[TU_SUPABASE_ANON_KEY]
SUPABASE_SERVICE_ROLE_KEY=[TU_SUPABASE_SERVICE_ROLE_KEY]
```

### **💳 MercadoPago - Producción**
```bash
# Credenciales de Producción
MERCADOPAGO_ACCESS_TOKEN=[TU_MERCADOPAGO_ACCESS_TOKEN]
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=[TU_MERCADOPAGO_PUBLIC_KEY]
MERCADOPAGO_CLIENT_ID=[TU_MERCADOPAGO_CLIENT_ID]
MERCADOPAGO_CLIENT_SECRET=kCyTlavw8B2l9zJ7T5IMeR3nOhLOHrTm

# Configuración de Producción
MERCADOPAGO_ENVIRONMENT=production
MERCADOPAGO_WEBHOOK_SECRET=WEBHOOK_SECRET_FROM_MERCADOPAGO_DASHBOARD

# Mocks Deshabilitados
NEXT_PUBLIC_MOCK_PAYMENTS=false
```

### **📧 Email - Resend**
```bash
RESEND_API_KEY=PRODUCTION_RESEND_API_KEY_REQUIRED
RESEND_FROM_EMAIL=noreply@pinteya.com
RESEND_SUPPORT_EMAIL=soporte@pinteya.com
```

### **🔐 Autenticación - Google OAuth**
```bash
GOOGLE_CLIENT_ID=PRODUCTION_GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET=PRODUCTION_GOOGLE_CLIENT_SECRET
```

### **📊 Analytics y Monitoreo**
```bash
# Google Analytics
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX

# Analytics Habilitado
ANALYTICS_ENABLED=true
ANALYTICS_DEBUG=false

# Debug Deshabilitado
DEBUG=false
NEXT_PUBLIC_DEBUG_MODE=false
```

### **⚡ Redis y Cache**
```bash
# Redis Habilitado
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
DISABLE_REDIS=false
```

### **🔒 Clerk (Deshabilitado)**
```bash
# Clerk está deshabilitado - Migrado a NextAuth.js
# NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
# CLERK_SECRET_KEY=
# CLERK_WEBHOOK_SECRET=
```

---

## 🛠️ Pasos para Configurar en Vercel

### **1. Acceder a Vercel Dashboard**
1. Ir a: https://vercel.com/dashboard
2. Seleccionar el proyecto `pinteya-ecommerce`
3. Ir a **Settings** → **Environment Variables**

### **2. Configurar Variables de Entorno**
1. Hacer clic en **"Add New"**
2. Copiar cada variable del listado anterior
3. Seleccionar **Environment**: `Production`
4. Hacer clic en **"Save"**

### **3. Configurar Dominio Personalizado**
1. Ir a **Settings** → **Domains**
2. Agregar dominio: `pinteya.com`
3. Configurar DNS según instrucciones de Vercel
4. Verificar SSL automático

---

## 🚀 Proceso de Despliegue

### **Opción 1: Despliegue Automático (Recomendado)**
```bash
# Hacer commit de todos los cambios
git add .
git commit -m "feat: configuración de producción completa"
git push origin main

# Vercel desplegará automáticamente
```

### **Opción 2: Despliegue Manual**
```bash
# Instalar Vercel CLI
npm i -g vercel

# Desplegar a producción
vercel --prod
```

---

## ✅ Checklist Pre-Despliegue

### **Configuración:**
- [ ] Todas las variables de entorno configuradas en Vercel
- [ ] Dominio `pinteya.com` configurado
- [ ] SSL certificado activo
- [ ] Webhook configurado en MercadoPago Dashboard
- [ ] Secret del webhook actualizado

### **Validaciones:**
- [ ] Build local exitoso con `npm run build`
- [ ] Tests críticos pasando
- [ ] Credenciales de producción validadas
- [ ] URLs de producción configuradas

---

## 🧪 Validación Post-Despliegue

### **1. Verificar Aplicación**
```bash
# Verificar que la aplicación carga
curl -I https://pinteya.com

# Verificar API de salud
curl https://pinteya.com/api/health
```

### **2. Test de Funcionalidades Críticas**
```bash
# Test de autenticación
curl https://pinteya.com/api/auth/session

# Test de productos
curl https://pinteya.com/api/products

# Test de webhook
curl -X POST https://pinteya.com/api/payments/webhook \
  -H "Content-Type: application/json" \
  -H "x-signature: test" \
  -d '{"test": true}'
```

### **3. Monitoreo Inicial**
- Dashboard: https://pinteya.com/admin/monitoring
- Métricas: https://pinteya.com/api/admin/monitoring/metrics
- Logs: Vercel Dashboard → Functions → Logs

---

## 📊 Métricas de Producción

### **Objetivos de Performance:**
- **First Load JS**: < 600 kB ✅ (589 kB actual)
- **Build Time**: < 45 segundos ✅ (16.8s actual)
- **API Response**: < 2 segundos
- **Uptime**: > 99.9%

### **Monitoreo Continuo:**
- Core Web Vitals
- Error Rate < 1%
- Response Time < 2s
- Memory Usage < 85%

---

## 🚨 Plan de Rollback

### **En caso de problemas críticos:**
```bash
# Rollback inmediato en Vercel
vercel rollback [deployment-url]

# O desde el dashboard:
# Vercel Dashboard → Deployments → Previous → Promote
```

### **Variables de Entorno de Emergencia:**
```bash
# Habilitar modo de mantenimiento
MAINTENANCE_MODE=true

# Habilitar bypass temporal (solo emergencias)
BYPASS_AUTH=true
DEBUG=true
```

---

## 📞 Contactos de Emergencia

### **Soporte Técnico:**
- **Email**: santiago@xor.com.ar
- **Dashboard**: https://pinteya.com/admin/monitoring
- **Vercel Support**: https://vercel.com/support

### **Servicios Externos:**
- **MercadoPago**: https://www.mercadopago.com.ar/developers/support
- **Supabase**: https://supabase.com/support
- **Resend**: https://resend.com/support

---

## 🎯 Estado Final

### **✅ Listo para Producción:**
- Configuración completa de variables de entorno
- Build exitoso con optimizaciones de producción
- Webhook configurado y documentado
- Monitoreo y alertas activos
- Plan de rollback definido

### **📅 Próximos Pasos:**
1. Configurar variables en Vercel Dashboard
2. Configurar webhook en MercadoPago Dashboard
3. Ejecutar despliegue
4. Validar funcionalidades críticas
5. Monitorear métricas por 24-48 horas

---

**🚀 Estado:** Listo para despliegue inmediato
**📅 Fecha:** 2024-01-09
**👤 Responsable:** Santiago XOR (santiago@xor.com.ar)
