-- ===================================
-- FASE 3: ACTUALIZACIÓN DE FOREIGN KEYS
-- Redireccionar referencias de users → user_profiles
-- ===================================

-- ===================================
-- PASO 1: VERIFICACIÓN PRE-ACTUALIZACIÓN
-- ===================================

-- Verificar estado actual de foreign keys
SELECT 
    'PRE-ACTUALIZACIÓN' as fase,
    tc.table_name,
    kcu.column_name,
    ccu.table_name as referenced_table,
    COUNT(*) as total_registros
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu 
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu 
    ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.tables t 
    ON t.table_name = tc.table_name AND t.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_schema = 'public'
    AND ccu.table_name = 'users'
GROUP BY tc.table_name, kcu.column_name, ccu.table_name
ORDER BY tc.table_name;

-- ===================================
-- PASO 2: ACTUALIZAR user_addresses
-- ===================================

-- Verificar datos antes de actualización
SELECT 
    'user_addresses PRE-UPDATE' as tipo,
    COUNT(*) as total_direcciones,
    COUNT(DISTINCT user_id) as usuarios_unicos,
    COUNT(CASE WHEN up.id IS NOT NULL THEN 1 END) as con_usuario_en_profiles
FROM public.user_addresses ua
LEFT JOIN public.user_profiles up ON ua.user_id = up.id;

-- Como los IDs se mantuvieron iguales en la migración, 
-- las foreign keys ya apuntan correctamente a user_profiles
-- Solo necesitamos actualizar el constraint

-- Eliminar constraint actual
ALTER TABLE public.user_addresses 
DROP CONSTRAINT IF EXISTS user_addresses_user_id_fkey;

-- Crear nuevo constraint apuntando a user_profiles
ALTER TABLE public.user_addresses 
ADD CONSTRAINT user_addresses_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE;

-- Verificar después de actualización
SELECT 
    'user_addresses POST-UPDATE' as tipo,
    COUNT(*) as total_direcciones,
    COUNT(DISTINCT user_id) as usuarios_unicos,
    COUNT(CASE WHEN up.id IS NOT NULL THEN 1 END) as con_usuario_en_profiles
FROM public.user_addresses ua
LEFT JOIN public.user_profiles up ON ua.user_id = up.id;

-- ===================================
-- PASO 3: ACTUALIZAR orders
-- ===================================

-- Verificar datos antes de actualización
SELECT 
    'orders PRE-UPDATE' as tipo,
    COUNT(*) as total_ordenes,
    COUNT(DISTINCT user_id) as usuarios_unicos,
    COUNT(CASE WHEN up.id IS NOT NULL THEN 1 END) as con_usuario_en_profiles
FROM public.orders o
LEFT JOIN public.user_profiles up ON o.user_id = up.id;

-- Eliminar constraint actual
ALTER TABLE public.orders 
DROP CONSTRAINT IF EXISTS orders_user_id_fkey;

-- Crear nuevo constraint apuntando a user_profiles
ALTER TABLE public.orders 
ADD CONSTRAINT orders_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE;

-- Verificar después de actualización
SELECT 
    'orders POST-UPDATE' as tipo,
    COUNT(*) as total_ordenes,
    COUNT(DISTINCT user_id) as usuarios_unicos,
    COUNT(CASE WHEN up.id IS NOT NULL THEN 1 END) as con_usuario_en_profiles
FROM public.orders o
LEFT JOIN public.user_profiles up ON o.user_id = up.id;

-- ===================================
-- PASO 4: ACTUALIZAR user_activity
-- ===================================

-- Verificar y actualizar user_activity
SELECT 
    'user_activity PRE-UPDATE' as tipo,
    COUNT(*) as total_actividades,
    COUNT(DISTINCT user_id) as usuarios_unicos
FROM public.user_activity;

ALTER TABLE public.user_activity 
DROP CONSTRAINT IF EXISTS user_activity_user_id_fkey;

ALTER TABLE public.user_activity 
ADD CONSTRAINT user_activity_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE;

-- ===================================
-- PASO 5: ACTUALIZAR user_preferences
-- ===================================

-- Verificar y actualizar user_preferences
SELECT 
    'user_preferences PRE-UPDATE' as tipo,
    COUNT(*) as total_preferencias,
    COUNT(DISTINCT user_id) as usuarios_unicos
FROM public.user_preferences;

ALTER TABLE public.user_preferences 
DROP CONSTRAINT IF EXISTS user_preferences_user_id_fkey;

ALTER TABLE public.user_preferences 
ADD CONSTRAINT user_preferences_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE;

-- ===================================
-- PASO 6: ACTUALIZAR user_security_alerts
-- ===================================

ALTER TABLE public.user_security_alerts 
DROP CONSTRAINT IF EXISTS user_security_alerts_user_id_fkey;

ALTER TABLE public.user_security_alerts 
ADD CONSTRAINT user_security_alerts_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE;

