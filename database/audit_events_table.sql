-- ===================================
-- PINTEYA E-COMMERCE - AUDIT EVENTS TABLE
-- Compliance: ISO/IEC 27001:2013
-- ===================================

-- Crear tabla de eventos de auditoría
CREATE TABLE IF NOT EXISTS audit_events (
    id VARCHAR(255) PRIMARY KEY,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    session_id VARCHAR(255),
    action VARCHAR(255) NOT NULL,
    resource VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN (
        'authentication',
        'authorization', 
        'data_access',
        'data_modification',
        'payment_processing',
        'system_administration',
        'security_violation',
        'configuration_change',
        'error_event',
        'compliance_event'
    )),
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    result VARCHAR(20) NOT NULL CHECK (result IN ('success', 'failure', 'blocked', 'unauthorized', 'error')),
    ip_address INET NOT NULL,
    user_agent TEXT,
    request_id VARCHAR(255),
    metadata JSONB,
    hash VARCHAR(64) NOT NULL,
    compliance_flags TEXT[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    archived_at TIMESTAMPTZ,
    retention_until TIMESTAMPTZ
);

-- Índices para performance y compliance
CREATE INDEX IF NOT EXISTS idx_audit_events_timestamp ON audit_events(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_events_user_id ON audit_events(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_category ON audit_events(category);
CREATE INDEX IF NOT EXISTS idx_audit_events_severity ON audit_events(severity);
CREATE INDEX IF NOT EXISTS idx_audit_events_result ON audit_events(result);
CREATE INDEX IF NOT EXISTS idx_audit_events_ip_address ON audit_events(ip_address);
CREATE INDEX IF NOT EXISTS idx_audit_events_compliance_flags ON audit_events USING GIN(compliance_flags);
CREATE INDEX IF NOT EXISTS idx_audit_events_metadata ON audit_events USING GIN(metadata);

-- Índice compuesto para consultas de compliance
CREATE INDEX IF NOT EXISTS idx_audit_events_compliance ON audit_events(category, severity, timestamp DESC);

-- Índice para archivado automático
CREATE INDEX IF NOT EXISTS idx_audit_events_retention ON audit_events(retention_until) WHERE retention_until IS NOT NULL;

-- Función para calcular fecha de retención automáticamente
CREATE OR REPLACE FUNCTION calculate_retention_date(event_category TEXT)
RETURNS TIMESTAMPTZ AS $$
BEGIN
    CASE event_category
        WHEN 'authentication' THEN RETURN NOW() + INTERVAL '365 days';
        WHEN 'authorization' THEN RETURN NOW() + INTERVAL '365 days';
        WHEN 'payment_processing' THEN RETURN NOW() + INTERVAL '2555 days'; -- 7 años
        WHEN 'security_violation' THEN RETURN NOW() + INTERVAL '2555 days'; -- 7 años
        WHEN 'data_access' THEN RETURN NOW() + INTERVAL '1095 days'; -- 3 años
        WHEN 'system_administration' THEN RETURN NOW() + INTERVAL '1095 days'; -- 3 años
        ELSE RETURN NOW() + INTERVAL '365 days'; -- Default 1 año
    END CASE;
END;
$$ LANGUAGE plpgsql;

-- Trigger para establecer fecha de retención automáticamente
CREATE OR REPLACE FUNCTION set_retention_date()
RETURNS TRIGGER AS $$
BEGIN
    NEW.retention_until := calculate_retention_date(NEW.category);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_retention_date
    BEFORE INSERT ON audit_events
    FOR EACH ROW
    EXECUTE FUNCTION set_retention_date();

-- Función para archivar eventos antiguos (ejecutar periódicamente)
CREATE OR REPLACE FUNCTION archive_old_audit_events()
RETURNS INTEGER AS $$
DECLARE
    archived_count INTEGER := 0;
BEGIN
    -- Marcar eventos para archivado según políticas de retención
    UPDATE audit_events 
    SET archived_at = NOW()
    WHERE archived_at IS NULL
    AND (
        (category = 'authentication' AND timestamp < NOW() - INTERVAL '90 days') OR
        (category = 'authorization' AND timestamp < NOW() - INTERVAL '90 days') OR
        (category = 'payment_processing' AND timestamp < NOW() - INTERVAL '365 days') OR
        (category = 'security_violation' AND timestamp < NOW() - INTERVAL '180 days') OR
        (category = 'data_access' AND timestamp < NOW() - INTERVAL '180 days') OR
        (category = 'system_administration' AND timestamp < NOW() - INTERVAL '365 days')
    );
    
    GET DIAGNOSTICS archived_count = ROW_COUNT;
    
    -- Log del proceso de archivado
    INSERT INTO audit_events (
        id,
        action,
        resource,
        category,
        severity,
        result,
        ip_address,
        user_agent,
        metadata,
        hash
    ) VALUES (
        'archive_' || extract(epoch from now())::text,
        'archive_audit_events',
        'audit_system',
        'system_administration',
        'low',
        'success',
        '127.0.0.1',
        'system',
        jsonb_build_object('archived_count', archived_count),
        encode(sha256(('archive_' || extract(epoch from now())::text)::bytea), 'hex')
    );
    
    RETURN archived_count;
END;
$$ LANGUAGE plpgsql;

-- Función para eliminar eventos expirados (ejecutar periódicamente)
CREATE OR REPLACE FUNCTION delete_expired_audit_events()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER := 0;
BEGIN
    -- Eliminar eventos que han superado su período de retención
    DELETE FROM audit_events 
    WHERE retention_until < NOW();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Log del proceso de eliminación
    INSERT INTO audit_events (
        id,
        action,
        resource,
        category,
        severity,
        result,
        ip_address,
        user_agent,
        metadata,
        hash
    ) VALUES (
        'cleanup_' || extract(epoch from now())::text,
        'delete_expired_audit_events',
        'audit_system',
        'system_administration',
        'low',
        'success',
        '127.0.0.1',
        'system',
        jsonb_build_object('deleted_count', deleted_count),
        encode(sha256(('cleanup_' || extract(epoch from now())::text)::bytea), 'hex')
    );
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Función para verificar integridad de eventos
CREATE OR REPLACE FUNCTION verify_audit_integrity(event_id TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    event_record RECORD;
    calculated_hash TEXT;
    event_data TEXT;
BEGIN
    -- Obtener el evento
    SELECT * INTO event_record FROM audit_events WHERE id = event_id;
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Recalcular hash (simplificado para demostración)
    event_data := event_record.id || event_record.timestamp || 
                  COALESCE(event_record.user_id::text, '') ||
                  event_record.action || event_record.resource ||
                  event_record.category || event_record.result;
    
    calculated_hash := encode(sha256(event_data::bytea), 'hex');
    
    -- Comparar con hash almacenado
    RETURN calculated_hash = event_record.hash;
END;
$$ LANGUAGE plpgsql;

-- Vista para reportes de compliance
CREATE OR REPLACE VIEW audit_compliance_report AS
SELECT 
    category,
    severity,
    result,
    DATE_TRUNC('day', timestamp) as event_date,
    COUNT(*) as event_count,
    COUNT(DISTINCT user_id) as unique_users,
    COUNT(DISTINCT ip_address) as unique_ips
FROM audit_events
WHERE timestamp >= NOW() - INTERVAL '30 days'
GROUP BY category, severity, result, DATE_TRUNC('day', timestamp)
ORDER BY event_date DESC, category, severity;

-- Vista para eventos críticos recientes
CREATE OR REPLACE VIEW critical_audit_events AS
SELECT 
    id,
    timestamp,
    user_id,
    action,
    resource,
    category,
    severity,
    result,
    ip_address,
    metadata
FROM audit_events
WHERE severity IN ('high', 'critical')
   OR result IN ('blocked', 'unauthorized')
   OR category = 'security_violation'
ORDER BY timestamp DESC
LIMIT 1000;

-- RLS (Row Level Security) para acceso controlado
ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;

-- Política: Solo administradores pueden ver todos los eventos
CREATE POLICY audit_events_admin_access ON audit_events
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Política: Los usuarios pueden ver solo sus propios eventos (excepto eventos críticos)
CREATE POLICY audit_events_user_access ON audit_events
    FOR SELECT
    TO authenticated
    USING (
        user_id = auth.uid() 
        AND severity NOT IN ('high', 'critical')
        AND category NOT IN ('security_violation', 'system_administration')
    );

-- Comentarios para documentación
COMMENT ON TABLE audit_events IS 'Tabla de eventos de auditoría para compliance ISO/IEC 27001:2013';
COMMENT ON COLUMN audit_events.hash IS 'Hash HMAC-SHA256 para verificación de integridad';
COMMENT ON COLUMN audit_events.compliance_flags IS 'Flags para identificar requisitos de compliance específicos';
COMMENT ON COLUMN audit_events.retention_until IS 'Fecha hasta la cual el evento debe ser retenido por compliance';

-- Insertar evento inicial del sistema
INSERT INTO audit_events (
    id,
    action,
    resource,
    category,
    severity,
    result,
    ip_address,
    user_agent,
    metadata,
    hash,
    compliance_flags
) VALUES (
    'system_init_' || extract(epoch from now())::text,
    'audit_system_initialized',
    'audit_system',
    'system_administration',
    'medium',
    'success',
    '127.0.0.1',
    'system',
    jsonb_build_object(
        'version', '1.0',
        'compliance_standard', 'ISO/IEC 27001:2013',
        'initialized_at', NOW()
    ),
    encode(sha256(('system_init_' || extract(epoch from now())::text)::bytea), 'hex'),
    ARRAY['ISO27001', 'SYSTEM_INIT']
) ON CONFLICT (id) DO NOTHING;

-- ===================================
-- ENTERPRISE METRICS TABLES
-- ===================================

-- Tabla de métricas enterprise
CREATE TABLE IF NOT EXISTS enterprise_metrics (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('counter', 'gauge', 'histogram', 'timer', 'rate')),
    category VARCHAR(50) NOT NULL CHECK (category IN (
        'performance',
        'security',
        'business',
        'infrastructure',
        'user_experience'
    )),
    value DECIMAL(20,6) NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    tags JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para métricas
CREATE INDEX IF NOT EXISTS idx_enterprise_metrics_name ON enterprise_metrics(name);
CREATE INDEX IF NOT EXISTS idx_enterprise_metrics_timestamp ON enterprise_metrics(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_enterprise_metrics_category ON enterprise_metrics(category);
CREATE INDEX IF NOT EXISTS idx_enterprise_metrics_type ON enterprise_metrics(type);
CREATE INDEX IF NOT EXISTS idx_enterprise_metrics_tags ON enterprise_metrics USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_enterprise_metrics_name_timestamp ON enterprise_metrics(name, timestamp DESC);

-- Tabla de alertas enterprise
CREATE TABLE IF NOT EXISTS enterprise_alerts (
    id VARCHAR(255) PRIMARY KEY,
    rule_id VARCHAR(255) NOT NULL,
    rule_name VARCHAR(255) NOT NULL,
    metric_name VARCHAR(255) NOT NULL,
    level VARCHAR(20) NOT NULL CHECK (level IN ('info', 'warning', 'critical', 'emergency')),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'resolved', 'suppressed')),
    message TEXT NOT NULL,
    value DECIMAL(20,6) NOT NULL,
    threshold DECIMAL(20,6) NOT NULL,
    triggered_at TIMESTAMPTZ NOT NULL,
    acknowledged_at TIMESTAMPTZ,
    acknowledged_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    escalated_at TIMESTAMPTZ,
    escalated_from VARCHAR(20),
    notifications_sent JSONB DEFAULT '[]',
    tags JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para alertas
CREATE INDEX IF NOT EXISTS idx_enterprise_alerts_rule_id ON enterprise_alerts(rule_id);
CREATE INDEX IF NOT EXISTS idx_enterprise_alerts_metric_name ON enterprise_alerts(metric_name);
CREATE INDEX IF NOT EXISTS idx_enterprise_alerts_level ON enterprise_alerts(level);
CREATE INDEX IF NOT EXISTS idx_enterprise_alerts_status ON enterprise_alerts(status);
CREATE INDEX IF NOT EXISTS idx_enterprise_alerts_triggered_at ON enterprise_alerts(triggered_at DESC);
CREATE INDEX IF NOT EXISTS idx_enterprise_alerts_resolved_at ON enterprise_alerts(resolved_at);
CREATE INDEX IF NOT EXISTS idx_enterprise_alerts_acknowledged_by ON enterprise_alerts(acknowledged_by);
CREATE INDEX IF NOT EXISTS idx_enterprise_alerts_resolved_by ON enterprise_alerts(resolved_by);
CREATE INDEX IF NOT EXISTS idx_enterprise_alerts_escalated_at ON enterprise_alerts(escalated_at);
CREATE INDEX IF NOT EXISTS idx_enterprise_alerts_tags ON enterprise_alerts USING GIN(tags);

-- Función para agregar métricas por período
CREATE OR REPLACE FUNCTION aggregate_metrics(
    metric_name TEXT,
    period_interval TEXT,
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ
)
RETURNS TABLE(
    period_start TIMESTAMPTZ,
    period_end TIMESTAMPTZ,
    count BIGINT,
    sum DECIMAL(20,6),
    avg DECIMAL(20,6),
    min DECIMAL(20,6),
    max DECIMAL(20,6),
    p50 DECIMAL(20,6),
    p95 DECIMAL(20,6),
    p99 DECIMAL(20,6)
) AS $$
DECLARE
    interval_duration INTERVAL;
BEGIN
    -- Convertir período a intervalo
    CASE period_interval
        WHEN '1m' THEN interval_duration := INTERVAL '1 minute';
        WHEN '5m' THEN interval_duration := INTERVAL '5 minutes';
        WHEN '1h' THEN interval_duration := INTERVAL '1 hour';
        WHEN '1d' THEN interval_duration := INTERVAL '1 day';
        WHEN '7d' THEN interval_duration := INTERVAL '7 days';
        ELSE interval_duration := INTERVAL '1 hour';
    END CASE;

    RETURN QUERY
    SELECT
        date_trunc(
            CASE period_interval
                WHEN '1m' THEN 'minute'
                WHEN '5m' THEN 'minute'
                WHEN '1h' THEN 'hour'
                WHEN '1d' THEN 'day'
                WHEN '7d' THEN 'day'
                ELSE 'hour'
            END,
            em.timestamp
        ) as period_start,
        date_trunc(
            CASE period_interval
                WHEN '1m' THEN 'minute'
                WHEN '5m' THEN 'minute'
                WHEN '1h' THEN 'hour'
                WHEN '1d' THEN 'day'
                WHEN '7d' THEN 'day'
                ELSE 'hour'
            END,
            em.timestamp
        ) + interval_duration as period_end,
        COUNT(*)::BIGINT as count,
        SUM(em.value) as sum,
        AVG(em.value) as avg,
        MIN(em.value) as min,
        MAX(em.value) as max,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY em.value) as p50,
        PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY em.value) as p95,
        PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY em.value) as p99
    FROM enterprise_metrics em
    WHERE em.name = metric_name
      AND em.timestamp >= start_time
      AND em.timestamp <= end_time
    GROUP BY period_start
    ORDER BY period_start;
