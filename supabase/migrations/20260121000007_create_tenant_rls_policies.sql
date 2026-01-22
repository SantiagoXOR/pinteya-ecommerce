-- ============================================================================
-- MIGRACIÓN: RLS Policies para Aislamiento de Datos por Tenant
-- ============================================================================
-- Descripción: Configura Row Level Security para asegurar que cada tenant
-- solo pueda acceder a sus propios datos
-- ============================================================================

-- ============================================================================
-- FUNCIÓN HELPER PARA OBTENER TENANT DEL CONTEXTO
-- ============================================================================
-- Esta función lee el tenant_id del contexto de la aplicación
-- Se debe establecer con: SET LOCAL app.current_tenant_id = 'uuid';
CREATE OR REPLACE FUNCTION get_current_tenant_id()
RETURNS UUID
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id UUID;
BEGIN
  -- Intentar obtener del contexto local
  BEGIN
    v_tenant_id := (current_setting('app.current_tenant_id', true))::uuid;
  EXCEPTION WHEN OTHERS THEN
    v_tenant_id := NULL;
  END;
  
  RETURN v_tenant_id;
END;
$$;

-- ============================================================================
-- RLS POLICIES PARA ORDERS
-- ============================================================================
-- Primero eliminar políticas existentes que puedan conflictuar
DO $$
BEGIN
  -- Orders
  DROP POLICY IF EXISTS "Orders tenant isolation" ON orders;
  DROP POLICY IF EXISTS "Orders tenant isolation select" ON orders;
  DROP POLICY IF EXISTS "Orders tenant isolation insert" ON orders;
  DROP POLICY IF EXISTS "Orders tenant isolation update" ON orders;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Política para SELECT: ver solo órdenes del tenant actual o si no hay tenant en contexto
CREATE POLICY "Orders tenant isolation select"
  ON orders
  FOR SELECT
  USING (
    -- Service role puede ver todo
    auth.role() = 'service_role'
    OR
    -- Si hay tenant en contexto, solo ver órdenes de ese tenant
    (
      get_current_tenant_id() IS NOT NULL 
      AND tenant_id = get_current_tenant_id()
    )
    OR
    -- Si no hay tenant en contexto (legacy), permitir acceso a órdenes sin tenant
    (
      get_current_tenant_id() IS NULL 
      AND tenant_id IS NULL
    )
  );

-- Política para INSERT
CREATE POLICY "Orders tenant isolation insert"
  ON orders
  FOR INSERT
  WITH CHECK (
    auth.role() = 'service_role'
    OR
    (get_current_tenant_id() IS NOT NULL AND tenant_id = get_current_tenant_id())
    OR
    (get_current_tenant_id() IS NULL)
  );

-- Política para UPDATE
CREATE POLICY "Orders tenant isolation update"
  ON orders
  FOR UPDATE
  USING (
    auth.role() = 'service_role'
    OR
    (get_current_tenant_id() IS NOT NULL AND tenant_id = get_current_tenant_id())
    OR
    (get_current_tenant_id() IS NULL AND tenant_id IS NULL)
  );

-- ============================================================================
-- RLS POLICIES PARA ORDER_ITEMS
-- ============================================================================
DO $$
BEGIN
  DROP POLICY IF EXISTS "Order items tenant isolation select" ON order_items;
  DROP POLICY IF EXISTS "Order items tenant isolation insert" ON order_items;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE POLICY "Order items tenant isolation select"
  ON order_items
  FOR SELECT
  USING (
    auth.role() = 'service_role'
    OR
    (get_current_tenant_id() IS NOT NULL AND tenant_id = get_current_tenant_id())
    OR
    (get_current_tenant_id() IS NULL AND tenant_id IS NULL)
  );

CREATE POLICY "Order items tenant isolation insert"
  ON order_items
  FOR INSERT
  WITH CHECK (
    auth.role() = 'service_role'
    OR
    (get_current_tenant_id() IS NOT NULL AND tenant_id = get_current_tenant_id())
    OR
    (get_current_tenant_id() IS NULL)
  );

-- ============================================================================
-- RLS POLICIES PARA ANALYTICS_EVENTS_OPTIMIZED
-- ============================================================================
DO $$
BEGIN
  DROP POLICY IF EXISTS "Analytics tenant isolation select" ON analytics_events_optimized;
  DROP POLICY IF EXISTS "Analytics tenant isolation insert" ON analytics_events_optimized;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE POLICY "Analytics tenant isolation select"
  ON analytics_events_optimized
  FOR SELECT
  USING (
    auth.role() = 'service_role'
    OR
    (get_current_tenant_id() IS NOT NULL AND tenant_id = get_current_tenant_id())
    OR
    (get_current_tenant_id() IS NULL AND tenant_id IS NULL)
  );

