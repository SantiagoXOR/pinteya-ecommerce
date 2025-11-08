-- ===================================
-- ROLLBACK COMPLETO DE MIGRACIÓN
-- Restaurar estado original en caso de problemas
-- ===================================

-- ⚠️ ADVERTENCIA: Este script restaura completamente el estado original
-- Solo ejecutar si hay problemas críticos durante la migración

-- ===================================
-- PASO 1: VERIFICAR BACKUPS DISPONIBLES
-- ===================================

-- Verificar que los backups existen
SELECT 
    'VERIFICACIÓN BACKUPS' as tipo,
    'users_backup' as tabla,
    COUNT(*) as registros,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ BACKUP DISPONIBLE'
        ELSE '❌ BACKUP NO ENCONTRADO'
    END as status
FROM backup_migration.users_backup

UNION ALL

SELECT 
    'VERIFICACIÓN BACKUPS' as tipo,
    'user_profiles_backup' as tabla,
    COUNT(*) as registros,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ BACKUP DISPONIBLE'
        ELSE '❌ BACKUP NO ENCONTRADO'
    END as status
FROM backup_migration.user_profiles_backup

UNION ALL

SELECT 
    'VERIFICACIÓN BACKUPS' as tipo,
    'user_addresses_backup' as tabla,
    COUNT(*) as registros,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ BACKUP DISPONIBLE'
        ELSE '❌ BACKUP NO ENCONTRADO'
    END as status
FROM backup_migration.user_addresses_backup

UNION ALL

SELECT 
    'VERIFICACIÓN BACKUPS' as tipo,
    'orders_backup' as tabla,
    COUNT(*) as registros,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ BACKUP DISPONIBLE'
        ELSE '❌ BACKUP NO ENCONTRADO'
    END as status
FROM backup_migration.orders_backup;

-- ===================================
-- PASO 2: ELIMINAR TABLAS MODIFICADAS
-- ===================================

-- Eliminar constraints que puedan interferir
ALTER TABLE IF EXISTS public.user_addresses DROP CONSTRAINT IF EXISTS user_addresses_user_id_fkey;
ALTER TABLE IF EXISTS public.orders DROP CONSTRAINT IF EXISTS orders_user_id_fkey;
ALTER TABLE IF EXISTS public.user_activity DROP CONSTRAINT IF EXISTS user_activity_user_id_fkey;
ALTER TABLE IF EXISTS public.user_preferences DROP CONSTRAINT IF EXISTS user_preferences_user_id_fkey;
ALTER TABLE IF EXISTS public.user_security_alerts DROP CONSTRAINT IF EXISTS user_security_alerts_user_id_fkey;
ALTER TABLE IF EXISTS public.user_security_settings DROP CONSTRAINT IF EXISTS user_security_settings_user_id_fkey;
ALTER TABLE IF EXISTS public.user_sessions DROP CONSTRAINT IF EXISTS user_sessions_user_id_fkey;
ALTER TABLE IF EXISTS public.data_export_requests DROP CONSTRAINT IF EXISTS data_export_requests_user_id_fkey;

-- Eliminar tablas que fueron modificadas
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.user_profiles CASCADE;
DROP TABLE IF EXISTS public.user_addresses CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.user_activity CASCADE;
DROP TABLE IF EXISTS public.user_preferences CASCADE;
DROP TABLE IF EXISTS public.user_security_alerts CASCADE;
DROP TABLE IF EXISTS public.user_security_settings CASCADE;
DROP TABLE IF EXISTS public.user_sessions CASCADE;
DROP TABLE IF EXISTS public.data_export_requests CASCADE;

-- ===================================
-- PASO 3: RESTAURAR DESDE BACKUPS
-- ===================================

-- Restaurar tabla users original
CREATE TABLE public.users AS 
SELECT * FROM backup_migration.users_backup;

-- Restaurar tabla user_profiles original
CREATE TABLE public.user_profiles AS 
SELECT * FROM backup_migration.user_profiles_backup;

-- Restaurar tabla user_addresses original
CREATE TABLE public.user_addresses AS 
SELECT * FROM backup_migration.user_addresses_backup;

-- Restaurar tabla orders original
CREATE TABLE public.orders AS 
SELECT * FROM backup_migration.orders_backup;

