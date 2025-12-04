-- =====================================================
-- AGREGAR PRIMARY KEYS A TABLAS SIN CLAVE PRIMARIA
-- Fecha: Enero 2025
-- Propósito: Mejorar integridad referencial y performance de la base de datos
-- =====================================================

-- IMPORTANTE: Estas operaciones pueden ser costosas en tablas con muchos datos
-- Se recomienda ejecutar durante ventanas de mantenimiento

-- 1. TABLAS DE AUTENTICACIÓN Y USUARIOS
-- =====================================================

-- accounts - Agregar PK compuesta
ALTER TABLE public.accounts 
ADD CONSTRAINT accounts_pkey 
PRIMARY KEY (provider, providerAccountId);

-- sessions - Agregar PK en sessionToken
ALTER TABLE public.sessions 
ADD CONSTRAINT sessions_pkey 
PRIMARY KEY (sessionToken);

-- users - Agregar PK en id (si no existe)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'users' 
        AND constraint_type = 'PRIMARY KEY'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.users ADD CONSTRAINT users_pkey PRIMARY KEY (id);
    END IF;
END $$;

-- verification_tokens - Agregar PK compuesta
ALTER TABLE public.verification_tokens 
ADD CONSTRAINT verification_tokens_pkey 
PRIMARY KEY (identifier, token);

-- user_roles - Agregar PK en user_id (un rol por usuario)
ALTER TABLE public.user_roles 
ADD CONSTRAINT user_roles_pkey 
PRIMARY KEY (user_id);

-- user_profiles - Agregar PK en user_id
ALTER TABLE public.user_profiles 
ADD CONSTRAINT user_profiles_pkey 
PRIMARY KEY (user_id);

-- user_preferences - Agregar PK en user_id
ALTER TABLE public.user_preferences 
ADD CONSTRAINT user_preferences_pkey 
PRIMARY KEY (user_id);

-- user_addresses - Agregar columna id como PK
ALTER TABLE public.user_addresses 
ADD COLUMN IF NOT EXISTS id uuid DEFAULT gen_random_uuid();

ALTER TABLE public.user_addresses 
ADD CONSTRAINT user_addresses_pkey 
PRIMARY KEY (id);

-- user_activity - Agregar columna id como PK
ALTER TABLE public.user_activity 
ADD COLUMN IF NOT EXISTS id uuid DEFAULT gen_random_uuid();

ALTER TABLE public.user_activity 
ADD CONSTRAINT user_activity_pkey 
PRIMARY KEY (id);

-- user_interactions - Agregar columna id como PK
ALTER TABLE public.user_interactions 
ADD COLUMN IF NOT EXISTS id uuid DEFAULT gen_random_uuid();

ALTER TABLE public.user_interactions 
ADD CONSTRAINT user_interactions_pkey 
PRIMARY KEY (id);

-- user_security_alerts - Agregar columna id como PK
ALTER TABLE public.user_security_alerts 
ADD COLUMN IF NOT EXISTS id uuid DEFAULT gen_random_uuid();

ALTER TABLE public.user_security_alerts 
ADD CONSTRAINT user_security_alerts_pkey 
PRIMARY KEY (id);

-- user_security_settings - Agregar PK en user_id
ALTER TABLE public.user_security_settings 
ADD CONSTRAINT user_security_settings_pkey 
PRIMARY KEY (user_id);

-- 2. TABLAS DE PRODUCTOS Y CATEGORÍAS
-- =====================================================

-- products - Agregar PK en id (si no existe)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'products' 
        AND constraint_type = 'PRIMARY KEY'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.products ADD CONSTRAINT products_pkey PRIMARY KEY (id);
    END IF;
END $$;

-- products_optimized - Agregar PK en id
ALTER TABLE public.products_optimized 
ADD CONSTRAINT products_optimized_pkey 
PRIMARY KEY (id);

-- categories - Agregar PK en id (si no existe)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'categories' 
        AND constraint_type = 'PRIMARY KEY'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.categories ADD CONSTRAINT categories_pkey PRIMARY KEY (id);
    END IF;
