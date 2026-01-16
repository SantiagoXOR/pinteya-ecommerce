-- ===================================
-- OPTIMIZACIÓN DE QUERIES DE ANALYTICS
-- Fecha: 2026-01-16
-- Objetivo: Crear funciones SQL y materialized views para queries eficientes
-- ===================================

-- 1. FUNCIÓN SQL PARA MÉTRICAS AGREGADAS
-- Calcula métricas directamente en SQL (mucho más rápido que JavaScript)

CREATE OR REPLACE FUNCTION get_analytics_metrics_aggregated(
    p_start_date INTEGER,
    p_end_date INTEGER,
    p_user_id BIGINT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    WITH event_stats AS (
        SELECT 
            -- E-commerce metrics
            COUNT(*) FILTER (WHERE aet.name = 'add_to_cart' OR aa.name = 'add') as cart_additions,
            COUNT(*) FILTER (WHERE aet.name = 'remove_from_cart' OR aa.name = 'remove') as cart_removals,
            COUNT(*) FILTER (WHERE aet.name = 'begin_checkout') as checkout_starts,
            COUNT(*) FILTER (WHERE aet.name = 'purchase') as checkout_completions,
            COUNT(*) FILTER (WHERE aet.name = 'product_view' OR aet.name = 'view_item') as product_views,
            COUNT(*) FILTER (WHERE aet.name = 'view_category') as category_views,
            COUNT(*) FILTER (WHERE aet.name = 'search' OR aet.name = 'search_query') as search_queries,
            
            -- Engagement metrics
            COUNT(DISTINCT aeo.session_hash) as unique_sessions,
            COUNT(DISTINCT aeo.user_id) FILTER (WHERE aeo.user_id IS NOT NULL) as unique_users,
            
            -- Revenue
            SUM(aeo.value) FILTER (WHERE aet.name = 'purchase') as total_revenue,
            AVG(aeo.value) FILTER (WHERE aet.name = 'purchase') as avg_order_value,
            
            -- Total events
            COUNT(*) as total_events
        FROM analytics_events_optimized aeo
        JOIN analytics_event_types aet ON aet.id = aeo.event_type
        JOIN analytics_categories ac ON ac.id = aeo.category_id
        JOIN analytics_actions aa ON aa.id = aeo.action_id
        WHERE aeo.created_at >= p_start_date
          AND aeo.created_at <= p_end_date
          AND (p_user_id IS NULL OR aeo.user_id = p_user_id)
    )
    SELECT jsonb_build_object(
        'ecommerce', jsonb_build_object(
            'cartAdditions', COALESCE(es.cart_additions, 0),
            'cartRemovals', COALESCE(es.cart_removals, 0),
            'checkoutStarts', COALESCE(es.checkout_starts, 0),
            'checkoutCompletions', COALESCE(es.checkout_completions, 0),
            'productViews', COALESCE(es.product_views, 0),
            'categoryViews', COALESCE(es.category_views, 0),
            'searchQueries', COALESCE(es.search_queries, 0),
            'conversionRate', CASE 
                WHEN es.checkout_starts > 0 THEN 
                    ROUND((es.checkout_completions::DECIMAL / es.checkout_starts::DECIMAL) * 100, 2)
                ELSE 0 
            END,
            'cartAbandonmentRate', CASE 
                WHEN es.cart_additions > 0 THEN 
                    ROUND(((es.cart_additions - es.checkout_completions)::DECIMAL / es.cart_additions::DECIMAL) * 100, 2)
                ELSE 0 
            END,
            'productToCartRate', CASE 
                WHEN es.product_views > 0 THEN 
                    ROUND((es.cart_additions::DECIMAL / es.product_views::DECIMAL) * 100, 2)
                ELSE 0 
            END,
            'averageOrderValue', COALESCE(ROUND(es.avg_order_value, 2), 0),
            'totalRevenue', COALESCE(es.total_revenue, 0)
        ),
        'engagement', jsonb_build_object(
            'uniqueSessions', COALESCE(es.unique_sessions, 0),
            'uniqueUsers', COALESCE(es.unique_users, 0),
            'averageEventsPerSession', CASE 
                WHEN es.unique_sessions > 0 THEN 
                    ROUND((es.total_events::DECIMAL / es.unique_sessions::DECIMAL), 2)
                ELSE 0 
            END,
            'totalEvents', COALESCE(es.total_events, 0)
        )
    ) INTO result
    FROM event_stats es;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 2. MATERIALIZED VIEW PARA MÉTRICAS DIARIAS
-- Agregación diaria para queries rápidas

CREATE MATERIALIZED VIEW IF NOT EXISTS analytics_daily_summary AS
SELECT 
    DATE(TO_TIMESTAMP(aeo.created_at)) as date,
    aet.name as event_name,
    ac.name as category,
    aa.name as action,
    COUNT(*) as total_events,
    COUNT(DISTINCT aeo.session_hash) as unique_sessions,
    COUNT(DISTINCT aeo.user_id) FILTER (WHERE aeo.user_id IS NOT NULL) as unique_users,
    SUM(aeo.value) FILTER (WHERE aet.name = 'purchase') as total_revenue,
    COUNT(*) FILTER (WHERE aet.name = 'purchase') as total_purchases
FROM analytics_events_optimized aeo
JOIN analytics_event_types aet ON aet.id = aeo.event_type
JOIN analytics_categories ac ON ac.id = aeo.category_id
JOIN analytics_actions aa ON aa.id = aeo.action_id
GROUP BY DATE(TO_TIMESTAMP(aeo.created_at)), aet.name, ac.name, aa.name;

-- Índice único para la materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_analytics_daily_summary_unique 
ON analytics_daily_summary(date, event_name, category, action);

-- Índice para queries por fecha
CREATE INDEX IF NOT EXISTS idx_analytics_daily_summary_date 
ON analytics_daily_summary(date DESC);

-- 3. FUNCIÓN PARA REFRESCAR MATERIALIZED VIEW
CREATE OR REPLACE FUNCTION refresh_analytics_daily_summary()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY analytics_daily_summary;
END;
$$ LANGUAGE plpgsql;

-- 4. COMENTARIOS
COMMENT ON FUNCTION get_analytics_metrics_aggregated IS 'Calcula métricas de analytics directamente en SQL - mucho más rápido que JavaScript';
COMMENT ON MATERIALIZED VIEW analytics_daily_summary IS 'Vista materializada con métricas diarias agregadas - actualizar con refresh_analytics_daily_summary()';
COMMENT ON FUNCTION refresh_analytics_daily_summary IS 'Refresca la vista materializada de métricas diarias - ejecutar periódicamente (ej: cada noche)';
