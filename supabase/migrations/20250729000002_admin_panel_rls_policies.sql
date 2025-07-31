-- =====================================================
-- MIGRACIÓN: Políticas RLS para Panel Administrativo
-- Fecha: 29 Julio 2025
-- Descripción: Políticas de seguridad específicas para el panel admin
-- =====================================================

-- =====================================================
-- 1. POLÍTICAS PARA PRODUCTOS (ADMIN PANEL)
-- =====================================================

-- Solo admins y moderadores pueden crear productos
CREATE POLICY "Admin and moderator can create products" ON public.products
    FOR INSERT WITH CHECK (
        public.has_permission(ARRAY['products', 'create'])
    );

-- Solo admins y moderadores pueden actualizar productos
CREATE POLICY "Admin and moderator can update products" ON public.products
    FOR UPDATE USING (
        public.has_permission(ARRAY['products', 'update'])
    );

-- Solo admins pueden eliminar productos
CREATE POLICY "Only admin can delete products" ON public.products
    FOR DELETE USING (
        public.has_permission(ARRAY['products', 'delete'])
    );

-- Todos pueden leer productos (público)
CREATE POLICY "Everyone can read products" ON public.products
    FOR SELECT USING (true);

-- =====================================================
-- 2. POLÍTICAS PARA ÓRDENES (ADMIN PANEL)
-- =====================================================

-- Crear tabla de órdenes si no existe (para futuras migraciones)
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.user_profiles(id),
    status VARCHAR(50) DEFAULT 'pending',
    total_amount DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS en órdenes
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Admins y moderadores pueden leer todas las órdenes
CREATE POLICY "Admin and moderator can read all orders" ON public.orders
    FOR SELECT USING (
        public.has_permission(ARRAY['orders', 'read'])
    );

-- Usuarios pueden leer solo sus propias órdenes
CREATE POLICY "Users can read own orders" ON public.orders
    FOR SELECT USING (
        user_id = (
            SELECT id FROM public.user_profiles 
            WHERE supabase_user_id = auth.uid()
        )
    );

-- Solo admins pueden crear órdenes desde el panel
CREATE POLICY "Admin can create orders" ON public.orders
    FOR INSERT WITH CHECK (
        public.has_permission(ARRAY['orders', 'create'])
    );

-- Admins y moderadores pueden actualizar órdenes
CREATE POLICY "Admin and moderator can update orders" ON public.orders
    FOR UPDATE USING (
        public.has_permission(ARRAY['orders', 'update'])
    );

-- Solo admins pueden eliminar órdenes
CREATE POLICY "Only admin can delete orders" ON public.orders
    FOR DELETE USING (
        public.has_permission(ARRAY['orders', 'delete'])
    );

-- =====================================================
-- 3. POLÍTICAS PARA CATEGORÍAS
-- =====================================================

-- Solo admins y moderadores pueden crear categorías
CREATE POLICY "Admin and moderator can create categories" ON public.categories
    FOR INSERT WITH CHECK (
        public.has_permission(ARRAY['products', 'create'])
    );

-- Solo admins y moderadores pueden actualizar categorías
CREATE POLICY "Admin and moderator can update categories" ON public.categories
    FOR UPDATE USING (
        public.has_permission(ARRAY['products', 'update'])
    );

-- Solo admins pueden eliminar categorías
CREATE POLICY "Only admin can delete categories" ON public.categories
    FOR DELETE USING (
        public.has_permission(ARRAY['products', 'delete'])
    );

-- Todos pueden leer categorías
CREATE POLICY "Everyone can read categories" ON public.categories
    FOR SELECT USING (true);

-- =====================================================
-- 4. POLÍTICAS PARA ANALYTICS
-- =====================================================

-- Crear tabla de analytics si no existe
CREATE TABLE IF NOT EXISTS public.analytics_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type VARCHAR(100) NOT NULL,
    event_data JSONB DEFAULT '{}',
    user_id UUID REFERENCES public.user_profiles(id),
    session_id VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS en analytics
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Solo admins pueden leer analytics
CREATE POLICY "Only admin can read analytics" ON public.analytics_events
    FOR SELECT USING (
        public.has_permission(ARRAY['analytics', 'read'])
    );

-- Permitir inserción de eventos de analytics (para tracking)
CREATE POLICY "Allow analytics events insertion" ON public.analytics_events
    FOR INSERT WITH CHECK (true);

-- Solo admins pueden eliminar eventos de analytics
CREATE POLICY "Only admin can delete analytics" ON public.analytics_events
    FOR DELETE USING (
        public.has_permission(ARRAY['analytics', 'read'])
    );

-- =====================================================
-- 5. POLÍTICAS PARA CONFIGURACIÓN DEL SISTEMA
-- =====================================================

-- Crear tabla de configuración si no existe
CREATE TABLE IF NOT EXISTS public.system_settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value JSONB NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS en configuración
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Solo admins pueden leer configuración privada
CREATE POLICY "Admin can read all settings" ON public.system_settings
    FOR SELECT USING (
        is_public = true OR public.has_permission(ARRAY['settings', 'read'])
    );

-- Solo admins pueden actualizar configuración
CREATE POLICY "Only admin can update settings" ON public.system_settings
    FOR UPDATE USING (
        public.has_permission(ARRAY['settings', 'update'])
    );

