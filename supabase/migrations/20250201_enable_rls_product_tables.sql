-- ===================================
-- HABILITAR RLS EN TABLAS DE PRODUCTOS
-- Habilitar Row Level Security en tablas de productos para cumplir con políticas de seguridad
-- Fecha: 2025-02-01
-- ===================================

-- Habilitar RLS en products_optimized
ALTER TABLE public.products_optimized ENABLE ROW LEVEL SECURITY;

-- Habilitar RLS en product_brands
ALTER TABLE public.product_brands ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLÍTICAS RLS PARA TABLAS DE PRODUCTOS
-- =====================================================

-- Políticas para products_optimized
-- Lectura pública de productos activos optimizados
CREATE POLICY "Public can view active optimized products" ON public.products_optimized
    FOR SELECT USING (
        is_active = true
    );

-- Admins y moderadores pueden ver todos los productos optimizados
CREATE POLICY "Admins and moderators can view all optimized products" ON public.products_optimized
    FOR SELECT USING (
        public.is_moderator_or_admin()
    );

-- Solo usuarios con permisos pueden crear productos optimizados
CREATE POLICY "Authorized users can create optimized products" ON public.products_optimized
    FOR INSERT WITH CHECK (
        public.has_any_permission(ARRAY['products_create', 'admin_access'])
    );

-- Solo usuarios con permisos pueden actualizar productos optimizados
CREATE POLICY "Authorized users can update optimized products" ON public.products_optimized
    FOR UPDATE USING (
        public.has_any_permission(ARRAY['products_update', 'admin_access'])
    );

-- Solo admins pueden eliminar productos optimizados
CREATE POLICY "Only admins can delete optimized products" ON public.products_optimized
    FOR DELETE USING (
        public.is_admin()
    );

-- Políticas para product_brands
-- Lectura pública de marcas de productos
CREATE POLICY "Public can view product brands" ON public.product_brands
    FOR SELECT USING (true);

-- Solo usuarios con permisos pueden crear marcas
CREATE POLICY "Authorized users can create product brands" ON public.product_brands
    FOR INSERT WITH CHECK (
        public.has_any_permission(ARRAY['products_create', 'admin_access'])
    );

-- Solo usuarios con permisos pueden actualizar marcas
CREATE POLICY "Authorized users can update product brands" ON public.product_brands
    FOR UPDATE USING (
        public.has_any_permission(ARRAY['products_update', 'admin_access'])
    );

-- Solo admins pueden eliminar marcas
CREATE POLICY "Only admins can delete product brands" ON public.product_brands
    FOR DELETE USING (
        public.is_admin()
    );

-- Comentarios de documentación
COMMENT ON TABLE public.products_optimized IS 'Tabla de productos optimizada con RLS habilitado';
COMMENT ON TABLE public.product_brands IS 'Tabla de marcas de productos con RLS habilitado';