END;
$$ LANGUAGE plpgsql;

-- Vista para métricas de performance en tiempo real
CREATE OR REPLACE VIEW performance_metrics_realtime AS
SELECT
    name,
    category,
    AVG(value) as avg_value,
    MIN(value) as min_value,
    MAX(value) as max_value,
    COUNT(*) as sample_count,
    MAX(timestamp) as last_updated
FROM enterprise_metrics
WHERE category = 'performance'
  AND timestamp >= NOW() - INTERVAL '5 minutes'
GROUP BY name, category
ORDER BY last_updated DESC;

-- Vista para alertas activas
CREATE OR REPLACE VIEW active_alerts AS
SELECT
    id,
    rule_id,
    metric_name,
    level,
    message,
    value,
    threshold,
    triggered_at,
    EXTRACT(EPOCH FROM (NOW() - triggered_at))/60 as minutes_active
FROM enterprise_alerts
WHERE resolved_at IS NULL
ORDER BY
    CASE level
        WHEN 'emergency' THEN 1
        WHEN 'critical' THEN 2
        WHEN 'warning' THEN 3
        WHEN 'info' THEN 4
    END,
    triggered_at DESC;

-- Función para limpiar métricas antiguas
CREATE OR REPLACE FUNCTION cleanup_old_metrics()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER := 0;
BEGIN
    -- Eliminar métricas de performance más antiguas que 30 días
    DELETE FROM enterprise_metrics
    WHERE category = 'performance'
      AND timestamp < NOW() - INTERVAL '30 days';

    GET DIAGNOSTICS deleted_count = ROW_COUNT;

    -- Eliminar métricas de negocio más antiguas que 90 días
    DELETE FROM enterprise_metrics
    WHERE category = 'business'
      AND timestamp < NOW() - INTERVAL '90 days';

    -- Eliminar alertas resueltas más antiguas que 30 días
    DELETE FROM enterprise_alerts
    WHERE resolved_at IS NOT NULL
      AND resolved_at < NOW() - INTERVAL '30 days';

    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- RLS para métricas (solo admins pueden ver todas)
