# ⚙️ Configuración Inicial - Pinteya E-commerce

> Guía completa para configurar el proyecto Pinteya E-commerce desde cero

## 🚀 Configuración Rápida

### 1. Variables de Entorno

Copia el archivo de ejemplo y configura tus credenciales:

```bash
cp .env.example .env.local
```

### 2. Configuración Básica

```bash
# URL de la aplicación
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Base de datos Supabase
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
```

---

## 🗄️ Configuración de Supabase

### 1. Crear Proyecto

1. Ve a [supabase.com](https://supabase.com)
2. Crea un nuevo proyecto
3. Copia las credenciales

### 2. Configurar Base de Datos

```sql
-- Ejecutar en SQL Editor de Supabase
-- Crear tablas principales
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  discounted_price DECIMAL(10,2),
  stock INTEGER DEFAULT 0,
  category_id INTEGER REFERENCES categories(id),
  brand VARCHAR(255),
  images JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 3. Configurar Storage

```sql
-- Crear bucket para imágenes
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true);

-- Política de acceso público
CREATE POLICY "Public Access" ON storage.objects
FOR SELECT USING (bucket_id = 'product-images');
```

---

## 🔐 Configuración de NextAuth

### 1. Crear Aplicación OAuth en Google

1. Ve a [Google Cloud Console](https://console.cloud.google.com)
2. Crea un nuevo proyecto o selecciona uno existente
3. Habilita Google+ API desde "APIs & Services" > "Library"
4. Ve a "APIs & Services" > "Credentials"
5. Crea credenciales OAuth 2.0 Client ID
6. Configura:
   - **Tipo**: Aplicación web
   - **URI de redirección autorizados**: `http://localhost:3000/api/auth/callback/google`
   - Para producción: `https://tu-dominio.com/api/auth/callback/google`

### 2. Variables de Entorno

```bash
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=tu-secret-generado-con-openssl-rand-base64-32

# Google OAuth
NEXT_PUBLIC_GOOGLE_CLIENT_ID=tu-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=tu-google-client-secret

# Para producción, actualiza NEXTAUTH_URL
NEXTAUTH_URL=https://tu-dominio.com
```

### 3. Generar NEXTAUTH_SECRET

```bash
# Generar secret seguro
openssl rand -base64 32

# O usar Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 4. Configurar Supabase para NextAuth

El proyecto usa Supabase como adaptador de NextAuth. Asegúrate de que las tablas de autenticación estén configuradas correctamente en Supabase.

---

## 💳 Configuración de MercadoPago

### 1. Obtener Credenciales

1. Ve a [developers.mercadopago.com](https://developers.mercadopago.com)
2. Crea una aplicación
3. Obtén las credenciales de prueba/producción

### 2. Variables de Entorno

```bash
# Credenciales de MercadoPago
MERCADOPAGO_ACCESS_TOKEN=APP_USR-tu-access-token
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=APP_USR-tu-public-key
MERCADOPAGO_CLIENT_ID=tu-client-id
MERCADOPAGO_CLIENT_SECRET=tu-client-secret
MERCADOPAGO_WEBHOOK_SECRET=tu-webhook-secret
```

### 3. Configurar Webhooks

- **URL**: `https://tu-dominio.com/api/payments/webhook`
- **Eventos**: `payment`, `merchant_order`

---

## 🎨 Configuración de Tailwind CSS

### 1. Colores Personalizados

El proyecto ya incluye los colores de Pinteya:

```js
// tailwind.config.ts
module.exports = {
  theme: {
    extend: {
      colors: {
        'blaze-orange': {
          50: '#fff7ed',
          500: '#ea5a17',
          600: '#dc4a0a',
        },
        'fun-green': {
          500: '#00a651',
        },
        'bright-sun': {
          400: '#ffd700',
        },
      },
    },
  },
}
```

### 2. Componentes shadcn/ui

Los componentes ya están configurados en `src/components/ui/`

---

## 🧪 Configuración de Testing

### 1. Jest (Tests Unitarios)

```bash
# Ejecutar tests
npm test

# Tests con cobertura
npm run test:coverage

# Tests en modo watch
npm run test:watch
```

### 2. Playwright (Tests E2E)

```bash
# Instalar navegadores
npx playwright install

# Ejecutar tests E2E
npm run test:e2e

# Tests con UI
npm run test:e2e:ui
```

---

## 🚀 Configuración de Deploy

### 1. Vercel (Recomendado)

```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel

# Configurar variables de entorno en Vercel Dashboard
```

### 2. Variables de Entorno en Producción

Configura todas las variables en Vercel Dashboard:

- Supabase credentials
- NextAuth credentials (Google OAuth)
- MercadoPago credentials
- `NEXT_PUBLIC_APP_URL=https://tu-dominio.vercel.app`

---

## ✅ Verificación de Configuración

### 1. Script de Verificación

```bash
# Verificar configuración
npm run check-env
```

### 2. Checklist

- [ ] Variables de entorno configuradas
- [ ] Supabase conectado y tablas creadas
- [ ] NextAuth funcionando (login/logout con Google)
- [ ] MercadoPago configurado
- [ ] Tests pasando
- [ ] Build exitoso

---

## 🔧 Troubleshooting

### Problemas Comunes

#### Error: "Supabase client not configured"

```bash
# Verificar variables
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_ANON_KEY
```

#### Error: "NextAuth not configured"

```bash
# Verificar variables de entorno
echo $NEXTAUTH_URL
echo $NEXTAUTH_SECRET
echo $NEXT_PUBLIC_GOOGLE_CLIENT_ID

# Verificar configuración
cat src/auth.ts
```

#### Error: "MercadoPago credentials invalid"

```bash
# Verificar en modo test
curl -X GET \
  'https://api.mercadopago.com/v1/payment_methods' \
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN'
```

---

## 📚 Recursos Adicionales

- [📋 Variables de Entorno](./environment.md)
- [🚀 Deploy en Vercel](../deployment/vercel.md)
- [🧪 Guía de Testing](../testing/README.md)
- [🔍 Debugging](../development/debugging.md)