END $$;

-- product_brands - Agregar columna id como PK
ALTER TABLE public.product_brands 
ADD COLUMN IF NOT EXISTS id uuid DEFAULT gen_random_uuid();

ALTER TABLE public.product_brands 
ADD CONSTRAINT product_brands_pkey 
PRIMARY KEY (id);

-- 3. TABLAS DE ÓRDENES Y CARRITO
-- =====================================================

-- orders - Agregar PK en id (si no existe)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'orders' 
        AND constraint_type = 'PRIMARY KEY'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.orders ADD CONSTRAINT orders_pkey PRIMARY KEY (id);
    END IF;
END $$;

-- order_items - Agregar columna id como PK
ALTER TABLE public.order_items 
ADD COLUMN IF NOT EXISTS id uuid DEFAULT gen_random_uuid();

ALTER TABLE public.order_items 
ADD CONSTRAINT order_items_pkey 
PRIMARY KEY (id);

-- cart_items - Agregar columna id como PK
ALTER TABLE public.cart_items 
ADD COLUMN IF NOT EXISTS id uuid DEFAULT gen_random_uuid();

ALTER TABLE public.cart_items 
ADD CONSTRAINT cart_items_pkey 
PRIMARY KEY (id);

-- 4. TABLAS DE ANALYTICS
-- =====================================================

-- analytics_events - Agregar PK en id (si no existe)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'analytics_events' 
        AND constraint_type = 'PRIMARY KEY'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.analytics_events ADD CONSTRAINT analytics_events_pkey PRIMARY KEY (id);
    END IF;
END $$;

-- analytics_events_optimized - Agregar PK en id
ALTER TABLE public.analytics_events_optimized 
ADD CONSTRAINT analytics_events_optimized_pkey 
PRIMARY KEY (id);

-- analytics_metrics_daily - Agregar PK compuesta
ALTER TABLE public.analytics_metrics_daily 
ADD CONSTRAINT analytics_metrics_daily_pkey 
PRIMARY KEY (date, metric_name);

-- analytics_actions - Agregar columna id como PK
ALTER TABLE public.analytics_actions 
ADD COLUMN IF NOT EXISTS id uuid DEFAULT gen_random_uuid();

ALTER TABLE public.analytics_actions 
ADD CONSTRAINT analytics_actions_pkey 
PRIMARY KEY (id);

-- analytics_browsers - Agregar columna id como PK
ALTER TABLE public.analytics_browsers 
ADD COLUMN IF NOT EXISTS id uuid DEFAULT gen_random_uuid();

ALTER TABLE public.analytics_browsers 
ADD CONSTRAINT analytics_browsers_pkey 
PRIMARY KEY (id);

-- analytics_categories - Agregar columna id como PK
ALTER TABLE public.analytics_categories 
ADD COLUMN IF NOT EXISTS id uuid DEFAULT gen_random_uuid();

ALTER TABLE public.analytics_categories 
ADD CONSTRAINT analytics_categories_pkey 
PRIMARY KEY (id);

-- analytics_event_types - Agregar columna id como PK
ALTER TABLE public.analytics_event_types 
ADD COLUMN IF NOT EXISTS id uuid DEFAULT gen_random_uuid();

ALTER TABLE public.analytics_event_types 
ADD CONSTRAINT analytics_event_types_pkey 
PRIMARY KEY (id);

-- analytics_pages - Agregar columna id como PK
ALTER TABLE public.analytics_pages 
ADD COLUMN IF NOT EXISTS id uuid DEFAULT gen_random_uuid();

ALTER TABLE public.analytics_pages 
ADD CONSTRAINT analytics_pages_pkey 
PRIMARY KEY (id);

-- 5. TABLAS DE LOGÍSTICA
-- =====================================================

-- couriers - Agregar columna id como PK
ALTER TABLE public.couriers 
ADD COLUMN IF NOT EXISTS id uuid DEFAULT gen_random_uuid();

