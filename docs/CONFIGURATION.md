# Configuración - Pinteya E-commerce

## 🔧 Variables de Entorno

### Archivo `.env.local`

⚠️ **IMPORTANTE**: Las siguientes variables contienen valores de ejemplo.
**NUNCA** uses estos valores en producción. Obtén tus propias credenciales de cada servicio.

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your-publishable-key
CLERK_SECRET_KEY=sk_test_your-secret-key

# MercadoPago Payment Gateway
MERCADOPAGO_ACCESS_TOKEN=APP_USR-your-access-token
MERCADOPAGO_PUBLIC_KEY=APP_USR-your-public-key
MERCADOPAGO_CLIENT_ID=your-client-id

# Application URLs
NEXT_PUBLIC_APP_URL=http://localhost:3001
```

### 🔒 Configuración de Seguridad

Para configurar el proyecto de forma segura:

1. **Copia el archivo de ejemplo**: `cp .env.example .env.local`
2. **Reemplaza todos los valores** con tus credenciales reales
3. **Verifica que `.env.local` esté en `.gitignore`**
4. **Nunca commitees archivos con credenciales reales**

## 🗄️ Base de Datos Supabase

### Proyecto
- **Nombre**: pinteya-ecommerce
- **ID**: aakzspzfulgftqlgwkpb
- **Región**: sa-east-1
- **URL**: https://aakzspzfulgftqlgwkpb.supabase.co
- **Estado**: ✅ OPTIMIZADO (63% reducción almacenamiento)
- **Performance**: 5-10x mejorada (Julio 2025)

### Tablas Principales

> **📊 OPTIMIZACIÓN 2025:** Las tablas principales han sido optimizadas con una reducción del 63% en almacenamiento. Ver [OPTIMIZATION_SUPABASE_2025.md](./OPTIMIZATION_SUPABASE_2025.md) para detalles completos.

#### Tablas Optimizadas (Recomendadas)
- `analytics_events_optimized` - 66% más eficiente
- `products_optimized` - 52% más eficiente
- `product_brands` - Lookup table normalizada
- `analytics_*` - Tablas de lookup para enums

#### Tablas Originales (Legacy)

#### `products`
```sql
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name VARCHAR NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  category_id INTEGER REFERENCES categories(id),
  stock INTEGER DEFAULT 0,
  image_url VARCHAR,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### `categories`
```sql
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR NOT NULL,
  slug VARCHAR UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### `users`
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id VARCHAR UNIQUE NOT NULL,
  email VARCHAR NOT NULL,
  name VARCHAR,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### `orders`
```sql
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  total DECIMAL(10,2) NOT NULL,
  status VARCHAR DEFAULT 'pending',
  external_reference VARCHAR,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### `order_items`
```sql
CREATE TABLE order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id),
  product_id INTEGER REFERENCES products(id),
  quantity INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Usuario Temporal
```sql
INSERT INTO users (id, clerk_id, email, name) 
VALUES ('00000000-0000-4000-8000-000000000000', 'temp_user', 'temp@pinteya.com', 'Usuario Temporal');
```

## 🔐 Autenticación y Seguridad

### Configuración Clerk
- **Dominio**: exciting-grouper-57.clerk.accounts.dev
- **Aplicación**: Pinteya E-commerce
- **Versión**: 6.19.4

### Configuración Supabase Auth (Actualizada 2025-01-05)
- **OTP Email**: 600 segundos (10 minutos) ✅ SEGURO
- **OTP SMS**: 60 segundos (1 minuto)
- **Contraseñas filtradas**: Habilitado (HaveIBeenPwned)
- **MFA**: TOTP + WebAuthn habilitados
- **Longitud mínima contraseña**: 8 caracteres

### Middleware Configurado
```typescript
// src/middleware.ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isPublicRoute = createRouteMatcher([
  "/",
  "/shop",
  "/shop/(.*)",
  "/product/(.*)",
  "/category/(.*)",
  "/about",
  "/contact",
  "/api/products",
  "/api/categories", 
  "/api/test",
  "/api/payments/create-preference",
  "/api/payments/webhook",
  "/api/payments/status",
  "/signin(.*)",
  "/signup(.*)",
  "/sso-callback(.*)"
])

