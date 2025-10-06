-- ===================================
-- PINTEYA E-COMMERCE - ENTERPRISE RLS SYSTEM
-- Row Level Security Enterprise para integración con NextAuth.js + Supabase
-- VERSIÓN CORREGIDA: Soluciona errores OLD en políticas RLS y funciones recordset
-- ===================================

-- =====================================================
-- 1. FUNCIONES AUXILIARES ENTERPRISE
-- =====================================================

-- Función para obtener el perfil del usuario actual
CREATE OR REPLACE FUNCTION public.get_current_user_profile()
RETURNS TABLE(
    id UUID,
    clerk_user_id VARCHAR(255),
    email VARCHAR(255),
    role VARCHAR(50),
    permissions TEXT[],
    is_active BOOLEAN
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        up.id,
        up.clerk_user_id,
        up.email,
        COALESCE(ur.role_name, 'user') as role,
        COALESCE(up.permissions, ARRAY[]::TEXT[]) as permissions,
        up.is_active
    FROM public.user_profiles up
    LEFT JOIN public.user_roles ur ON up.role_id = ur.id
    WHERE up.supabase_user_id = auth.uid()
    AND up.is_active = true;
END;
$$;

-- NOTA: Función is_admin() ya existe en migración anterior (20250201_security_functions_fix.sql)
-- No redefinimos para evitar conflictos "function is not unique"

-- Función para verificar si el usuario actual es moderador o admin
CREATE OR REPLACE FUNCTION public.is_moderator_or_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_role VARCHAR(50);
BEGIN
    -- CORREGIDO: Manejo correcto del recordset con LIMIT 1
    SELECT role INTO user_role FROM public.get_current_user_profile() LIMIT 1;
    RETURN COALESCE(user_role IN ('admin', 'moderator'), false);
END;
$$;

-- Función para verificar permisos específicos
CREATE OR REPLACE FUNCTION public.has_permission(required_permission TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_permissions TEXT[];
BEGIN
    -- CORREGIDO: Manejo correcto del recordset con LIMIT 1
    SELECT permissions INTO user_permissions FROM public.get_current_user_profile() LIMIT 1;
    RETURN COALESCE(required_permission = ANY(user_permissions), false);
END;
$$;

-- Función para verificar múltiples permisos
CREATE OR REPLACE FUNCTION public.has_any_permission(required_permissions TEXT[])
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_permissions TEXT[];
    perm TEXT;
BEGIN
    -- CORREGIDO: Manejo correcto del recordset con LIMIT 1
    SELECT permissions INTO user_permissions FROM public.get_current_user_profile() LIMIT 1;
    
    FOREACH perm IN ARRAY required_permissions
    LOOP
        IF perm = ANY(user_permissions) THEN
            RETURN true;
        END IF;
    END LOOP;
    
    RETURN false;
END;
$$;

-- Función para obtener el ID del perfil del usuario actual
CREATE OR REPLACE FUNCTION public.get_current_user_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_id UUID;
BEGIN
    -- CORREGIDO: Manejo correcto del recordset con LIMIT 1
    SELECT id INTO user_id FROM public.get_current_user_profile() LIMIT 1;
    RETURN user_id;
END;
$$;

-- =====================================================
-- 2. RLS PARA USER_PROFILES
-- =====================================================

-- Habilitar RLS en user_profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios pueden ver su propio perfil
CREATE POLICY "Users can view own profile" ON public.user_profiles
    FOR SELECT USING (
        supabase_user_id = auth.uid()
    );

-- CORREGIDO: Política sin referencias OLD, usando subqueries
CREATE POLICY "Users can update own profile" ON public.user_profiles
    FOR UPDATE USING (
        supabase_user_id = auth.uid()
    ) WITH CHECK (
        supabase_user_id = auth.uid()
        AND role_id = (SELECT role_id FROM public.user_profiles WHERE id = user_profiles.id)
        AND is_active = (SELECT is_active FROM public.user_profiles WHERE id = user_profiles.id)
    );

-- Política: Admins y moderadores pueden ver todos los perfiles
CREATE POLICY "Admins and moderators can view all profiles" ON public.user_profiles
    FOR SELECT USING (
        public.is_moderator_or_admin()
    );

-- Política: Solo admins pueden crear perfiles
CREATE POLICY "Only admins can create profiles" ON public.user_profiles
    FOR INSERT WITH CHECK (
        public.is_admin()
    );

-- Política: Solo admins pueden actualizar cualquier perfil
CREATE POLICY "Only admins can update any profile" ON public.user_profiles
    FOR UPDATE USING (
        public.is_admin()
    );

-- Política: Solo admins pueden eliminar perfiles (soft delete)
CREATE POLICY "Only admins can delete profiles" ON public.user_profiles
    FOR DELETE USING (
        public.is_admin()
    );

-- =====================================================
-- 3. RLS PARA PRODUCTS
-- =====================================================

-- Habilitar RLS en products
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Política: Lectura pública de productos activos
CREATE POLICY "Public can view active products" ON public.products
    FOR SELECT USING (
        is_active = true
    );

-- Política: Admins y moderadores pueden ver todos los productos
CREATE POLICY "Admins and moderators can view all products" ON public.products
    FOR SELECT USING (
        public.is_moderator_or_admin()
    );

-- Política: Solo usuarios con permisos pueden crear productos
CREATE POLICY "Authorized users can create products" ON public.products
    FOR INSERT WITH CHECK (
        public.has_any_permission(ARRAY['products_create', 'admin_access'])
    );

-- Política: Solo usuarios con permisos pueden actualizar productos
CREATE POLICY "Authorized users can update products" ON public.products
    FOR UPDATE USING (
        public.has_any_permission(ARRAY['products_update', 'admin_access'])
    );

-- Política: Solo admins pueden eliminar productos
CREATE POLICY "Only admins can delete products" ON public.products
    FOR DELETE USING (
        public.is_admin()
    );

-- =====================================================
-- 4. RLS PARA CATEGORIES
-- =====================================================

-- Habilitar RLS en categories
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Política: Lectura pública de categorías
CREATE POLICY "Public can view categories" ON public.categories
    FOR SELECT USING (true);

-- Política: Solo usuarios con permisos pueden crear categorías
CREATE POLICY "Authorized users can create categories" ON public.categories
    FOR INSERT WITH CHECK (
        public.has_any_permission(ARRAY['categories_create', 'admin_access'])
    );

-- Política: Solo usuarios con permisos pueden actualizar categorías
CREATE POLICY "Authorized users can update categories" ON public.categories
    FOR UPDATE USING (
        public.has_any_permission(ARRAY['categories_update', 'admin_access'])
    );

-- Política: Solo admins pueden eliminar categorías
CREATE POLICY "Only admins can delete categories" ON public.categories
    FOR DELETE USING (
        public.is_admin()
    );

-- =====================================================
-- 5. RLS PARA ORDERS
-- =====================================================

-- Crear tabla orders si no existe
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
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
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS en orders
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios pueden ver sus propias órdenes
CREATE POLICY "Users can view own orders" ON public.orders
    FOR SELECT USING (
        user_id = public.get_current_user_id()
    );

-- Política: Admins y moderadores pueden ver todas las órdenes
CREATE POLICY "Admins and moderators can view all orders" ON public.orders
    FOR SELECT USING (
        public.is_moderator_or_admin()
    );

-- Política: Los usuarios pueden crear sus propias órdenes
CREATE POLICY "Users can create own orders" ON public.orders
    FOR INSERT WITH CHECK (
        user_id = public.get_current_user_id()
    );

-- Política: Solo usuarios con permisos pueden crear órdenes para otros
CREATE POLICY "Authorized users can create orders for others" ON public.orders
    FOR INSERT WITH CHECK (
        public.has_any_permission(ARRAY['orders_create', 'admin_access'])
    );

-- Política: Los usuarios pueden actualizar sus órdenes (estados limitados)
CREATE POLICY "Users can update own orders" ON public.orders
    FOR UPDATE USING (
        user_id = public.get_current_user_id()
        AND status IN ('pending', 'cancelled')  -- Solo ciertos estados
    );

-- Política: Solo usuarios con permisos pueden actualizar cualquier orden
CREATE POLICY "Authorized users can update any order" ON public.orders
    FOR UPDATE USING (
        public.has_any_permission(ARRAY['orders_update', 'admin_access'])
    );

-- Política: Solo admins pueden eliminar órdenes
CREATE POLICY "Only admins can delete orders" ON public.orders
    FOR DELETE USING (
        public.is_admin()
    );

-- =====================================================
-- 6. RLS PARA ORDER_ITEMS
-- =====================================================

-- Crear tabla order_items si no existe
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES public.products(id) ON DELETE SET NULL,
    product_name VARCHAR(255) NOT NULL,
    product_sku VARCHAR(100),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    product_snapshot JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS en order_items
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios pueden ver items de sus propias órdenes
CREATE POLICY "Users can view own order items" ON public.order_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.orders o 
            WHERE o.id = order_id 
            AND o.user_id = public.get_current_user_id()
        )
    );

