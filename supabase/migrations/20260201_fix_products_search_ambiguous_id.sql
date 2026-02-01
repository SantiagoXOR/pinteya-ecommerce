-- ===================================
-- FIX: products_search - column reference 'id' is ambiguous
-- ===================================
-- En producción (PostgreSQL) el CTE combined_results puede dar error
-- "column reference 'id' is ambiguous" al usar DISTINCT ON (id) y ORDER BY id.
-- Solución: calificar todas las columnas con el alias del subquery (combined).

CREATE OR REPLACE FUNCTION products_search(
  q TEXT,
  lim INTEGER DEFAULT 10,
  off INTEGER DEFAULT 0
)
RETURNS TABLE (
  id INTEGER,
  name TEXT,
  slug TEXT,
  description TEXT,
  brand TEXT,
  price DECIMAL,
  discounted_price DECIMAL,
  stock INTEGER,
  images JSONB,
  color TEXT,
  medida TEXT,
  category_id INTEGER,
  created_at TIMESTAMP WITH TIME ZONE,
  rank DOUBLE PRECISION
)
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = 'public'
AS $$
DECLARE
  search_query TEXT;
  prefix_query TEXT;
BEGIN
  search_query := lower(trim(q));
  prefix_query := search_query || '%';

  RETURN QUERY
  WITH fts_results AS (
    SELECT
      p.id,
      p.name,
      p.slug,
      p.description,
      p.brand,
      p.price,
      p.discounted_price,
      p.stock,
      p.images,
      p.color,
      p.medida,
      p.category_id,
      p.created_at,
      ts_rank(
        to_tsvector('spanish',
          coalesce(p.name, '') || ' ' ||
          coalesce(p.description, '') || ' ' ||
          coalesce(p.brand, '')
        ),
        to_tsquery('spanish', search_query || ':*')
      ) as rank,
      'fts' as match_type
    FROM products p
    WHERE
      to_tsvector('spanish',
        coalesce(p.name, '') || ' ' ||
        coalesce(p.description, '') || ' ' ||
        coalesce(p.brand, '')
      ) @@ to_tsquery('spanish', search_query || ':*')
  ),
  ilike_results AS (
    SELECT
      p.id,
      p.name,
      p.slug,
      p.description,
      p.brand,
      p.price,
      p.discounted_price,
      p.stock,
      p.images,
      p.color,
      p.medida,
      p.category_id,
      p.created_at,
      CASE
        WHEN lower(p.name) = search_query THEN 10.0
        WHEN lower(p.name) LIKE prefix_query THEN 8.0
        WHEN lower(p.name) LIKE '%' || search_query || '%' THEN 6.0
        WHEN lower(coalesce(p.description, '')) LIKE '%' || search_query || '%' THEN 4.0
        WHEN lower(coalesce(p.brand, '')) LIKE '%' || search_query || '%' THEN 3.0
        ELSE 1.0
      END as rank,
      'ilike' as match_type
    FROM products p
    WHERE
      lower(p.name) LIKE prefix_query
      OR lower(p.name) LIKE '%' || search_query || '%'
      OR lower(coalesce(p.description, '')) LIKE '%' || search_query || '%'
      OR lower(coalesce(p.brand, '')) LIKE '%' || search_query || '%'
  ),
  combined_results AS (
    SELECT DISTINCT ON (combined.id)
      combined.id,
      combined.name,
      combined.slug,
      combined.description,
      combined.brand,
      combined.price,
      combined.discounted_price,
      combined.stock,
      combined.images,
      combined.color,
      combined.medida,
      combined.category_id,
      combined.created_at,
      CASE
        WHEN combined.match_type = 'fts' THEN combined.rank * 1.5
        ELSE combined.rank
      END as rank
    FROM (
      SELECT * FROM fts_results
      UNION ALL
      SELECT * FROM ilike_results
    ) combined
    ORDER BY combined.id,
      CASE combined.match_type WHEN 'fts' THEN 0 ELSE 1 END,
      combined.rank DESC
  )
  SELECT
    cr.id,
    cr.name,
    cr.slug::text,
    cr.description::text,
    cr.brand::text,
    cr.price,
    cr.discounted_price,
    cr.stock,
    cr.images,
    cr.color::text,
    cr.medida::text,
    cr.category_id,
    cr.created_at,
    cr.rank
  FROM combined_results cr
  ORDER BY
    cr.rank DESC,
    cr.created_at DESC
  LIMIT lim
  OFFSET off;
END;
$$;

COMMENT ON FUNCTION products_search(TEXT, INTEGER, INTEGER) IS
'Búsqueda mejorada de productos (FTS + ILIKE). Fix: columnas calificadas con alias para evitar "id" ambiguo.';
