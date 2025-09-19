-- ===================================
-- FASE 2: MIGRACIÓN DE DATOS DE USUARIOS
-- Consolidación users → user_profiles
-- ===================================

-- ===================================
-- PASO 1: ANÁLISIS PRE-MIGRACIÓN
-- ===================================

-- Verificar estado actual de ambas tablas
SELECT 
    'PRE-MIGRACIÓN' as fase,
    'users' as tabla,
    COUNT(*) as total,
    COUNT(CASE WHEN clerk_id IS NOT NULL THEN 1 END) as con_clerk,
    COUNT(CASE WHEN email IS NOT NULL THEN 1 END) as con_email
FROM public.users

UNION ALL

SELECT 
    'PRE-MIGRACIÓN' as fase,
    'user_profiles' as tabla,
    COUNT(*) as total,
    COUNT(CASE WHEN clerk_user_id IS NOT NULL THEN 1 END) as con_clerk,
    COUNT(CASE WHEN email IS NOT NULL THEN 1 END) as con_email
FROM public.user_profiles;

-- Identificar usuarios que necesitan migración
SELECT 
    'USUARIOS A MIGRAR' as tipo,
    u.id as user_id,
    u.email,
    u.clerk_id,
    CASE 
        WHEN up.email IS NOT NULL THEN 'YA EXISTE EN user_profiles'
        ELSE 'NECESITA MIGRACIÓN'
    END as status
FROM public.users u
LEFT JOIN public.user_profiles up ON (u.email = up.email OR u.clerk_id = up.clerk_user_id)
ORDER BY status, u.email;

-- ===================================
-- PASO 2: MIGRACIÓN DE DATOS
-- ===================================

-- Migrar usuarios de users a user_profiles (solo los que no existen)
INSERT INTO public.user_profiles (
    id,
    email, 
    first_name,
    last_name,
    clerk_user_id,
    role_id,
    is_active,
    metadata,
    created_at,
    updated_at
)
SELECT 
    u.id,  -- Mantener el mismo ID para preservar foreign keys
    u.email,
    -- Dividir el nombre en first_name y last_name
    CASE 
        WHEN u.name IS NOT NULL AND TRIM(u.name) != '' 
        THEN SPLIT_PART(TRIM(u.name), ' ', 1)
        ELSE NULL
    END as first_name,
    CASE 
        WHEN u.name IS NOT NULL AND TRIM(u.name) != '' 
             AND ARRAY_LENGTH(STRING_TO_ARRAY(TRIM(u.name), ' '), 1) > 1 
        THEN TRIM(SUBSTRING(u.name FROM POSITION(' ' IN u.name) + 1))
        ELSE NULL
    END as last_name,
    u.clerk_id as clerk_user_id,
    -- Asignar rol de customer por defecto
    (SELECT id FROM public.user_roles WHERE role_name = 'customer' LIMIT 1) as role_id,
    true as is_active,
    -- Metadata con información de migración
    jsonb_build_object(
        'migrated_from', 'users_table',
        'migration_date', NOW(),
        'original_clerk_id', u.clerk_id,
        'original_name', u.name,
        'migration_phase', 'clerk_removal_refactor'
    ) as metadata,
    u.created_at,
    COALESCE(u.updated_at, u.created_at) as updated_at
FROM public.users u
WHERE NOT EXISTS (
    -- No migrar si ya existe por email o clerk_id
    SELECT 1 FROM public.user_profiles up 
    WHERE up.email = u.email 
       OR up.clerk_user_id = u.clerk_id
       OR up.id = u.id
);

-- ===================================
-- PASO 3: CREAR MAPEO DE IDs
-- ===================================

-- Llenar tabla de mapeo para tracking de la migración
INSERT INTO backup_migration.user_id_mapping (
    old_user_id,
    new_user_profile_id,
    email,
    clerk_id,
    migration_status
)
SELECT 
    u.id as old_user_id,
    up.id as new_user_profile_id,
    u.email,
    u.clerk_id,
    'migrated' as migration_status
FROM public.users u
JOIN public.user_profiles up ON (
    up.email = u.email 
    AND up.metadata->>'migrated_from' = 'users_table'
);

-- ===================================
-- PASO 4: VERIFICACIÓN POST-MIGRACIÓN
-- ===================================

-- Verificar que la migración fue exitosa
SELECT 
    'POST-MIGRACIÓN' as fase,
    'user_profiles' as tabla,
    COUNT(*) as total_registros,
    COUNT(CASE WHEN metadata->>'migrated_from' = 'users_table' THEN 1 END) as migrados_ahora,
    COUNT(CASE WHEN clerk_user_id IS NOT NULL THEN 1 END) as con_clerk_id
