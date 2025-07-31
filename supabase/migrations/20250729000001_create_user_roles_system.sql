-- =====================================================
-- MIGRACIÓN: Sistema de Roles y Permisos - Pinteya E-commerce
-- Fecha: 29 Julio 2025
-- Descripción: Crear sistema completo de roles con permisos granulares
-- =====================================================

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. CREAR TABLA DE ROLES
-- =====================================================

CREATE TABLE IF NOT EXISTS public.user_roles (
    id SERIAL PRIMARY KEY,
    role_name VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    permissions JSONB NOT NULL DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    is_system_role BOOLEAN DEFAULT false, -- Roles del sistema no se pueden eliminar
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para optimización
CREATE INDEX IF NOT EXISTS idx_user_roles_name ON public.user_roles(role_name);
CREATE INDEX IF NOT EXISTS idx_user_roles_active ON public.user_roles(is_active);
CREATE INDEX IF NOT EXISTS idx_user_roles_permissions ON public.user_roles USING GIN(permissions);

-- =====================================================
-- 2. CREAR TABLA DE PERFILES DE USUARIO
-- =====================================================

CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    supabase_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    clerk_user_id VARCHAR(255) UNIQUE,
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    role_id INTEGER REFERENCES public.user_roles(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    last_login_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT user_profiles_email_check CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Índices para optimización
CREATE INDEX IF NOT EXISTS idx_user_profiles_supabase_user_id ON public.user_profiles(supabase_user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_clerk_user_id ON public.user_profiles(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role_id ON public.user_profiles(role_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_active ON public.user_profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_user_profiles_metadata ON public.user_profiles USING GIN(metadata);

-- =====================================================
-- 3. INSERTAR ROLES PREDEFINIDOS
-- =====================================================

INSERT INTO public.user_roles (role_name, display_name, description, permissions, is_system_role) VALUES
-- ADMINISTRADOR COMPLETO
('admin', 'Administrador', 'Administrador del sistema con acceso completo', '{
  "products": {
    "create": true,
    "read": true,
    "update": true,
    "delete": true,
    "bulk_operations": true,
    "export": true,
    "import": true
  },
  "orders": {
    "create": true,
    "read": true,
    "update": true,
    "delete": true,
    "cancel": true,
    "refund": true,
    "export": true,
    "bulk_operations": true
  },
  "customers": {
    "create": true,
    "read": true,
    "update": true,
    "delete": true,
    "export": true,
    "impersonate": true
  },
  "analytics": {
    "read": true,
    "export": true,
    "advanced_reports": true
  },
  "settings": {
    "read": true,
    "update": true,
    "system_config": true,
    "payment_config": true,
    "shipping_config": true
  },
  "users": {
    "create": true,
    "read": true,
    "update": true,
    "delete": true,
    "manage_roles": true
  },
  "admin_panel": {
    "access": true,
    "full_access": true
  }
}', true),

-- MODERADOR
('moderator', 'Moderador', 'Moderador de contenido con permisos limitados', '{
  "products": {
    "create": true,
    "read": true,
    "update": true,
    "delete": false,
    "bulk_operations": false,
    "export": true,
    "import": false
  },
  "orders": {
    "create": false,
    "read": true,
    "update": true,
    "delete": false,
    "cancel": true,
    "refund": false,
    "export": true,
    "bulk_operations": false
  },
  "customers": {
    "create": false,
    "read": true,
    "update": true,
    "delete": false,
    "export": false,
    "impersonate": false
  },
  "analytics": {
    "read": true,
    "export": false,
    "advanced_reports": false
  },
  "settings": {
    "read": true,
    "update": false,
    "system_config": false,
    "payment_config": false,
    "shipping_config": false
  },
  "users": {
    "create": false,
    "read": true,
    "update": false,
    "delete": false,
    "manage_roles": false
  },
  "admin_panel": {
    "access": true,
    "full_access": false
  }
}', true),

-- CLIENTE
('customer', 'Cliente', 'Cliente del e-commerce con permisos básicos', '{
  "products": {
    "create": false,
    "read": true,
    "update": false,
    "delete": false,
    "bulk_operations": false,
    "export": false,
    "import": false
  },
  "orders": {
    "create": true,
    "read": "own",
    "update": "own_limited",
    "delete": false,
    "cancel": "own",
    "refund": false,
    "export": "own",
    "bulk_operations": false
  },
  "customers": {
    "create": false,
    "read": "own",
    "update": "own",
    "delete": false,
    "export": false,
    "impersonate": false
  },
  "analytics": {
    "read": false,
    "export": false,
    "advanced_reports": false
  },
  "settings": {
    "read": false,
    "update": false,
    "system_config": false,
    "payment_config": false,
    "shipping_config": false
  },
  "users": {
    "create": false,
    "read": false,
    "update": false,
    "delete": false,
    "manage_roles": false
  },
  "admin_panel": {
    "access": false,
    "full_access": false
  },
  "profile": {
    "read": "own",
    "update": "own",
    "delete": "own"
  },
  "wishlist": {
    "create": true,
    "read": "own",
    "update": "own",
    "delete": "own"
  },
  "cart": {
    "create": true,
    "read": "own",
    "update": "own",
    "delete": "own"
  }
}', true);

-- =====================================================
-- 4. FUNCIONES DE UTILIDAD
-- =====================================================

-- Función para obtener el rol de un usuario
CREATE OR REPLACE FUNCTION public.get_user_role(user_uuid UUID DEFAULT auth.uid())
RETURNS TEXT AS $$
DECLARE
    user_role TEXT;
BEGIN
    SELECT ur.role_name INTO user_role
    FROM public.user_profiles up
    JOIN public.user_roles ur ON up.role_id = ur.id
    WHERE up.supabase_user_id = user_uuid
    AND up.is_active = true
    AND ur.is_active = true;
    
    RETURN COALESCE(user_role, 'customer');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- Función para verificar si un usuario es admin
CREATE OR REPLACE FUNCTION public.is_admin(user_uuid UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
    RETURN public.get_user_role(user_uuid) = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- Función para verificar si un usuario es moderador o admin
CREATE OR REPLACE FUNCTION public.is_moderator_or_admin(user_uuid UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
DECLARE
    user_role TEXT;
BEGIN
    user_role := public.get_user_role(user_uuid);
    RETURN user_role IN ('admin', 'moderator');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- Función para verificar permisos específicos
CREATE OR REPLACE FUNCTION public.has_permission(
    permission_path TEXT[],
    user_uuid UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN AS $$
DECLARE
    user_permissions JSONB;
    current_level JSONB;
    path_element TEXT;
    result BOOLEAN := false;
BEGIN
    -- Obtener permisos del usuario
    SELECT ur.permissions INTO user_permissions
    FROM public.user_profiles up
    JOIN public.user_roles ur ON up.role_id = ur.id
    WHERE up.supabase_user_id = user_uuid
    AND up.is_active = true
    AND ur.is_active = true;
    
    -- Si no hay permisos, retornar false
    IF user_permissions IS NULL THEN
        RETURN false;
    END IF;
    
    -- Navegar por la estructura de permisos
    current_level := user_permissions;
    FOREACH path_element IN ARRAY permission_path
    LOOP
        IF current_level ? path_element THEN
            current_level := current_level -> path_element;
        ELSE
            RETURN false;
        END IF;
    END LOOP;
    
    -- Verificar el valor final
    IF jsonb_typeof(current_level) = 'boolean' THEN
        result := (current_level)::boolean;
    ELSIF jsonb_typeof(current_level) = 'string' THEN
        -- Para permisos como "own", "own_limited", etc.
        result := current_level::text != '"false"';
    ELSE
        result := false;
    END IF;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- =====================================================
-- 5. TRIGGERS PARA ACTUALIZACIÓN AUTOMÁTICA
-- =====================================================

-- Trigger para actualizar updated_at en user_roles
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_roles_updated_at
    BEFORE UPDATE ON public.user_roles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- 6. POLÍTICAS RLS (Row Level Security)
-- =====================================================

-- Habilitar RLS en las tablas
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Políticas para user_roles
CREATE POLICY "Allow read user_roles for authenticated users" ON public.user_roles
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow admin to manage user_roles" ON public.user_roles
    FOR ALL USING (public.is_admin());

-- Políticas para user_profiles
CREATE POLICY "Allow users to read own profile" ON public.user_profiles
    FOR SELECT USING (
        supabase_user_id = auth.uid() OR public.is_moderator_or_admin()
    );

CREATE POLICY "Allow users to update own profile" ON public.user_profiles
    FOR UPDATE USING (
        supabase_user_id = auth.uid() OR public.is_admin()
    );

CREATE POLICY "Allow admin to insert user profiles" ON public.user_profiles
    FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "Allow admin to delete user profiles" ON public.user_profiles
    FOR DELETE USING (public.is_admin());

-- =====================================================
-- 7. COMENTARIOS Y DOCUMENTACIÓN
-- =====================================================

COMMENT ON TABLE public.user_roles IS 'Tabla de roles del sistema con estructura de permisos JSONB jerárquica';
COMMENT ON TABLE public.user_profiles IS 'Perfiles de usuario con relación a roles y metadatos adicionales';
COMMENT ON FUNCTION public.get_user_role(UUID) IS 'Obtiene el rol de un usuario específico';
COMMENT ON FUNCTION public.is_admin(UUID) IS 'Verifica si un usuario tiene rol de administrador';
COMMENT ON FUNCTION public.has_permission(TEXT[], UUID) IS 'Verifica si un usuario tiene un permiso específico';

-- =====================================================
-- 8. CREAR USUARIO ADMINISTRADOR POR DEFECTO
-- =====================================================

-- Insertar rol de customer por defecto para nuevos usuarios
INSERT INTO public.user_profiles (
    supabase_user_id,
    email,
    first_name,
    last_name,
    role_id,
    is_active,
    is_verified,
    metadata
)
SELECT 
    id,
    email,
    COALESCE(raw_user_meta_data->>'first_name', 'Usuario'),
    COALESCE(raw_user_meta_data->>'last_name', ''),
    (SELECT id FROM public.user_roles WHERE role_name = 'customer'),
    true,
    email_confirmed_at IS NOT NULL,
    jsonb_build_object(
        'created_by', 'migration',
        'source', 'existing_user'
    )
FROM auth.users 
WHERE NOT EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE supabase_user_id = auth.users.id
);

-- Crear usuario admin específico si no existe
DO $$
DECLARE
    admin_role_id INTEGER;
BEGIN
    -- Obtener ID del rol admin
    SELECT id INTO admin_role_id FROM public.user_roles WHERE role_name = 'admin';
    
    -- Crear perfil admin para santiago@xor.com.ar si no existe
    INSERT INTO public.user_profiles (
        email,
        first_name,
        last_name,
        role_id,
        is_active,
        is_verified,
        metadata
    )
    SELECT 
        'santiago@xor.com.ar',
        'Santiago',
        'Admin',
        admin_role_id,
        true,
        true,
        jsonb_build_object(
            'created_by', 'migration',
            'is_super_admin', true,
            'source', 'system_setup'
        )
    WHERE NOT EXISTS (
        SELECT 1 FROM public.user_profiles 
        WHERE email = 'santiago@xor.com.ar'
    );
END $$;
