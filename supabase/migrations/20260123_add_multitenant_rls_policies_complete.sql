-- ============================================================================
-- MIGRACIÓN: RLS Policies Multitenant Completas
-- ============================================================================
-- Descripción: Completa las políticas RLS para todas las tablas con tenant_id
-- que aún no tienen políticas de aislamiento por tenant
-- Fecha: 2026-01-23
-- ============================================================================

-- ============================================================================
-- HABILITAR RLS EN TABLAS QUE AÚN NO LO TIENEN
-- ============================================================================

-- Habilitar RLS en tablas que pueden no tenerlo habilitado
DO $$
BEGIN
  -- Categories
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'categories' AND table_schema = 'public') THEN
    ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
  END IF;
  
  -- Coupons
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'coupons' AND table_schema = 'public') THEN
    ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
  END IF;
  
  -- Promotions
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'promotions' AND table_schema = 'public') THEN
    ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;
  END IF;
  
  -- Drivers
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'drivers' AND table_schema = 'public') THEN
    ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
  END IF;
  
  -- Optimized Routes
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'optimized_routes' AND table_schema = 'public') THEN
    ALTER TABLE optimized_routes ENABLE ROW LEVEL SECURITY;
  END IF;
  
  -- Tracking Events
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tracking_events' AND table_schema = 'public') THEN
    ALTER TABLE tracking_events ENABLE ROW LEVEL SECURITY;
  END IF;
  
  -- System Settings
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'system_settings' AND table_schema = 'public') THEN
    ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
  END IF;
  
  -- User Profiles (si tiene tenant_id)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' 
    AND column_name = 'tenant_id'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- ============================================================================
-- RLS POLICIES PARA CATEGORIES
-- ============================================================================
DO $$
BEGIN
  -- Eliminar políticas existentes que puedan conflictuar
  DROP POLICY IF EXISTS "Categories tenant isolation select" ON categories;
  DROP POLICY IF EXISTS "Categories tenant isolation insert" ON categories;
  DROP POLICY IF EXISTS "Categories tenant isolation update" ON categories;
  DROP POLICY IF EXISTS "Categories tenant isolation delete" ON categories;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- SELECT: Todos pueden leer categorías del tenant actual o sin tenant
CREATE POLICY "Categories tenant isolation select"
  ON categories
  FOR SELECT
  USING (
    auth.role() = 'service_role'
    OR
    (get_current_tenant_id() IS NOT NULL AND tenant_id = get_current_tenant_id())
    OR
    (get_current_tenant_id() IS NULL AND tenant_id IS NULL)
    OR
    -- Permitir lectura pública de categorías (para APIs públicas)
    tenant_id IS NOT NULL
  );

-- INSERT: Solo service_role o con tenant en contexto
CREATE POLICY "Categories tenant isolation insert"
  ON categories
  FOR INSERT
  WITH CHECK (
    auth.role() = 'service_role'
    OR
    (get_current_tenant_id() IS NOT NULL AND tenant_id = get_current_tenant_id())
  );

-- UPDATE: Solo service_role o con tenant en contexto
CREATE POLICY "Categories tenant isolation update"
  ON categories
  FOR UPDATE
  USING (
    auth.role() = 'service_role'
    OR
    (get_current_tenant_id() IS NOT NULL AND tenant_id = get_current_tenant_id())
  );

-- DELETE: Solo service_role o con tenant en contexto
CREATE POLICY "Categories tenant isolation delete"
  ON categories
  FOR DELETE
  USING (
    auth.role() = 'service_role'
    OR
    (get_current_tenant_id() IS NOT NULL AND tenant_id = get_current_tenant_id())
  );

-- ============================================================================
-- RLS POLICIES PARA COUPONS
-- ============================================================================
DO $$
BEGIN
  DROP POLICY IF EXISTS "Coupons tenant isolation select" ON coupons;
  DROP POLICY IF EXISTS "Coupons tenant isolation insert" ON coupons;
  DROP POLICY IF EXISTS "Coupons tenant isolation update" ON coupons;
  DROP POLICY IF EXISTS "Coupons tenant isolation delete" ON coupons;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE POLICY "Coupons tenant isolation select"
  ON coupons
  FOR SELECT
  USING (
    auth.role() = 'service_role'
    OR
    (get_current_tenant_id() IS NOT NULL AND tenant_id = get_current_tenant_id())
    OR
    (get_current_tenant_id() IS NULL AND tenant_id IS NULL)
  );

