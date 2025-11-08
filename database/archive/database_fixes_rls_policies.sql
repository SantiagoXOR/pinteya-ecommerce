-- =====================================================
-- CORRECCIONES RLS PARA PINTEYA E-COMMERCE (IDEMPOTENTE)
-- Fecha: Octubre 2025
-- Propósito: Resolver problemas identificados por Supabase Security Advisor
-- =====================================================

-- 0. Helper: función para comprobar si una policy existe (schema + table + policy_name)
-- (No modifica nada; solo usada por los bloques DO)
CREATE OR REPLACE FUNCTION public._policy_exists(
  target_schema text,
  target_table text,
  policy_name text
) RETURNS boolean LANGUAGE sql STABLE AS $$
  SELECT EXISTS (
    SELECT 1
    FROM pg_policy p
    JOIN pg_class c ON p.polrelid = c.oid
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE n.nspname = target_schema
      AND c.relname = target_table
      AND p.polname = policy_name
  );
$$;
REVOKE EXECUTE ON FUNCTION public._policy_exists(text,text,text) FROM PUBLIC;

-- 1. HABILITAR RLS EN TABLAS QUE LO TIENEN DESHABILITADO
-- =====================================================

ALTER TABLE public.logistics_drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.optimized_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.couriers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_event_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_addresses ENABLE ROW LEVEL SECURITY;

-- 2. CREAR POLÍTICAS RLS DE FORMA IDEMPOTENTE
-- =====================================================

-- Políticas para order_items
DO $$
BEGIN
  IF NOT public._policy_exists('public','order_items','Users can view their own order items') THEN
    EXECUTE $sql$
      CREATE POLICY "Users can view their own order items" ON public.order_items
        FOR SELECT USING (
          EXISTS (
            SELECT 1 FROM public.orders o
            WHERE o.id = order_items.order_id
            AND o.user_id = (SELECT auth.uid())
          )
        );
    $sql$;
  END IF;
END$$;

DO $$
BEGIN
  IF NOT public._policy_exists('public','order_items','Admin can view all order items') THEN
    EXECUTE $sql$
      CREATE POLICY "Admin can view all order items" ON public.order_items
        FOR SELECT USING (
          EXISTS (
            SELECT 1 FROM public.user_profiles up
            JOIN public.user_roles ur ON up.role_id = ur.id
            WHERE up.supabase_user_id = (SELECT auth.uid())
            AND ur.role_name = 'admin'
          )
        );
    $sql$;
  END IF;
END$$;

DO $$
BEGIN
  IF NOT public._policy_exists('public','order_items','System can insert order items') THEN
    EXECUTE $sql$
      CREATE POLICY "System can insert order items" ON public.order_items
        FOR INSERT WITH CHECK (
          EXISTS (
            SELECT 1 FROM public.orders o
            WHERE o.id = order_items.order_id
            AND o.user_id = (SELECT auth.uid())
          )
        );
    $sql$;
  END IF;
END$$;

DO $$
BEGIN
  IF NOT public._policy_exists('public','order_items','Admin can modify order items') THEN
    EXECUTE $sql$
      CREATE POLICY "Admin can modify order items" ON public.order_items
        FOR ALL USING (
          EXISTS (
            SELECT 1 FROM public.user_profiles up
            JOIN public.user_roles ur ON up.role_id = ur.id
            WHERE up.supabase_user_id = (SELECT auth.uid())
            AND ur.role_name = 'admin'
          )
        );
    $sql$;
  END IF;
END$$;

-- Políticas para orders
DO $$
BEGIN
  IF NOT public._policy_exists('public','orders','Users can view their own orders') THEN
    EXECUTE $sql$
      CREATE POLICY "Users can view their own orders" ON public.orders
        FOR SELECT USING ((user_id = (SELECT auth.uid())));
    $sql$;
  END IF;
END$$;

