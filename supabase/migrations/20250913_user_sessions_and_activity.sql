-- ===================================
-- PINTEYA E-COMMERCE - MIGRACIÓN FASE 3: SESIONES Y SEGURIDAD
-- ===================================
-- Fecha: 13 de Septiembre, 2025
-- Descripción: Crear tablas para gestión de sesiones de usuario, actividad y configuración de seguridad

-- Crear tabla de sesiones de usuario
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    device_type VARCHAR(50) NOT NULL DEFAULT 'desktop',
    device_name VARCHAR(255) NOT NULL,
    browser VARCHAR(100) NOT NULL,
    os VARCHAR(100) NOT NULL,
    ip_address INET NOT NULL,
    location VARCHAR(255),
    user_agent TEXT NOT NULL,
    is_trusted BOOLEAN DEFAULT FALSE,
    last_activity TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Índices para performance
    CONSTRAINT user_sessions_device_type_check CHECK (device_type IN ('desktop', 'mobile', 'tablet'))
);

-- Crear índices para user_sessions
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_last_activity ON user_sessions(last_activity);
CREATE INDEX IF NOT EXISTS idx_user_sessions_ip_address ON user_sessions(ip_address);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_agent ON user_sessions USING hash(user_agent);

-- Crear tabla de actividad de usuario
CREATE TABLE IF NOT EXISTS user_activity (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    description TEXT,
    metadata JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraint para categorías válidas
    CONSTRAINT user_activity_category_check CHECK (
        category IN ('auth', 'profile', 'order', 'security', 'session', 'preference')
    )
);

-- Crear índices para user_activity
CREATE INDEX IF NOT EXISTS idx_user_activity_user_id ON user_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_category ON user_activity(category);
CREATE INDEX IF NOT EXISTS idx_user_activity_action ON user_activity(action);
CREATE INDEX IF NOT EXISTS idx_user_activity_created_at ON user_activity(created_at);
CREATE INDEX IF NOT EXISTS idx_user_activity_metadata ON user_activity USING gin(metadata);

-- Crear tabla de configuración de seguridad
CREATE TABLE IF NOT EXISTS user_security_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    login_alerts BOOLEAN DEFAULT TRUE,
    suspicious_activity_alerts BOOLEAN DEFAULT TRUE,
    new_device_alerts BOOLEAN DEFAULT TRUE,
    password_change_alerts BOOLEAN DEFAULT TRUE,
    trusted_devices_only BOOLEAN DEFAULT FALSE,
    session_timeout INTEGER DEFAULT 43200, -- 30 días en minutos
    max_concurrent_sessions INTEGER DEFAULT 5,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints para validación
    CONSTRAINT user_security_settings_session_timeout_check CHECK (
        session_timeout >= 1 AND session_timeout <= 43200
    ),
    CONSTRAINT user_security_settings_max_sessions_check CHECK (
        max_concurrent_sessions >= 1 AND max_concurrent_sessions <= 20
    )
);

-- Crear índice para user_security_settings
CREATE INDEX IF NOT EXISTS idx_user_security_settings_user_id ON user_security_settings(user_id);

-- Crear tabla de alertas de seguridad
CREATE TABLE IF NOT EXISTS user_security_alerts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL DEFAULT 'medium',
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    metadata JSONB,
    is_read BOOLEAN DEFAULT FALSE,
    is_resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    
    -- Constraints para validación
    CONSTRAINT user_security_alerts_type_check CHECK (
        type IN ('login', 'suspicious_activity', 'new_device', 'password_change', 'session_timeout')
    ),
    CONSTRAINT user_security_alerts_severity_check CHECK (
        severity IN ('low', 'medium', 'high', 'critical')
    )
);

-- Crear índices para user_security_alerts
CREATE INDEX IF NOT EXISTS idx_user_security_alerts_user_id ON user_security_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_security_alerts_type ON user_security_alerts(type);
CREATE INDEX IF NOT EXISTS idx_user_security_alerts_severity ON user_security_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_user_security_alerts_is_resolved ON user_security_alerts(is_resolved);
CREATE INDEX IF NOT EXISTS idx_user_security_alerts_created_at ON user_security_alerts(created_at);

-- ===================================
-- POLÍTICAS RLS (Row Level Security)
-- ===================================

-- Habilitar RLS en todas las tablas
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_security_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_security_alerts ENABLE ROW LEVEL SECURITY;

-- Políticas para user_sessions
CREATE POLICY "Users can view their own sessions" ON user_sessions
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own sessions" ON user_sessions
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own sessions" ON user_sessions
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own sessions" ON user_sessions
    FOR DELETE USING (user_id = auth.uid());

-- Políticas para user_activity
CREATE POLICY "Users can view their own activity" ON user_activity
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own activity" ON user_activity
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Políticas para user_security_settings
CREATE POLICY "Users can view their own security settings" ON user_security_settings
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own security settings" ON user_security_settings
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own security settings" ON user_security_settings
    FOR UPDATE USING (user_id = auth.uid());

