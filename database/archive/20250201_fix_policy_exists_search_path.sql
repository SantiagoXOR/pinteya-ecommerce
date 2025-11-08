-- =====================================================
-- MIGRACIÓN: CORRECCIÓN SEARCH_PATH FUNCIÓN _policy_exists
-- Fecha: OCTUBRE 2025
-- Propósito: Resolver el warning de search_path mutable en _policy_exists
-- =====================================================

-- Eliminar TODAS las versiones existentes de _policy_exists (diferentes firmas)
DROP FUNCTION IF EXISTS public._policy_exists(text, text) CASCADE;
DROP FUNCTION IF EXISTS public._policy_exists(text, text, text) CASCADE;

-- Recrear la función con search_path correcto y configuración completa
CREATE OR REPLACE FUNCTION public._policy_exists(policy_name text, table_name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    policy_count integer;
BEGIN
    -- Verificar si existe la política especificada
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = table_name
    AND policyname = policy_name;
    
    RETURN policy_count > 0;
END;
$$;

-- Verificación de que la función fue creada correctamente
DO $$
DECLARE
    func_config text[];
    func_count integer;
BEGIN
    -- Verificar que solo existe una versión de la función
    SELECT COUNT(*) INTO func_count
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND p.proname = '_policy_exists';
    
    IF func_count != 1 THEN
        RAISE EXCEPTION 'Se esperaba exactamente 1 función _policy_exists, pero se encontraron %', func_count;
    END IF;
    
    -- Verificar que tiene search_path configurado
    SELECT proconfig INTO func_config
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND p.proname = '_policy_exists'
    AND array_length(p.proargtypes, 1) = 2; -- Solo la versión con 2 parámetros
    
    IF func_config IS NULL OR NOT (func_config && ARRAY['search_path=""']) THEN
        RAISE EXCEPTION 'La función _policy_exists no tiene search_path configurado correctamente. Config actual: %', func_config;
    END IF;
    
    RAISE NOTICE 'Función _policy_exists corregida exitosamente con search_path fijo';
END;
$$;

-- Comentario de documentación
COMMENT ON FUNCTION public._policy_exists(text, text) IS 
'Función utilitaria para verificar existencia de políticas RLS - search_path fijo para seguridad';

-- =====================================================
-- RESUMEN DE CORRECCIÓN
-- =====================================================

/*
PROBLEMA RESUELTO:

✅ SEARCH_PATH MUTABLE EN _policy_exists
   - Eliminadas todas las versiones existentes de la función
   - Recreada con SET search_path = '' explícito
   - Verificación automática incluida
   - Documentación añadida

ESTADO: WARNING DE SEARCH_PATH RESUELTO
*/

-- =====================================================
-- FIN DE MIGRACIÓN
-- =====================================================