ALTER TABLE public.couriers 
ADD CONSTRAINT couriers_pkey 
PRIMARY KEY (id);

-- drivers - Agregar columna id como PK
ALTER TABLE public.drivers 
ADD COLUMN IF NOT EXISTS id uuid DEFAULT gen_random_uuid();

ALTER TABLE public.drivers 
ADD CONSTRAINT drivers_pkey 
PRIMARY KEY (id);

-- logistics_drivers - Agregar columna id como PK
ALTER TABLE public.logistics_drivers 
ADD COLUMN IF NOT EXISTS id uuid DEFAULT gen_random_uuid();

ALTER TABLE public.logistics_drivers 
ADD CONSTRAINT logistics_drivers_pkey 
PRIMARY KEY (id);

-- logistics_alerts - Agregar columna id como PK
ALTER TABLE public.logistics_alerts 
ADD COLUMN IF NOT EXISTS id uuid DEFAULT gen_random_uuid();

ALTER TABLE public.logistics_alerts 
ADD CONSTRAINT logistics_alerts_pkey 
PRIMARY KEY (id);

-- optimized_routes - Agregar columna id como PK
ALTER TABLE public.optimized_routes 
ADD COLUMN IF NOT EXISTS id uuid DEFAULT gen_random_uuid();

ALTER TABLE public.optimized_routes 
ADD CONSTRAINT optimized_routes_pkey 
PRIMARY KEY (id);

-- fleet_vehicles - Agregar columna id como PK
ALTER TABLE public.fleet_vehicles 
ADD COLUMN IF NOT EXISTS id uuid DEFAULT gen_random_uuid();

ALTER TABLE public.fleet_vehicles 
ADD CONSTRAINT fleet_vehicles_pkey 
PRIMARY KEY (id);

-- vehicle_locations - Agregar columna id como PK
ALTER TABLE public.vehicle_locations 
ADD COLUMN IF NOT EXISTS id uuid DEFAULT gen_random_uuid();

ALTER TABLE public.vehicle_locations 
ADD CONSTRAINT vehicle_locations_pkey 
PRIMARY KEY (id);

-- 6. TABLAS DE ENVÍOS
-- =====================================================

-- shipments - Agregar columna id como PK
ALTER TABLE public.shipments 
ADD COLUMN IF NOT EXISTS id uuid DEFAULT gen_random_uuid();

ALTER TABLE public.shipments 
ADD CONSTRAINT shipments_pkey 
PRIMARY KEY (id);

-- shipment_items - Agregar columna id como PK
ALTER TABLE public.shipment_items 
ADD COLUMN IF NOT EXISTS id uuid DEFAULT gen_random_uuid();

ALTER TABLE public.shipment_items 
ADD CONSTRAINT shipment_items_pkey 
PRIMARY KEY (id);

-- tracking_events - Agregar columna id como PK
ALTER TABLE public.tracking_events 
ADD COLUMN IF NOT EXISTS id uuid DEFAULT gen_random_uuid();

ALTER TABLE public.tracking_events 
ADD CONSTRAINT tracking_events_pkey 
PRIMARY KEY (id);

-- 7. TABLAS DE CONFIGURACIÓN Y ADMINISTRACIÓN
-- =====================================================

-- site_configuration - Agregar columna id como PK
ALTER TABLE public.site_configuration 
ADD COLUMN IF NOT EXISTS id uuid DEFAULT gen_random_uuid();

ALTER TABLE public.site_configuration 
ADD CONSTRAINT site_configuration_pkey 
PRIMARY KEY (id);

-- brand_colors - Agregar columna id como PK
ALTER TABLE public.brand_colors 
ADD COLUMN IF NOT EXISTS id uuid DEFAULT gen_random_uuid();

ALTER TABLE public.brand_colors 
ADD CONSTRAINT brand_colors_pkey 
PRIMARY KEY (id);

