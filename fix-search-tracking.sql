-- ===================================
-- FIX: Arreglar tracking de búsquedas
-- ===================================

-- 1. Eliminar la función vieja que está rota
DROP FUNCTION IF EXISTS insert_analytics_event_optimized(text, uuid, text, text, jsonb);

-- 2. Crear la función CORRECTA que coincide con el código
CREATE OR REPLACE FUNCTION insert_analytics_event_optimized(
    p_event_name TEXT,
    p_category TEXT,
    p_action TEXT,
    p_label TEXT DEFAULT NULL,
    p_value DECIMAL DEFAULT NULL,
    p_user_id TEXT DEFAULT NULL,
    p_session_id TEXT DEFAULT NULL,
    p_page TEXT DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS BIGINT AS $$
DECLARE
    event_id BIGINT;
    page_id_val SMALLINT;
    browser_id_val SMALLINT;
BEGIN
    -- Obtener o crear page_id
    SELECT id INTO page_id_val FROM analytics_pages WHERE path = p_page;
    IF page_id_val IS NULL THEN
        INSERT INTO analytics_pages (id, path, name) 
        VALUES ((SELECT COALESCE(MAX(id), 0) + 1 FROM analytics_pages), p_page, p_page)
        RETURNING id INTO page_id_val;
    END IF;
    
    -- Detectar browser del user_agent
    SELECT CASE 
        WHEN p_user_agent ILIKE '%chrome%' AND p_user_agent ILIKE '%mobile%' THEN 5
        WHEN p_user_agent ILIKE '%chrome%' THEN 1
        WHEN p_user_agent ILIKE '%firefox%' THEN 2
        WHEN p_user_agent ILIKE '%safari%' AND p_user_agent ILIKE '%mobile%' THEN 6
        WHEN p_user_agent ILIKE '%safari%' THEN 3
        WHEN p_user_agent ILIKE '%edge%' THEN 4
        ELSE 7
    END INTO browser_id_val;
    
    -- Insertar evento en tabla OPTIMIZADA
    INSERT INTO analytics_events_optimized (
        event_type, category_id, action_id, label, value,
        user_id, session_hash, page_id, browser_id
    ) VALUES (
        -- Mapear event_name a event_type
        CASE p_event_name
            WHEN 'page_view' THEN 1
            WHEN 'click' THEN 2
            WHEN 'search' THEN 3
            WHEN 'product_view' THEN 4
            WHEN 'add_to_cart' THEN 5
            WHEN 'remove_from_cart' THEN 6
            WHEN 'begin_checkout' THEN 7
            WHEN 'purchase' THEN 8
            ELSE 1
        END,
        
        -- Mapear category a category_id
        CASE p_category
            WHEN 'navigation' THEN 1
            WHEN 'ecommerce' THEN 2
            WHEN 'user' THEN 3
            WHEN 'search' THEN 4
            WHEN 'engagement' THEN 5
            WHEN 'error' THEN 6
            WHEN 'performance' THEN 7
            ELSE 1
        END,
        
        -- Mapear action a action_id
        CASE p_action
            WHEN 'view' THEN 1
            WHEN 'click' THEN 2
            WHEN 'hover' THEN 3
            WHEN 'scroll' THEN 4
            WHEN 'search' THEN 5
            WHEN 'filter' THEN 6
            WHEN 'add' THEN 7
            WHEN 'remove' THEN 8
            WHEN 'purchase' THEN 9
            ELSE 1
        END,
        
        -- Label truncado a 50 caracteres
        LEFT(p_label, 50),
        p_value,
        
        -- User ID convertido a BIGINT
        CASE 
            WHEN p_user_id ~ '^[0-9]+$' THEN p_user_id::BIGINT
            WHEN p_user_id IS NOT NULL THEN ABS(HASHTEXT(p_user_id))
            ELSE NULL
        END,
        
        -- Session ID hasheado
        ABS(HASHTEXT(COALESCE(p_session_id, 'anonymous'))),
        page_id_val,
        browser_id_val
    ) RETURNING id INTO event_id;
    
    RETURN event_id;
END;
$$ LANGUAGE plpgsql;

-- 3. Verificar que la función se creó correctamente
SELECT proname, pronargs FROM pg_proc WHERE proname = 'insert_analytics_event_optimized';

-- 4. Probar la función con un evento de búsqueda de prueba
SELECT insert_analytics_event_optimized(
    'search',           -- event_name
    'search',           -- category
    'search',           -- action
    'test busqueda',    -- label
    NULL,              -- value
    NULL,              -- user_id
    'session-test',    -- session_id
    '/search',         -- page
    NULL               -- user_agent
);

-- 5. Verificar que se insertó correctamente
SELECT 
    aeo.id,
    aet.name as event_name,
    ac.name as category,
    aa.name as action,
    aeo.label,
    ap.path as page,
    TO_TIMESTAMP(aeo.created_at) as created_at
FROM analytics_events_optimized aeo
JOIN analytics_event_types aet ON aet.id = aeo.event_type
JOIN analytics_categories ac ON ac.id = aeo.category_id
JOIN analytics_actions aa ON aa.id = aeo.action_id
JOIN analytics_pages ap ON ap.id = aeo.page_id
WHERE aeo.label = 'test busqueda'
ORDER BY aeo.id DESC
LIMIT 1;


