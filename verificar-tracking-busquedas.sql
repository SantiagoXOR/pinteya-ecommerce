-- ========================================
-- SCRIPT DE VERIFICACIÓN - TRACKING DE BÚSQUEDAS
-- ========================================

-- 1. VERIFICAR QUE LA FUNCIÓN EXISTE Y ESTÁ CORRECTA
SELECT 
    proname as nombre_funcion,
    pronargs as num_parametros,
    prorettype::regtype as tipo_retorno,
    prosrc as codigo_fuente
FROM pg_proc 
WHERE proname = 'insert_analytics_event_optimized';

-- Debe mostrar:
-- nombre_funcion: insert_analytics_event_optimized
-- num_parametros: 9
-- tipo_retorno: bigint
-- ✅ Si muestra esto, la función está correcta

-- ========================================

-- 2. VER BÚSQUEDAS DE LAS ÚLTIMAS 24 HORAS
SELECT 
    aeo.id,
    aeo.label as termino_busqueda,
    ap.path as pagina,
    TO_TIMESTAMP(aeo.created_at) as fecha,
    aeo.session_hash as sesion
FROM analytics_events_optimized aeo
JOIN analytics_event_types aet ON aet.id = aeo.event_type
JOIN analytics_pages ap ON ap.id = aeo.page_id
WHERE aeo.event_type = 3  -- 3 = search
  AND aeo.created_at > EXTRACT(EPOCH FROM NOW() - INTERVAL '24 hours')
ORDER BY aeo.created_at DESC;

-- Debe mostrar las búsquedas recientes
-- ✅ Si aparecen búsquedas con fecha de hoy, el tracking funciona

-- ========================================

-- 3. VER ESTADÍSTICAS DE BÚSQUEDAS POR DÍA (ÚLTIMOS 7 DÍAS)
SELECT 
    DATE(TO_TIMESTAMP(aeo.created_at)) as fecha,
    COUNT(*) as total_busquedas,
    COUNT(DISTINCT aeo.label) as terminos_unicos,
    COUNT(DISTINCT aeo.session_hash) as sesiones_unicas
FROM analytics_events_optimized aeo
WHERE aeo.event_type = 3  -- search
  AND aeo.created_at > EXTRACT(EPOCH FROM NOW() - INTERVAL '7 days')
GROUP BY DATE(TO_TIMESTAMP(aeo.created_at))
ORDER BY fecha DESC;

-- Debe mostrar actividad diaria
-- ✅ Si hay datos de hoy/ayer, el sistema funciona correctamente

-- ========================================

-- 4. TOP 10 BÚSQUEDAS MÁS POPULARES (ÚLTIMOS 7 DÍAS)
SELECT 
    aeo.label as termino_busqueda,
    COUNT(*) as veces_buscado,
    COUNT(DISTINCT aeo.session_hash) as sesiones_diferentes,
    MAX(TO_TIMESTAMP(aeo.created_at)) as ultima_busqueda
FROM analytics_events_optimized aeo
WHERE aeo.event_type = 3  -- search
  AND aeo.created_at > EXTRACT(EPOCH FROM NOW() - INTERVAL '7 days')
  AND aeo.label IS NOT NULL
GROUP BY aeo.label
ORDER BY veces_buscado DESC
LIMIT 10;

-- Muestra los términos más buscados
-- ✅ Útil para análisis de tendencias

-- ========================================

-- 5. VERIFICAR TODAS LAS BÚSQUEDAS (HISTÓRICO COMPLETO)
SELECT 
    DATE_TRUNC('month', TO_TIMESTAMP(aeo.created_at)) as mes,
    COUNT(*) as total_busquedas,
    COUNT(DISTINCT aeo.label) as terminos_unicos
FROM analytics_events_optimized aeo
WHERE aeo.event_type = 3  -- search
GROUP BY DATE_TRUNC('month', TO_TIMESTAMP(aeo.created_at))
ORDER BY mes DESC;

-- Muestra el historial completo por mes
-- ✅ Deberías ver datos de julio, agosto, septiembre y diciembre 2025

-- ========================================

-- 6. HACER UNA BÚSQUEDA DE PRUEBA MANUAL
-- Ejecutar esto para probar manualmente que todo funciona:

-- SELECT insert_analytics_event_optimized(
--     'search',                    -- event_name
--     'search',                    -- category
--     'search',                    -- action
--     'mi búsqueda de prueba',     -- label (cambiar por lo que quieras)
--     NULL,                        -- value
--     NULL,                        -- user_id
--     'session-manual-test',       -- session_id
--     '/search',                   -- page
--     'Mozilla/5.0 (Test Manual)'  -- user_agent
-- ) as nuevo_event_id;

-- Luego ejecutar query #2 para ver si apareció la búsqueda

-- ========================================
-- FIN DEL SCRIPT
-- ========================================

-- NOTAS:
-- - Si alguna query falla, revisar que existan las tablas y joins
-- - El event_type = 3 corresponde a 'search' en analytics_event_types
-- - Los timestamps en created_at son UNIX epoch (enteros)
-- - TO_TIMESTAMP() los convierte a fechas legibles

