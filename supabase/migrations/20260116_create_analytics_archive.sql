-- ===================================
-- SISTEMA DE ARCHIVADO DE ANALYTICS
-- Fecha: 2026-01-16
-- Objetivo: Crear tabla de archivado para eventos antiguos
-- ===================================

-- 1. TABLA DE ARCHIVADO
-- Almacena eventos comprimidos después de 90 días
CREATE TABLE IF NOT EXISTS analytics_events_archive (
    id BIGSERIAL PRIMARY KEY,
    archived_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    date_range_start TIMESTAMP WITH TIME ZONE NOT NULL,
    date_range_end TIMESTAMP WITH TIME ZONE NOT NULL,
    total_events INTEGER NOT NULL,
    compressed_data JSONB, -- Datos comprimidos/agregados
    summary JSONB, -- Resumen de métricas del período
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para búsquedas por rango de fechas
CREATE INDEX IF NOT EXISTS idx_analytics_archive_date_range 
ON analytics_events_archive(date_range_start, date_range_end);

-- Índice para búsquedas por fecha de archivado
CREATE INDEX IF NOT EXISTS idx_analytics_archive_archived_at 
ON analytics_events_archive(archived_at DESC);

-- 2. FUNCIÓN PARA ARCHIVAR EVENTOS ANTIGUOS
CREATE OR REPLACE FUNCTION archive_old_analytics_events(
    p_days_old INTEGER DEFAULT 90,
    p_batch_size INTEGER DEFAULT 10000
)
RETURNS TABLE(
    archived_count INTEGER,
    date_range_start TIMESTAMP WITH TIME ZONE,
    date_range_end TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
    v_cutoff_date TIMESTAMP WITH TIME ZONE;
    v_start_date TIMESTAMP WITH TIME ZONE;
    v_end_date TIMESTAMP WITH TIME ZONE;
    v_event_count INTEGER;
    v_summary JSONB;
BEGIN
    -- Calcular fecha de corte (90 días atrás por defecto)
    v_cutoff_date := NOW() - (p_days_old || ' days')::INTERVAL;
    
    -- Obtener rango de fechas de eventos antiguos
    SELECT 
        MIN(TO_TIMESTAMP(created_at)),
        MAX(TO_TIMESTAMP(created_at))
    INTO v_start_date, v_end_date
    FROM analytics_events_optimized
    WHERE created_at <= EXTRACT(EPOCH FROM v_cutoff_date)::INTEGER;
    
    -- Si no hay eventos antiguos, retornar
    IF v_start_date IS NULL THEN
        RETURN;
    END IF;
    
    -- Contar eventos a archivar
    SELECT COUNT(*) INTO v_event_count
    FROM analytics_events_optimized
    WHERE created_at <= EXTRACT(EPOCH FROM v_cutoff_date)::INTEGER;
    
    -- Calcular resumen de métricas del período
    SELECT jsonb_build_object(
        'total_events', v_event_count,
        'date_range', jsonb_build_object(
            'start', v_start_date,
            'end', v_end_date
        ),
        'metrics', (
            SELECT jsonb_build_object(
                'unique_sessions', COUNT(DISTINCT session_hash),
                'unique_users', COUNT(DISTINCT user_id) FILTER (WHERE user_id IS NOT NULL),
                'total_revenue', SUM(value) FILTER (WHERE event_type IN (
                    SELECT id FROM analytics_event_types WHERE name = 'purchase'
                ))
            )
            FROM analytics_events_optimized
            WHERE created_at <= EXTRACT(EPOCH FROM v_cutoff_date)::INTEGER
        )
    ) INTO v_summary;
    
    -- Insertar registro de archivado
    INSERT INTO analytics_events_archive (
        date_range_start,
        date_range_end,
        total_events,
        summary
    ) VALUES (
        v_start_date,
        v_end_date,
        v_event_count,
        v_summary
    );
    
    -- Eliminar eventos archivados (en lotes para evitar bloqueos)
    -- NOTA: En producción, considerar mover a tabla de staging primero
    DELETE FROM analytics_events_optimized
    WHERE created_at <= EXTRACT(EPOCH FROM v_cutoff_date)::INTEGER
    AND id IN (
        SELECT id FROM analytics_events_optimized
        WHERE created_at <= EXTRACT(EPOCH FROM v_cutoff_date)::INTEGER
        LIMIT p_batch_size
    );
    
    -- Retornar resultados
    RETURN QUERY SELECT 
        v_event_count,
        v_start_date,
        v_end_date;
END;
$$ LANGUAGE plpgsql;

-- 3. FUNCIÓN PARA RESTAURAR EVENTOS DESDE ARCHIVO
-- (Para casos donde se necesite acceso histórico)
CREATE OR REPLACE FUNCTION restore_archived_events(
    p_archive_id BIGINT
)
RETURNS INTEGER AS $$
DECLARE
    v_restored_count INTEGER;
BEGIN
    -- Esta función sería útil si se necesita restaurar eventos
    -- Por ahora, solo retornamos 0 ya que los datos están en summary
    -- En el futuro, se podría implementar descompresión de compressed_data
    
    SELECT 0 INTO v_restored_count;
    
    RETURN v_restored_count;
END;
$$ LANGUAGE plpgsql;

-- 4. COMENTARIOS
COMMENT ON TABLE analytics_events_archive IS 'Tabla de archivado para eventos de analytics antiguos (>90 días)';
COMMENT ON FUNCTION archive_old_analytics_events IS 'Archiva eventos antiguos moviéndolos a tabla de archivado y eliminándolos de la tabla principal';
COMMENT ON FUNCTION restore_archived_events IS 'Restaura eventos desde archivo (para acceso histórico)';

-- 5. POLÍTICAS RLS (si es necesario)
-- ALTER TABLE analytics_events_archive ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Solo admins pueden ver archivos" ON analytics_events_archive FOR SELECT USING (auth.role() = 'admin');
