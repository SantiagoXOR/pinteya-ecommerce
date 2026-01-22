-- ============================================================================
-- MIGRACIÓN: Sistema de Roles por Tenant
-- ============================================================================
-- Descripción: Crea el sistema de roles híbrido con Super Admins (plataforma)
-- y Tenant Admins (por tienda)
-- ============================================================================

-- Tipo enum para roles de usuario
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tenant_user_role') THEN
    CREATE TYPE tenant_user_role AS ENUM (
      'super_admin',     -- Acceso total a toda la plataforma
      'tenant_owner',    -- Dueño del tenant, acceso total a su tienda
      'tenant_admin',    -- Administrador del tenant
      'tenant_staff',    -- Personal con acceso limitado
      'customer'         -- Cliente registrado
    );
  END IF;
END $$;

-- Tabla de Super Admins (administradores de la plataforma)
CREATE TABLE IF NOT EXISTS super_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  
  -- Permisos específicos de super admin
  can_create_tenants BOOLEAN DEFAULT true,
  can_delete_tenants BOOLEAN DEFAULT true,
  can_manage_super_admins BOOLEAN DEFAULT false,    -- Solo el primer super admin
  can_access_billing BOOLEAN DEFAULT true,
  can_view_all_analytics BOOLEAN DEFAULT true,
  
  -- Metadata
  granted_by UUID REFERENCES user_profiles(id),
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- Tabla de roles de usuario por tenant
CREATE TABLE IF NOT EXISTS tenant_user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Rol asignado
  role tenant_user_role NOT NULL DEFAULT 'customer',
  
  -- Permisos granulares (JSON para flexibilidad)
  permissions JSONB DEFAULT '{
    "orders": {"view": true, "create": false, "edit": false, "delete": false, "export": false},
    "products": {"view": true, "create": false, "edit": false, "delete": false, "import": false},
    "customers": {"view": false, "edit": false, "export": false},
    "analytics": {"view": false, "export": false},
    "settings": {"view": false, "edit": false},
    "integrations": {"view": false, "edit": false},
    "marketing": {"view": false, "edit": false}
  }'::jsonb,
  
  -- Estado
  is_active BOOLEAN DEFAULT true,
  
  -- Metadata
  invited_by UUID REFERENCES user_profiles(id),
  invited_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, tenant_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_super_admins_user ON super_admins(user_id);
CREATE INDEX IF NOT EXISTS idx_tenant_user_roles_user ON tenant_user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_tenant_user_roles_tenant ON tenant_user_roles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_user_roles_role ON tenant_user_roles(role);
CREATE INDEX IF NOT EXISTS idx_tenant_user_roles_active ON tenant_user_roles(is_active) WHERE is_active = true;

-- Triggers para updated_at
DROP TRIGGER IF EXISTS trigger_super_admins_updated_at ON super_admins;
CREATE TRIGGER trigger_super_admins_updated_at
  BEFORE UPDATE ON super_admins
  FOR EACH ROW
  EXECUTE FUNCTION update_tenants_updated_at();

DROP TRIGGER IF EXISTS trigger_tenant_user_roles_updated_at ON tenant_user_roles;
CREATE TRIGGER trigger_tenant_user_roles_updated_at
  BEFORE UPDATE ON tenant_user_roles
  FOR EACH ROW
  EXECUTE FUNCTION update_tenants_updated_at();

-- RLS
ALTER TABLE super_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_user_roles ENABLE ROW LEVEL SECURITY;

-- Políticas para super_admins (solo service role puede leer/escribir)
CREATE POLICY "Super admins readable by service role"
  ON super_admins FOR SELECT
  USING (auth.role() = 'service_role');

CREATE POLICY "Super admins writable by service role"
  ON super_admins FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Políticas para tenant_user_roles
CREATE POLICY "Tenant user roles readable by service role"
  ON tenant_user_roles FOR SELECT
  USING (auth.role() = 'service_role');

CREATE POLICY "Tenant user roles writable by service role"
  ON tenant_user_roles FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Función para verificar si un usuario es super admin
CREATE OR REPLACE FUNCTION is_super_admin(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM super_admins 
    WHERE user_id = p_user_id
  );
END;
$$;

-- Función para obtener el rol de un usuario en un tenant
CREATE OR REPLACE FUNCTION get_user_tenant_role(p_user_id UUID, p_tenant_id UUID)
RETURNS tenant_user_role
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role tenant_user_role;
BEGIN
  -- Primero verificar si es super admin
  IF is_super_admin(p_user_id) THEN
    RETURN 'super_admin'::tenant_user_role;
  END IF;
  
  -- Buscar rol en el tenant
  SELECT role INTO v_role
  FROM tenant_user_roles
  WHERE user_id = p_user_id 
    AND tenant_id = p_tenant_id
    AND is_active = true;
  
  RETURN COALESCE(v_role, 'customer'::tenant_user_role);