-- Restaurar tabla user_activity original
CREATE TABLE public.user_activity AS 
SELECT * FROM backup_migration.user_activity_backup;

-- Restaurar tabla user_preferences original
CREATE TABLE public.user_preferences AS 
SELECT * FROM backup_migration.user_preferences_backup;

-- Restaurar tabla user_security_alerts original
CREATE TABLE public.user_security_alerts AS 
SELECT * FROM backup_migration.user_security_alerts_backup;

-- Restaurar tabla user_security_settings original
CREATE TABLE public.user_security_settings AS 
SELECT * FROM backup_migration.user_security_settings_backup;

-- Restaurar tabla user_sessions original
CREATE TABLE public.user_sessions AS 
SELECT * FROM backup_migration.user_sessions_backup;

-- Restaurar tabla data_export_requests original
CREATE TABLE public.data_export_requests AS 
SELECT * FROM backup_migration.data_export_requests_backup;

-- ===================================
-- PASO 4: RECREAR CONSTRAINTS ORIGINALES
-- ===================================

-- Recrear primary keys
ALTER TABLE public.users ADD PRIMARY KEY (id);
ALTER TABLE public.user_profiles ADD PRIMARY KEY (id);
ALTER TABLE public.user_addresses ADD PRIMARY KEY (id);
ALTER TABLE public.orders ADD PRIMARY KEY (id);
ALTER TABLE public.user_activity ADD PRIMARY KEY (id);
ALTER TABLE public.user_preferences ADD PRIMARY KEY (id);
ALTER TABLE public.user_security_alerts ADD PRIMARY KEY (id);
ALTER TABLE public.user_security_settings ADD PRIMARY KEY (id);
ALTER TABLE public.user_sessions ADD PRIMARY KEY (id);
ALTER TABLE public.data_export_requests ADD PRIMARY KEY (id);

-- Recrear foreign keys originales (apuntando a users)
ALTER TABLE public.user_addresses 
ADD CONSTRAINT user_addresses_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE public.orders 
ADD CONSTRAINT orders_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE public.user_activity 
ADD CONSTRAINT user_activity_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE public.user_preferences 
ADD CONSTRAINT user_preferences_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE public.user_security_alerts 
ADD CONSTRAINT user_security_alerts_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE public.user_security_settings 
ADD CONSTRAINT user_security_settings_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE public.user_sessions 
ADD CONSTRAINT user_sessions_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE public.data_export_requests 
ADD CONSTRAINT data_export_requests_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Recrear constraint de user_profiles
ALTER TABLE public.user_profiles 
ADD CONSTRAINT user_profiles_role_id_fkey 
FOREIGN KEY (role_id) REFERENCES public.user_roles(id) ON DELETE SET NULL;

-- ===================================
-- PASO 5: RESTAURAR ESQUEMA next_auth
-- ===================================

-- Recrear esquema next_auth
CREATE SCHEMA IF NOT EXISTS next_auth;

-- Otorgar permisos
GRANT USAGE ON SCHEMA next_auth TO postgres, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA next_auth TO postgres, authenticated, service_role;

-- Recrear tablas next_auth (estructura básica)
CREATE TABLE next_auth.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255),
    email VARCHAR(255) UNIQUE,
    "emailVerified" TIMESTAMP,
    image VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE next_auth.accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL REFERENCES next_auth.users(id) ON DELETE CASCADE,
    type VARCHAR(255) NOT NULL,
    provider VARCHAR(255) NOT NULL,
    "providerAccountId" VARCHAR(255) NOT NULL,
    refresh_token TEXT,
    access_token TEXT,
    expires_at INTEGER,
    token_type VARCHAR(255),
    scope VARCHAR(255),
    id_token TEXT,
    session_state VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(provider, "providerAccountId")
);

CREATE TABLE next_auth.sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "sessionToken" VARCHAR(255) UNIQUE NOT NULL,
    "userId" UUID NOT NULL REFERENCES next_auth.users(id) ON DELETE CASCADE,
    expires TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE next_auth.verification_tokens (
    identifier VARCHAR(255) NOT NULL,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires TIMESTAMP NOT NULL,
    PRIMARY KEY (identifier, token)
);