export default clerkMiddleware((auth, req) => {
  if (!isPublicRoute(req)) auth().protect()
})

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
}
```

## 💳 MercadoPago

### Configuración
- **País**: Argentina
- **Moneda**: ARS (Pesos Argentinos)
- **Modo**: Sandbox (Desarrollo)
- **Client ID**: 921414591813674

### URLs de Retorno
```javascript
back_urls: {
  success: "http://localhost:3001/checkout/success?order_id={order_id}",
  failure: "http://localhost:3001/checkout/failure?order_id={order_id}",
  pending: "http://localhost:3001/checkout/pending?order_id={order_id}"
}
```

### Webhook
- **URL**: `http://localhost:3001/api/payments/webhook`
- **Eventos**: payment, merchant_order

## 🎨 Diseño y UI

### Paleta de Colores - Nueva Identidad Visual
```css
:root {
  /* Blaze Orange - Color Primario */
  --blaze-orange-50: #fef7ee;
  --blaze-orange-100: #feeed6;
  --blaze-orange-200: #fcd9ac;
  --blaze-orange-300: #f9be78;
  --blaze-orange-400: #f59842;
  --blaze-orange-500: #f27a1d;
  --blaze-orange-600: #eb6313;
  --blaze-orange-700: #bd4811;
  --blaze-orange-800: #963a16;
  --blaze-orange-900: #793115;
  --blaze-orange-950: #411709;

  /* Fun Green - Color Secundario */
  --fun-green-50: #ecfff5;
  --fun-green-100: #d3ffe8;
  --fun-green-200: #aaffd3;
  --fun-green-300: #69ffb2;
  --fun-green-400: #21ff8a;
  --fun-green-500: #00f269;
  --fun-green-600: #00ca53;
  --fun-green-700: #009e44;
  --fun-green-800: #007638;
  --fun-green-900: #026532;
  --fun-green-950: #003919;

  /* Bright Sun - Color de Acento */
  --bright-sun-50: #fffbeb;
  --bright-sun-100: #fff4c6;
  --bright-sun-200: #ffe788;
  --bright-sun-300: #ffd549;
  --bright-sun-400: #ffc220;
  --bright-sun-500: #f9a007;
  --bright-sun-600: #dd7802;
  --bright-sun-700: #b75406;
  --bright-sun-800: #943f0c;
  --bright-sun-900: #7a350d;
  --bright-sun-950: #461a02;
}
```

### Componentes UI
- **Framework**: Tailwind CSS
- **Componentes**: shadcn/ui + Radix UI
- **Iconos**: Lucide React
- **Fuentes**: Inter (Google Fonts)

## 🚀 Desarrollo

### Comandos
```bash
# Instalar dependencias
npm install

# Desarrollo
npm run dev

# Build
npm run build

# Iniciar producción
npm start

# Linting
npm run lint
```

### Puerto
- **Desarrollo**: http://localhost:3001
- **Producción**: Por configurar

## 📦 Dependencias Principales

```json
{
  "next": "^15.3.3",
  "react": "^19",
  "typescript": "^5",
  "@clerk/nextjs": "^6.19.4",
  "@supabase/supabase-js": "^2.39.3",
  "mercadopago": "^2.0.15",
  "tailwindcss": "^3.4.1",
  "@radix-ui/react-*": "^1.0.0"
}
```

## 🔍 APIs Disponibles

### Productos
- `GET /api/products` - Listar productos
- `GET /api/products/[id]` - Obtener producto específico
- `GET /api/categories` - Listar categorías

### Pagos
- `POST /api/payments/create-preference` - Crear preferencia MercadoPago
- `POST /api/payments/webhook` - Webhook MercadoPago
- `GET /api/payments/status` - Estado de pagos

### Usuario
- `GET /api/user/profile` - Perfil del usuario
- `GET /api/user/orders` - Órdenes del usuario
- `GET /api/user/addresses` - Direcciones del usuario

## 🎯 Estado del Proyecto

### ✅ Completado
- Backend con Supabase
- Autenticación con Clerk
- Sistema de pagos MercadoPago
- Productos y categorías dinámicas
- Checkout funcional
- APIs operativas

### 🔄 En Desarrollo
- Páginas de resultado de pago
- Webhook completo
- Panel de administración

### 📋 Por Hacer
- Deploy a producción
- Configuración de dominio
- Optimizaciones de performance
- Tests automatizados
