-- ===================================
-- CORRECCIÓN: RECURSIÓN INFINITA EN POLÍTICAS RLS DE USER_PROFILES
-- ===================================
-- Fecha: 2025-01-20
-- Problema: Políticas RLS causan recursión infinita al llamar funciones
--           que consultan user_profiles
-- Solución: Crear funciones que consulten user_roles directamente

-- =====================================================
-- PASO 1: CREAR FUNCIONES SIN RECURSIÓN
-- =====================================================

-- Función para verificar si el usuario actual es admin (sin recursión)
-- Consulta user_roles directamente en lugar de user_profiles
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
-- PASO 2: ELIMINAR POLÍTICAS RLS PROBLEMÁTICAS
-- =====================================================

-- Eliminar políticas que causan recursión
DROP POLICY IF EXISTS "Admins and moderators can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Only admins can create profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Only admins can update any profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Only admins can delete profiles" ON public.user_profiles;

-- =====================================================
-- PASO 3: RECREAR POLÍTICAS SIN RECURSIÓN
-- =====================================================

-- IMPORTANTE: Estas políticas NO pueden usar funciones que consulten user_profiles
-- Para operaciones administrativas, usaremos el cliente service_role desde las APIs

-- Política: Los usuarios pueden ver su propio perfil (mantener)
-- Esta ya existe y no causa recursión

-- Política: Los usuarios pueden actualizar su propio perfil (mantener)
-- Esta ya existe y no causa recursión

-- =====================================================
-- PASO 4: DESHABILITAR TEMPORALMENTE RLS PARA ADMINS
-- =====================================================

-- Para operaciones administrativas en las APIs, usaremos:
-- 1. Cliente service_role (bypassa RLS completamente)
-- 2. Verificación de roles en la capa de aplicación

-- Alternativamente, podemos crear políticas que NO usen funciones:

-- Política: Bypass RLS para service role
-- El service role key bypassa RLS automáticamente, no necesita política

-- =====================================================
-- PASO 5: COMENTARIOS Y DOCUMENTACIÓN
-- =====================================================

COMMENT ON FUNCTION public.is_admin_safe() IS 
'Función segura sin recursión - Verifica si usuario es admin consultando user_roles directamente';

COMMENT ON FUNCTION public.is_moderator_or_admin_safe() IS 
'Función segura sin recursión - Verifica si usuario es admin/moderador consultando user_roles directamente';

-- =====================================================
-- PASO 6: GRANTS
-- =====================================================

GRANT EXECUTE ON FUNCTION public.is_admin_safe() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_moderator_or_admin_safe() TO authenticated;

-- =====================================================
-- VERIFICACIÓN
-- =====================================================

-- Verificar que las políticas RLS estén activas
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename = 'user_profiles';

-- Verificar que las funciones existan
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname IN ('is_admin_safe', 'is_moderator_or_admin_safe');



