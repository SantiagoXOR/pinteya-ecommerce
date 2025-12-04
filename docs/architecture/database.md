# 🗄️ Base de Datos - Arquitectura Supabase

> Documentación completa del esquema de base de datos PostgreSQL en Supabase

## 📊 Visión General

Pinteya E-commerce utiliza **Supabase PostgreSQL** como base de datos principal con las siguientes características:

- **🔐 Row Level Security (RLS)**: Seguridad a nivel de fila
- **📡 Real-time**: Actualizaciones en tiempo real
- **🗂️ Storage**: Almacenamiento de imágenes integrado
- **🔍 Full-text Search**: Búsqueda de texto completo

---

## 📋 Esquema de Tablas

### 🏷️ **categories**

Categorías de productos de pinturería y ferretería.

```sql
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  image_url VARCHAR(500),
  parent_id INTEGER REFERENCES categories(id),
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Datos de ejemplo:**

- Pinturas de Interior
- Pinturas de Exterior
- Herramientas
- Accesorios
- Impermeabilizantes
- Barnices y Lacas

### 🛍️ **products**

Productos del catálogo con información completa.

```sql
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  short_description VARCHAR(500),
  price DECIMAL(10,2) NOT NULL,
  discounted_price DECIMAL(10,2),
  stock INTEGER DEFAULT 0,
  sku VARCHAR(100) UNIQUE,
  category_id INTEGER REFERENCES categories(id),
  brand VARCHAR(255),
  weight DECIMAL(8,2),
  dimensions JSONB,
  images JSONB,
  features JSONB,
  specifications JSONB,
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  meta_title VARCHAR(255),
  meta_description VARCHAR(500),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Campos JSONB:**

```json
// images
{
  "main": "/images/products/pintura-interior-blanca.jpg",
  "gallery": [
    "/images/products/pintura-interior-blanca-1.jpg",
    "/images/products/pintura-interior-blanca-2.jpg"
  ],
  "thumbnails": [
    "/images/products/thumbs/pintura-interior-blanca-thumb.jpg"
  ]
}

// features
{
  "coverage": "12-14 m²/L",
  "drying_time": "2-4 horas",
  "finish": "Mate",
  "base": "Agua"
}
```

### 👥 **users**

Perfiles de usuario sincronizados con Clerk.

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  clerk_id VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  phone VARCHAR(50),
  avatar_url VARCHAR(500),
  is_active BOOLEAN DEFAULT true,
  preferences JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 📍 **addresses**

Direcciones de envío de usuarios.

```sql
CREATE TABLE addresses (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) DEFAULT 'shipping', -- 'shipping', 'billing'
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  company VARCHAR(255),
  address_line_1 VARCHAR(500) NOT NULL,
  address_line_2 VARCHAR(500),
  city VARCHAR(255) NOT NULL,
  state VARCHAR(255) NOT NULL,
  postal_code VARCHAR(20) NOT NULL,
  country VARCHAR(100) DEFAULT 'Argentina',
  phone VARCHAR(50),
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 🛒 **orders**

Órdenes de compra con estados completos.

```sql
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  order_number VARCHAR(100) UNIQUE NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  payment_status VARCHAR(50) DEFAULT 'pending',
  payment_method VARCHAR(100),
  payment_id VARCHAR(255),
  subtotal DECIMAL(10,2) NOT NULL,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  shipping_amount DECIMAL(10,2) DEFAULT 0,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'ARS',
  shipping_address JSONB,
  billing_address JSONB,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Estados de orden:**

- `pending` - Pendiente
- `confirmed` - Confirmada
- `processing` - En proceso
- `shipped` - Enviada
- `delivered` - Entregada
- `cancelled` - Cancelada

### 📦 **order_items**

Items individuales de cada orden.

```sql
CREATE TABLE order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id),
  product_name VARCHAR(255) NOT NULL,
  product_sku VARCHAR(100),
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  product_snapshot JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🔐 Row Level Security (RLS)

### Políticas de Seguridad

```sql
-- Usuarios solo pueden ver sus propios datos
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid() = id);

-- Usuarios solo pueden actualizar sus propios datos
CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Direcciones privadas por usuario
CREATE POLICY "Users can manage own addresses" ON addresses
  FOR ALL USING (auth.uid() = user_id);

-- Órdenes privadas por usuario
CREATE POLICY "Users can view own orders" ON orders
  FOR SELECT USING (auth.uid() = user_id);