END;
$$;

-- Función para verificar un permiso específico
CREATE OR REPLACE FUNCTION check_tenant_permission(
  p_user_id UUID, 
  p_tenant_id UUID,
  p_resource VARCHAR(50),
  p_action VARCHAR(20)
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_permissions JSONB;
  v_role tenant_user_role;
BEGIN
  -- Super admins tienen todos los permisos
  IF is_super_admin(p_user_id) THEN
    RETURN true;
  END IF;
  
  -- Obtener rol y permisos del usuario
  SELECT role, permissions INTO v_role, v_permissions
  FROM tenant_user_roles
  WHERE user_id = p_user_id 
    AND tenant_id = p_tenant_id
    AND is_active = true;
  
  IF v_role IS NULL THEN
    RETURN false;
  END IF;
  
  -- Tenant owners tienen todos los permisos en su tenant
  IF v_role = 'tenant_owner' OR v_role = 'tenant_admin' THEN
    RETURN true;
  END IF;
  
  -- Verificar permiso específico
  RETURN COALESCE(
    (v_permissions->p_resource->>p_action)::boolean,
    false
  );
END;
$$;

-- Función para obtener todos los tenants a los que un usuario tiene acceso
CREATE OR REPLACE FUNCTION get_user_accessible_tenants(p_user_id UUID)
RETURNS TABLE (
  tenant_id UUID,
  tenant_slug VARCHAR(50),
  tenant_name VARCHAR(255),
  user_role tenant_user_role
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Si es super admin, devolver todos los tenants activos
  IF is_super_admin(p_user_id) THEN
    RETURN QUERY
    SELECT 
      t.id AS tenant_id,
      t.slug AS tenant_slug,
      t.name AS tenant_name,
      'super_admin'::tenant_user_role AS user_role
    FROM tenants t
    WHERE t.is_active = true
    ORDER BY t.name;
  ELSE
    -- Devolver solo tenants donde tiene rol asignado
    RETURN QUERY
    SELECT 
      t.id AS tenant_id,
      t.slug AS tenant_slug,
      t.name AS tenant_name,
      tur.role AS user_role
    FROM tenant_user_roles tur
    JOIN tenants t ON t.id = tur.tenant_id
    WHERE tur.user_id = p_user_id
      AND tur.is_active = true
      AND t.is_active = true
    ORDER BY t.name;
  END IF;
END;
$$;

-- Permisos predefinidos por rol
CREATE OR REPLACE FUNCTION get_default_permissions_for_role(p_role tenant_user_role)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
BEGIN
  CASE p_role
    WHEN 'tenant_owner', 'tenant_admin' THEN
      RETURN '{
        "orders": {"view": true, "create": true, "edit": true, "delete": true, "export": true},
        "products": {"view": true, "create": true, "edit": true, "delete": true, "import": true},
        "customers": {"view": true, "edit": true, "export": true},
        "analytics": {"view": true, "export": true},
        "settings": {"view": true, "edit": true},
        "integrations": {"view": true, "edit": true},
        "marketing": {"view": true, "edit": true}
      }'::jsonb;
    WHEN 'tenant_staff' THEN
      RETURN '{
        "orders": {"view": true, "create": true, "edit": true, "delete": false, "export": false},
        "products": {"view": true, "create": false, "edit": true, "delete": false, "import": false},
        "customers": {"view": true, "edit": false, "export": false},
        "analytics": {"view": true, "export": false},
        "settings": {"view": false, "edit": false},
        "integrations": {"view": false, "edit": false},
        "marketing": {"view": false, "edit": false}
      }'::jsonb;
    ELSE -- customer
      RETURN '{
        "orders": {"view": true, "create": false, "edit": false, "delete": false, "export": false},
        "products": {"view": true, "create": false, "edit": false, "delete": false, "import": false},
        "customers": {"view": false, "edit": false, "export": false},
        "analytics": {"view": false, "export": false},
        "settings": {"view": false, "edit": false},
        "integrations": {"view": false, "edit": false},
        "marketing": {"view": false, "edit": false}
      }'::jsonb;
  END CASE;
END;
$$;

-- Comentarios
COMMENT ON TABLE super_admins IS 'Usuarios con acceso de administrador a toda la plataforma';
COMMENT ON TABLE tenant_user_roles IS 'Roles y permisos de usuarios por tenant';
COMMENT ON FUNCTION is_super_admin IS 'Verifica si un usuario es super admin de la plataforma';
COMMENT ON FUNCTION get_user_tenant_role IS 'Obtiene el rol de un usuario en un tenant específico';
COMMENT ON FUNCTION check_tenant_permission IS 'Verifica si un usuario tiene un permiso específico en un tenant';
