-- =============================================
-- FIX: Security Definer View
-- Fecha: 2025-10-19
-- Descripción: Eliminar SECURITY DEFINER de la vista products_with_default_variant
-- =============================================

-- Paso 1: Drop la vista actual con SECURITY DEFINER
DROP VIEW IF EXISTS public.products_with_default_variant;

-- Paso 2: Recrear la vista SIN SECURITY DEFINER (será SECURITY INVOKER por defecto)
CREATE OR REPLACE VIEW public.products_with_default_variant
AS
SELECT 
    p.id,
    p.name,
    p.slug,
    p.description,
    p.brand,
    p.category_id,
    p.images,
    p.created_at,
    p.updated_at,
    p.is_active,
    COALESCE(pv.aikon_id, p.aikon_id) AS aikon_id,
    COALESCE(pv.color_name, p.color) AS color,
    COALESCE(pv.measure, p.medida) AS medida,
    COALESCE(pv.price_list, p.price) AS price,
    COALESCE(pv.price_sale, p.discounted_price) AS discounted_price,
    COALESCE(pv.stock, p.stock) AS stock,
    pv.id AS variant_id,
    pv.variant_slug,
    pv.color_hex,
    pv.finish,
    pv.image_url AS variant_image_url,
    (
        SELECT count(*) 
        FROM product_variants
        WHERE product_variants.product_id = p.id 
          AND product_variants.is_active = true
    ) AS variant_count
FROM products p
LEFT JOIN product_variants pv 
    ON p.id = pv.product_id 
    AND pv.is_default = true
WHERE p.is_active = true;

-- Paso 3: Otorgar permisos necesarios
GRANT SELECT ON public.products_with_default_variant TO anon;
GRANT SELECT ON public.products_with_default_variant TO authenticated;

-- Verificación
SELECT 
    schemaname,
    viewname,
    viewowner
FROM pg_views
WHERE viewname = 'products_with_default_variant';

COMMENT ON VIEW public.products_with_default_variant IS 'Vista de productos con su variante por defecto. Security: INVOKER (respeta RLS del usuario que consulta)';