DO $$
BEGIN
  IF NOT public._policy_exists('public','orders','Admin can view all orders') THEN
    EXECUTE $sql$
      CREATE POLICY "Admin can view all orders" ON public.orders
        FOR SELECT USING (
          EXISTS (
            SELECT 1 FROM public.user_profiles up
            JOIN public.user_roles ur ON up.role_id = ur.id
            WHERE up.supabase_user_id = (SELECT auth.uid())
            AND ur.role_name = 'admin'
          )
        );
    $sql$;
  END IF;
END$$;

DO $$
BEGIN
  IF NOT public._policy_exists('public','orders','Users can create their own orders') THEN
    EXECUTE $sql$
      CREATE POLICY "Users can create their own orders" ON public.orders
        FOR INSERT WITH CHECK ((user_id = (SELECT auth.uid())));
    $sql$;
  END IF;
END$$;

DO $$
BEGIN
  IF NOT public._policy_exists('public','orders','Users can update their own orders') THEN
    EXECUTE $sql$
      CREATE POLICY "Users can update their own orders" ON public.orders
        FOR UPDATE USING ((user_id = (SELECT auth.uid())))
        WITH CHECK ((user_id = (SELECT auth.uid())));
    $sql$;
  END IF;
END$$;

DO $$
BEGIN
  IF NOT public._policy_exists('public','orders','Admin can modify all orders') THEN
    EXECUTE $sql$
      CREATE POLICY "Admin can modify all orders" ON public.orders
        FOR ALL USING (
          EXISTS (
            SELECT 1 FROM public.user_profiles up
            JOIN public.user_roles ur ON up.role_id = ur.id
            WHERE up.supabase_user_id = (SELECT auth.uid())
            AND ur.role_name = 'admin'
          )
        );
    $sql$;
  END IF;
END$$;

-- Políticas para user_addresses
DO $$
BEGIN
  IF NOT public._policy_exists('public','user_addresses','Users can view their own addresses') THEN
    EXECUTE $sql$
      CREATE POLICY "Users can view their own addresses" ON public.user_addresses
        FOR SELECT USING ((user_id = (SELECT auth.uid())));
    $sql$;
  END IF;
END$$;

DO $$
BEGIN
  IF NOT public._policy_exists('public','user_addresses','Users can create their own addresses') THEN
    EXECUTE $sql$
      CREATE POLICY "Users can create their own addresses" ON public.user_addresses
        FOR INSERT WITH CHECK ((user_id = (SELECT auth.uid())));
    $sql$;
  END IF;
END$$;

DO $$
BEGIN
  IF NOT public._policy_exists('public','user_addresses','Users can update their own addresses') THEN
    EXECUTE $sql$
      CREATE POLICY "Users can update their own addresses" ON public.user_addresses
        FOR UPDATE USING ((user_id = (SELECT auth.uid())))
        WITH CHECK ((user_id = (SELECT auth.uid())));
    $sql$;
  END IF;
END$$;

DO $$
BEGIN
  IF NOT public._policy_exists('public','user_addresses','Users can delete their own addresses') THEN
    EXECUTE $sql$
      CREATE POLICY "Users can delete their own addresses" ON public.user_addresses
        FOR DELETE USING ((user_id = (SELECT auth.uid())));
    $sql$;
  END IF;
END$$;

DO $$
BEGIN
  IF NOT public._policy_exists('public','user_addresses','Admin can manage all addresses') THEN
    EXECUTE $sql$
      CREATE POLICY "Admin can manage all addresses" ON public.user_addresses
        FOR ALL USING (
          EXISTS (
            SELECT 1 FROM public.user_profiles up
            JOIN public.user_roles ur ON up.role_id = ur.id
            WHERE up.supabase_user_id = (SELECT auth.uid())
            AND ur.role_name = 'admin'
          )
        );
    $sql$;
  END IF;
END$$;

-- Políticas para logistics_drivers (CORREGIDAS)
DO $$
BEGIN
  IF NOT public._policy_exists('public','logistics_drivers','Drivers can view their own profile') THEN
    EXECUTE $sql$
      CREATE POLICY "Drivers can view their own profile" ON public.logistics_drivers
        FOR SELECT USING (
          EXISTS (
            SELECT 1 FROM public.drivers d
            WHERE d.id = public.logistics_drivers.id
            AND d.user_id = (SELECT auth.uid())
          )
        );
    $sql$;
  END IF;