-- admin_performance_metrics - Agregar columna id como PK
ALTER TABLE public.admin_performance_metrics 
ADD COLUMN IF NOT EXISTS id uuid DEFAULT gen_random_uuid();

ALTER TABLE public.admin_performance_metrics 
ADD CONSTRAINT admin_performance_metrics_pkey 
PRIMARY KEY (id);

-- admin_security_alerts - Agregar columna id como PK
ALTER TABLE public.admin_security_alerts 
ADD COLUMN IF NOT EXISTS id uuid DEFAULT gen_random_uuid();

ALTER TABLE public.admin_security_alerts 
ADD CONSTRAINT admin_security_alerts_pkey 
PRIMARY KEY (id);

-- 8. CREAR ÍNDICES ÚNICOS ADICIONALES DONDE SEA NECESARIO
-- =====================================================

-- Índices únicos para evitar duplicados
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_roles_user_id_unique 
ON public.user_roles(user_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_profiles_user_id_unique 
ON public.user_profiles(user_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_preferences_user_id_unique 
ON public.user_preferences(user_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_security_settings_user_id_unique 
ON public.user_security_settings(user_id);

-- Índices únicos para configuración
CREATE UNIQUE INDEX IF NOT EXISTS idx_site_configuration_key_unique 
ON public.site_configuration(key) WHERE key IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_brand_colors_name_unique 
ON public.brand_colors(name) WHERE name IS NOT NULL;

-- 9. ACTUALIZAR CONSTRAINTS EXISTENTES
-- =====================================================

-- Asegurar que las foreign keys apunten a las nuevas primary keys
-- Esto se hará en un script separado después de verificar las relaciones

-- 10. FUNCIONES PARA VALIDAR INTEGRIDAD
-- =====================================================

-- Función para verificar que todas las tablas tienen primary key
CREATE OR REPLACE FUNCTION public.check_tables_have_primary_keys()
RETURNS TABLE(
    table_name text,
    has_primary_key boolean
)
LANGUAGE sql
AS $$
    SELECT 
        t.table_name::text,
        CASE 
            WHEN tc.constraint_name IS NOT NULL THEN true 
            ELSE false 
        END as has_primary_key
    FROM information_schema.tables t
    LEFT JOIN information_schema.table_constraints tc 
        ON t.table_name = tc.table_name 
        AND t.table_schema = tc.table_schema
        AND tc.constraint_type = 'PRIMARY KEY'
    WHERE t.table_schema = 'public'
    AND t.table_type = 'BASE TABLE'
    ORDER BY t.table_name;
$$;

-- Función para obtener estadísticas de primary keys
CREATE OR REPLACE FUNCTION public.get_primary_key_stats()
RETURNS json
LANGUAGE sql
AS $$
    SELECT json_build_object(
        'total_tables', COUNT(*),
        'tables_with_pk', COUNT(*) FILTER (WHERE has_primary_key = true),
        'tables_without_pk', COUNT(*) FILTER (WHERE has_primary_key = false),
        'pk_coverage_percentage', 
            ROUND(
                (COUNT(*) FILTER (WHERE has_primary_key = true) * 100.0) / COUNT(*), 
                2
            )
    )
    FROM public.check_tables_have_primary_keys();
$$;

-- 11. COMENTARIOS Y DOCUMENTACIÓN
-- =====================================================

COMMENT ON FUNCTION public.check_tables_have_primary_keys() IS 
'Función para verificar qué tablas tienen primary keys definidas';

COMMENT ON FUNCTION public.get_primary_key_stats() IS 
'Función para obtener estadísticas sobre la cobertura de primary keys en la base de datos';

-- 12. SCRIPT DE VERIFICACIÓN
-- =====================================================

-- Verificar que todas las operaciones se completaron correctamente
DO $$
DECLARE
    stats json;
BEGIN
    SELECT public.get_primary_key_stats() INTO stats;
    RAISE NOTICE 'Estadísticas de Primary Keys: %', stats;
END $$;

-- =====================================================
-- FIN DE AGREGADO DE PRIMARY KEYS
-- =====================================================