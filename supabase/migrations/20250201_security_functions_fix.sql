-- =====================================================
-- MIGRACIÓN: CORRECCIÓN DE SEGURIDAD DE FUNCIONES
-- Fecha: OCTUBRE 2025
-- Descripción: Corrección de funciones críticas con SECURITY DEFINER y search_path fijo
-- Resuelve: Vulnerabilidades SEARCH_PATH MUTABLE y dependencias RLS
-- =====================================================

-- PASO 1: FUNCIONES CRÍTICAS DE AUTENTICACIÓN
-- =====================================================

-- Función is_admin corregida (CRÍTICA - usada por RLS policies)
CREATE OR REPLACE FUNCTION public.is_admin(user_uuid uuid DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_role text;
    current_user_id uuid;
BEGIN
    -- Si no se proporciona user_uuid, usar el usuario actual de la sesión
    IF user_uuid IS NULL THEN
        -- Intentar obtener el user_id de auth.users() si existe
        SELECT auth.uid() INTO current_user_id;
        IF current_user_id IS NULL THEN
            RETURN false;
        END IF;
    ELSE
        current_user_id := user_uuid;
    END IF;
    
    SELECT role INTO user_role
    FROM public.user_roles
    WHERE user_id = current_user_id;
    
    RETURN (user_role = 'admin');
END;
$$;

-- Función get_user_role corregida
CREATE OR REPLACE FUNCTION public.get_user_role(user_uuid uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_role text;
BEGIN
    SELECT role INTO user_role
    FROM public.user_roles
    WHERE user_id = user_uuid;
    
    RETURN COALESCE(user_role, 'customer');
END;
$$;

-- PASO 2: FUNCIONES DE NEXTAUTH.JS
-- =====================================================

CREATE OR REPLACE FUNCTION public.create_nextauth_user(
    user_id uuid,
    email text,
    name text DEFAULT NULL,
    image text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.users (id, email, name, image, created_at, updated_at)
    VALUES (user_id, email, name, image, NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        name = EXCLUDED.name,
        image = EXCLUDED.image,
        updated_at = NOW();
    
    RETURN user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_by_account(
    provider_id text,
    provider_account_id text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_uuid uuid;
BEGIN
    SELECT userId INTO user_uuid
    FROM public.accounts
    WHERE provider = provider_id
    AND providerAccountId = provider_account_id;
    
    RETURN user_uuid;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_by_email(user_email text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_uuid uuid;
BEGIN
    SELECT id INTO user_uuid
    FROM public.users
    WHERE email = user_email;
    
    RETURN user_uuid;
END;
$$;

-- PASO 3: FUNCIONES DE PRODUCTOS Y ANALYTICS
-- =====================================================

CREATE OR REPLACE FUNCTION public.update_product_stock(
    product_uuid uuid,
    quantity_change integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.products
    SET 
        stock = stock + quantity_change,
        updated_at = NOW()
    WHERE id = product_uuid
    AND (stock + quantity_change) >= 0;
    
    RETURN FOUND;
END;
$$;

CREATE OR REPLACE FUNCTION public.insert_analytics_event_optimized(
    event_type text,
    user_uuid uuid DEFAULT NULL,
    session_id text DEFAULT NULL,
    page_url text DEFAULT NULL,
    event_data jsonb DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    event_id uuid;
BEGIN
    INSERT INTO public.analytics_events (
        id, event_type, user_id, session_id, page_url, event_data, created_at
    )
    VALUES (
        gen_random_uuid(), event_type, user_uuid, session_id, page_url, event_data, NOW()
    )
    RETURNING id INTO event_id;
    
    RETURN event_id;
END;
$$;

-- PASO 4: TRIGGERS Y FUNCIONES AUXILIARES
-- =====================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- PASO 5: COMENTARIOS DE DOCUMENTACIÓN
-- =====================================================

COMMENT ON FUNCTION public.is_admin(uuid) IS 
'Función segura para verificar si un usuario es admin - CRÍTICA para RLS policies';

COMMENT ON FUNCTION public.get_user_role(uuid) IS 
'Función segura para obtener el rol de un usuario con search_path fijo';

COMMENT ON FUNCTION public.create_nextauth_user(uuid, text, text, text) IS 
'Función segura para crear usuarios de NextAuth.js con search_path fijo';

-- =====================================================
-- MIGRACIÓN COMPLETADA - FUNCIONES SEGURAS
-- =====================================================