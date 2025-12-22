-- =====================================================
-- MIGRACIÓN: Actualizar estructura de system_settings
-- =====================================================
-- Migra la tabla system_settings del formato antiguo (setting_key, setting_value)
-- al nuevo formato (key, value, category) que espera la API

BEGIN;

-- Verificar si la tabla existe y tiene la estructura antigua
DO $$
BEGIN
    -- Si la tabla no existe, crearla con la nueva estructura directamente
    IF NOT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'system_settings'
    ) THEN
        CREATE TABLE public.system_settings (
            id SERIAL PRIMARY KEY,
            key VARCHAR(100) UNIQUE NOT NULL,
            value JSONB NOT NULL,
            category VARCHAR(50) NOT NULL DEFAULT 'general',
            description TEXT,
            is_public BOOLEAN DEFAULT false,
            updated_by VARCHAR(255),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Habilitar RLS
        ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
        
        -- Crear políticas RLS (se crean después)
        RAISE NOTICE 'Tabla system_settings creada con nueva estructura';
    END IF;
END $$;

-- Si la tabla existe con estructura antigua, migrar
DO $$
DECLARE
    has_old_structure BOOLEAN;
    setting_rec RECORD;
    setting_category VARCHAR(50);
BEGIN
    -- Verificar si tiene la estructura antigua (setting_key)
    SELECT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'system_settings' 
        AND column_name = 'setting_key'
    ) INTO has_old_structure;

    IF has_old_structure THEN
        RAISE NOTICE 'Migrando estructura antigua de system_settings...';

        -- Crear tabla temporal con nueva estructura
        CREATE TEMP TABLE system_settings_new (
            id SERIAL PRIMARY KEY,
            key VARCHAR(100) UNIQUE NOT NULL,
            value JSONB NOT NULL,
            category VARCHAR(50) NOT NULL DEFAULT 'general',
            description TEXT,
            is_public BOOLEAN DEFAULT false,
            updated_by VARCHAR(255),
            created_at TIMESTAMP WITH TIME ZONE,
            updated_at TIMESTAMP WITH TIME ZONE
        );

        -- Migrar datos existentes
        FOR setting_rec IN 
            SELECT id, setting_key, setting_value, description, is_public, created_at, updated_at
            FROM public.system_settings
        LOOP
            -- Determinar categoría basándose en el nombre de la clave
            setting_category := CASE 
                WHEN setting_rec.setting_key LIKE 'site_%' OR 
                     setting_rec.setting_key LIKE 'contact_%' OR
                     setting_rec.setting_key LIKE 'support_%' OR
                     setting_rec.setting_key LIKE 'timezone' OR
                     setting_rec.setting_key LIKE 'currency' OR
                     setting_rec.setting_key LIKE 'language' OR
                     setting_rec.setting_key LIKE 'maintenance_mode' OR
                     setting_rec.setting_key LIKE 'allow_registration' THEN 'general'
                WHEN setting_rec.setting_key LIKE 'tax_%' OR
                     setting_rec.setting_key LIKE 'shipping_%' OR
                     setting_rec.setting_key LIKE 'free_%' OR
                     setting_rec.setting_key LIKE 'inventory_%' OR
                     setting_rec.setting_key LIKE 'low_stock%' OR
                     setting_rec.setting_key LIKE 'allow_backorders' OR
                     setting_rec.setting_key LIKE 'auto_approve_reviews' OR
                     setting_rec.setting_key LIKE 'max_cart%' OR
                     setting_rec.setting_key LIKE 'session_timeout' THEN 'ecommerce'
                WHEN setting_rec.setting_key LIKE '%_enabled' OR
                     setting_rec.setting_key LIKE 'payment_%' OR
                     setting_rec.setting_key LIKE 'stripe_%' OR
                     setting_rec.setting_key LIKE 'paypal_%' OR
                     setting_rec.setting_key LIKE 'mercadopago_%' OR
                     setting_rec.setting_key LIKE 'cash_%' OR
                     setting_rec.setting_key LIKE 'bank_%' THEN 'payments'
                WHEN setting_rec.setting_key LIKE '%_notifications' OR
                     setting_rec.setting_key LIKE 'email_%' OR
                     setting_rec.setting_key LIKE 'sms_%' OR
                     setting_rec.setting_key LIKE 'push_%' OR
                     setting_rec.setting_key LIKE 'order_%' OR
                     setting_rec.setting_key LIKE 'shipping_%' OR
                     setting_rec.setting_key LIKE 'marketing_%' OR
                     setting_rec.setting_key LIKE '%_alerts' OR
                     setting_rec.setting_key LIKE '%_updates' THEN 'notifications'
                WHEN setting_rec.setting_key LIKE 'two_factor%' OR
                     setting_rec.setting_key LIKE 'password_%' OR
                     setting_rec.setting_key LIKE 'session_%' OR
                     setting_rec.setting_key LIKE 'max_login%' OR
                     setting_rec.setting_key LIKE 'lockout_%' OR
                     setting_rec.setting_key LIKE 'require_%' OR
                     setting_rec.setting_key LIKE '%_whitelist' OR
                     setting_rec.setting_key LIKE 'admin_ip%' THEN 'security'
                WHEN setting_rec.setting_key LIKE '%_id' OR
                     setting_rec.setting_key LIKE '%_api_key' OR
                     setting_rec.setting_key LIKE '%_cloud_name' OR
                     setting_rec.setting_key LIKE '%_bucket' OR
                     setting_rec.setting_key LIKE 'google_%' OR
                     setting_rec.setting_key LIKE 'facebook_%' OR
                     setting_rec.setting_key LIKE 'mailchimp_%' OR
                     setting_rec.setting_key LIKE 'sendgrid_%' OR
                     setting_rec.setting_key LIKE 'cloudinary_%' OR
                     setting_rec.setting_key LIKE 'aws_%' THEN 'integrations'
                ELSE 'general'
            END;

            -- Insertar en tabla temporal
            INSERT INTO system_settings_new (
                id, key, value, category, description, is_public, created_at, updated_at
            ) VALUES (
                setting_rec.id,
                setting_rec.setting_key,
                setting_rec.setting_value,
                setting_category,
                setting_rec.description,
                setting_rec.is_public,
                setting_rec.created_at,
                setting_rec.updated_at
            );
        END LOOP;

        -- Eliminar tabla antigua
        DROP TABLE public.system_settings CASCADE;

        -- Renombrar tabla nueva
        ALTER TABLE system_settings_new RENAME TO system_settings;

        -- Mover a esquema public
        ALTER TABLE system_settings SET SCHEMA public;

        -- Recrear secuencia
        CREATE SEQUENCE IF NOT EXISTS system_settings_id_seq OWNED BY system_settings.id;
        ALTER TABLE system_settings ALTER COLUMN id SET DEFAULT nextval('system_settings_id_seq');
        SELECT setval('system_settings_id_seq', (SELECT MAX(id) FROM system_settings));

        RAISE NOTICE 'Migración de datos completada';
    ELSE
        -- Si ya tiene la estructura nueva, solo asegurarnos de que tiene todas las columnas necesarias
        RAISE NOTICE 'La tabla ya tiene la estructura nueva, verificando columnas...';

        -- Agregar columna category si no existe
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'system_settings' 
            AND column_name = 'category'
        ) THEN
            ALTER TABLE public.system_settings 
            ADD COLUMN category VARCHAR(50) NOT NULL DEFAULT 'general';
            RAISE NOTICE 'Columna category agregada';
        END IF;

        -- Agregar columna updated_by si no existe
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'system_settings' 
            AND column_name = 'updated_by'
        ) THEN
            ALTER TABLE public.system_settings 
            ADD COLUMN updated_by VARCHAR(255);
            RAISE NOTICE 'Columna updated_by agregada';
        END IF;
    END IF;
