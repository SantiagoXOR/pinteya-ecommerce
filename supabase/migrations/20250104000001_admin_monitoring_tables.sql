-- =====================================================
-- MIGRACIÓN: SISTEMA DE MONITOREO PARA PANEL ADMIN
-- Fecha: 2025-01-04
-- Descripción: Tablas para métricas de performance y alertas de seguridad
-- =====================================================

-- =====================================================
-- 1. TABLA DE MÉTRICAS DE PERFORMANCE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.admin_performance_metrics (
    id SERIAL PRIMARY KEY,
    endpoint VARCHAR(255) NOT NULL,
    method VARCHAR(10) NOT NULL,
    duration_ms INTEGER NOT NULL,
    status_code INTEGER NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    error_message TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Índices para consultas rápidas
    CONSTRAINT admin_performance_metrics_method_check CHECK (method IN ('GET', 'POST', 'PUT', 'DELETE', 'PATCH')),
    CONSTRAINT admin_performance_metrics_status_check CHECK (status_code >= 100 AND status_code < 600),
    CONSTRAINT admin_performance_metrics_duration_check CHECK (duration_ms >= 0)
);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_admin_performance_metrics_timestamp ON public.admin_performance_metrics(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_admin_performance_metrics_endpoint ON public.admin_performance_metrics(endpoint);
CREATE INDEX IF NOT EXISTS idx_admin_performance_metrics_status ON public.admin_performance_metrics(status_code);
CREATE INDEX IF NOT EXISTS idx_admin_performance_metrics_user ON public.admin_performance_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_performance_metrics_duration ON public.admin_performance_metrics(duration_ms);

-- =====================================================
-- 2. TABLA DE ALERTAS DE SEGURIDAD
-- =====================================================

CREATE TABLE IF NOT EXISTS public.admin_security_alerts (
    id SERIAL PRIMARY KEY,
    alert_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    resolved BOOLEAN DEFAULT FALSE,
    resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    resolved_at TIMESTAMP WITH TIME ZONE,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT admin_security_alerts_type_check CHECK (
        alert_type IN ('rate_limit', 'auth_failure', 'permission_denied', 'suspicious_activity', 'data_breach', 'system_error')
    ),
    CONSTRAINT admin_security_alerts_severity_check CHECK (
        severity IN ('low', 'medium', 'high', 'critical')
    )
);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_admin_security_alerts_timestamp ON public.admin_security_alerts(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_admin_security_alerts_type ON public.admin_security_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_admin_security_alerts_severity ON public.admin_security_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_admin_security_alerts_resolved ON public.admin_security_alerts(resolved);

-- =====================================================
-- 3. OPTIMIZACIÓN DE TABLAS EXISTENTES
-- =====================================================

-- Índices para tabla products (optimizar consultas admin)
CREATE INDEX IF NOT EXISTS idx_products_name_search ON public.products USING gin(to_tsvector('spanish', name));
CREATE INDEX IF NOT EXISTS idx_products_description_search ON public.products USING gin(to_tsvector('spanish', description));
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_price ON public.products(price);
CREATE INDEX IF NOT EXISTS idx_products_stock ON public.products(stock);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON public.products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_updated_at ON public.products(updated_at DESC);

-- Índices para tabla categories
CREATE INDEX IF NOT EXISTS idx_categories_name ON public.categories(name);
CREATE INDEX IF NOT EXISTS idx_categories_active ON public.categories(is_active) WHERE is_active = true;

-- Índices para tabla user_profiles (optimizar autenticación)
CREATE INDEX IF NOT EXISTS idx_user_profiles_supabase_user_id ON public.user_profiles(supabase_user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role_id ON public.user_profiles(role_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_active ON public.user_profiles(is_active) WHERE is_active = true;

-- =====================================================
-- 4. FUNCIONES DE UTILIDAD PARA MONITOREO
-- =====================================================

-- Función para obtener estadísticas de performance
CREATE OR REPLACE FUNCTION public.get_admin_performance_stats(
    timeframe_hours INTEGER DEFAULT 24
)
RETURNS TABLE (
    total_requests BIGINT,
    avg_duration NUMERIC,
    error_rate NUMERIC,
    slow_requests BIGINT,
    top_endpoints JSONB
) AS $$
DECLARE
    start_time TIMESTAMP WITH TIME ZONE;
BEGIN
    start_time := NOW() - (timeframe_hours || ' hours')::INTERVAL;
    
    RETURN QUERY
    WITH stats AS (
        SELECT 
            COUNT(*) as total_reqs,
            AVG(duration_ms) as avg_dur,
            COUNT(*) FILTER (WHERE status_code >= 400) as error_count,
            COUNT(*) FILTER (WHERE duration_ms > 2000) as slow_count
        FROM public.admin_performance_metrics 
        WHERE timestamp >= start_time
    ),
    endpoints AS (
        SELECT 
            jsonb_agg(
                jsonb_build_object(
                    'endpoint', endpoint,
                    'method', method,
                    'count', count,
                    'avg_duration', avg_duration,
                    'error_rate', error_rate
                )
                ORDER BY count DESC
            ) as top_eps
        FROM (
            SELECT 
                endpoint,
                method,
                COUNT(*) as count,
                AVG(duration_ms) as avg_duration,
                (COUNT(*) FILTER (WHERE status_code >= 400) * 100.0 / COUNT(*)) as error_rate
            FROM public.admin_performance_metrics 
            WHERE timestamp >= start_time
            GROUP BY endpoint, method
            ORDER BY COUNT(*) DESC
            LIMIT 10
        ) ep
    )
    SELECT 
        s.total_reqs,
        ROUND(s.avg_dur, 2),
        ROUND((s.error_count * 100.0 / NULLIF(s.total_reqs, 0)), 2),
        s.slow_count,
        e.top_eps
    FROM stats s, endpoints e;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- Función para obtener alertas activas por severidad
CREATE OR REPLACE FUNCTION public.get_active_alerts_by_severity()
RETURNS TABLE (
    severity VARCHAR(20),
    count BIGINT,
    latest_alert TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.severity,
        COUNT(*) as count,
        MAX(a.timestamp) as latest_alert
    FROM public.admin_security_alerts a
    WHERE a.resolved = FALSE
    GROUP BY a.severity
    ORDER BY 
        CASE a.severity 
            WHEN 'critical' THEN 1
            WHEN 'high' THEN 2
            WHEN 'medium' THEN 3
            WHEN 'low' THEN 4
        END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- =====================================================
-- 5. POLÍTICAS RLS PARA SEGURIDAD
-- =====================================================

-- Habilitar RLS en las nuevas tablas
ALTER TABLE public.admin_performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_security_alerts ENABLE ROW LEVEL SECURITY;

-- Políticas para métricas de performance (solo admins pueden leer)
CREATE POLICY "Allow admin read admin_performance_metrics" ON public.admin_performance_metrics
    FOR SELECT USING (public.is_admin());

CREATE POLICY "Allow system insert admin_performance_metrics" ON public.admin_performance_metrics
    FOR INSERT WITH CHECK (true); -- Permitir inserción desde el sistema

-- Políticas para alertas de seguridad (solo admins pueden leer y actualizar)
CREATE POLICY "Allow admin read admin_security_alerts" ON public.admin_security_alerts
    FOR SELECT USING (public.is_admin());

CREATE POLICY "Allow admin update admin_security_alerts" ON public.admin_security_alerts
    FOR UPDATE USING (public.is_admin());

CREATE POLICY "Allow system insert admin_security_alerts" ON public.admin_security_alerts
    FOR INSERT WITH CHECK (true); -- Permitir inserción desde el sistema

-- =====================================================
-- 6. TRIGGERS PARA LIMPIEZA AUTOMÁTICA
-- =====================================================

-- Función para limpiar métricas antiguas
CREATE OR REPLACE FUNCTION public.cleanup_old_admin_metrics()
RETURNS void AS $$
BEGIN
    -- Eliminar métricas más antiguas de 30 días
    DELETE FROM public.admin_performance_metrics 
    WHERE timestamp < NOW() - INTERVAL '30 days';
    
    -- Eliminar alertas resueltas más antiguas de 90 días
    DELETE FROM public.admin_security_alerts 
    WHERE resolved = TRUE AND resolved_at < NOW() - INTERVAL '90 days';
    
    -- Log de limpieza
    INSERT INTO public.admin_performance_metrics (
        endpoint, method, duration_ms, status_code, timestamp
    ) VALUES (
        '/system/cleanup', 'SYSTEM', 0, 200, NOW()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- =====================================================
-- 7. COMENTARIOS Y DOCUMENTACIÓN
-- =====================================================

COMMENT ON TABLE public.admin_performance_metrics IS 'Métricas de performance para APIs administrativas';
COMMENT ON TABLE public.admin_security_alerts IS 'Alertas de seguridad para el panel administrativo';
COMMENT ON FUNCTION public.get_admin_performance_stats(INTEGER) IS 'Obtiene estadísticas de performance para un período específico';
COMMENT ON FUNCTION public.get_active_alerts_by_severity() IS 'Obtiene alertas activas agrupadas por severidad';
COMMENT ON FUNCTION public.cleanup_old_admin_metrics() IS 'Limpia métricas y alertas antiguas automáticamente';

-- =====================================================
-- 8. DATOS INICIALES Y CONFIGURACIÓN
-- =====================================================

-- Insertar métrica inicial del sistema
INSERT INTO public.admin_performance_metrics (
    endpoint, method, duration_ms, status_code, timestamp
) VALUES (
    '/system/migration', 'SYSTEM', 0, 200, NOW()
);

-- Insertar alerta inicial de configuración
INSERT INTO public.admin_security_alerts (
    alert_type, severity, message, metadata, timestamp
) VALUES (
    'system_error', 'low', 'Admin monitoring system initialized', 
    '{"migration": "20250104000001_admin_monitoring_tables", "version": "1.0.0"}', 
    NOW()
);
