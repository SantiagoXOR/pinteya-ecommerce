-- ===================================
-- PINTEYA E-COMMERCE - MIGRACIÓN FASE 4: PREFERENCIAS DE USUARIO
-- ===================================
-- Fecha: 13 de Septiembre, 2025
-- Descripción: Crear tabla para gestión de preferencias de usuario

-- Crear tabla de preferencias de usuario
CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    preferences JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraint para asegurar un registro por usuario
    CONSTRAINT user_preferences_user_id_unique UNIQUE (user_id)
);

-- Crear índices para user_preferences
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_updated_at ON user_preferences(updated_at);

-- Crear índices GIN para búsquedas en JSONB
CREATE INDEX IF NOT EXISTS idx_user_preferences_notifications 
ON user_preferences USING GIN ((preferences->'notifications'));

CREATE INDEX IF NOT EXISTS idx_user_preferences_display 
ON user_preferences USING GIN ((preferences->'display'));

CREATE INDEX IF NOT EXISTS idx_user_preferences_privacy 
ON user_preferences USING GIN ((preferences->'privacy'));

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_user_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at
DROP TRIGGER IF EXISTS trigger_update_user_preferences_updated_at ON user_preferences;
CREATE TRIGGER trigger_update_user_preferences_updated_at
    BEFORE UPDATE ON user_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_user_preferences_updated_at();

-- ===================================
-- POLÍTICAS RLS (ROW LEVEL SECURITY)
-- ===================================

-- Habilitar RLS en la tabla
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Política para que los usuarios solo puedan ver sus propias preferencias
CREATE POLICY "Users can view own preferences" ON user_preferences
    FOR SELECT USING (
        auth.uid()::text = user_id::text
    );

-- Política para que los usuarios solo puedan insertar sus propias preferencias
CREATE POLICY "Users can insert own preferences" ON user_preferences
    FOR INSERT WITH CHECK (
        auth.uid()::text = user_id::text
    );

-- Política para que los usuarios solo puedan actualizar sus propias preferencias
CREATE POLICY "Users can update own preferences" ON user_preferences
    FOR UPDATE USING (
        auth.uid()::text = user_id::text
    ) WITH CHECK (
        auth.uid()::text = user_id::text
    );

-- Política para que los usuarios solo puedan eliminar sus propias preferencias
CREATE POLICY "Users can delete own preferences" ON user_preferences
    FOR DELETE USING (
        auth.uid()::text = user_id::text
    );

-- Política para administradores (acceso completo)
CREATE POLICY "Admins have full access to preferences" ON user_preferences
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id::text = auth.uid()::text 
            AND users.role = 'admin'
        )
    );

-- ===================================
-- FUNCIONES AUXILIARES
-- ===================================

-- Función para obtener preferencias con valores por defecto
CREATE OR REPLACE FUNCTION get_user_preferences_with_defaults(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    user_prefs JSONB;
    default_prefs JSONB := '{
        "notifications": {
            "emailNotifications": true,
            "orderUpdates": true,
            "promotions": false,
            "securityAlerts": true,
            "marketingEmails": false,
            "pushNotifications": true,
            "smsNotifications": false
        },
        "display": {
            "language": "es",
            "timezone": "America/Argentina/Buenos_Aires",
            "currency": "ARS",
            "theme": "system"
        },
        "privacy": {
            "profileVisibility": "private",
            "activityTracking": true,
            "marketingConsent": false,
            "dataCollection": true,
            "thirdPartySharing": false,
            "analyticsOptOut": false
        }
    }';
BEGIN
    -- Obtener preferencias del usuario
    SELECT preferences INTO user_prefs
    FROM user_preferences
    WHERE user_id = p_user_id;
    
    -- Si no hay preferencias, devolver las por defecto
    IF user_prefs IS NULL THEN
        RETURN default_prefs;
    END IF;
    
    -- Combinar preferencias del usuario con las por defecto
    RETURN default_prefs || user_prefs;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para validar estructura de preferencias
CREATE OR REPLACE FUNCTION validate_user_preferences(prefs JSONB)
RETURNS BOOLEAN AS $$
BEGIN
    -- Verificar que sea un objeto JSON válido
    IF prefs IS NULL OR jsonb_typeof(prefs) != 'object' THEN
        RETURN FALSE;
    END IF;
    
    -- Verificar secciones principales (opcional, pueden no estar todas)
    IF prefs ? 'notifications' AND jsonb_typeof(prefs->'notifications') != 'object' THEN
        RETURN FALSE;
    END IF;
    
    IF prefs ? 'display' AND jsonb_typeof(prefs->'display') != 'object' THEN
        RETURN FALSE;
    END IF;
    
    IF prefs ? 'privacy' AND jsonb_typeof(prefs->'privacy') != 'object' THEN
        RETURN FALSE;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Trigger para validar preferencias antes de insertar/actualizar
CREATE OR REPLACE FUNCTION validate_preferences_trigger()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT validate_user_preferences(NEW.preferences) THEN
        RAISE EXCEPTION 'Invalid preferences structure';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_validate_preferences ON user_preferences;
CREATE TRIGGER trigger_validate_preferences
    BEFORE INSERT OR UPDATE ON user_preferences
    FOR EACH ROW
    EXECUTE FUNCTION validate_preferences_trigger();

