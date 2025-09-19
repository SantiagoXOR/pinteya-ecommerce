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
NEXT_PUBLIC_APP_URL=http://localhost:3001

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

## 🔐 Configuración de Clerk

### 1. Crear Aplicación

1. Ve a [clerk.com](https://clerk.com)
2. Crea una nueva aplicación
3. Configura métodos de autenticación

### 2. Variables de Entorno

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=[STRIPE_PUBLIC_KEY_REMOVED]tu-key
CLERK_SECRET_KEY=[STRIPE_SECRET_KEY_REMOVED]tu-secret
CLERK_WEBHOOK_SECRET=whsec_tu-webhook-secret
```

### 3. Configurar Webhooks

- **URL**: `https://tu-dominio.com/api/auth/webhook`
- **Eventos**: `user.created`, `user.updated`, `user.deleted`

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
        }
      }
    }
  }
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
- Clerk credentials  
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
- [ ] Clerk funcionando (login/logout)
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

#### Error: "Clerk not configured"
```bash
# Verificar middleware
cat src/middleware.ts
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