END$$;

DO $$
BEGIN
  IF NOT public._policy_exists('public','logistics_drivers','Admin can manage all drivers') THEN
    EXECUTE $sql$
      CREATE POLICY "Admin can manage all drivers" ON public.logistics_drivers
        FOR ALL USING (
          EXISTS (
            SELECT 1 FROM public.user_profiles up
            JOIN public.user_roles ur ON up.role_id = ur.id
            WHERE up.supabase_user_id = (SELECT auth.uid())
            AND ur.role_name = 'admin'
          )
        );
    $sql$;
  END IF;
END$$;

DO $$
BEGIN
  IF NOT public._policy_exists('public','logistics_drivers','Logistics managers can view drivers') THEN
    EXECUTE $sql$
      CREATE POLICY "Logistics managers can view drivers" ON public.logistics_drivers
        FOR SELECT USING (
          EXISTS (
            SELECT 1 FROM public.user_profiles up
            JOIN public.user_roles ur ON up.role_id = ur.id
            WHERE up.supabase_user_id = (SELECT auth.uid())
            AND ur.role_name IN ('admin', 'logistics_manager')
          )
        );
    $sql$;
  END IF;
END$$;

-- Políticas para optimized_routes (CORREGIDAS)
DO $$
BEGIN
  IF NOT public._policy_exists('public','optimized_routes','Drivers can view their assigned routes') THEN
    EXECUTE $sql$
      CREATE POLICY "Drivers can view their assigned routes" ON public.optimized_routes
        FOR SELECT USING (
          EXISTS (
            SELECT 1 FROM public.drivers d
            WHERE d.id = public.optimized_routes.driver_id
            AND d.user_id = (SELECT auth.uid())
          )
        );
    $sql$;
  END IF;
END$$;

DO $$
BEGIN
  IF NOT public._policy_exists('public','optimized_routes','Admin can manage all routes') THEN
    EXECUTE $sql$
      CREATE POLICY "Admin can manage all routes" ON public.optimized_routes
        FOR ALL USING (
          EXISTS (
            SELECT 1 FROM public.user_profiles up
            JOIN public.user_roles ur ON up.role_id = ur.id
            WHERE up.supabase_user_id = (SELECT auth.uid())
            AND ur.role_name = 'admin'
          )
        );
    $sql$;
  END IF;
END$$;

DO $$
BEGIN
  IF NOT public._policy_exists('public','optimized_routes','Logistics managers can manage routes') THEN
    EXECUTE $sql$
      CREATE POLICY "Logistics managers can manage routes" ON public.optimized_routes
        FOR ALL USING (
          EXISTS (
            SELECT 1 FROM public.user_profiles up
            JOIN public.user_roles ur ON up.role_id = ur.id
            WHERE up.supabase_user_id = (SELECT auth.uid())
            AND ur.role_name IN ('admin', 'logistics_manager')
          )
        );
    $sql$;
  END IF;
END$$;

-- Políticas para couriers
DO $$
BEGIN
  IF NOT public._policy_exists('public','couriers','Public can view active couriers') THEN
    EXECUTE $sql$
      CREATE POLICY "Public can view active couriers" ON public.couriers
        FOR SELECT USING (is_active = true);
    $sql$;
  END IF;
END$$;

DO $$
BEGIN
  IF NOT public._policy_exists('public','couriers','Admin can manage all couriers') THEN
    EXECUTE $sql$
      CREATE POLICY "Admin can manage all couriers" ON public.couriers
        FOR ALL USING (
          EXISTS (
            SELECT 1 FROM public.user_profiles up
            JOIN public.user_roles ur ON up.role_id = ur.id
            WHERE up.supabase_user_id = (SELECT auth.uid())
            AND ur.role_name = 'admin'
          )
        );
    $sql$;
  END IF;
END$$;