END $$;

-- Recrear políticas RLS
DROP POLICY IF EXISTS "Admin can read all settings" ON public.system_settings;
DROP POLICY IF EXISTS "Only admin can update settings" ON public.system_settings;
DROP POLICY IF EXISTS "Only admin can create settings" ON public.system_settings;
DROP POLICY IF EXISTS "Only admin can delete settings" ON public.system_settings;

-- Habilitar RLS si no está habilitado
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Crear políticas RLS
CREATE POLICY "Admin can read all settings" ON public.system_settings
    FOR SELECT USING (
        is_public = true OR public.has_permission(ARRAY['settings', 'read'])
    );

CREATE POLICY "Only admin can update settings" ON public.system_settings
    FOR UPDATE USING (
        public.has_permission(ARRAY['settings', 'update'])
    );

CREATE POLICY "Only admin can create settings" ON public.system_settings
    FOR INSERT WITH CHECK (
        public.has_permission(ARRAY['settings', 'update'])
    );

CREATE POLICY "Only admin can delete settings" ON public.system_settings
    FOR DELETE USING (
        public.has_permission(ARRAY['settings', 'update'])
    );

-- Crear índice único en key si no existe
CREATE UNIQUE INDEX IF NOT EXISTS system_settings_key_unique 
ON public.system_settings(key);

-- Crear índice en category para mejor rendimiento
CREATE INDEX IF NOT EXISTS system_settings_category_idx 
ON public.system_settings(category);

COMMENT ON TABLE public.system_settings IS 'Configuraciones del sistema - Estructura actualizada con key, value, category';
COMMENT ON COLUMN public.system_settings.key IS 'Clave única de la configuración';
COMMENT ON COLUMN public.system_settings.value IS 'Valor de la configuración en formato JSONB';
COMMENT ON COLUMN public.system_settings.category IS 'Categoría de la configuración (general, ecommerce, payments, notifications, security, integrations)';

COMMIT;
