-- ===================================
-- ACTUALIZAR FUNCIÓN RPC CON METADATA Y ELEMENTOS
-- Extiende insert_analytics_event_optimized para aceptar metadata completo
-- ===================================

-- Reemplazar función con versión extendida
CREATE OR REPLACE FUNCTION insert_analytics_event_optimized(
    p_event_name TEXT,
    p_category TEXT,
    p_action TEXT,
    p_label TEXT DEFAULT NULL,
    p_value DECIMAL DEFAULT NULL,
    p_user_id TEXT DEFAULT NULL,
    p_session_id TEXT DEFAULT NULL,
    p_page TEXT DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    -- Nuevos parámetros de metadata de productos
    p_product_id INTEGER DEFAULT NULL,
    p_product_name TEXT DEFAULT NULL,
    p_category_name TEXT DEFAULT NULL,
    p_price DECIMAL DEFAULT NULL,
    p_quantity SMALLINT DEFAULT NULL,
    -- Nuevos parámetros de tracking de elementos
    p_element_selector TEXT DEFAULT NULL,
    p_element_x SMALLINT DEFAULT NULL,
    p_element_y SMALLINT DEFAULT NULL,
    p_element_width SMALLINT DEFAULT NULL,
    p_element_height SMALLINT DEFAULT NULL,
    p_device_type TEXT DEFAULT NULL,
    -- Metadata adicional (se comprimirá si se proporciona)
    p_metadata JSONB DEFAULT NULL
)
RETURNS BIGINT AS $$
DECLARE
    event_id BIGINT;
    page_id_val SMALLINT;
    browser_id_val SMALLINT;
    metadata_compressed_val BYTEA;
    device_type_val VARCHAR(20);
BEGIN
    -- Obtener o crear page_id
    SELECT id INTO page_id_val FROM analytics_pages WHERE path = p_page;
    IF page_id_val IS NULL THEN
        INSERT INTO analytics_pages (id, path, name) 
        VALUES ((SELECT COALESCE(MAX(id), 0) + 1 FROM analytics_pages), p_page, p_page)
        RETURNING id INTO page_id_val;
    END IF;
    
    -- Detectar browser
    SELECT CASE 
        WHEN p_user_agent ILIKE '%chrome%' AND p_user_agent ILIKE '%mobile%' THEN 5
        WHEN p_user_agent ILIKE '%chrome%' THEN 1
        WHEN p_user_agent ILIKE '%firefox%' THEN 2
        WHEN p_user_agent ILIKE '%safari%' AND p_user_agent ILIKE '%mobile%' THEN 6
        WHEN p_user_agent ILIKE '%safari%' THEN 3
        WHEN p_user_agent ILIKE '%edge%' THEN 4
        ELSE 7
    END INTO browser_id_val;
    
    -- Detectar device_type si no se proporciona
    IF p_device_type IS NULL AND p_user_agent IS NOT NULL THEN
        SELECT CASE
            WHEN p_user_agent ILIKE '%mobile%' OR p_user_agent ILIKE '%android%' OR p_user_agent ILIKE '%iphone%' THEN 'mobile'
            WHEN p_user_agent ILIKE '%tablet%' OR p_user_agent ILIKE '%ipad%' THEN 'tablet'
            ELSE 'desktop'
        END INTO device_type_val;
    ELSE
        device_type_val := p_device_type;
    END IF;
    
    -- Comprimir metadata adicional si se proporciona
    IF p_metadata IS NOT NULL THEN
        -- Usar pg_compress si está disponible, sino convertir a BYTEA directamente
        BEGIN
            metadata_compressed_val := pg_compress(p_metadata::text::bytea, 'gzip');
        EXCEPTION WHEN OTHERS THEN
            -- Si pg_compress no está disponible, usar conversión directa
            metadata_compressed_val := p_metadata::text::bytea;
        END;
    END IF;
    
    -- Insertar evento optimizado con todos los campos
    INSERT INTO analytics_events_optimized (
        event_type, category_id, action_id, label, value,
        user_id, session_hash, page_id, browser_id,
        product_id, product_name, category_name, price, quantity,
        element_selector, element_x, element_y, element_width, element_height, device_type,
        metadata_compressed
    ) VALUES (
        CASE p_event_name
            WHEN 'page_view' THEN 1
            WHEN 'click' THEN 2
            WHEN 'search' THEN 3
            WHEN 'product_view' THEN 4
            WHEN 'add_to_cart' THEN 5
            WHEN 'remove_from_cart' THEN 6
            WHEN 'begin_checkout' THEN 7
            WHEN 'purchase' THEN 8
            WHEN 'hover' THEN 9
            WHEN 'scroll' THEN 10
            WHEN 'focus' THEN 11
            WHEN 'input' THEN 12
            ELSE 1
        END,
        
        CASE p_category
            WHEN 'navigation' THEN 1
            WHEN 'ecommerce' THEN 2
            WHEN 'shop' THEN 2
            WHEN 'user' THEN 3
            WHEN 'search' THEN 4
            WHEN 'engagement' THEN 5
            WHEN 'interaction' THEN 5
            WHEN 'error' THEN 6
            WHEN 'performance' THEN 7
            ELSE 1
        END,
        
        CASE p_action
            WHEN 'view' THEN 1
            WHEN 'click' THEN 2
            WHEN 'hover' THEN 3
            WHEN 'scroll' THEN 4
            WHEN 'search' THEN 5
            WHEN 'filter' THEN 6
            WHEN 'add' THEN 7
            WHEN 'add_to_cart' THEN 7
            WHEN 'remove' THEN 8
            WHEN 'remove_from_cart' THEN 8
            WHEN 'purchase' THEN 9
            WHEN 'begin_checkout' THEN 10
            WHEN 'focus' THEN 11
            WHEN 'input' THEN 12
            ELSE 1
        END,
        
        LEFT(p_label, 50),
        p_value,
        
        CASE 
            WHEN p_user_id ~ '^[0-9]+$' THEN p_user_id::BIGINT
            WHEN p_user_id IS NOT NULL THEN ABS(HASHTEXT(p_user_id))
            ELSE NULL
        END,
        
        ABS(HASHTEXT(COALESCE(p_session_id, 'anonymous'))),
        page_id_val,
        browser_id_val,
        
        -- Campos de metadata de productos
        p_product_id,
        LEFT(p_product_name, 200),
        LEFT(p_category_name, 100),
        p_price,
        p_quantity,
        
        -- Campos de tracking de elementos
        LEFT(p_element_selector, 500),
        p_element_x,
        p_element_y,
        p_element_width,
        p_element_height,
        device_type_val,
        
        -- Metadata comprimido
        metadata_compressed_val
    ) RETURNING id INTO event_id;
    
    RETURN event_id;
END;
$$ LANGUAGE plpgsql;

-- Comentario actualizado
COMMENT ON FUNCTION insert_analytics_event_optimized IS 'Función optimizada para insertar eventos de analytics con metadata completo de productos y elementos';
