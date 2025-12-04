-- ===================================
-- CORRECCIÓN: RECURSIÓN INFINITA EN POLÍTICAS RLS DE USER_ROLES
-- ===================================
-- Fecha: 2025-01-20
-- Problema: Las políticas RLS de user_roles también causan recursión infinita
--           cuando las funciones safe intentan consultarlas
-- Solución: Simplificar políticas RLS de user_roles para acceso público de lectura

-- =====================================================
-- PASO 1: VERIFICAR Y ELIMINAR POLÍTICAS PROBLEMÁTICAS
-- =====================================================

-- Eliminar todas las políticas RLS de user_roles que puedan causar recursión
DROP POLICY IF EXISTS "user_roles_select_consolidated" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_insert_consolidated" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_update_consolidated" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_delete_consolidated" ON public.user_roles;
DROP POLICY IF EXISTS "Allow users to read own profile" ON public.user_roles;
DROP POLICY IF EXISTS "Allow admin to manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view roles" ON public.user_roles;

-- =====================================================
-- PASO 2: CREAR POLÍTICAS SIMPLIFICADAS SIN RECURSIÓN
-- =====================================================

-- Política SELECT: Permitir lectura pública de user_roles
-- Esto es necesario para que is_admin_safe() y is_moderator_or_admin_safe() funcionen
CREATE POLICY "user_roles_select_public" ON public.user_roles
    FOR SELECT USING (true);

-- Política INSERT: Solo service_role puede insertar
CREATE POLICY "user_roles_insert_service" ON public.user_roles
    FOR INSERT WITH CHECK (
        auth.role() = 'service_role'
    );

-- Política UPDATE: Solo service_role puede actualizar
CREATE POLICY "user_roles_update_service" ON public.user_roles
    FOR UPDATE USING (
        auth.role() = 'service_role'
    ) WITH CHECK (
        auth.role() = 'service_role'
    );

-- Política DELETE: Solo service_role puede eliminar
CREATE POLICY "user_roles_delete_service" ON public.user_roles
    FOR DELETE USING (
        auth.role() = 'service_role'
    );

-- =====================================================
-- PASO 3: COMENTARIOS Y DOCUMENTACIÓN
-- =====================================================

COMMENT ON POLICY "user_roles_select_public" ON public.user_roles IS 
'Permite lectura pública de roles para funciones de autorizacíon sin recursión';

COMMENT ON POLICY "user_roles_insert_service" ON public.user_roles IS 
'Solo service_role puede insertar roles - sin recursión';

COMMENT ON POLICY "user_roles_update_service" ON public.user_roles IS 
'Solo service_role puede actualizar roles - sin recursión';

COMMENT ON POLICY "user_roles_delete_service" ON public.user_roles IS 
'Solo service_role puede eliminar roles - sin recursión';

-- =====================================================
-- VERIFICACIÓN
-- =====================================================

-- Verificar que las políticas RLS estén activas
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename = 'user_roles';