CREATE POLICY "Coupons tenant isolation insert"
  ON coupons
  FOR INSERT
  WITH CHECK (
    auth.role() = 'service_role'
    OR
    (get_current_tenant_id() IS NOT NULL AND tenant_id = get_current_tenant_id())
  );

CREATE POLICY "Coupons tenant isolation update"
  ON coupons
  FOR UPDATE
  USING (
    auth.role() = 'service_role'
    OR
    (get_current_tenant_id() IS NOT NULL AND tenant_id = get_current_tenant_id())
  );

CREATE POLICY "Coupons tenant isolation delete"
  ON coupons
  FOR DELETE
  USING (
    auth.role() = 'service_role'
    OR
    (get_current_tenant_id() IS NOT NULL AND tenant_id = get_current_tenant_id())
  );

-- ============================================================================
-- RLS POLICIES PARA PROMOTIONS
-- ============================================================================
DO $$
BEGIN
  DROP POLICY IF EXISTS "Promotions tenant isolation select" ON promotions;
  DROP POLICY IF EXISTS "Promotions tenant isolation insert" ON promotions;
  DROP POLICY IF EXISTS "Promotions tenant isolation update" ON promotions;
  DROP POLICY IF EXISTS "Promotions tenant isolation delete" ON promotions;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE POLICY "Promotions tenant isolation select"
  ON promotions
  FOR SELECT
  USING (
    auth.role() = 'service_role'
    OR
    (get_current_tenant_id() IS NOT NULL AND tenant_id = get_current_tenant_id())
    OR
    (get_current_tenant_id() IS NULL AND tenant_id IS NULL)
  );

CREATE POLICY "Promotions tenant isolation insert"
  ON promotions
  FOR INSERT
  WITH CHECK (
    auth.role() = 'service_role'
    OR
    (get_current_tenant_id() IS NOT NULL AND tenant_id = get_current_tenant_id())
  );

CREATE POLICY "Promotions tenant isolation update"
  ON promotions
  FOR UPDATE
  USING (
    auth.role() = 'service_role'
    OR
    (get_current_tenant_id() IS NOT NULL AND tenant_id = get_current_tenant_id())
  );

CREATE POLICY "Promotions tenant isolation delete"
  ON promotions
  FOR DELETE
  USING (
    auth.role() = 'service_role'
    OR
    (get_current_tenant_id() IS NOT NULL AND tenant_id = get_current_tenant_id())
  );

-- ============================================================================
-- RLS POLICIES PARA DRIVERS
-- ============================================================================
DO $$
BEGIN
  DROP POLICY IF EXISTS "Drivers tenant isolation select" ON drivers;
  DROP POLICY IF EXISTS "Drivers tenant isolation insert" ON drivers;
  DROP POLICY IF EXISTS "Drivers tenant isolation update" ON drivers;
  DROP POLICY IF EXISTS "Drivers tenant isolation delete" ON drivers;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE POLICY "Drivers tenant isolation select"
  ON drivers
  FOR SELECT
  USING (
    auth.role() = 'service_role'
    OR
    (get_current_tenant_id() IS NOT NULL AND tenant_id = get_current_tenant_id())
    OR
    (get_current_tenant_id() IS NULL AND tenant_id IS NULL)
  );

CREATE POLICY "Drivers tenant isolation insert"
  ON drivers
  FOR INSERT
  WITH CHECK (
    auth.role() = 'service_role'
    OR
    (get_current_tenant_id() IS NOT NULL AND tenant_id = get_current_tenant_id())
  );

CREATE POLICY "Drivers tenant isolation update"
  ON drivers
  FOR UPDATE
  USING (
    auth.role() = 'service_role'
    OR
    (get_current_tenant_id() IS NOT NULL AND tenant_id = get_current_tenant_id())
  );

CREATE POLICY "Drivers tenant isolation delete"
  ON drivers
  FOR DELETE
  USING (
    auth.role() = 'service_role'
    OR
    (get_current_tenant_id() IS NOT NULL AND tenant_id = get_current_tenant_id())
  );