-- Productos públicos para lectura
CREATE POLICY "Products are publicly readable" ON products
  FOR SELECT USING (is_active = true);

-- Categorías públicas
CREATE POLICY "Categories are publicly readable" ON categories
  FOR SELECT USING (is_active = true);
```

---

## 📡 Real-time Subscriptions

### Configuración de Tiempo Real

```sql
-- Habilitar real-time para productos
ALTER PUBLICATION supabase_realtime ADD TABLE products;

-- Habilitar real-time para órdenes
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
```

### Uso en Frontend

```typescript
// Suscripción a cambios de stock
const { data, error } = supabase
  .from('products')
  .select('id, stock')
  .on('UPDATE', payload => {
    console.log('Stock actualizado:', payload.new)
  })
  .subscribe()
```

---

## 🗂️ Storage Configuration

### Buckets de Almacenamiento

```sql
-- Bucket para imágenes de productos
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true);

-- Bucket para avatares de usuario
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true);
```

### Políticas de Storage

```sql
-- Acceso público a imágenes de productos
CREATE POLICY "Public Access" ON storage.objects
FOR SELECT USING (bucket_id = 'product-images');

-- Usuarios pueden subir sus avatares
CREATE POLICY "Users can upload avatars" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

---

## 🔍 Índices y Optimización

### Índices Principales

```sql
-- Búsqueda de productos
CREATE INDEX idx_products_name_search ON products
USING gin(to_tsvector('spanish', name || ' ' || description));

-- Filtros por categoría
CREATE INDEX idx_products_category ON products(category_id);

-- Filtros por marca
CREATE INDEX idx_products_brand ON products(brand);

-- Búsqueda por slug
CREATE INDEX idx_products_slug ON products(slug);

-- Órdenes por usuario
CREATE INDEX idx_orders_user ON orders(user_id);

-- Órdenes por estado
CREATE INDEX idx_orders_status ON orders(status);
```

### Funciones Personalizadas

```sql
-- Función para actualizar stock
CREATE OR REPLACE FUNCTION update_product_stock(
  product_id INTEGER,
  quantity_change INTEGER
)
RETURNS VOID AS $$
BEGIN
  UPDATE products
  SET stock = stock + quantity_change,
      updated_at = NOW()
  WHERE id = product_id;
END;
$$ LANGUAGE plpgsql;

-- Función para buscar productos
CREATE OR REPLACE FUNCTION search_products(search_term TEXT)
RETURNS TABLE(
  id INTEGER,
  name VARCHAR,
  price DECIMAL,
  rank REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.name,
    p.price,
    ts_rank(to_tsvector('spanish', p.name || ' ' || p.description),
            plainto_tsquery('spanish', search_term)) as rank
  FROM products p
  WHERE to_tsvector('spanish', p.name || ' ' || p.description)
        @@ plainto_tsquery('spanish', search_term)
  ORDER BY rank DESC;
END;
$$ LANGUAGE plpgsql;
```

---

## 📊 Datos de Ejemplo

### Productos Reales

El proyecto incluye **22 productos reales** de marcas argentinas:

- **Sherwin Williams**: Pinturas premium
- **Petrilac**: Pinturas industriales
- **Sinteplast**: Revestimientos
- **Plavicon**: Impermeabilizantes
- **Akapol**: Adhesivos y selladores

### Categorías Implementadas

1. **Pinturas de Interior** (8 productos)
2. **Pinturas de Exterior** (6 productos)
3. **Impermeabilizantes** (4 productos)
4. **Herramientas** (2 productos)
5. **Accesorios** (1 producto)
6. **Adhesivos** (1 producto)

---

## 🔧 Mantenimiento

### Backups Automáticos

Supabase realiza backups automáticos:

- **Diarios**: Últimos 7 días
- **Semanales**: Últimas 4 semanas
- **Point-in-time**: Últimas 24 horas

### Monitoreo

```sql
-- Verificar salud de la base de datos
SELECT
  schemaname,
  tablename,
  n_tup_ins as inserts,
  n_tup_upd as updates,
  n_tup_del as deletes
FROM pg_stat_user_tables;

-- Verificar uso de índices
SELECT
  indexrelname,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes;
```

---

## 📚 Recursos Adicionales

- [🔌 APIs](../api/README.md) - Documentación de endpoints
- [🔐 Autenticación](./authentication.md) - Integración con Clerk
- [📡 Real-time](./realtime.md) - Configuración tiempo real
- [🗂️ Storage](./storage.md) - Gestión de archivos