-- Política: Admins y moderadores pueden ver todos los items
CREATE POLICY "Admins and moderators can view all order items" ON public.order_items
    FOR SELECT USING (
        public.is_moderator_or_admin()
    );

-- Política: Los usuarios pueden crear items para sus propias órdenes
CREATE POLICY "Users can create items for own orders" ON public.order_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.orders o 
            WHERE o.id = order_id 
            AND o.user_id = public.get_current_user_id()
        )
    );

-- Política: Solo usuarios con permisos pueden crear items para cualquier orden
CREATE POLICY "Authorized users can create any order items" ON public.order_items
    FOR INSERT WITH CHECK (
        public.has_any_permission(ARRAY['orders_create', 'admin_access'])
    );

-- Política: Solo usuarios con permisos pueden actualizar items
CREATE POLICY "Authorized users can update order items" ON public.order_items
    FOR UPDATE USING (
        public.has_any_permission(ARRAY['orders_update', 'admin_access'])
    );

-- Política: Solo admins pueden eliminar items
CREATE POLICY "Only admins can delete order items" ON public.order_items
    FOR DELETE USING (
        public.is_admin()
    );

-- =====================================================
-- 7. ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índices para user_profiles
CREATE INDEX IF NOT EXISTS idx_user_profiles_supabase_user_id ON public.user_profiles(supabase_user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_clerk_user_id ON public.user_profiles(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role_active ON public.user_profiles(role_id, is_active);

-- Índices para products
CREATE INDEX IF NOT EXISTS idx_products_active ON public.products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
-- NOTA: Columna is_featured no existe en la tabla products actual

-- Índices para orders
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at);

-- Índices para order_items
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items(product_id);

-- =====================================================
-- 8. COMENTARIOS Y DOCUMENTACIÓN
-- =====================================================

COMMENT ON FUNCTION public.get_current_user_profile() IS 'Obtiene el perfil completo del usuario autenticado actual';
-- NOTA: is_admin() ya documentada en migración anterior
COMMENT ON FUNCTION public.is_moderator_or_admin() IS 'Verifica si el usuario actual es moderador o administrador';
COMMENT ON FUNCTION public.has_permission(TEXT) IS 'Verifica si el usuario actual tiene un permiso específico';
COMMENT ON FUNCTION public.has_any_permission(TEXT[]) IS 'Verifica si el usuario actual tiene alguno de los permisos especificados';
COMMENT ON FUNCTION public.get_current_user_id() IS 'Obtiene el ID del perfil del usuario autenticado actual';

-- =====================================================
-- 9. GRANTS Y PERMISOS
-- =====================================================

-- Otorgar permisos de ejecución a las funciones
GRANT EXECUTE ON FUNCTION public.get_current_user_profile() TO authenticated;
-- NOTA: is_admin() ya tiene permisos otorgados en migración anterior
GRANT EXECUTE ON FUNCTION public.is_moderator_or_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_permission(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_any_permission(TEXT[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_current_user_id() TO authenticated;