CREATE POLICY "Analytics tenant isolation insert"
  ON analytics_events_optimized
  FOR INSERT
  WITH CHECK (
    auth.role() = 'service_role'
    OR
    (get_current_tenant_id() IS NOT NULL AND tenant_id = get_current_tenant_id())
    OR
    (get_current_tenant_id() IS NULL)
  );

-- ============================================================================
-- RLS POLICIES PARA CART_ITEMS
-- ============================================================================
DO $$
BEGIN
  DROP POLICY IF EXISTS "Cart items tenant isolation select" ON cart_items;
  DROP POLICY IF EXISTS "Cart items tenant isolation insert" ON cart_items;
  DROP POLICY IF EXISTS "Cart items tenant isolation update" ON cart_items;
  DROP POLICY IF EXISTS "Cart items tenant isolation delete" ON cart_items;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE POLICY "Cart items tenant isolation select"
  ON cart_items
  FOR SELECT
  USING (
    auth.role() = 'service_role'
    OR
    (get_current_tenant_id() IS NOT NULL AND tenant_id = get_current_tenant_id())
    OR
    (get_current_tenant_id() IS NULL AND tenant_id IS NULL)
  );

CREATE POLICY "Cart items tenant isolation insert"
  ON cart_items
  FOR INSERT
  WITH CHECK (
    auth.role() = 'service_role'
    OR
    (get_current_tenant_id() IS NOT NULL AND tenant_id = get_current_tenant_id())
    OR
    (get_current_tenant_id() IS NULL)
  );

CREATE POLICY "Cart items tenant isolation update"
  ON cart_items
  FOR UPDATE
  USING (
    auth.role() = 'service_role'
    OR
    (get_current_tenant_id() IS NOT NULL AND tenant_id = get_current_tenant_id())
    OR
    (get_current_tenant_id() IS NULL AND tenant_id IS NULL)
  );

CREATE POLICY "Cart items tenant isolation delete"
  ON cart_items
  FOR DELETE
  USING (
    auth.role() = 'service_role'
    OR
    (get_current_tenant_id() IS NOT NULL AND tenant_id = get_current_tenant_id())
    OR
    (get_current_tenant_id() IS NULL AND tenant_id IS NULL)
  );

-- ============================================================================
-- RLS POLICIES PARA SHIPMENTS
-- ============================================================================
DO $$
BEGIN
  DROP POLICY IF EXISTS "Shipments tenant isolation select" ON shipments;
  DROP POLICY IF EXISTS "Shipments tenant isolation insert" ON shipments;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE POLICY "Shipments tenant isolation select"
  ON shipments
  FOR SELECT
  USING (
    auth.role() = 'service_role'
    OR
    (get_current_tenant_id() IS NOT NULL AND tenant_id = get_current_tenant_id())
    OR
    (get_current_tenant_id() IS NULL AND tenant_id IS NULL)
  );

CREATE POLICY "Shipments tenant isolation insert"
  ON shipments
  FOR INSERT
  WITH CHECK (
    auth.role() = 'service_role'
    OR
    (get_current_tenant_id() IS NOT NULL AND tenant_id = get_current_tenant_id())
    OR
    (get_current_tenant_id() IS NULL)
  );

-- ============================================================================
-- FUNCIÓN PARA ESTABLECER EL TENANT EN EL CONTEXTO
-- ============================================================================
-- Usar esta función al inicio de cada request para establecer el tenant
CREATE OR REPLACE FUNCTION set_current_tenant(p_tenant_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM set_config('app.current_tenant_id', p_tenant_id::text, true);
END;
$$;

-- Función para limpiar el contexto del tenant
CREATE OR REPLACE FUNCTION clear_current_tenant()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM set_config('app.current_tenant_id', '', true);
END;
$$;

-- Comentarios
COMMENT ON FUNCTION get_current_tenant_id IS 'Obtiene el tenant_id del contexto de la sesión actual';
COMMENT ON FUNCTION set_current_tenant IS 'Establece el tenant_id en el contexto de la sesión';
COMMENT ON FUNCTION clear_current_tenant IS 'Limpia el tenant_id del contexto de la sesión';
