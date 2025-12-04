-- ===================================
-- PINTEYA E-COMMERCE - FUNCIÓN RPC PARA BÚSQUEDA DE PRODUCTOS
-- ===================================
-- Fecha: Enero 19, 2025
-- Descripción: Crear función RPC para búsqueda Full-Text Search de productos

-- ===================================
-- 1. CREAR O REEMPLAZAR FUNCIÓN products_search
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
      plainto_tsquery('spanish', q)
    ) as rank
  FROM products p
  WHERE 
    to_tsvector('spanish', 
      coalesce(p.name, '') || ' ' || 
      coalesce(p.description, '') || ' ' || 
      coalesce(p.brand, '')
    ) @@ plainto_tsquery('spanish', q)
  ORDER BY rank DESC, p.created_at DESC
  LIMIT lim
  OFFSET off;
END;
$$;

-- ===================================
-- 2. AGREGAR COMENTARIO
-- ===================================

COMMENT ON FUNCTION products_search(TEXT, INTEGER, INTEGER) IS 
'Búsqueda Full-Text Search de productos con ranking por relevancia. 
Usa configuración de idioma español para mejor análisis de texto.';

-- ===================================
-- 3. ASEGURAR QUE EXISTE ÍNDICE GIN PARA FTS
-- ===================================

-- Crear índice GIN si no existe para mejorar performance de búsqueda
CREATE INDEX IF NOT EXISTS idx_products_fts_spanish
ON products USING gin(
  to_tsvector('spanish', 
    coalesce(name, '') || ' ' || 
    coalesce(description, '') || ' ' || 
    coalesce(brand, '')
  )
);

-- ===================================
-- 4. OTORGAR PERMISOS
-- ===================================

-- Permitir acceso público a la función (lectura solamente)
GRANT EXECUTE ON FUNCTION products_search(TEXT, INTEGER, INTEGER) TO anon;
GRANT EXECUTE ON FUNCTION products_search(TEXT, INTEGER, INTEGER) TO authenticated;





