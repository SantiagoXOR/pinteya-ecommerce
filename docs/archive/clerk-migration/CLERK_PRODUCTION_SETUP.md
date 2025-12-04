# 🔐 Configuración de Clerk para Producción - Pinteya E-commerce

## 📋 Checklist de Configuración

### ✅ 1. Variables de Entorno Requeridas

```env
# Claves de producción (desde dashboard.clerk.com)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=[STRIPE_PUBLIC_KEY_REMOVED]
CLERK_SECRET_KEY=[STRIPE_SECRET_KEY_REMOVED]

# Webhook secret (CRÍTICO para sincronización)
CLERK_WEBHOOK_SECRET=whsec_tu_webhook_secret_aqui

# URLs de redirección
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/signin
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/signup
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/home
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/home

# Dominio autorizado
NEXT_PUBLIC_CLERK_DOMAIN=pinteya.com
```

### ✅ 2. Configuración en Dashboard de Clerk

#### **A. Dominios Autorizados**

Ve a **Configure** → **Domains** y agrega:

- ✅ `https://pinteya.com`
- ✅ `https://pinteya-ecommerce.vercel.app`
- ✅ `https://www.pinteya.com` (si aplica)

#### **B. URLs de Redirección**

Ve a **Configure** → **Paths**:

- **Sign-in URL**: `/signin`
- **Sign-up URL**: `/signup`
- **After sign-in URL**: `/home`
- **After sign-up URL**: `/home`
- **After sign-out URL**: `/`

#### **C. Webhooks (CRÍTICO)**

Ve a **Configure** → **Webhooks**:

- **Endpoint URL**: `https://pinteya.com/api/webhooks/clerk`
- **Events**:
  - ✅ `user.created`
  - ✅ `user.updated`
  - ✅ `user.deleted`
- **Secret**: Copia y pega en `CLERK_WEBHOOK_SECRET`

### ✅ 3. Configuración de Seguridad

#### **A. Configuración de Sesiones**

- **Session timeout**: 7 días (recomendado para e-commerce)
- **Inactivity timeout**: 1 día
- **Multi-session handling**: Permitir múltiples sesiones

#### **B. Configuración de Autenticación**

- **Email verification**: ✅ Requerido
- **Phone verification**: ❌ Opcional
- **Password requirements**: Mínimo 8 caracteres, 1 mayúscula, 1 número

#### **C. Proveedores Sociales**

- **Google**: ✅ Habilitado (configurado)
- **Facebook**: ❌ Deshabilitado
- **GitHub**: ❌ Deshabilitado

### ✅ 4. Variables de Entorno en Vercel

En tu dashboard de Vercel, configura estas variables:

```bash
# Clerk Production Keys
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=[STRIPE_PUBLIC_KEY_REMOVED]
CLERK_SECRET_KEY=[STRIPE_SECRET_KEY_REMOVED]
CLERK_WEBHOOK_SECRET=whsec_tu_webhook_secret_aqui

# Clerk URLs
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/signin
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/signup
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/home
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/home
NEXT_PUBLIC_CLERK_DOMAIN=pinteya.com
```

### ✅ 5. Testing de Configuración

#### **A. Test de Autenticación**

```bash
# Verificar que las claves funcionan
curl -H "Authorization: Bearer $CLERK_SECRET_KEY" \
     https://api.clerk.com/v1/users
```

#### **B. Test de Webhook**

```bash
# Verificar que el webhook responde
curl -X POST https://pinteya.com/api/webhooks/clerk \
     -H "Content-Type: application/json" \
     -d '{"test": true}'
```

### ✅ 6. Monitoreo y Logs

#### **A. Logs de Clerk**

- Ve a **Logs** en el dashboard de Clerk
- Monitorea eventos de autenticación
- Revisa errores de webhook

#### **B. Logs de Aplicación**

```bash
# Ver logs de webhook en Vercel
vercel logs --app=pinteya-ecommerce --since=1h
```

## 🚨 Problemas Comunes y Soluciones

### **Error: "Invalid publishable key"**

- ✅ Verificar que la clave empiece con `pk_live_`
- ✅ Verificar que el dominio esté autorizado en Clerk
- ✅ Verificar que `NEXT_PUBLIC_CLERK_DOMAIN` coincida

### **Error: "Webhook verification failed"**

- ✅ Verificar que `CLERK_WEBHOOK_SECRET` sea correcto
- ✅ Verificar que la URL del webhook sea accesible
- ✅ Verificar que los headers estén correctos

### **Error: "User not synced to Supabase"**

- ✅ Verificar que el webhook esté configurado
- ✅ Verificar que los eventos estén habilitados
- ✅ Verificar logs del webhook en Vercel

## 📊 Métricas de Éxito

### **Indicadores Clave**

- ✅ **Tasa de registro exitoso**: >95%
- ✅ **Tiempo de autenticación**: <2 segundos
- ✅ **Sincronización de usuarios**: 100%
- ✅ **Uptime del webhook**: >99.9%

### **Monitoreo Continuo**

- Dashboard de Clerk: Revisar diariamente
- Logs de Vercel: Revisar semanalmente
- Métricas de usuario: Revisar mensualmente

## 🔄 Proceso de Actualización

### **Rotación de Claves (Cada 90 días)**

1. Generar nuevas claves en Clerk
2. Actualizar variables en Vercel
3. Verificar funcionamiento
4. Revocar claves antiguas

### **Backup de Configuración**

- Exportar configuración de Clerk mensualmente
- Documentar cambios en este archivo
- Mantener historial de configuraciones

---

**📝 Última actualización**: Enero 2025  
**👤 Responsable**: Equipo de Desarrollo Pinteya  
**🔄 Próxima revisión**: Abril 2025
