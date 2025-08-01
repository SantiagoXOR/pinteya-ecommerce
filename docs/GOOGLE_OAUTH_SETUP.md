# 🔐 Configuración Google OAuth para Clerk - Pinteya E-commerce

## 🚨 PROBLEMA ACTUAL
**Error**: "Acceso bloqueado: Error de autorización - Missing required parameter: client_id"

## ✅ SOLUCIÓN PASO A PASO

### **1. Crear Proyecto en Google Cloud Console**

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Habilita la **Google+ API** y **Google Identity API**

### **2. Configurar OAuth 2.0**

1. Ve a **APIs & Services** → **Credentials**
2. Clic en **+ CREATE CREDENTIALS** → **OAuth 2.0 Client IDs**
3. Selecciona **Web application**
4. Configura:
   ```
   Name: Pinteya E-commerce
   Authorized JavaScript origins:
   - https://pinteya.com
   - https://www.pinteya.com
   - https://pinteya-ecommerce.vercel.app
   - https://clerk.pinteya.com
   
   Authorized redirect URIs:
   - https://clerk.pinteya.com/v1/oauth_callback
   - https://accounts.pinteya.com/v1/oauth_callback
   ```

### **3. Configurar en Clerk Dashboard**

1. Ve a [Clerk Dashboard](https://dashboard.clerk.com/)
2. Selecciona tu aplicación **PinteYa**
3. Ve a **Configure** → **SSO connections**
4. Habilita **Google**
5. Ingresa:
   - **Client ID**: El que obtuviste de Google Cloud
   - **Client Secret**: El que obtuviste de Google Cloud

### **4. Actualizar Variables de Entorno**

En Vercel, agrega estas variables:
```env
NEXT_PUBLIC_CLERK_GOOGLE_CLIENT_ID=tu_google_client_id_aqui
CLERK_GOOGLE_CLIENT_SECRET=tu_google_client_secret_aqui
```

### **5. Verificar Dominios Autorizados**

En Clerk Dashboard → **Configure** → **Domains**:
- ✅ pinteya.com
- ✅ www.pinteya.com  
- ✅ pinteya-ecommerce.vercel.app

## 🔄 TESTING

Después de la configuración:
1. Ve a tu aplicación
2. Clic en "Iniciar sesión con Google"
3. Debería funcionar sin errores

## 📞 SOPORTE

Si persisten los problemas:
- Verifica que todos los dominios estén en ambas plataformas
- Revisa que las URLs de callback sean exactas
- Confirma que las APIs estén habilitadas en Google Cloud

## 🎯 RESULTADO ESPERADO

✅ Autenticación con Google funcionando
✅ Sin errores de client_id
✅ Usuarios sincronizados con Supabase automáticamente