-- Políticas para analytics_event_types
DO $$
BEGIN
  IF NOT public._policy_exists('public','analytics_event_types','Public can view event types') THEN
    EXECUTE $sql$
      CREATE POLICY "Public can view event types" ON public.analytics_event_types
        FOR SELECT USING (true);
    $sql$;
  END IF;
END$$;

DO $$
BEGIN
  IF NOT public._policy_exists('public','analytics_event_types','Admin can manage event types') THEN
    EXECUTE $sql$
      CREATE POLICY "Admin can manage event types" ON public.analytics_event_types
        FOR ALL USING (
          EXISTS (
            SELECT 1 FROM public.user_profiles up
            JOIN public.user_roles ur ON up.role_id = ur.id
            WHERE up.supabase_user_id = (SELECT auth.uid())
            AND ur.role_name = 'admin'
          )
        );
    $sql$;
  END IF;
END$$;

-- Políticas para user_roles
DO $$
BEGIN
  IF NOT public._policy_exists('public','user_roles','Authenticated users can view roles') THEN
    EXECUTE $sql$
      CREATE POLICY "Authenticated users can view roles" ON public.user_roles
        FOR SELECT USING (auth.role() = 'authenticated');
    $sql$;
  END IF;
END$$;

DO $$
BEGIN
  IF NOT public._policy_exists('public','user_roles','Admins can manage roles') THEN
    EXECUTE $sql$
      CREATE POLICY "Admins can manage roles" ON public.user_roles
        FOR ALL USING (
          EXISTS (
            SELECT 1 FROM public.user_profiles up
            JOIN public.user_roles admin_role ON up.role_id = admin_role.id
            WHERE up.supabase_user_id = (SELECT auth.uid())
            AND admin_role.role_name = 'admin'
          )
        );
    $sql$;
  END IF;
END$$;

-- 3. COMENTARIOS Y DOCUMENTACIÓN
-- =====================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Users can view their own order items') THEN
    EXECUTE $sql$
      COMMENT ON POLICY "Users can view their own order items" ON public.order_items IS 
      'Permite a los usuarios ver solo los items de sus propias órdenes';
    $sql$;
  END IF;
END$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Users can view their own orders') THEN
    EXECUTE $sql$
      COMMENT ON POLICY "Users can view their own orders" ON public.orders IS 
      'Permite a los usuarios ver solo sus propias órdenes';
    $sql$;
  END IF;
END$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Users can view their own addresses') THEN
    EXECUTE $sql$
      COMMENT ON POLICY "Users can view their own addresses" ON public.user_addresses IS 
      'Permite a los usuarios gestionar solo sus propias direcciones';
    $sql$;
  END IF;
END$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Drivers can view their own profile') THEN
    EXECUTE $sql$
      COMMENT ON POLICY "Drivers can view their own profile" ON public.logistics_drivers IS 
      'Permite a los conductores ver solo su propio perfil';
    $sql$;
  END IF;
END$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Drivers can view their assigned routes') THEN
    EXECUTE $sql$
      COMMENT ON POLICY "Drivers can view their assigned routes" ON public.optimized_routes IS 
      'Permite a los conductores ver solo las rutas que les han sido asignadas';
    $sql$;
  END IF;
END$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Public can view active couriers') THEN
    EXECUTE $sql$
      COMMENT ON POLICY "Public can view active couriers" ON public.couriers IS 
      'Permite acceso público a la información de couriers activos para el checkout';
    $sql$;
  END IF;
END$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Public can view event types') THEN
    EXECUTE $sql$
      COMMENT ON POLICY "Public can view event types" ON public.analytics_event_types IS 
      'Permite acceso público a los tipos de eventos para analytics';
    $sql$;
  END IF;
END$$;

-- 4. LIMPIEZA: Eliminar función helper (opcional)
-- =====================================================
-- DROP FUNCTION IF EXISTS public._policy_exists(text,text,text);

-- =====================================================
-- FIN DE CORRECCIONES RLS (VERSIÓN IDEMPOTENTE)
-- =====================================================