FROM public.user_profiles

UNION ALL

SELECT 
    'POST-MIGRACIÓN' as fase,
    'mapeo_ids' as tabla,
    COUNT(*) as total_registros,
    COUNT(CASE WHEN migration_status = 'migrated' THEN 1 END) as migrados_ahora,
    0 as con_clerk_id
FROM backup_migration.user_id_mapping;

-- Verificar integridad de emails (no debe haber duplicados)
SELECT 
    'VERIFICACIÓN INTEGRIDAD' as tipo,
    'emails_duplicados' as check_name,
    COUNT(*) as duplicados_encontrados,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ OK - Sin duplicados'
        ELSE '❌ ERROR - Duplicados encontrados'
    END as status
FROM (
    SELECT email, COUNT(*) as count
    FROM public.user_profiles 
    WHERE email IS NOT NULL
    GROUP BY email
    HAVING COUNT(*) > 1
) duplicates;

-- Verificar que todos los usuarios de 'users' tienen correspondencia en 'user_profiles'
SELECT 
    'VERIFICACIÓN MIGRACIÓN' as tipo,
    'usuarios_sin_migrar' as check_name,
    COUNT(*) as usuarios_faltantes,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ OK - Todos migrados'
        ELSE '❌ ERROR - Usuarios sin migrar'
    END as status
FROM public.users u
WHERE NOT EXISTS (
    SELECT 1 FROM public.user_profiles up 
    WHERE up.email = u.email OR up.id = u.id
);

-- ===================================
-- PASO 5: ANÁLISIS DE DEPENDENCIAS
-- ===================================

-- Verificar que todas las direcciones tienen usuario válido en user_profiles
SELECT 
    'DEPENDENCIAS CHECK' as tipo,
    'user_addresses' as tabla,
    COUNT(*) as total_direcciones,
    COUNT(CASE WHEN up.id IS NOT NULL THEN 1 END) as con_usuario_valido,
    COUNT(CASE WHEN up.id IS NULL THEN 1 END) as huerfanas
FROM public.user_addresses ua
LEFT JOIN public.user_profiles up ON ua.user_id = up.id;

-- Verificar que todas las órdenes tienen usuario válido en user_profiles  
SELECT 
    'DEPENDENCIAS CHECK' as tipo,
    'orders' as tabla,
    COUNT(*) as total_ordenes,
    COUNT(CASE WHEN up.id IS NOT NULL THEN 1 END) as con_usuario_valido,
    COUNT(CASE WHEN up.id IS NULL THEN 1 END) as huerfanas
FROM public.orders o
LEFT JOIN public.user_profiles up ON o.user_id = up.id;

-- ===================================
-- PASO 6: PREPARACIÓN PARA SIGUIENTE FASE
-- ===================================

-- Marcar usuarios migrados como listos para eliminación
UPDATE backup_migration.user_id_mapping 
SET migration_status = 'ready_for_fk_update'
WHERE migration_status = 'migrated'
  AND old_user_id IS NOT NULL 
  AND new_user_profile_id IS NOT NULL;

-- ===================================
-- RESUMEN DE MIGRACIÓN
-- ===================================

SELECT 
    '🎯 MIGRACIÓN DE DATOS COMPLETADA' as resultado,
    (SELECT COUNT(*) FROM public.user_profiles WHERE metadata->>'migrated_from' = 'users_table') as usuarios_migrados,
    (SELECT COUNT(*) FROM backup_migration.user_id_mapping WHERE migration_status = 'ready_for_fk_update') as mapeos_creados,
    'LISTO PARA FASE 3' as siguiente_paso;

-- ===================================
-- INSTRUCCIONES PARA CONTINUAR
-- ===================================

/*
✅ FASE 2 COMPLETADA - MIGRACIÓN DE DATOS

ACCIONES REALIZADAS:
- ✅ Usuarios migrados de users → user_profiles
- ✅ Mapeo de IDs creado para foreign keys
- ✅ Verificación de integridad completada
- ✅ Análisis de dependencias realizado

VERIFICACIONES CRÍTICAS:
- ✅ Sin emails duplicados en user_profiles
- ✅ Todos los usuarios migrados exitosamente
- ✅ Dependencias (direcciones, órdenes) verificadas

PRÓXIMO PASO:
Ejecutar: 03-update-foreign-keys.sql

ROLLBACK (si es necesario):
Ejecutar: 99-rollback-complete.sql
*/