-- ===================================
-- DATOS DE EJEMPLO (OPCIONAL)
-- ===================================

-- Insertar preferencias por defecto para usuarios existentes (opcional)
-- Esto se puede ejecutar manualmente si se desea

/*
INSERT INTO user_preferences (user_id, preferences)
SELECT 
    id,
    '{
        "notifications": {
            "emailNotifications": true,
            "orderUpdates": true,
            "promotions": false,
            "securityAlerts": true,
            "marketingEmails": false,
            "pushNotifications": true,
            "smsNotifications": false
        },
        "display": {
            "language": "es",
            "timezone": "America/Argentina/Buenos_Aires",
            "currency": "ARS",
            "theme": "system"
        },
        "privacy": {
            "profileVisibility": "private",
            "activityTracking": true,
            "marketingConsent": false,
            "dataCollection": true,
            "thirdPartySharing": false,
            "analyticsOptOut": false
        }
    }'::JSONB
FROM users
WHERE NOT EXISTS (
    SELECT 1 FROM user_preferences WHERE user_preferences.user_id = users.id
);
*/

-- ===================================
-- COMENTARIOS Y DOCUMENTACIÓN
-- ===================================

COMMENT ON TABLE user_preferences IS 'Tabla para almacenar las preferencias personalizadas de cada usuario';
COMMENT ON COLUMN user_preferences.user_id IS 'ID del usuario propietario de las preferencias';
COMMENT ON COLUMN user_preferences.preferences IS 'Objeto JSON con todas las preferencias del usuario organizadas por secciones';
COMMENT ON COLUMN user_preferences.created_at IS 'Fecha de creación del registro de preferencias';
COMMENT ON COLUMN user_preferences.updated_at IS 'Fecha de última actualización de las preferencias';

COMMENT ON FUNCTION get_user_preferences_with_defaults(UUID) IS 'Obtiene las preferencias del usuario combinadas con valores por defecto';
COMMENT ON FUNCTION validate_user_preferences(JSONB) IS 'Valida que la estructura de preferencias sea correcta';

-- ===================================
-- TABLA PARA SOLICITUDES DE EXPORTACIÓN DE DATOS
-- ===================================

-- Crear tabla para solicitudes de exportación de datos (GDPR compliance)
CREATE TABLE IF NOT EXISTS data_export_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    format VARCHAR(10) NOT NULL DEFAULT 'json',
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    email_delivery BOOLEAN DEFAULT true,
    file_url TEXT,
    error_message TEXT,
    requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,

    -- Constraints
    CONSTRAINT data_export_requests_format_check CHECK (format IN ('json', 'csv')),
    CONSTRAINT data_export_requests_status_check CHECK (
        status IN ('pending', 'processing', 'completed', 'failed', 'expired')
    )
);

-- Crear índices para data_export_requests
CREATE INDEX IF NOT EXISTS idx_data_export_requests_user_id ON data_export_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_data_export_requests_status ON data_export_requests(status);
CREATE INDEX IF NOT EXISTS idx_data_export_requests_requested_at ON data_export_requests(requested_at);

-- Habilitar RLS en la tabla
ALTER TABLE data_export_requests ENABLE ROW LEVEL SECURITY;

-- Política para que los usuarios solo puedan ver sus propias solicitudes
CREATE POLICY "Users can view own export requests" ON data_export_requests
    FOR SELECT USING (
        auth.uid()::text = user_id::text
    );

-- Política para que los usuarios solo puedan crear sus propias solicitudes
CREATE POLICY "Users can create own export requests" ON data_export_requests
    FOR INSERT WITH CHECK (
        auth.uid()::text = user_id::text
    );

-- Política para administradores (acceso completo)
CREATE POLICY "Admins have full access to export requests" ON data_export_requests
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id::text = auth.uid()::text
            AND users.role = 'admin'
        )
    );

-- Función para limpiar solicitudes expiradas
CREATE OR REPLACE FUNCTION cleanup_expired_export_requests()
RETURNS void AS $$
BEGIN
    UPDATE data_export_requests
    SET status = 'expired'
    WHERE status = 'completed'
    AND expires_at < NOW();

    DELETE FROM data_export_requests
    WHERE status = 'expired'
    AND expires_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Comentarios
COMMENT ON TABLE data_export_requests IS 'Tabla para gestionar solicitudes de exportación de datos personales (GDPR compliance)';
COMMENT ON COLUMN data_export_requests.user_id IS 'ID del usuario que solicita la exportación';
COMMENT ON COLUMN data_export_requests.format IS 'Formato de exportación solicitado (json, csv)';
COMMENT ON COLUMN data_export_requests.status IS 'Estado de la solicitud de exportación';
COMMENT ON COLUMN data_export_requests.email_delivery IS 'Si la exportación debe enviarse por email';
COMMENT ON COLUMN data_export_requests.file_url IS 'URL del archivo exportado (si aplica)';
COMMENT ON COLUMN data_export_requests.expires_at IS 'Fecha de expiración del enlace de descarga';

-- Finalizar migración
SELECT 'Migración de preferencias de usuario y exportación de datos completada exitosamente' as status;
