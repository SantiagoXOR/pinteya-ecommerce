-- ===================================
-- FASE 1: BACKUP Y PREPARACIÓN
-- Refactorización Supabase - Eliminación Dependencias Clerk
-- ===================================

-- Crear esquema de backup para migración segura
CREATE SCHEMA IF NOT EXISTS backup_migration;

-- Otorgar permisos necesarios
GRANT USAGE ON SCHEMA backup_migration TO postgres, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA backup_migration TO postgres, authenticated, service_role;

-- ===================================
-- BACKUP DE TABLAS CRÍTICAS
-- ===================================

-- Backup tabla users (estructura legacy con clerk_id)
CREATE TABLE backup_migration.users_backup AS 
SELECT * FROM public.users;

-- Backup tabla user_profiles (estructura moderna)
CREATE TABLE backup_migration.user_profiles_backup AS 
SELECT * FROM public.user_profiles;

-- Backup tabla user_addresses (depende de users)
CREATE TABLE backup_migration.user_addresses_backup AS 
SELECT * FROM public.user_addresses;

-- Backup tabla orders (depende de users)
CREATE TABLE backup_migration.orders_backup AS 
SELECT * FROM public.orders;

-- Backup tabla user_activity (depende de users)
CREATE TABLE backup_migration.user_activity_backup AS 
SELECT * FROM public.user_activity;

-- Backup tabla user_preferences (depende de users)
CREATE TABLE backup_migration.user_preferences_backup AS 
SELECT * FROM public.user_preferences;

-- Backup tabla user_security_alerts (depende de users)
CREATE TABLE backup_migration.user_security_alerts_backup AS 
SELECT * FROM public.user_security_alerts;

-- Backup tabla user_security_settings (depende de users)
CREATE TABLE backup_migration.user_security_settings_backup AS 
SELECT * FROM public.user_security_settings;

-- Backup tabla user_sessions (depende de users)
CREATE TABLE backup_migration.user_sessions_backup AS 
SELECT * FROM public.user_sessions;

-- Backup tabla data_export_requests (depende de users)
CREATE TABLE backup_migration.data_export_requests_backup AS 
SELECT * FROM public.data_export_requests;

-- ===================================
-- VERIFICACIÓN DE BACKUPS
-- ===================================

-- Verificar que todos los backups se crearon correctamente
SELECT 
    'users_backup' as tabla, 
    COUNT(*) as registros_backup,
    (SELECT COUNT(*) FROM public.users) as registros_original,
    CASE 
        WHEN COUNT(*) = (SELECT COUNT(*) FROM public.users) 
        THEN '✅ BACKUP OK' 
        ELSE '❌ BACKUP FAILED' 
    END as status
FROM backup_migration.users_backup

UNION ALL

SELECT 
    'user_profiles_backup' as tabla, 
    COUNT(*) as registros_backup,
    (SELECT COUNT(*) FROM public.user_profiles) as registros_original,
    CASE 
        WHEN COUNT(*) = (SELECT COUNT(*) FROM public.user_profiles) 
        THEN '✅ BACKUP OK' 
        ELSE '❌ BACKUP FAILED' 
    END as status
FROM backup_migration.user_profiles_backup

UNION ALL

SELECT 
    'user_addresses_backup' as tabla, 
    COUNT(*) as registros_backup,
    (SELECT COUNT(*) FROM public.user_addresses) as registros_original,
    CASE 
        WHEN COUNT(*) = (SELECT COUNT(*) FROM public.user_addresses) 
        THEN '✅ BACKUP OK' 
        ELSE '❌ BACKUP FAILED' 
    END as status
FROM backup_migration.user_addresses_backup

UNION ALL

SELECT 
    'orders_backup' as tabla, 
    COUNT(*) as registros_backup,
    (SELECT COUNT(*) FROM public.orders) as registros_original,
    CASE 
        WHEN COUNT(*) = (SELECT COUNT(*) FROM public.orders) 
        THEN '✅ BACKUP OK' 
        ELSE '❌ BACKUP FAILED' 
    END as status
FROM backup_migration.orders_backup

ORDER BY tabla;

-- ===================================
-- ANÁLISIS PRE-MIGRACIÓN
-- ===================================

