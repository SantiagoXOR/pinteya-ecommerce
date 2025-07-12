-- ===================================
-- PINTEYA E-COMMERCE - ESQUEMA DE BASE DE DATOS
-- ===================================
-- Ejecutar este script en el SQL Editor de Supabase

-- ===================================
-- 1. TABLA DE USUARIOS
-- ===================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===================================
-- 2. TABLA DE CATEGORÍAS
-- ===================================
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  parent_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===================================
-- 3. TABLA DE PRODUCTOS
-- ===================================
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  brand VARCHAR(100),
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL CHECK (price > 0),
  discounted_price DECIMAL(10,2) CHECK (discounted_price > 0),
  stock INTEGER DEFAULT 0 CHECK (stock >= 0),
  category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  images JSONB DEFAULT '{"thumbnails": [], "previews": []}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===================================
-- 4. TABLA DE ÓRDENES
-- ===================================
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  total DECIMAL(10,2) NOT NULL CHECK (total > 0),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'shipped', 'delivered', 'cancelled')),
  payment_id TEXT,
  shipping_address JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===================================
-- 5. TABLA DE ITEMS DE ÓRDENES
-- ===================================
CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price DECIMAL(10,2) NOT NULL CHECK (price > 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===================================
-- 6. TABLA DE DIRECCIONES DE USUARIO
-- ===================================
CREATE TABLE IF NOT EXISTS user_addresses (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  street TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT,
  postal_code TEXT NOT NULL,
  country TEXT DEFAULT 'Argentina',
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===================================
-- 6. TABLA DE DIRECCIONES DE USUARIO
-- ===================================
CREATE TABLE IF NOT EXISTS user_addresses (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  street TEXT NOT NULL,
  city TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  country TEXT DEFAULT 'Argentina',
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===================================
-- 7. ÍNDICES PARA OPTIMIZACIÓN
-- ===================================
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);
CREATE INDEX IF NOT EXISTS idx_products_stock ON products(stock);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_user_addresses_user ON user_addresses(user_id);

-- Índice para búsqueda full-text en productos
CREATE INDEX IF NOT EXISTS idx_products_search ON products 
USING gin(to_tsvector('spanish', name || ' ' || COALESCE(description, '')));

-- ===================================
-- 8. TRIGGERS PARA UPDATED_AT
-- ===================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar triggers a las tablas
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_addresses_updated_at BEFORE UPDATE ON user_addresses 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===================================
-- 9. ROW LEVEL SECURITY (RLS)
-- ===================================

-- Habilitar RLS en tablas sensibles
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_addresses ENABLE ROW LEVEL SECURITY;

-- Habilitar RLS en tablas de catálogo (SEGURIDAD CRÍTICA)
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Políticas para usuarios (solo pueden ver/editar sus propios datos)
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (clerk_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (clerk_id = auth.jwt() ->> 'sub');

-- Políticas para órdenes (solo pueden ver sus propias órdenes)
CREATE POLICY "Users can view own orders" ON orders
  FOR SELECT USING (user_id IN (
    SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'
  ));

CREATE POLICY "Users can create own orders" ON orders
  FOR INSERT WITH CHECK (user_id IN (
    SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'
  ));

-- Políticas para items de órdenes
CREATE POLICY "Users can view own order items" ON order_items
  FOR SELECT USING (order_id IN (
    SELECT id FROM orders WHERE user_id IN (
      SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'
    )
  ));

-- Políticas para direcciones de usuario
CREATE POLICY "Users can manage own addresses" ON user_addresses
  FOR ALL USING (user_id IN (
    SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'
  ));

-- ===================================
-- 10. POLÍTICAS RLS PARA CATÁLOGO PÚBLICO
-- ===================================

-- Función auxiliar para verificar si el usuario es administrador
-- SEGURIDAD: Protegida contra path hijacking con SET search_path
CREATE OR REPLACE FUNCTION public.is_admin() RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_profiles up
    JOIN public.user_roles ur ON up.role_id = ur.id
    WHERE up.supabase_user_id = auth.uid()
    AND ur.role_name = 'admin'
    AND up.is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- POLÍTICAS PARA CATEGORÍAS
-- Lectura pública (necesaria para mostrar catálogo)
CREATE POLICY "Public read access for categories" ON public.categories
  FOR SELECT USING (true);

-- Escritura solo para administradores
CREATE POLICY "Admin only insert for categories" ON public.categories
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "Admin only update for categories" ON public.categories
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "Admin only delete for categories" ON public.categories
  FOR DELETE USING (public.is_admin());

-- POLÍTICAS PARA PRODUCTOS
-- Lectura pública (necesaria para mostrar catálogo)
CREATE POLICY "Public read access for products" ON public.products
  FOR SELECT USING (true);

-- Escritura solo para administradores
CREATE POLICY "Admin only insert for products" ON public.products
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "Admin only update for products" ON public.products
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "Admin only delete for products" ON public.products
  FOR DELETE USING (public.is_admin());

-- ===================================
-- 11. FUNCIONES ADICIONALES CON PROTECCIÓN DE SEGURIDAD
-- ===================================

-- Función para actualizar timestamp (protegida contra path hijacking)
CREATE OR REPLACE FUNCTION public.update_updated_at_column() RETURNS trigger AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = 'public';

-- Función para actualizar stock de productos (protegida contra path hijacking)
CREATE OR REPLACE FUNCTION public.update_product_stock(product_id INTEGER, quantity_sold INTEGER) RETURNS void AS $$
BEGIN
  UPDATE products
  SET stock = stock - quantity_sold,
      updated_at = NOW()
  WHERE id = product_id;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER SET search_path = 'public';

-- Función para verificar permisos de usuario (protegida contra path hijacking)
CREATE OR REPLACE FUNCTION public.check_user_permission(user_email TEXT, permission_path TEXT[]) RETURNS boolean AS $$
DECLARE
    user_permissions JSONB;
    permission_value JSONB;
BEGIN
    SELECT ur.permissions INTO user_permissions
    FROM user_profiles up
    JOIN user_roles ur ON up.role_id = ur.id
    WHERE up.email = user_email AND up.is_active = true;

    IF user_permissions IS NULL THEN
        RETURN false;
    END IF;

    permission_value := user_permissions;
    FOR i IN 1..array_length(permission_path, 1) LOOP
        permission_value := permission_value -> permission_path[i];
        IF permission_value IS NULL THEN
            RETURN false;
        END IF;
    END LOOP;

    RETURN (permission_value::text = 'true');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- Función para obtener rol de usuario (protegida contra path hijacking)
CREATE OR REPLACE FUNCTION public.get_user_role(user_email TEXT)
RETURNS TABLE(role_name TEXT, permissions JSONB, is_active BOOLEAN) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ur.role_name::TEXT,
        ur.permissions,
        up.is_active
    FROM user_profiles up
    JOIN user_roles ur ON up.role_id = ur.id
    WHERE up.email = user_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- Función para asignar rol a usuario (protegida contra path hijacking)
CREATE OR REPLACE FUNCTION public.assign_user_role(user_email TEXT, new_role_name TEXT, clerk_id TEXT DEFAULT NULL) RETURNS boolean AS $$
DECLARE
    role_id_var UUID;
    user_exists BOOLEAN;
BEGIN
    SELECT id INTO role_id_var FROM user_roles WHERE role_name = new_role_name;

    IF role_id_var IS NULL THEN
        RAISE EXCEPTION 'Rol % no encontrado', new_role_name;
    END IF;

    SELECT EXISTS(SELECT 1 FROM user_profiles WHERE email = user_email) INTO user_exists;

    IF user_exists THEN
        UPDATE user_profiles
        SET
            role_id = role_id_var,
            updated_at = NOW(),
            clerk_user_id = COALESCE(clerk_id, clerk_user_id)
        WHERE email = user_email;
    ELSE
        INSERT INTO user_profiles (
            clerk_user_id,
            email,
            role_id,
            is_active
        ) VALUES (
            COALESCE(clerk_id, 'pending_' || user_email),
            user_email,
            role_id_var,
            true
        );
    END IF;

    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- ===================================
-- 12. DATOS INICIALES
-- ===================================

-- Insertar categorías específicas para PINTEYA
INSERT INTO categories (name, slug, image_url) VALUES
('Pinturas', 'pinturas', '/images/categories/pinturas.jpg'),
('Herramientas', 'herramientas', '/images/categories/herramientas.jpg'),
('Accesorios de Pintura', 'accesorios-pintura', '/images/categories/accesorios-pintura.jpg'),
('Materiales de Construcción', 'materiales-construccion', '/images/categories/materiales-construccion.jpg'),
('Seguridad', 'seguridad', '/images/categories/seguridad.jpg')
ON CONFLICT (slug) DO NOTHING;

-- Insertar subcategorías específicas para pinturería
INSERT INTO categories (name, slug, parent_id, image_url) VALUES
('Pinturas Látex', 'pinturas-latex', 1, '/images/categories/pinturas-latex.jpg'),
('Pinturas Esmalte', 'pinturas-esmalte', 1, '/images/categories/pinturas-esmalte.jpg'),
('Pinceles', 'pinceles', 3, '/images/categories/pinceles.jpg'),
('Rodillos', 'rodillos', 3, '/images/categories/rodillos.jpg'),
('Taladros', 'taladros', 2, '/images/categories/taladros.jpg'),
('Destornilladores', 'destornilladores', 2, '/images/categories/destornilladores.jpg')
ON CONFLICT (slug) DO NOTHING;