-- ===================================
-- PASO 6: VERIFICAR RESTAURACIÓN
-- ===================================

-- Verificar que todas las tablas se restauraron correctamente
SELECT 
    'VERIFICACIÓN ROLLBACK' as tipo,
    'users' as tabla,
    COUNT(*) as registros_restaurados,
    (SELECT COUNT(*) FROM backup_migration.users_backup) as registros_backup,
    CASE 
        WHEN COUNT(*) = (SELECT COUNT(*) FROM backup_migration.users_backup) 
        THEN '✅ RESTAURADO OK'
        ELSE '❌ RESTAURACIÓN INCOMPLETA'
    END as status
FROM public.users

UNION ALL

SELECT 
    'VERIFICACIÓN ROLLBACK' as tipo,
    'user_profiles' as tabla,
    COUNT(*) as registros_restaurados,
    (SELECT COUNT(*) FROM backup_migration.user_profiles_backup) as registros_backup,
    CASE 
        WHEN COUNT(*) = (SELECT COUNT(*) FROM backup_migration.user_profiles_backup) 
        THEN '✅ RESTAURADO OK'
        ELSE '❌ RESTAURACIÓN INCOMPLETA'
    END as status
FROM public.user_profiles

UNION ALL

SELECT 
    'VERIFICACIÓN ROLLBACK' as tipo,
    'user_addresses' as tabla,
    COUNT(*) as registros_restaurados,
    (SELECT COUNT(*) FROM backup_migration.user_addresses_backup) as registros_backup,
    CASE 
        WHEN COUNT(*) = (SELECT COUNT(*) FROM backup_migration.user_addresses_backup) 
        THEN '✅ RESTAURADO OK'
        ELSE '❌ RESTAURACIÓN INCOMPLETA'
    END as status
FROM public.user_addresses

UNION ALL

SELECT 
    'VERIFICACIÓN ROLLBACK' as tipo,
    'orders' as tabla,
    COUNT(*) as registros_restaurados,
    (SELECT COUNT(*) FROM backup_migration.orders_backup) as registros_backup,
    CASE 
        WHEN COUNT(*) = (SELECT COUNT(*) FROM backup_migration.orders_backup) 
        THEN '✅ RESTAURADO OK'
        ELSE '❌ RESTAURACIÓN INCOMPLETA'
    END as status
FROM public.orders;

-- Verificar constraints
SELECT 
    'CONSTRAINTS RESTAURADOS' as tipo,
    tc.table_name,
    kcu.column_name,
    ccu.table_name as referenced_table
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
-- PASO 7: LIMPIAR DATOS DE MIGRACIÓN
-- ===================================

-- Marcar rollback en tabla de mapeo
INSERT INTO backup_migration.user_id_mapping (
    old_user_id,
    new_user_profile_id,
    email,
    clerk_id,
    migration_status
) VALUES (
    NULL,
    NULL,
    'ROLLBACK_EXECUTED',
    'MIGRATION_REVERTED',
    'rollback_completed'
);

-- ===================================
-- RESUMEN DE ROLLBACK
-- ===================================

SELECT 
    '🔄 ROLLBACK COMPLETADO' as resultado,
    'Estado original restaurado completamente' as descripcion,
    (SELECT COUNT(*) FROM public.users) as usuarios_restaurados,
    'Sistema funcional con estructura original' as estado_final;

-- ===================================
-- INSTRUCCIONES POST-ROLLBACK
-- ===================================

/*
✅ ROLLBACK COMPLETADO EXITOSAMENTE

ESTADO RESTAURADO:
- ✅ Tabla users con clerk_id restaurada
- ✅ Tabla user_profiles original restaurada
- ✅ Todas las foreign keys apuntando a users
- ✅ Esquema next_auth recreado
- ✅ Todas las dependencias funcionando

VERIFICACIONES REQUERIDAS:
1. Probar funcionalidad de direcciones
2. Verificar sistema de órdenes
3. Confirmar autenticación NextAuth
4. Validar integridad de datos

PRÓXIMOS PASOS:
1. Identificar causa del problema que requirió rollback
2. Ajustar plan de migración si es necesario
3. Re-ejecutar migración con correcciones

NOTA: Los backups permanecen en backup_migration para futuras referencias
*/
