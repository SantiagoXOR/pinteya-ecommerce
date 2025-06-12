# 🔧 **GUÍA DE CONFIGURACIÓN DE SERVICIOS EXTERNOS**

## 📋 **RESUMEN DE SERVICIOS REQUERIDOS**

Para que Pinteya funcione completamente, necesitas configurar estos servicios:

1. **🗄️ Supabase** - Base de datos y backend
2. **🔐 Clerk** - Autenticación de usuarios  
3. **💳 MercadoPago** - Procesamiento de pagos

---

## 🗄️ **1. CONFIGURACIÓN DE SUPABASE**

### **Paso 1: Crear proyecto**
1. Ve a [https://supabase.com](https://supabase.com)
2. Crea una cuenta o inicia sesión
3. Haz clic en "New Project"
4. Completa los datos:
   - **Name**: `pinteya-ecommerce`
   - **Database Password**: (genera una segura)
   - **Region**: `South America (São Paulo)`
5. Haz clic en "Create new project"

### **Paso 2: Obtener credenciales**
1. Ve a **Settings > API**
2. Copia estos valores:
   - **Project URL**: `https://tu-proyecto.supabase.co`
   - **anon public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - **service_role key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### **Paso 3: Ejecutar esquema de base de datos**
1. Ve a **SQL Editor** en el dashboard de Supabase
2. Copia y pega el contenido completo de `supabase-schema.sql`
3. Haz clic en "Run" para ejecutar el script
4. Luego ejecuta `migrate-products.sql` para poblar con productos

### **Paso 4: Actualizar variables de entorno**
Actualiza `.env.local` con tus credenciales reales:
```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_aqui
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_aqui
```

---

## 🔐 **2. CONFIGURACIÓN DE CLERK**

### **Paso 1: Crear aplicación**
1. Ve a [https://clerk.com](https://clerk.com)
2. Crea una cuenta o inicia sesión
3. Haz clic en "Create application"
4. Completa los datos:
   - **Application name**: `Pinteya E-commerce`
   - **Sign-in options**: Email, Google (opcional)
5. Haz clic en "Create application"

### **Paso 2: Obtener credenciales**
1. Ve a **API Keys** en el dashboard
2. Copia estos valores:
   - **Publishable key**: `pk_test_...`
   - **Secret key**: `sk_test_...`

### **Paso 3: Configurar webhook**
1. Ve a **Webhooks** en el dashboard
2. Haz clic en "Add Endpoint"
3. Completa:
   - **Endpoint URL**: `https://tu-dominio.com/api/auth/webhook`
   - **Events**: Selecciona `user.created`, `user.updated`, `user.deleted`
4. Copia el **Signing Secret**: `whsec_...`

### **Paso 4: Actualizar variables de entorno**
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_tu_key_aqui
CLERK_SECRET_KEY=sk_test_tu_key_aqui
CLERK_WEBHOOK_SECRET=whsec_tu_secret_aqui
```

---

## 💳 **3. CONFIGURACIÓN DE MERCADOPAGO**

### **Paso 1: Crear cuenta de desarrollador**
1. Ve a [https://www.mercadopago.com.ar/developers/](https://www.mercadopago.com.ar/developers/)
2. Crea una cuenta o inicia sesión
3. Ve a **Tus aplicaciones**
4. Haz clic en "Crear aplicación"
5. Completa:
   - **Nombre**: `Pinteya E-commerce`
   - **Modelo de integración**: `Pagos online`

### **Paso 2: Obtener credenciales de prueba**
1. Ve a **Credenciales** en tu aplicación
2. En la sección **Credenciales de prueba**, copia:
   - **Public Key**: `TEST-...`
   - **Access Token**: `TEST-...`

### **Paso 3: Actualizar variables de entorno**
```env
MERCADOPAGO_ACCESS_TOKEN=TEST-tu_access_token_aqui
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=TEST-tu_public_key_aqui
```

---

## 🔧 **4. CONFIGURACIÓN FINAL**

### **Actualizar next.config.js**
Reemplaza `your-project.supabase.co` con tu URL real de Supabase:
```javascript
const nextConfig = {
  images: {
    domains: [
      'tu-proyecto-real.supabase.co', // ← Cambiar aquí
      'localhost',
    ],
  },
  // ... resto de la configuración
};
```

### **Variables de entorno completas**
Tu archivo `.env.local` final debe verse así:
```env
# CLERK
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_tu_key_real
CLERK_SECRET_KEY=sk_test_tu_key_real
CLERK_WEBHOOK_SECRET=whsec_tu_secret_real

# SUPABASE
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto-real.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_real
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_real

# MERCADOPAGO
MERCADOPAGO_ACCESS_TOKEN=TEST-tu_access_token_real
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=TEST-tu_public_key_real

# APP
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=tu_secret_generado_aqui
NODE_ENV=development
```

---

## ✅ **5. VERIFICACIÓN**

### **Probar la configuración**
1. **Ejecutar el proyecto**:
   ```bash
   npm run dev
   ```

2. **Verificar Supabase**:
   - Ve a `http://localhost:3000/api/products`
   - Deberías ver una respuesta JSON con productos

3. **Verificar Clerk**:
   - Ve a `http://localhost:3000/signin`
   - Deberías ver el formulario de login de Clerk

4. **Verificar webhook**:
   - Ve a `http://localhost:3000/api/auth/webhook`
   - Deberías ver: `"Webhook de Clerk funcionando correctamente"`

### **Solución de problemas comunes**

**Error: "Supabase client not configured"**
- Verifica que las variables de entorno de Supabase estén correctas
- Reinicia el servidor de desarrollo

**Error: "Clerk publishable key not found"**
- Verifica que `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` esté en `.env.local`
- Asegúrate de que empiece con `pk_test_`

**Error: "Database connection failed"**
- Verifica que el esquema SQL se haya ejecutado correctamente
- Revisa que las políticas RLS estén habilitadas

---

## 🚀 **PRÓXIMOS PASOS**

Una vez configurados todos los servicios:

1. **Probar autenticación**: Registra un usuario nuevo
2. **Verificar sincronización**: Revisa que el usuario aparezca en Supabase
3. **Probar productos**: Navega por la tienda y verifica que carguen desde la DB
4. **Continuar con Fase 2**: Implementar filtros y búsqueda dinámica

¿Necesitas ayuda con alguna configuración específica?
