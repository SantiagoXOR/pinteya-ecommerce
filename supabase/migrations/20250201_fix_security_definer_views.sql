-- ===================================
-- CORRECCIÓN DE VISTAS SECURITY DEFINER
-- Cambiar vistas problemáticas a SECURITY INVOKER para cumplir con mejores prácticas de seguridad
-- Fecha: 2025-02-01
-- ===================================

-- Recrear analytics_events_view con SECURITY INVOKER
DROP VIEW IF EXISTS public.analytics_events_view;

CREATE VIEW public.analytics_events_view 
WITH (security_invoker=on)
AS 
SELECT 
    aeo.id,
    aet.name AS event_name,
    ac.name AS category,
    aa.name AS action,
    aeo.label,
    aeo.value,
    (aeo.user_id)::text AS user_id,
    (aeo.session_hash)::text AS session_id,
    ap.path AS page,
    (((ab.name)::text || ' '::text) || (ab.version)::text) AS user_agent,
    NULL::text AS metadata,
    to_timestamp((aeo.created_at)::double precision) AS created_at
FROM (((((analytics_events_optimized aeo
     JOIN analytics_event_types aet ON ((aet.id = aeo.event_type)))
     JOIN analytics_categories ac ON ((ac.id = aeo.category_id)))
     JOIN analytics_actions aa ON ((aa.id = aeo.action_id)))
     JOIN analytics_pages ap ON ((ap.id = aeo.page_id)))
     LEFT JOIN analytics_browsers ab ON ((ab.id = aeo.browser_id)));

-- Recrear cart_items_with_products con SECURITY INVOKER
DROP VIEW IF EXISTS public.cart_items_with_products;

CREATE VIEW public.cart_items_with_products 
WITH (security_invoker=on)
AS 
SELECT 
    ci.id,
    ci.user_id,
    ci.product_id,
    ci.quantity,
    ci.created_at,
    ci.updated_at,
    p.name AS product_name,
    p.price AS product_price,
    p.discounted_price,
    p.images AS product_images,
    p.stock,
    p.brand,
    c.name AS category_name,
    ((ci.quantity)::numeric * COALESCE(p.discounted_price, p.price)) AS subtotal
FROM ((cart_items ci
     JOIN products p ON ((ci.product_id = p.id)))
     LEFT JOIN categories c ON ((p.category_id = c.id)));

-- Comentarios de documentación
COMMENT ON VIEW public.analytics_events_view IS 'Vista de eventos de analytics con SECURITY INVOKER para respetar RLS del usuario consultante';
COMMENT ON VIEW public.cart_items_with_products IS 'Vista de items del carrito con productos con SECURITY INVOKER para respetar RLS del usuario consultante';