-- Políticas para user_security_alerts
CREATE POLICY "Users can view their own security alerts" ON user_security_alerts
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own security alerts" ON user_security_alerts
    FOR UPDATE USING (user_id = auth.uid());

-- ===================================
-- FUNCIONES Y TRIGGERS
-- ===================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para user_security_settings
CREATE TRIGGER update_user_security_settings_updated_at
    BEFORE UPDATE ON user_security_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Función para limpiar sesiones expiradas
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Eliminar sesiones inactivas por más de 30 días
    DELETE FROM user_sessions 
    WHERE last_activity < NOW() - INTERVAL '30 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Función para limpiar actividad antigua
CREATE OR REPLACE FUNCTION cleanup_old_activity()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Eliminar actividad de más de 90 días
    DELETE FROM user_activity 
    WHERE created_at < NOW() - INTERVAL '90 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Función para detectar actividad sospechosa
CREATE OR REPLACE FUNCTION detect_suspicious_activity()
RETURNS TRIGGER AS $$
DECLARE
    recent_ips INTEGER;
    recent_devices INTEGER;
    user_settings RECORD;
BEGIN
    -- Obtener configuración de seguridad del usuario
    SELECT * INTO user_settings 
    FROM user_security_settings 
    WHERE user_id = NEW.user_id;
    
    -- Si no hay configuración, usar valores por defecto
    IF user_settings IS NULL THEN
        INSERT INTO user_security_settings (user_id) VALUES (NEW.user_id);
        SELECT * INTO user_settings 
        FROM user_security_settings 
        WHERE user_id = NEW.user_id;
    END IF;
    
    -- Verificar múltiples IPs en las últimas 24 horas
    SELECT COUNT(DISTINCT ip_address) INTO recent_ips
    FROM user_sessions 
    WHERE user_id = NEW.user_id 
    AND last_activity > NOW() - INTERVAL '24 hours';
    
    -- Verificar múltiples dispositivos en las últimas 24 horas
    SELECT COUNT(DISTINCT device_name) INTO recent_devices
    FROM user_sessions 
    WHERE user_id = NEW.user_id 
    AND last_activity > NOW() - INTERVAL '24 hours';
    
    -- Crear alerta si hay actividad sospechosa
    IF recent_ips > 3 AND user_settings.suspicious_activity_alerts THEN
        INSERT INTO user_security_alerts (
            user_id, type, severity, title, description, metadata
        ) VALUES (
            NEW.user_id,
            'suspicious_activity',
            'medium',
            'Múltiples ubicaciones detectadas',
            'Se han detectado inicios de sesión desde múltiples ubicaciones en las últimas 24 horas.',
            jsonb_build_object('ip_count', recent_ips, 'trigger', 'multiple_ips')
        );
    END IF;
    
    IF recent_devices > 5 AND user_settings.suspicious_activity_alerts THEN
        INSERT INTO user_security_alerts (
            user_id, type, severity, title, description, metadata
        ) VALUES (
            NEW.user_id,
            'suspicious_activity',
            'high',
            'Múltiples dispositivos detectados',
            'Se han detectado inicios de sesión desde múltiples dispositivos en las últimas 24 horas.',
            jsonb_build_object('device_count', recent_devices, 'trigger', 'multiple_devices')
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para detectar actividad sospechosa en nuevas sesiones
CREATE TRIGGER detect_suspicious_activity_trigger
    AFTER INSERT ON user_sessions
    FOR EACH ROW
    EXECUTE FUNCTION detect_suspicious_activity();

-- ===================================
-- DATOS INICIALES
-- ===================================

-- Insertar configuración de seguridad por defecto para usuarios existentes
INSERT INTO user_security_settings (user_id)
SELECT id FROM users 
WHERE id NOT IN (SELECT user_id FROM user_security_settings)
ON CONFLICT (user_id) DO NOTHING;

-- ===================================
-- COMENTARIOS Y DOCUMENTACIÓN
-- ===================================

COMMENT ON TABLE user_sessions IS 'Tabla para gestionar sesiones activas de usuarios';
COMMENT ON TABLE user_activity IS 'Tabla para registrar actividad de usuarios';
COMMENT ON TABLE user_security_settings IS 'Tabla para configuración de seguridad de usuarios';
COMMENT ON TABLE user_security_alerts IS 'Tabla para alertas de seguridad de usuarios';

COMMENT ON COLUMN user_sessions.device_type IS 'Tipo de dispositivo: desktop, mobile, tablet';
COMMENT ON COLUMN user_sessions.is_trusted IS 'Indica si el dispositivo es marcado como confiable';
COMMENT ON COLUMN user_activity.category IS 'Categoría de actividad: auth, profile, order, security, session, preference';
COMMENT ON COLUMN user_security_settings.session_timeout IS 'Timeout de sesión en minutos (1-43200)';
COMMENT ON COLUMN user_security_settings.max_concurrent_sessions IS 'Máximo de sesiones concurrentes (1-20)';
COMMENT ON COLUMN user_security_alerts.severity IS 'Severidad de la alerta: low, medium, high, critical';
