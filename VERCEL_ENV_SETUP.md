# Configuración de Variables de Entorno para Vercel - Pinteya E-commerce

## 🚨 Variables CRÍTICAS para el Deploy

### 1. Supabase (OBLIGATORIAS)
```
NEXT_PUBLIC_SUPABASE_URL=https://aakzspzfulgftqlgwkpb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFha3pzcHpmdWxnZnRxbGd3a3BiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkzMzQxMTIsImV4cCI6MjA2NDkxMDExMn0.4f3FScXKA5xnSUekHWhtautpqejwYupPI15dJ0oatlM
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFha3pzcHpmdWxnZnRxbGd3a3BiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTMzNDExMiwiZXhwIjoyMDY0OTEwMTEyfQ.r-RFBL09kjQtMO3_RrHyh4sqOiaYrkT86knc_bP0c6g
```

### 2. MercadoPago (OBLIGATORIAS)
```
MERCADOPAGO_ACCESS_TOKEN=APP_USR-921414591813674-121116-9d0109c7050807d76606491e8a1711d9-176553735
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=APP_USR-b989b49d-2678-43ce-a048-614769c7982c
MERCADOPAGO_CLIENT_ID=921414591813674
MERCADOPAGO_CLIENT_SECRET=0Pgl2xD3mbRTQ0G4dGadxQztfSqioihT
MERCADOPAGO_WEBHOOK_SECRET=pinteya_webhook_secret_2025
```

### 3. Clerk (OPCIONALES - para autenticación)
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_ZXhjaXRpbmctZ3JvdXBlci01Ny5jbGVyay5hY2NvdW50cy5kZXYk
CLERK_SECRET_KEY=sk_test_Y9R3dn2pkyM173HqywLDE8uadR7vqT1edC6kPQwPCs
CLERK_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

### 4. Aplicación (OBLIGATORIAS)
```
NEXT_PUBLIC_APP_URL=https://pinteya-ecommerce.vercel.app
NODE_ENV=production
```

## 📋 Pasos para Configurar en Vercel

### 1. Acceder al Dashboard de Vercel
1. Ve a [vercel.com](https://vercel.com)
2. Selecciona tu proyecto `pinteya-ecommerce`
3. Ve a **Settings** → **Environment Variables**

### 2. Agregar Variables Una por Una
Para cada variable de la lista anterior:
1. Haz clic en **Add New**
2. **Name**: Nombre de la variable (ej: `NEXT_PUBLIC_SUPABASE_URL`)
3. **Value**: Valor correspondiente
4. **Environments**: Selecciona **Production**, **Preview**, y **Development**
5. Haz clic en **Save**

### 3. Variables Críticas para el Build
Estas variables DEBEN estar configuradas para que el build no falle:
- ✅ `NEXT_PUBLIC_SUPABASE_URL`
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- ✅ `SUPABASE_SERVICE_ROLE_KEY`
- ✅ `NEXT_PUBLIC_APP_URL`

### 4. Verificar Configuración
Después de agregar todas las variables:
1. Ve a **Deployments**
2. Haz clic en **Redeploy** en el último deployment
3. Selecciona **Use existing Build Cache** = NO
4. Haz clic en **Redeploy**

## 🔧 Solución de Problemas

### Error: "Faltan variables de entorno de Supabase"
- ✅ Verificar que `NEXT_PUBLIC_SUPABASE_URL` esté configurada
- ✅ Verificar que `NEXT_PUBLIC_SUPABASE_ANON_KEY` esté configurada
- ✅ Verificar que `SUPABASE_SERVICE_ROLE_KEY` esté configurada
- ✅ Hacer redeploy completo sin cache

### Error en /api/auth/webhook
- ✅ Configurar `CLERK_SECRET_KEY`
- ✅ Configurar `CLERK_WEBHOOK_SECRET`
- ✅ Verificar que la ruta esté en `publicRoutes` del middleware

### Error de MercadoPago
- ✅ Configurar `MERCADOPAGO_ACCESS_TOKEN`
- ✅ Configurar `NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY`
- ✅ Verificar que las credenciales sean de producción

## ⚠️ Notas Importantes

1. **Nunca** subas archivos `.env` al repositorio
2. Las variables `NEXT_PUBLIC_*` son visibles en el frontend
3. Las variables sin `NEXT_PUBLIC_` solo están disponibles en el servidor
4. Después de cambiar variables, siempre hacer redeploy completo
5. Verificar que todas las variables estén en los 3 environments (Production, Preview, Development)
