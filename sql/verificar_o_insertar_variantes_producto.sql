-- ===================================
-- Verificar o insertar variantes para un producto (selector de medida en shopdetail)
-- Usar cuando un producto (ej. Recuplast Frentes) no muestra el selector de medida
-- porque no tiene filas en product_variants o no tienen measure.
-- ===================================

-- 1) Obtener el product_id del producto (por nombre o slug)
-- Ejemplo: Recuplast Frentes
-- SELECT id, name, slug FROM products WHERE name ILIKE '%recuplast%frentes%' OR slug ILIKE '%recuplast%';

-- 2) Verificar si el producto tiene variantes con measure
-- Reemplazar :product_id por el ID real (ej. 123)
/*
SELECT id, product_id, measure, color_name, is_active, is_default, price_list, price_sale, stock
FROM product_variants
WHERE product_id = :product_id
ORDER BY is_default DESC, measure;
*/

-- 3) Si no hay filas o faltan medidas: insertar variantes de ejemplo
-- Reemplazar PRODUCT_ID, AIKON_ID_BASE y los precios/stock según el producto.
-- Las columnas mínimas necesarias para el selector de medida: product_id, measure, is_active, is_default, price_list, price_sale, stock.
-- Opcional: color_name, color_hex, variant_slug, aikon_id, finish, image_url.

/*
INSERT INTO product_variants (
  product_id,
  aikon_id,
  variant_slug,
  color_name,
  color_hex,
  measure,
  finish,
  price_list,
  price_sale,
  stock,
  is_active,
  is_default
)
SELECT
  PRODUCT_ID,
  (SELECT aikon_id FROM products WHERE id = PRODUCT_ID LIMIT 1) || '-1L',
  (SELECT slug FROM products WHERE id = PRODUCT_ID LIMIT 1) || '-1l',
  NULL,
  NULL,
  '1 L',
  NULL,
  (SELECT price FROM products WHERE id = PRODUCT_ID LIMIT 1),
  (SELECT discounted_price FROM products WHERE id = PRODUCT_ID LIMIT 1),
  COALESCE((SELECT stock FROM products WHERE id = PRODUCT_ID LIMIT 1), 10),
  true,
  false
WHERE NOT EXISTS (SELECT 1 FROM product_variants WHERE product_id = PRODUCT_ID AND measure = '1 L');

-- Repetir para 4 L, 10 L, 20 L según necesidad (cambiar measure, variant_slug, y opcionalmente precios).
-- Marcar is_default = true en una sola variante (ej. la de 10 L).
*/

-- 4) Ejemplo concreto: insertar una variante por medida para un product_id dado
-- Reemplazar 999 por el product_id real y ejecutar en Supabase SQL Editor.
-- Solo inserta si no existe ya una variante con ese measure para el producto.
/*
DO $$
DECLARE
  pid int := 999;
  p_slug text;
  p_aikon text;
  p_price numeric;
  p_discount numeric;
  p_stock int;
  m text;
  measures text[] := ARRAY['1 L', '4 L', '10 L', '20 L'];
  i int;
BEGIN
  SELECT slug, aikon_id, price, discounted_price, stock
  INTO p_slug, p_aikon, p_price, p_discount, p_stock
  FROM products WHERE id = pid LIMIT 1;
  IF p_slug IS NULL THEN
    RAISE EXCEPTION 'Producto % no encontrado', pid;
  END IF;
  FOR i IN 1..array_length(measures, 1) LOOP
    m := measures[i];
    INSERT INTO product_variants (
      product_id, aikon_id, variant_slug, measure, price_list, price_sale, stock, is_active, is_default
    )
    SELECT
      pid,
      COALESCE(p_aikon, '') || '-' || replace(m, ' ', ''),
      p_slug || '-' || replace(lower(m), ' ', ''),
      m,
      COALESCE(p_price, 0),
      COALESCE(p_discount, p_price, 0),
      COALESCE(p_stock, 10),
      true,
      (m = '10 L')
    WHERE NOT EXISTS (
      SELECT 1 FROM product_variants WHERE product_id = pid AND measure = m
    );
  END LOOP;
END $$;
*/
