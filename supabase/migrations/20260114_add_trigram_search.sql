-- ===================================
-- PINTEYA E-COMMERCE - BÚSQUEDA CON TRIGRAMAS
-- ===================================
-- Fecha: Enero 14, 2026
-- Descripción: Habilitar búsqueda fuzzy con trigramas para mejor matching
-- NOTA: Esta migración es opcional y puede mejorar búsquedas con errores tipográficos

-- ===================================
-- 1. HABILITAR EXTENSIÓN pg_trgm
-- ===================================

-- Verificar si la extensión ya está habilitada
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'pg_trgm'
  ) THEN
    CREATE EXTENSION IF NOT EXISTS pg_trgm;
    RAISE NOTICE 'Extensión pg_trgm habilitada';
  ELSE
    RAISE NOTICE 'Extensión pg_trgm ya está habilitada';
  END IF;
END $$;

-- ===================================
-- 2. CREAR ÍNDICES TRIGRAM PARA BÚSQUEDA FUZZY
-- ===================================

-- Índice trigram para nombre de productos (mejora búsquedas con errores tipográficos)
CREATE INDEX IF NOT EXISTS idx_products_name_trgm 
ON products USING gin(name gin_trgm_ops);

-- Índice trigram para descripción (opcional, puede ser costoso)
-- CREATE INDEX IF NOT EXISTS idx_products_description_trgm 
-- ON products USING gin(description gin_trgm_ops);

-- Índice trigram para marca
CREATE INDEX IF NOT EXISTS idx_products_brand_trgm 
ON products USING gin(brand gin_trgm_ops);

-- ===================================
-- 3. CREAR FUNCIÓN DE BÚSQUEDA FUZZY (OPCIONAL)
-- ===================================

-- Función auxiliar para búsqueda fuzzy usando trigramas
-- Esta función puede ser usada como complemento a la búsqueda principal
CREATE OR REPLACE FUNCTION products_search_fuzzy(
  q TEXT,
  similarity_threshold REAL DEFAULT 0.3,
  lim INTEGER DEFAULT 10
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
  similarity REAL
)
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.slug,
    p.description,
    p.brand,
    p.price,
    p.discounted_price,
    p.stock,
    GREATEST(
      similarity(lower(p.name), lower(q)),
      similarity(lower(coalesce(p.description, '')), lower(q)),
      similarity(lower(coalesce(p.brand, '')), lower(q))
    ) as similarity
  FROM products p
  WHERE 
    similarity(lower(p.name), lower(q)) > similarity_threshold
    OR similarity(lower(coalesce(p.description, '')), lower(q)) > similarity_threshold
    OR similarity(lower(coalesce(p.brand, '')), lower(q)) > similarity_threshold
  ORDER BY similarity DESC, p.created_at DESC
  LIMIT lim;
END;
$$;

-- ===================================
-- 4. COMENTARIOS
-- ===================================

COMMENT ON FUNCTION products_search_fuzzy(TEXT, REAL, INTEGER) IS 
'Búsqueda fuzzy de productos usando trigramas. Útil para encontrar productos
con errores tipográficos o variaciones en el nombre. similarity_threshold
controla qué tan similar debe ser el término (0.0 a 1.0, mayor = más estricto).';

-- ===================================
-- 5. PERMISOS
-- ===================================

GRANT EXECUTE ON FUNCTION products_search_fuzzy(TEXT, REAL, INTEGER) TO anon;
GRANT EXECUTE ON FUNCTION products_search_fuzzy(TEXT, REAL, INTEGER) TO authenticated;

-- ===================================
-- NOTAS DE USO
-- ===================================
-- Esta migración es opcional y puede mejorar búsquedas con errores tipográficos.
-- Los índices trigram pueden ser costosos en términos de espacio y mantenimiento.
-- Se recomienda usar solo si se necesita búsqueda fuzzy avanzada.
-- La función products_search_fuzzy puede ser llamada como complemento a products_search.