-- ============================================================================
-- RLS POLICIES PARA OPTIMIZED_ROUTES
-- ============================================================================
DO $$
BEGIN
  DROP POLICY IF EXISTS "Optimized routes tenant isolation select" ON optimized_routes;
  DROP POLICY IF EXISTS "Optimized routes tenant isolation insert" ON optimized_routes;
  DROP POLICY IF EXISTS "Optimized routes tenant isolation update" ON optimized_routes;
  DROP POLICY IF EXISTS "Optimized routes tenant isolation delete" ON optimized_routes;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE POLICY "Optimized routes tenant isolation select"
  ON optimized_routes
  FOR SELECT
  USING (
    auth.role() = 'service_role'
    OR
    (get_current_tenant_id() IS NOT NULL AND tenant_id = get_current_tenant_id())
    OR
    (get_current_tenant_id() IS NULL AND tenant_id IS NULL)
  );

CREATE POLICY "Optimized routes tenant isolation insert"
  ON optimized_routes
  FOR INSERT
  WITH CHECK (
    auth.role() = 'service_role'
    OR
    (get_current_tenant_id() IS NOT NULL AND tenant_id = get_current_tenant_id())
  );

CREATE POLICY "Optimized routes tenant isolation update"
  ON optimized_routes
  FOR UPDATE
  USING (
    auth.role() = 'service_role'
    OR
    (get_current_tenant_id() IS NOT NULL AND tenant_id = get_current_tenant_id())
  );

CREATE POLICY "Optimized routes tenant isolation delete"
  ON optimized_routes
  FOR DELETE
  USING (
    auth.role() = 'service_role'
    OR
    (get_current_tenant_id() IS NOT NULL AND tenant_id = get_current_tenant_id())
  );

-- ============================================================================
-- RLS POLICIES PARA TRACKING_EVENTS
-- ============================================================================
DO $$
BEGIN
  DROP POLICY IF EXISTS "Tracking events tenant isolation select" ON tracking_events;
  DROP POLICY IF EXISTS "Tracking events tenant isolation insert" ON tracking_events;
  DROP POLICY IF EXISTS "Tracking events tenant isolation update" ON tracking_events;
  DROP POLICY IF EXISTS "Tracking events tenant isolation delete" ON tracking_events;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE POLICY "Tracking events tenant isolation select"
  ON tracking_events
  FOR SELECT
  USING (
    auth.role() = 'service_role'
    OR
    (get_current_tenant_id() IS NOT NULL AND tenant_id = get_current_tenant_id())
    OR
    (get_current_tenant_id() IS NULL AND tenant_id IS NULL)
  );

CREATE POLICY "Tracking events tenant isolation insert"
  ON tracking_events
  FOR INSERT
  WITH CHECK (
    auth.role() = 'service_role'
    OR
    (get_current_tenant_id() IS NOT NULL AND tenant_id = get_current_tenant_id())
    OR
    (get_current_tenant_id() IS NULL)
  );

CREATE POLICY "Tracking events tenant isolation update"
  ON tracking_events
  FOR UPDATE
  USING (
    auth.role() = 'service_role'
    OR
    (get_current_tenant_id() IS NOT NULL AND tenant_id = get_current_tenant_id())
  );

CREATE POLICY "Tracking events tenant isolation delete"
  ON tracking_events
  FOR DELETE
  USING (
    auth.role() = 'service_role'
    OR
    (get_current_tenant_id() IS NOT NULL AND tenant_id = get_current_tenant_id())
  );

-- ============================================================================
-- RLS POLICIES PARA SYSTEM_SETTINGS
-- ============================================================================
DO $$
BEGIN
  DROP POLICY IF EXISTS "System settings tenant isolation select" ON system_settings;
  DROP POLICY IF EXISTS "System settings tenant isolation insert" ON system_settings;
  DROP POLICY IF EXISTS "System settings tenant isolation update" ON system_settings;
  DROP POLICY IF EXISTS "System settings tenant isolation delete" ON system_settings;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE POLICY "System settings tenant isolation select"
  ON system_settings
  FOR SELECT
  USING (
    auth.role() = 'service_role'
    OR
    (get_current_tenant_id() IS NOT NULL AND tenant_id = get_current_tenant_id())
    OR
    (get_current_tenant_id() IS NULL AND tenant_id IS NULL)
  );

