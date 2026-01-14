-- ===================================
-- PINTEYA E-COMMERCE - MEJORA DE BÚSQUEDA DE PRODUCTOS
-- ===================================
-- Fecha: Enero 14, 2026
-- Descripción: Mejorar función products_search para soportar búsqueda por prefijos
-- y combinación de FTS con ILIKE para mejores resultados

-- ===================================
-- 1. MEJORAR FUNCIÓN products_search CON SOPORTE DE PREFIJOS
-- ===================================

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
  images TEXT[],
  color TEXT,
  medida TEXT,
  category_id INTEGER,
  created_at TIMESTAMP WITH TIME ZONE,
  rank REAL
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
  -- Normalizar query: eliminar espacios y convertir a minúsculas
  search_query := lower(trim(q));
  prefix_query := search_query || '%';
  
  RETURN QUERY
  WITH fts_results AS (
    -- Búsqueda FTS con prefijos usando to_tsquery con wildcard
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
    -- Búsqueda ILIKE para capturar prefijos y coincidencias parciales
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
        -- Coincidencia exacta en nombre (mayor prioridad)
        WHEN lower(p.name) = search_query THEN 10.0
        -- Nombre empieza con query
        WHEN lower(p.name) LIKE prefix_query THEN 8.0
        -- Nombre contiene query
        WHEN lower(p.name) LIKE '%' || search_query || '%' THEN 6.0
        -- Descripción contiene query
        WHEN lower(coalesce(p.description, '')) LIKE '%' || search_query || '%' THEN 4.0
        -- Marca contiene query
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
    -- Combinar resultados FTS e ILIKE, priorizando FTS cuando existe
    SELECT DISTINCT ON (id)
      id,
      name,
      slug,
      description,
      brand,
      price,
      discounted_price,
      stock,
      images,
      color,
      medida,
      category_id,
      created_at,
      CASE
        WHEN match_type = 'fts' THEN rank * 1.5  -- Priorizar resultados FTS
        ELSE rank
      END as rank
    FROM (
      SELECT * FROM fts_results
      UNION ALL
      SELECT * FROM ilike_results
    ) combined
    ORDER BY id, 
      CASE match_type WHEN 'fts' THEN 0 ELSE 1 END,  -- FTS primero
      rank DESC
  )
  SELECT 
    cr.id,
    cr.name,
    cr.slug,
    cr.description,
    cr.brand,
    cr.price,
    cr.discounted_price,
    cr.stock,
    cr.images,
    cr.color,
    cr.medida,
    cr.category_id,
    cr.created_at,
    cr.rank
  FROM combined_results cr
  ORDER BY 
    cr.rank DESC,  -- Mayor relevancia primero
    cr.created_at DESC  -- Más recientes primero en caso de empate
  LIMIT lim
  OFFSET off;
END;
$$;

-- ===================================
-- 2. ACTUALIZAR COMENTARIO
-- ===================================

COMMENT ON FUNCTION products_search(TEXT, INTEGER, INTEGER) IS 
'Búsqueda mejorada de productos que combina Full-Text Search (FTS) con búsqueda ILIKE.
Soporta búsqueda por prefijos (ej: "aer" encuentra "aerosol", "aero", etc.).
Prioriza coincidencias exactas, luego al inicio, luego en cualquier parte.
Usa configuración de idioma español para mejor análisis de texto.';

-- ===================================
-- 3. ASEGURAR ÍNDICES PARA PERFORMANCE
-- ===================================

-- Índice GIN para FTS (ya debería existir, pero lo creamos si no)
CREATE INDEX IF NOT EXISTS idx_products_fts_spanish
ON products USING gin(
  to_tsvector('spanish', 
    coalesce(name, '') || ' ' || 
    coalesce(description, '') || ' ' || 
    coalesce(brand, '')
  )
);

-- Índices adicionales para búsqueda ILIKE (mejoran performance de prefijos)
CREATE INDEX IF NOT EXISTS idx_products_name_lower 
ON products (lower(name));

CREATE INDEX IF NOT EXISTS idx_products_brand_lower 
ON products (lower(brand));

-- Índice para búsqueda en descripción (solo si es necesario, puede ser costoso)
-- CREATE INDEX IF NOT EXISTS idx_products_description_lower 
-- ON products USING gin(to_tsvector('spanish', description));

-- ===================================
-- 4. MANTENER PERMISOS
-- ===================================

-- Permitir acceso público a la función (lectura solamente)
GRANT EXECUTE ON FUNCTION products_search(TEXT, INTEGER, INTEGER) TO anon;
GRANT EXECUTE ON FUNCTION products_search(TEXT, INTEGER, INTEGER) TO authenticated;