-- ===================================
-- PASO 7: ACTUALIZAR user_security_settings
-- ===================================

ALTER TABLE public.user_security_settings 
DROP CONSTRAINT IF EXISTS user_security_settings_user_id_fkey;

ALTER TABLE public.user_security_settings 
ADD CONSTRAINT user_security_settings_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE;

-- ===================================
-- PASO 8: ACTUALIZAR user_sessions
-- ===================================

ALTER TABLE public.user_sessions 
DROP CONSTRAINT IF EXISTS user_sessions_user_id_fkey;

ALTER TABLE public.user_sessions 
ADD CONSTRAINT user_sessions_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE;

-- ===================================
-- PASO 9: ACTUALIZAR data_export_requests
-- ===================================

ALTER TABLE public.data_export_requests 
DROP CONSTRAINT IF EXISTS data_export_requests_user_id_fkey;

ALTER TABLE public.data_export_requests 
ADD CONSTRAINT data_export_requests_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE;

-- ===================================
-- PASO 10: VERIFICACIÓN COMPLETA DE CONSTRAINTS
-- ===================================

-- Verificar que todos los constraints se actualizaron correctamente
SELECT 
    'CONSTRAINTS ACTUALIZADOS' as tipo,
    tc.table_name,
    kcu.column_name,
    ccu.table_name as referenced_table,
    tc.constraint_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu 
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu 
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_schema = 'public'
    AND ccu.table_name = 'user_profiles'
ORDER BY tc.table_name;

-- Verificar que no quedan referencias a la tabla users
SELECT 
    'CONSTRAINTS LEGACY' as tipo,
    tc.table_name,
    kcu.column_name,
    ccu.table_name as referenced_table,
    tc.constraint_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu 
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu 
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_schema = 'public'
    AND ccu.table_name = 'users'
ORDER BY tc.table_name;

-- ===================================
-- PASO 11: VERIFICACIÓN DE INTEGRIDAD
-- ===================================

-- Verificar que todas las relaciones funcionan correctamente
SELECT 
    'INTEGRIDAD POST-FK' as tipo,
    'user_addresses' as tabla,
    COUNT(*) as total,
    COUNT(CASE WHEN up.id IS NOT NULL THEN 1 END) as con_usuario_valido,
    COUNT(CASE WHEN up.id IS NULL THEN 1 END) as huerfanas
FROM public.user_addresses ua
LEFT JOIN public.user_profiles up ON ua.user_id = up.id

UNION ALL

SELECT 
    'INTEGRIDAD POST-FK' as tipo,
    'orders' as tabla,
    COUNT(*) as total,
    COUNT(CASE WHEN up.id IS NOT NULL THEN 1 END) as con_usuario_valido,
    COUNT(CASE WHEN up.id IS NULL THEN 1 END) as huerfanas
FROM public.orders o
LEFT JOIN public.user_profiles up ON o.user_id = up.id;

-- ===================================
-- PASO 12: MARCAR MIGRACIÓN COMO COMPLETADA
-- ===================================

-- Actualizar estado en tabla de mapeo
UPDATE backup_migration.user_id_mapping 
SET migration_status = 'fk_updated'
WHERE migration_status = 'ready_for_fk_update';

-- ===================================
-- RESUMEN DE ACTUALIZACIÓN
-- ===================================

SELECT 
    '🎯 FOREIGN KEYS ACTUALIZADAS' as resultado,
    (SELECT COUNT(*) FROM information_schema.table_constraints tc 
     JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
     WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public' 
     AND ccu.table_name = 'user_profiles') as constraints_a_user_profiles,
    (SELECT COUNT(*) FROM information_schema.table_constraints tc 
     JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
     WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public' 
     AND ccu.table_name = 'users') as constraints_a_users_legacy,
    'LISTO PARA FASE 4' as siguiente_paso;

-- ===================================
-- INSTRUCCIONES PARA CONTINUAR
-- ===================================

/*
✅ FASE 3 COMPLETADA - FOREIGN KEYS ACTUALIZADAS

ACCIONES REALIZADAS:
- ✅ Todos los constraints redirigidos a user_profiles
- ✅ Verificación de integridad completada
- ✅ Sin registros huérfanos detectados
- ✅ Tabla users lista para eliminación

TABLAS ACTUALIZADAS:
- ✅ user_addresses → user_profiles
- ✅ orders → user_profiles  
- ✅ user_activity → user_profiles
- ✅ user_preferences → user_profiles
- ✅ user_security_alerts → user_profiles
- ✅ user_security_settings → user_profiles
- ✅ user_sessions → user_profiles
- ✅ data_export_requests → user_profiles

PRÓXIMO PASO:
Ejecutar: 04-cleanup-legacy-tables.sql

ROLLBACK (si es necesario):
Ejecutar: 99-rollback-complete.sql
*/
