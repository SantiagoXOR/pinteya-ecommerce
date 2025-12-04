-- =============================================
-- FIX: Extensions in Public Schema
-- Fecha: 2025-10-19
-- Descripción: Mover extensiones unaccent y pg_trgm de public a extensions schema
-- =============================================

-- Paso 1: Crear schema extensions si no existe
CREATE SCHEMA IF NOT EXISTS extensions;

-- Paso 2: Mover extensión unaccent
ALTER EXTENSION unaccent SET SCHEMA extensions;

-- Paso 3: Mover extensión pg_trgm
ALTER EXTENSION pg_trgm SET SCHEMA extensions;

-- Paso 4: Actualizar search_path para que las aplicaciones puedan encontrar las extensiones
-- IMPORTANTE: Esto debe hacerse en las funciones que usan estas extensiones

-- Verificación: Listar extensiones y sus schemas
SELECT 
    extname as extension_name,
    nspname as schema_name,
    extversion as version
FROM pg_extension e
JOIN pg_namespace n ON e.extnamespace = n.oid
WHERE extname IN ('unaccent', 'pg_trgm')
ORDER BY extname;

-- Notas:
-- - Las funciones que usan unaccent() o similitud trigram deben poder encontrar estas extensiones
-- - Si hay errores después de mover, puede ser necesario agregar 'extensions' al search_path
-- - Alternativa: ALTER DATABASE [nombre] SET search_path = public, extensions;