-- Solo admins pueden crear configuración
CREATE POLICY "Only admin can create settings" ON public.system_settings
    FOR INSERT WITH CHECK (
        public.has_permission(ARRAY['settings', 'update'])
    );

-- Solo admins pueden eliminar configuración
CREATE POLICY "Only admin can delete settings" ON public.system_settings
    FOR DELETE USING (
        public.has_permission(ARRAY['settings', 'update'])
    );

-- =====================================================
-- 6. FUNCIÓN PARA VERIFICAR ACCESO AL PANEL ADMIN
-- =====================================================

CREATE OR REPLACE FUNCTION public.can_access_admin_panel(user_uuid UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
    RETURN public.has_permission(ARRAY['admin_panel', 'access'], user_uuid);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- =====================================================
-- 7. FUNCIÓN PARA LOGGING DE ACCIONES ADMINISTRATIVAS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.admin_audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.user_profiles(id),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id VARCHAR(255),
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS en audit log
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Solo admins pueden leer el audit log
CREATE POLICY "Only admin can read audit log" ON public.admin_audit_log
    FOR SELECT USING (
        public.has_permission(ARRAY['admin_panel', 'full_access'])
    );

-- Permitir inserción en audit log (para logging automático)
CREATE POLICY "Allow audit log insertion" ON public.admin_audit_log
    FOR INSERT WITH CHECK (true);

-- Función para registrar acciones administrativas
CREATE OR REPLACE FUNCTION public.log_admin_action(
    p_action VARCHAR(100),
    p_resource_type VARCHAR(50),
    p_resource_id VARCHAR(255) DEFAULT NULL,
    p_old_values JSONB DEFAULT NULL,
    p_new_values JSONB DEFAULT NULL,
    p_user_uuid UUID DEFAULT auth.uid()
)
RETURNS UUID AS $$
DECLARE
    log_id UUID;
    user_profile_id UUID;
BEGIN
    -- Obtener ID del perfil de usuario
    SELECT id INTO user_profile_id
    FROM public.user_profiles
    WHERE supabase_user_id = p_user_uuid;
    
    -- Insertar en audit log
    INSERT INTO public.admin_audit_log (
        user_id,
        action,
        resource_type,
        resource_id,
        old_values,
        new_values
    ) VALUES (
        user_profile_id,
        p_action,
        p_resource_type,
        p_resource_id,
        p_old_values,
        p_new_values
    ) RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- =====================================================
-- 8. TRIGGERS PARA AUDIT LOG AUTOMÁTICO
-- =====================================================

-- Función para trigger de audit log en productos
CREATE OR REPLACE FUNCTION public.audit_products_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        PERFORM public.log_admin_action(
            'CREATE',
            'product',
            NEW.id::text,
            NULL,
            to_jsonb(NEW)
        );
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        PERFORM public.log_admin_action(
            'UPDATE',
            'product',
            NEW.id::text,
            to_jsonb(OLD),
            to_jsonb(NEW)
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        PERFORM public.log_admin_action(
            'DELETE',
            'product',
            OLD.id::text,
            to_jsonb(OLD),
            NULL
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Crear triggers para audit log
CREATE TRIGGER audit_products_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION public.audit_products_changes();

-- =====================================================
-- 9. ÍNDICES PARA OPTIMIZACIÓN
-- =====================================================

-- Índices para analytics
CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON public.analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON public.analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON public.analytics_events(created_at);

-- Índices para audit log
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON public.admin_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON public.admin_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_resource ON public.admin_audit_log(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON public.admin_audit_log(created_at);

-- Índices para órdenes
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at);

-- =====================================================
-- 10. CONFIGURACIÓN INICIAL DEL SISTEMA
-- =====================================================

-- Insertar configuraciones básicas del sistema
INSERT INTO public.system_settings (setting_key, setting_value, description, is_public) VALUES
('site_name', '"Pinteya E-commerce"', 'Nombre del sitio web', true),
('site_description', '"Tu tienda de pinturería online"', 'Descripción del sitio', true),
('admin_email', '"santiago@xor.com.ar"', 'Email del administrador principal', false),
('maintenance_mode', 'false', 'Modo de mantenimiento activado', false),
('allow_registration', 'true', 'Permitir registro de nuevos usuarios', false),
('max_products_per_page', '20', 'Máximo de productos por página', true),
('currency', '"ARS"', 'Moneda del sitio', true),
('timezone', '"America/Argentina/Cordoba"', 'Zona horaria del sistema', false)
ON CONFLICT (setting_key) DO NOTHING;

-- =====================================================
-- 11. COMENTARIOS FINALES
-- =====================================================

COMMENT ON FUNCTION public.can_access_admin_panel(UUID) IS 'Verifica si un usuario puede acceder al panel administrativo';
COMMENT ON FUNCTION public.log_admin_action(VARCHAR, VARCHAR, VARCHAR, JSONB, JSONB, UUID) IS 'Registra acciones administrativas en el audit log';
COMMENT ON TABLE public.admin_audit_log IS 'Log de auditoría para acciones administrativas';
COMMENT ON TABLE public.analytics_events IS 'Eventos de analytics del sistema';
COMMENT ON TABLE public.system_settings IS 'Configuraciones del sistema';
