-- Crear tablas para el sistema de analytics
-- Tabla para eventos de analytics

CREATE TABLE IF NOT EXISTS analytics_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    label VARCHAR(255),
    value DECIMAL(10,2),
    user_id VARCHAR(255),
    session_id VARCHAR(255) NOT NULL,
    page VARCHAR(500),
    user_agent TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_events_category ON analytics_events(category);
CREATE INDEX IF NOT EXISTS idx_analytics_events_action ON analytics_events(action);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_session_id ON analytics_events(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_page ON analytics_events(page);

-- Tabla para interacciones de usuarios (heatmap)
CREATE TABLE IF NOT EXISTS user_interactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    interaction_type VARCHAR(20) NOT NULL CHECK (interaction_type IN ('click', 'hover', 'scroll', 'focus', 'input')),
    element_selector VARCHAR(500),
    x_coordinate INTEGER,
    y_coordinate INTEGER,
    page VARCHAR(500) NOT NULL,
    session_id VARCHAR(255) NOT NULL,
    user_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para interacciones
CREATE INDEX IF NOT EXISTS idx_user_interactions_created_at ON user_interactions(created_at);
CREATE INDEX IF NOT EXISTS idx_user_interactions_page ON user_interactions(page);
CREATE INDEX IF NOT EXISTS idx_user_interactions_session_id ON user_interactions(session_id);
CREATE INDEX IF NOT EXISTS idx_user_interactions_type ON user_interactions(interaction_type);

-- Tabla para métricas agregadas (para performance)
CREATE TABLE IF NOT EXISTS analytics_metrics_daily (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    date DATE NOT NULL,
    page VARCHAR(500),
    category VARCHAR(50),
    total_events INTEGER DEFAULT 0,
    unique_sessions INTEGER DEFAULT 0,
    unique_users INTEGER DEFAULT 0,
    total_page_views INTEGER DEFAULT 0,
    total_interactions INTEGER DEFAULT 0,
    conversion_events INTEGER DEFAULT 0,
    total_revenue DECIMAL(12,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para métricas diarias
CREATE UNIQUE INDEX IF NOT EXISTS idx_analytics_metrics_daily_unique ON analytics_metrics_daily(date, page, category);
CREATE INDEX IF NOT EXISTS idx_analytics_metrics_daily_date ON analytics_metrics_daily(date);

-- Función para actualizar métricas diarias
CREATE OR REPLACE FUNCTION update_daily_metrics()
RETURNS TRIGGER AS $$
BEGIN
    -- Actualizar métricas para el día actual
    INSERT INTO analytics_metrics_daily (
        date, 
        page, 
        category, 
        total_events, 
        unique_sessions, 
        unique_users,
        total_page_views,
        conversion_events,
        updated_at
    )
    SELECT 
        DATE(NEW.created_at) as date,
        NEW.page,
        NEW.category,
        COUNT(*) as total_events,
        COUNT(DISTINCT session_id) as unique_sessions,
        COUNT(DISTINCT user_id) FILTER (WHERE user_id IS NOT NULL) as unique_users,
        COUNT(*) FILTER (WHERE action = 'view') as total_page_views,
        COUNT(*) FILTER (WHERE category = 'ecommerce' AND action IN ('purchase', 'add_to_cart', 'begin_checkout')) as conversion_events,
        NOW() as updated_at
    FROM analytics_events 
    WHERE DATE(created_at) = DATE(NEW.created_at)
        AND page = NEW.page 
        AND category = NEW.category
    GROUP BY DATE(created_at), page, category
    ON CONFLICT (date, page, category) 
    DO UPDATE SET
        total_events = EXCLUDED.total_events,
        unique_sessions = EXCLUDED.unique_sessions,
        unique_users = EXCLUDED.unique_users,
        total_page_views = EXCLUDED.total_page_views,
        conversion_events = EXCLUDED.conversion_events,
        updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar métricas automáticamente
DROP TRIGGER IF EXISTS trigger_update_daily_metrics ON analytics_events;
CREATE TRIGGER trigger_update_daily_metrics
    AFTER INSERT ON analytics_events
    FOR EACH ROW
    EXECUTE FUNCTION update_daily_metrics();

-- Función para limpiar datos antiguos (opcional)
CREATE OR REPLACE FUNCTION cleanup_old_analytics_data()
RETURNS void AS $$
BEGIN
    -- Eliminar eventos más antiguos de 90 días
    DELETE FROM analytics_events 
    WHERE created_at < NOW() - INTERVAL '90 days';
    
    -- Eliminar interacciones más antiguas de 30 días
    DELETE FROM user_interactions 
    WHERE created_at < NOW() - INTERVAL '30 days';
    
    -- Mantener métricas diarias por 1 año
    DELETE FROM analytics_metrics_daily 
    WHERE date < CURRENT_DATE - INTERVAL '1 year';
END;
$$ LANGUAGE plpgsql;

-- Función para obtener métricas de conversión
CREATE OR REPLACE FUNCTION get_conversion_metrics(
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() - INTERVAL '7 days',
    end_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_filter VARCHAR(255) DEFAULT NULL
)
RETURNS TABLE (
    product_views BIGINT,
    cart_additions BIGINT,
    checkout_starts BIGINT,
    checkout_completions BIGINT,
    conversion_rate DECIMAL,
    cart_abandonment_rate DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    WITH metrics AS (
        SELECT 
            COUNT(*) FILTER (WHERE action = 'view_item') as product_views,
            COUNT(*) FILTER (WHERE action = 'add_to_cart') as cart_additions,
            COUNT(*) FILTER (WHERE action = 'begin_checkout') as checkout_starts,
            COUNT(*) FILTER (WHERE action = 'purchase') as checkout_completions
        FROM analytics_events
        WHERE created_at BETWEEN start_date AND end_date
            AND category = 'shop'
            AND (user_filter IS NULL OR user_id = user_filter)
    )
    SELECT 
        m.product_views,
        m.cart_additions,
        m.checkout_starts,
        m.checkout_completions,
        CASE 
            WHEN m.checkout_starts > 0 THEN 
                ROUND((m.checkout_completions::DECIMAL / m.checkout_starts::DECIMAL) * 100, 2)
            ELSE 0 
        END as conversion_rate,
        CASE 
            WHEN m.cart_additions > 0 THEN 
                ROUND(((m.cart_additions - m.checkout_completions)::DECIMAL / m.cart_additions::DECIMAL) * 100, 2)
            ELSE 0 
        END as cart_abandonment_rate
    FROM metrics m;
END;
$$ LANGUAGE plpgsql;

-- Políticas RLS (Row Level Security)
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_metrics_daily ENABLE ROW LEVEL SECURITY;

-- Política para permitir inserción de eventos (cualquier usuario autenticado)
CREATE POLICY "Allow insert analytics events" ON analytics_events
    FOR INSERT WITH CHECK (true);

-- Política para permitir lectura de eventos (solo admins)
CREATE POLICY "Allow read analytics events for admins" ON analytics_events
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid()
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Política para interacciones
CREATE POLICY "Allow insert user interactions" ON user_interactions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow read user interactions for admins" ON user_interactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid()
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Política para métricas diarias
CREATE POLICY "Allow read daily metrics for admins" ON analytics_metrics_daily
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid()
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Comentarios para documentación
COMMENT ON TABLE analytics_events IS 'Almacena todos los eventos de analytics del sistema';
COMMENT ON TABLE user_interactions IS 'Almacena interacciones de usuarios para heatmaps';
COMMENT ON TABLE analytics_metrics_daily IS 'Métricas agregadas por día para performance';
COMMENT ON FUNCTION get_conversion_metrics IS 'Calcula métricas de conversión para un período específico';