CREATE POLICY "System settings tenant isolation insert"
  ON system_settings
  FOR INSERT
  WITH CHECK (
    auth.role() = 'service_role'
    OR
    (get_current_tenant_id() IS NOT NULL AND tenant_id = get_current_tenant_id())
  );

CREATE POLICY "System settings tenant isolation update"
  ON system_settings
  FOR UPDATE
  USING (
    auth.role() = 'service_role'
    OR
    (get_current_tenant_id() IS NOT NULL AND tenant_id = get_current_tenant_id())
  );

CREATE POLICY "System settings tenant isolation delete"
  ON system_settings
  FOR DELETE
  USING (
    auth.role() = 'service_role'
    OR
    (get_current_tenant_id() IS NOT NULL AND tenant_id = get_current_tenant_id())
  );

-- ============================================================================
-- RLS POLICIES PARA USER_PROFILES (si tiene tenant_id)
-- ============================================================================
-- Nota: user_profiles puede tener una lógica más compleja ya que un usuario
-- puede pertenecer a múltiples tenants. Por ahora, solo filtramos por tenant_id
-- si existe la columna.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' 
    AND column_name = 'tenant_id'
    AND table_schema = 'public'
  ) THEN
    -- Eliminar políticas existentes
    DROP POLICY IF EXISTS "User profiles tenant isolation select" ON user_profiles;
    DROP POLICY IF EXISTS "User profiles tenant isolation update" ON user_profiles;
    
    -- SELECT: Usuarios pueden ver su propio perfil o admins pueden ver todos del tenant
    CREATE POLICY "User profiles tenant isolation select"
      ON user_profiles
      FOR SELECT
      USING (
        auth.role() = 'service_role'
        OR
        -- Usuario puede ver su propio perfil
        (supabase_user_id = auth.uid())
        OR
        -- Admins pueden ver usuarios de su tenant
        (
          get_current_tenant_id() IS NOT NULL 
          AND tenant_id = get_current_tenant_id()
          AND EXISTS (
            SELECT 1 FROM user_profiles up
            WHERE up.supabase_user_id = auth.uid()
            AND up.tenant_id = get_current_tenant_id()
            -- Aquí se podría agregar verificación de rol admin
          )
        )
        OR
        (get_current_tenant_id() IS NULL AND tenant_id IS NULL)
      );
    
    -- UPDATE: Usuarios pueden actualizar su propio perfil
    CREATE POLICY "User profiles tenant isolation update"
      ON user_profiles
      FOR UPDATE
      USING (
        auth.role() = 'service_role'
        OR
        (supabase_user_id = auth.uid())
        OR
        (
          get_current_tenant_id() IS NOT NULL 
          AND tenant_id = get_current_tenant_id()
        )
      );
  END IF;
END $$;

-- ============================================================================
-- COMENTARIOS
-- ============================================================================
COMMENT ON POLICY "Categories tenant isolation select" ON categories IS 
  'Permite leer categorías del tenant actual o sin tenant. Service role puede ver todo.';
COMMENT ON POLICY "Coupons tenant isolation select" ON coupons IS 
  'Aísla cupones por tenant. Service role puede ver todo.';
COMMENT ON POLICY "Promotions tenant isolation select" ON promotions IS 
  'Aísla promociones por tenant. Service role puede ver todo.';
COMMENT ON POLICY "Drivers tenant isolation select" ON drivers IS 
  'Aísla conductores por tenant. Service role puede ver todo.';
COMMENT ON POLICY "Optimized routes tenant isolation select" ON optimized_routes IS 
  'Aísla rutas optimizadas por tenant. Service role puede ver todo.';
COMMENT ON POLICY "Tracking events tenant isolation select" ON tracking_events IS 
  'Aísla eventos de tracking por tenant. Service role puede ver todo.';
COMMENT ON POLICY "System settings tenant isolation select" ON system_settings IS 
  'Aísla configuraciones del sistema por tenant. Service role puede ver todo.';
