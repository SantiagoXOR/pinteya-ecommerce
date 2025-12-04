-- ===================================
-- SOLUCIÓN COMPLETA: RECURSIÓN INFINITA EN RLS
-- ===================================
-- Este script contiene TODAS las correcciones necesarias
-- Ejecutar en Supabase SQL Editor

-- =====================================================
-- PARTE 1: CORREGIR USER_PROFILES
-- =====================================================

-- Eliminar políticas problemáticas de user_profiles
DROP POLICY IF EXISTS "user_profiles_select_consolidated" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_insert_consolidated" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_update_consolidated" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins and moderators can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Only admins can create profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Only admins can update any profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Only admins can delete profiles" ON public.user_profiles;

-- Crear políticas simplificadas para user_profiles
CREATE POLICY "user_profiles_select_own" ON public.user_profiles
    FOR SELECT USING (
        supabase_user_id = auth.uid()
        OR auth.role() = 'service_role'
    );

CREATE POLICY "user_profiles_insert_service_role" ON public.user_profiles
    FOR INSERT WITH CHECK (
        auth.role() = 'service_role'
    );

CREATE POLICY "user_profiles_update_own" ON public.user_profiles
    FOR UPDATE USING (
        supabase_user_id = auth.uid()
        OR auth.role() = 'service_role'
    ) WITH CHECK (
        supabase_user_id = auth.uid()
        OR auth.role() = 'service_role'
    );

-- =====================================================
-- PARTE 2: CORREGIR USER_ROLES
-- =====================================================

-- Eliminar políticas problemáticas de user_roles
DROP POLICY IF EXISTS "user_roles_select_consolidated" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_insert_consolidated" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_update_consolidated" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_delete_consolidated" ON public.user_roles;
DROP POLICY IF EXISTS "Allow users to read own profile" ON public.user_roles;
DROP POLICY IF EXISTS "Allow admin to manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view roles" ON public.user_roles;

-- Crear políticas simplificadas para user_roles
CREATE POLICY "user_roles_select_public" ON public.user_roles
    FOR SELECT USING (true);

CREATE POLICY "user_roles_insert_service" ON public.user_roles
    FOR INSERT WITH CHECK (
        auth.role() = 'service_role'
    );

CREATE POLICY "user_roles_update_service" ON public.user_roles
    FOR UPDATE USING (
        auth.role() = 'service_role'
    ) WITH CHECK (
        auth.role() = 'service_role'
    );

CREATE POLICY "user_roles_delete_service" ON public.user_roles
    FOR DELETE USING (
        auth.role() = 'service_role'
    );

-- =====================================================
-- PARTE 3: CREAR FUNCIONES SEGURAS (OPCIONAL - YA EXISTEN)
-- =====================================================

-- Función para verificar si el usuario actual es admin (sin recursión)
CREATE OR REPLACE FUNCTION public.is_admin_safe()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 
        FROM public.user_profiles up
        INNER JOIN public.user_roles ur ON up.role_id = ur.id
        WHERE up.supabase_user_id = auth.uid()
        AND ur.role_name = 'admin'
        AND up.is_active = true
    );
$$;

-- Función para verificar si el usuario es moderador o admin (sin recursión)
CREATE OR REPLACE FUNCTION public.is_moderator_or_admin_safe()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 
        FROM public.user_profiles up
        INNER JOIN public.user_roles ur ON up.role_id = ur.id
        WHERE up.supabase_user_id = auth.uid()
        AND ur.role_name IN ('admin', 'moderator')
        AND up.is_active = true
    );
$$;

-- =====================================================
-- PARTE 4: GRANTS
-- =====================================================

GRANT EXECUTE ON FUNCTION public.is_admin_safe() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_moderator_or_admin_safe() TO authenticated;

-- =====================================================
-- VERIFICACIÓN
-- =====================================================

-- Verificar políticas de user_profiles
SELECT 'user_profiles policies:' as info;
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename = 'user_profiles';

-- Verificar políticas de user_roles
SELECT 'user_roles policies:' as info;
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename = 'user_roles';

-- Verificar funciones seguras
SELECT 'Safe functions:' as info;
SELECT proname, prosecdef, provolatile
FROM pg_proc 
WHERE proname IN ('is_admin_safe', 'is_moderator_or_admin_safe');




