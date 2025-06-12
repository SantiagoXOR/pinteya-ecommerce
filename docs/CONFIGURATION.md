# Configuración - Pinteya E-commerce

## 🔧 Variables de Entorno

### Archivo `.env.local`

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://aakzspzfulgftqlgwkpb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_ZXhjaXRpbmctZ3JvdXBlci01Ny5jbGVyay5hY2NvdW50cy5kZXYk
CLERK_SECRET_KEY=sk_test_Y9R3dn2pkyM173HqywLDE8uadR7vqT1edC6kPQwPCs

# MercadoPago Payment Gateway
MERCADOPAGO_ACCESS_TOKEN=APP_USR-921414591813674-121116-...
MERCADOPAGO_PUBLIC_KEY=APP_USR-b989b49d-2678-43ce-a048-...
MERCADOPAGO_CLIENT_ID=921414591813674

# Application URLs
NEXT_PUBLIC_APP_URL=http://localhost:3001
```

## 🗄️ Base de Datos Supabase

### Proyecto
- **Nombre**: pinteya-ecommerce
- **ID**: aakzspzfulgftqlgwkpb
- **Región**: sa-east-1
- **URL**: https://aakzspzfulgftqlgwkpb.supabase.co

### Tablas Principales

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

## 🔐 Autenticación Clerk

### Configuración
- **Dominio**: exciting-grouper-57.clerk.accounts.dev
- **Aplicación**: Pinteya E-commerce
- **Versión**: 6.19.4

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

### Paleta de Colores - Tahiti Gold
```css
:root {
  --tahiti-gold-50: #fffbea;
  --tahiti-gold-100: #fef3c7;
  --tahiti-gold-200: #fde68a;
  --tahiti-gold-300: #fcd34d;
  --tahiti-gold-400: #fbbf24;
  --tahiti-gold-500: #f59e0b;
  --tahiti-gold-600: #d97706;
  --tahiti-gold-700: #b45309;
  --tahiti-gold-800: #92400e;
  --tahiti-gold-900: #78350f;
  --tahiti-gold-950: #471801;
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