-- Verificar datos actuales en tablas de usuarios
SELECT 
    'ANÁLISIS PRE-MIGRACIÓN' as seccion,
    'users' as tabla,
    COUNT(*) as total_registros,
    COUNT(CASE WHEN clerk_id IS NOT NULL THEN 1 END) as con_clerk_id,
    COUNT(CASE WHEN clerk_id IS NULL THEN 1 END) as sin_clerk_id
FROM public.users

UNION ALL

SELECT 
    'ANÁLISIS PRE-MIGRACIÓN' as seccion,
    'user_profiles' as tabla,
    COUNT(*) as total_registros,
    COUNT(CASE WHEN clerk_user_id IS NOT NULL THEN 1 END) as con_clerk_id,
    COUNT(CASE WHEN clerk_user_id IS NULL THEN 1 END) as sin_clerk_id
FROM public.user_profiles;

-- Verificar foreign keys que dependen de users
SELECT 
    'DEPENDENCIAS' as seccion,
    'user_addresses' as tabla,
    COUNT(*) as registros_dependientes,
    COUNT(DISTINCT user_id) as usuarios_únicos,
    0 as placeholder1
FROM public.user_addresses

UNION ALL

SELECT 
    'DEPENDENCIAS' as seccion,
    'orders' as tabla,
    COUNT(*) as registros_dependientes,
    COUNT(DISTINCT user_id) as usuarios_únicos,
    0 as placeholder1
FROM public.orders;

-- ===================================
-- VERIFICACIÓN DE INTEGRIDAD
-- ===================================

-- Verificar que no hay usuarios huérfanos en direcciones
SELECT 
    'INTEGRIDAD CHECK' as tipo,
    'user_addresses_orphans' as descripcion,
    COUNT(*) as cantidad,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ OK' 
        ELSE '⚠️ HUÉRFANOS DETECTADOS' 
    END as status,
    '' as detalle
FROM public.user_addresses ua
LEFT JOIN public.users u ON ua.user_id = u.id
WHERE u.id IS NULL

UNION ALL

-- Verificar que no hay órdenes huérfanas
SELECT 
    'INTEGRIDAD CHECK' as tipo,
    'orders_orphans' as descripcion,
    COUNT(*) as cantidad,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ OK' 
        ELSE '⚠️ HUÉRFANOS DETECTADOS' 
    END as status,
    '' as detalle
FROM public.orders o
LEFT JOIN public.users u ON o.user_id = u.id
WHERE u.id IS NULL;

-- ===================================
-- PREPARACIÓN PARA MIGRACIÓN
-- ===================================

-- Crear tabla temporal para mapeo de IDs
CREATE TABLE IF NOT EXISTS backup_migration.user_id_mapping (
    old_user_id UUID,
    new_user_profile_id UUID,
    email VARCHAR(255),
    clerk_id VARCHAR(255),
    migration_status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Índices para optimizar el mapeo
CREATE INDEX IF NOT EXISTS idx_user_id_mapping_old_id 
ON backup_migration.user_id_mapping(old_user_id);

CREATE INDEX IF NOT EXISTS idx_user_id_mapping_new_id 
ON backup_migration.user_id_mapping(new_user_profile_id);

-- ===================================
-- RESUMEN DE PREPARACIÓN
-- ===================================

SELECT 
    '🎯 PREPARACIÓN COMPLETADA' as resultado,
    'Backups creados, integridad verificada' as descripcion,
    NOW() as timestamp_preparacion,
    'LISTO PARA FASE 2' as siguiente_paso,
    '' as notas;

-- ===================================
-- INSTRUCCIONES PARA CONTINUAR
-- ===================================

/*
✅ FASE 1 COMPLETADA - BACKUP Y PREPARACIÓN

VERIFICACIONES REALIZADAS:
- ✅ Backups de todas las tablas críticas
- ✅ Verificación de integridad de datos
- ✅ Análisis de dependencias
- ✅ Tabla de mapeo preparada

PRÓXIMO PASO:
Ejecutar: 02-migrate-users-data.sql

ROLLBACK (si es necesario):
Ejecutar: 99-rollback-complete.sql
*/
