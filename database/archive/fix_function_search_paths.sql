-- =============================================
-- FIX: Function Search Path Mutable
-- Fecha: 2025-10-19
-- Descripción: Agregar SET search_path = 'public' a 14 funciones para prevenir SQL injection
-- =============================================

-- 1. products_search_vector_update
ALTER FUNCTION public.products_search_vector_update() 
SET search_path = 'public';

-- 2. products_search
ALTER FUNCTION public.products_search(
    search_query text,
    limit_count integer,
    offset_count integer
) SET search_path = 'public';

-- 3. products_search_with_variants_priority
ALTER FUNCTION public.products_search_with_variants_priority(
    search_query text,
    limit_count integer,
    offset_count integer
) SET search_path = 'public';

-- 4. update_product_variants_updated_at
ALTER FUNCTION public.update_product_variants_updated_at() 
SET search_path = 'public';

-- 5. ensure_default_variant
ALTER FUNCTION public.ensure_default_variant() 
SET search_path = 'public';

-- 6. migrate_existing_products_to_variants
ALTER FUNCTION public.migrate_existing_products_to_variants() 
SET search_path = 'public';

-- 7. split_and_trim
ALTER FUNCTION public.split_and_trim(
    input_text text,
    delimiter text
) SET search_path = 'public';

-- 8. generate_unique_slug
ALTER FUNCTION public.generate_unique_slug(
    base_text text,
    table_name text
) SET search_path = 'public';

-- 9. get_or_create_category
ALTER FUNCTION public.get_or_create_category(
    category_name text
) SET search_path = 'public';

-- 10. process_csv_products
ALTER FUNCTION public.process_csv_products() 
SET search_path = 'public';

-- 11. get_product_variants
ALTER FUNCTION public.get_product_variants(
    product_id_param uuid
) SET search_path = 'public';

-- 12. get_default_variant
ALTER FUNCTION public.get_default_variant(
    product_id_param uuid
) SET search_path = 'public';

-- 13. show_migration_stats
ALTER FUNCTION public.show_migration_stats() 
SET search_path = 'public';

-- Verificación: Listar funciones con su search_path configurado
SELECT 
    n.nspname as schema,
    p.proname as function_name,
    pg_get_function_identity_arguments(p.oid) as arguments,
    (
        SELECT string_agg(setting, ', ')
        FROM unnest(p.proconfig) AS setting
        WHERE setting LIKE 'search_path=%'
    ) as search_path_config
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname IN (
    'products_search_vector_update',
    'products_search',
    'products_search_with_variants_priority',
    'update_product_variants_updated_at',
    'ensure_default_variant',
    'migrate_existing_products_to_variants',
    'split_and_trim',
    'generate_unique_slug',
    'get_or_create_category',
    'process_csv_products',
    'get_product_variants',
    'get_default_variant',
    'show_migration_stats'
  )
ORDER BY p.proname;


