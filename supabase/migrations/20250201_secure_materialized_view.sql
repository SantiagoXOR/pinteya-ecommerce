-- Migration: Secure Materialized View Access
-- Date: 2025-02-01
-- Description: Asegura el acceso a la vista materializada analytics_daily_stats con políticas RLS apropiadas

-- =====================================================
-- VISTA MATERIALIZADA: analytics_daily_stats
-- =====================================================

-- Habilitar RLS en la vista materializada
ALTER MATERIALIZED VIEW public.analytics_daily_stats ENABLE ROW LEVEL SECURITY;

-- Política para analytics_daily_stats: solo admins pueden acceder a estadísticas agregadas
CREATE POLICY "analytics_daily_stats_admin_only" ON public.analytics_daily_stats
    FOR SELECT USING (
        (SELECT role FROM public.users WHERE id::text = auth.uid()::text) = 'admin'
    );

-- =====================================================
-- FUNCIÓN DE ACTUALIZACIÓN SEGURA
-- =====================================================

-- Crear función para refrescar la vista materializada de forma segura
CREATE OR REPLACE FUNCTION public.refresh_analytics_daily_stats()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    -- Solo admins pueden refrescar las estadísticas
    IF (SELECT role FROM public.users WHERE id::text = auth.uid()::text) != 'admin' THEN
        RAISE EXCEPTION 'Solo administradores pueden refrescar las estadísticas diarias';
    END IF;
    
    -- Refrescar la vista materializada
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.analytics_daily_stats;
    
    -- Log de la operación
    INSERT INTO public.analytics_events_optimized (
        event_type,
        user_id,
        metadata,
        created_at
    ) VALUES (
        'materialized_view_refresh',
        (auth.uid())::bigint,
        json_build_object(
            'view_name', 'analytics_daily_stats',
            'refresh_time', CURRENT_TIMESTAMP,
            'admin_user', auth.uid()
        ),
        CURRENT_TIMESTAMP
    );
END;
$$;

-- =====================================================
-- PERMISOS Y GRANTS
-- =====================================================

-- Revocar acceso público a la vista materializada
REVOKE ALL ON public.analytics_daily_stats FROM PUBLIC;
REVOKE ALL ON public.analytics_daily_stats FROM anon;
REVOKE ALL ON public.analytics_daily_stats FROM authenticated;

-- Otorgar acceso solo a roles específicos
GRANT SELECT ON public.analytics_daily_stats TO authenticated;

-- Permisos para la función de refresh
REVOKE ALL ON FUNCTION public.refresh_analytics_daily_stats() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.refresh_analytics_daily_stats() TO authenticated;

-- =====================================================
-- ÍNDICES DE SEGURIDAD Y PERFORMANCE
-- =====================================================

-- Crear índice para optimizar las consultas de políticas RLS
CREATE INDEX IF NOT EXISTS idx_analytics_daily_stats_security 
ON public.analytics_daily_stats (date);

-- =====================================================
-- TRIGGER PARA ACTUALIZACIÓN AUTOMÁTICA
-- =====================================================

-- Crear función trigger para actualización automática nocturna
CREATE OR REPLACE FUNCTION public.auto_refresh_analytics_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    -- Solo ejecutar si es una inserción significativa (más de 100 eventos por día)
    IF (SELECT COUNT(*) FROM public.analytics_events_optimized 
        WHERE DATE(created_at) = CURRENT_DATE) > 100 THEN
        
        -- Programar refresh para la próxima hora (usando pg_cron si está disponible)
        -- Por ahora, solo registramos la necesidad de refresh
        INSERT INTO public.analytics_events_optimized (
            event_type,
            user_id,
            metadata,
            created_at
        ) VALUES (
            'refresh_needed',
            NULL,
            json_build_object(
                'view_name', 'analytics_daily_stats',
                'trigger_reason', 'high_volume_events',
                'event_count', (SELECT COUNT(*) FROM public.analytics_events_optimized 
                               WHERE DATE(created_at) = CURRENT_DATE)
            ),
            CURRENT_TIMESTAMP
        );
    END IF;
    
    RETURN NEW;
END;
$$;

-- Crear trigger en la tabla de eventos
DROP TRIGGER IF EXISTS trigger_auto_refresh_analytics ON public.analytics_events_optimized;
CREATE TRIGGER trigger_auto_refresh_analytics
    AFTER INSERT ON public.analytics_events_optimized
    FOR EACH ROW
    EXECUTE FUNCTION public.auto_refresh_analytics_trigger();

-- =====================================================
-- COMENTARIOS DE DOCUMENTACIÓN
-- =====================================================

COMMENT ON MATERIALIZED VIEW public.analytics_daily_stats IS 'Vista materializada con RLS habilitado - Solo acceso para administradores';
COMMENT ON FUNCTION public.refresh_analytics_daily_stats() IS 'Función segura para refrescar estadísticas diarias - Solo administradores';
COMMENT ON FUNCTION public.auto_refresh_analytics_trigger() IS 'Trigger para detectar necesidad de refresh automático de estadísticas';

-- =====================================================
-- VERIFICACIÓN DE SEGURIDAD
-- =====================================================

-- Verificar que RLS está habilitado
DO $$
BEGIN
    IF NOT (SELECT relrowsecurity FROM pg_class WHERE relname = 'analytics_daily_stats') THEN
        RAISE EXCEPTION 'RLS no está habilitado en analytics_daily_stats';
    END IF;
    
    RAISE NOTICE 'Verificación completada: RLS habilitado en analytics_daily_stats';
END;
$$;