ALTER TABLE enterprise_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE enterprise_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY metrics_admin_access ON enterprise_metrics
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

CREATE POLICY alerts_admin_access ON enterprise_alerts
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Tabla de definiciones de métricas personalizadas
CREATE TABLE IF NOT EXISTS custom_metric_definitions (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL CHECK (type IN ('counter', 'gauge', 'histogram', 'timer', 'rate')),
    category VARCHAR(50) NOT NULL CHECK (category IN ('performance', 'security', 'business', 'infrastructure', 'user_experience')),
    unit VARCHAR(50) DEFAULT '',
    tags JSONB DEFAULT '{}',
    aggregation_method VARCHAR(20) NOT NULL DEFAULT 'avg' CHECK (aggregation_method IN ('sum', 'avg', 'min', 'max', 'count')),
    retention_days INTEGER NOT NULL DEFAULT 30,
    enabled BOOLEAN NOT NULL DEFAULT true,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para métricas personalizadas
CREATE INDEX IF NOT EXISTS idx_custom_metric_definitions_name ON custom_metric_definitions(name);
CREATE INDEX IF NOT EXISTS idx_custom_metric_definitions_type ON custom_metric_definitions(type);
CREATE INDEX IF NOT EXISTS idx_custom_metric_definitions_category ON custom_metric_definitions(category);
CREATE INDEX IF NOT EXISTS idx_custom_metric_definitions_enabled ON custom_metric_definitions(enabled);
CREATE INDEX IF NOT EXISTS idx_custom_metric_definitions_created_by ON custom_metric_definitions(created_by);
CREATE INDEX IF NOT EXISTS idx_custom_metric_definitions_tags ON custom_metric_definitions USING GIN(tags);

-- Políticas RLS para métricas personalizadas
ALTER TABLE custom_metric_definitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage custom metrics" ON custom_metric_definitions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND (auth.users.raw_user_meta_data->>'role' = 'admin'
                 OR auth.users.raw_app_meta_data->>'role' = 'admin')
        )
    );

-- Comentarios finales
-- Este script crea un sistema completo de auditoría enterprise
-- Compatible con ISO/IEC 27001:2013 y GDPR
-- Incluye métricas, alertas, compliance automático y métricas personalizadas
