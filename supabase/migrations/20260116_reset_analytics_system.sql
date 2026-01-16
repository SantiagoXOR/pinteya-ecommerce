-- ===================================
-- REINICIO COMPLETO DEL SISTEMA DE ANALYTICS
-- Fecha: 2026-01-16
-- Objetivo: Limpiar todas las tablas y preparar sistema desde cero
-- ===================================

-- 1. BACKUP DE DATOS EXISTENTES (comentado - ejecutar manualmente si es necesario)
-- Los datos se pueden exportar con:
-- COPY analytics_events TO '/path/to/backup.csv' WITH CSV HEADER;

-- 2. ELIMINAR TRIGGERS OBSOLETOS
DROP TRIGGER IF EXISTS trigger_update_daily_metrics ON analytics_events;

-- 3. LIMPIAR TODAS LAS TABLAS DE ANALYTICS
TRUNCATE TABLE analytics_events CASCADE;
TRUNCATE TABLE analytics_events_optimized CASCADE;
TRUNCATE TABLE analytics_metrics_daily CASCADE;
TRUNCATE TABLE user_interactions CASCADE;

-- 4. ELIMINAR VISTA UNIFICADA (ya no necesaria)
DROP VIEW IF EXISTS analytics_events_unified;

-- 5. CREAR ÍNDICES FALTANTES EN TABLA OPTIMIZADA

-- Índice crítico para queries por fecha (FALTA)
CREATE INDEX IF NOT EXISTS idx_analytics_opt_created_at 
ON analytics_events_optimized(created_at DESC);

-- Índice compuesto para queries comunes de métricas
CREATE INDEX IF NOT EXISTS idx_analytics_opt_event_category_action 
ON analytics_events_optimized(event_type, category_id, action_id, created_at DESC);

-- Índice para análisis de sesiones
CREATE INDEX IF NOT EXISTS idx_analytics_opt_session_created 
ON analytics_events_optimized(session_hash, created_at DESC);

-- 6. VERIFICAR QUE LOS ÍNDICES ESTÁN CREADOS
DO $$
BEGIN
    -- Verificar índices
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'analytics_events_optimized' 
        AND indexname = 'idx_analytics_opt_created_at'
    ) THEN
        RAISE EXCEPTION 'Índice idx_analytics_opt_created_at no fue creado';
    END IF;
    
    RAISE NOTICE '✅ Todos los índices fueron creados correctamente';
END $$;

-- 7. COMENTARIOS
COMMENT ON INDEX idx_analytics_opt_created_at IS 'Índice crítico para queries por fecha - permite búsquedas rápidas por rango de fechas';
COMMENT ON INDEX idx_analytics_opt_event_category_action IS 'Índice compuesto para queries de métricas agrupadas por tipo, categoría y acción';
COMMENT ON INDEX idx_analytics_opt_session_created IS 'Índice para análisis de sesiones de usuario';

-- 8. VERIFICACIÓN FINAL
DO $$
DECLARE
    events_count INTEGER;
    optimized_count INTEGER;
    metrics_count INTEGER;
    interactions_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO events_count FROM analytics_events;
    SELECT COUNT(*) INTO optimized_count FROM analytics_events_optimized;
    SELECT COUNT(*) INTO metrics_count FROM analytics_metrics_daily;
    SELECT COUNT(*) INTO interactions_count FROM user_interactions;
    
    IF events_count > 0 OR optimized_count > 0 OR metrics_count > 0 OR interactions_count > 0 THEN
        RAISE WARNING '⚠️  Algunas tablas aún tienen datos: events=%, optimized=%, metrics=%, interactions=%', 
            events_count, optimized_count, metrics_count, interactions_count;
    ELSE
        RAISE NOTICE '✅ Todas las tablas están limpias';
    END IF;
END $$;
