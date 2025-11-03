-- ===================================
-- CONSOLIDACIÓN MASIVA - FASE 2
-- Consolidar 16 grupos (54 productos) → 16 productos padre
-- Fecha: 27 de Octubre, 2025
-- ===================================

-- ===================================
-- GRUPO 1: Pincel Persianero (IDs 1-5)
-- ===================================
INSERT INTO product_variants (
  product_id, aikon_id, variant_slug, measure, 
  price_list, price_sale, stock, is_active, is_default,
  image_url, created_at, updated_at
)
SELECT
  1, -- product_id padre
  p.aikon_id,
  p.slug,
  p.medida,
  p.price,
  p.discounted_price,
  p.stock,
  p.is_active,
  (p.id = 1), -- Primer producto es default
  CASE 
    WHEN p.images IS NOT NULL AND jsonb_typeof(p.images) = 'array' THEN p.images->>0
    WHEN p.images IS NOT NULL AND jsonb_typeof(p.images) = 'object' THEN 
      COALESCE(p.images->'previews'->>0, p.images->'thumbnails'->>0, p.images->>'main')
    ELSE NULL
  END,
  p.created_at,
  p.updated_at
FROM products p
WHERE p.id IN (1, 2, 3, 4, 5)
ON CONFLICT (product_id, variant_slug) DO UPDATE SET
  price_list = EXCLUDED.price_list,
  price_sale = EXCLUDED.price_sale,
  stock = EXCLUDED.stock;

DELETE FROM products WHERE id IN (2, 3, 4, 5);

UPDATE products SET 
  slug = 'pincel-persianero',
  name = 'Pincel Persianero'
WHERE id = 1;

-- ===================================
-- GRUPO 2: Plavipint Techos Poliuretánico (IDs 7-8)
-- ===================================
INSERT INTO product_variants (
  product_id, aikon_id, variant_slug, measure, 
  price_list, price_sale, stock, is_active, is_default,
  image_url, created_at, updated_at
)
SELECT
  7,
  p.aikon_id,
  p.slug,
  p.medida,
  p.price,
  p.discounted_price,
  p.stock,
  p.is_active,
  (p.id = 7),
  CASE 
    WHEN p.images IS NOT NULL AND jsonb_typeof(p.images) = 'array' THEN p.images->>0
    WHEN p.images IS NOT NULL AND jsonb_typeof(p.images) = 'object' THEN 
      COALESCE(p.images->'previews'->>0, p.images->'thumbnails'->>0, p.images->>'main')
    ELSE NULL
  END,
  p.created_at,
  p.updated_at
FROM products p
WHERE p.id IN (7, 8)
ON CONFLICT (product_id, variant_slug) DO UPDATE SET
  price_list = EXCLUDED.price_list,
  price_sale = EXCLUDED.price_sale,
  stock = EXCLUDED.stock;

DELETE FROM products WHERE id = 8;

UPDATE products SET 
  slug = 'plavipint-techos-poliuretanico',
  name = 'Plavipint Techos Poliuretánico'
WHERE id = 7;

-- ===================================
-- GRUPO 3: Látex Frentes (IDs 10-12)
-- ===================================
INSERT INTO product_variants (
  product_id, aikon_id, variant_slug, measure, 
  price_list, price_sale, stock, is_active, is_default,
  image_url, created_at, updated_at
)
SELECT
  10,
  p.aikon_id,
  p.slug,
  p.medida,
  p.price,
  p.discounted_price,
  p.stock,
  p.is_active,
  (p.id = 10),
  CASE 
    WHEN p.images IS NOT NULL AND jsonb_typeof(p.images) = 'array' THEN p.images->>0
    WHEN p.images IS NOT NULL AND jsonb_typeof(p.images) = 'object' THEN 
      COALESCE(p.images->'previews'->>0, p.images->'thumbnails'->>0, p.images->>'main')
    ELSE NULL
  END,
  p.created_at,
  p.updated_at
FROM products p
WHERE p.id IN (10, 11, 12)
ON CONFLICT (product_id, variant_slug) DO UPDATE SET
  price_list = EXCLUDED.price_list,
  price_sale = EXCLUDED.price_sale,
  stock = EXCLUDED.stock;

DELETE FROM products WHERE id IN (11, 12);

UPDATE products SET 
  slug = 'latex-frentes',
  name = 'Látex Frentes'
WHERE id = 10;

-- ===================================
-- GRUPO 4: Látex Interior (IDs 13-15)
-- ===================================
INSERT INTO product_variants (
  product_id, aikon_id, variant_slug, measure, 
  price_list, price_sale, stock, is_active, is_default,
  image_url, created_at, updated_at
)
SELECT
  13,
  p.aikon_id,
  p.slug,
  p.medida,
  p.price,
  p.discounted_price,
  p.stock,
  p.is_active,
  (p.id = 13),
  CASE 
    WHEN p.images IS NOT NULL AND jsonb_typeof(p.images) = 'array' THEN p.images->>0
    WHEN p.images IS NOT NULL AND jsonb_typeof(p.images) = 'object' THEN 
      COALESCE(p.images->'previews'->>0, p.images->'thumbnails'->>0, p.images->>'main')
    ELSE NULL
  END,
  p.created_at,
  p.updated_at
FROM products p
WHERE p.id IN (13, 14, 15)
ON CONFLICT (product_id, variant_slug) DO UPDATE SET
  price_list = EXCLUDED.price_list,
  price_sale = EXCLUDED.price_sale,
  stock = EXCLUDED.stock;

DELETE FROM products WHERE id IN (14, 15);

UPDATE products SET 
  slug = 'latex-interior',
  name = 'Látex Interior'
WHERE id = 13;

-- ===================================
-- GRUPO 5: Cielorrasos (IDs 16-19)
-- ===================================
INSERT INTO product_variants (
  product_id, aikon_id, variant_slug, measure, 
  price_list, price_sale, stock, is_active, is_default,
  image_url, created_at, updated_at
)
SELECT
  16,
  p.aikon_id,
  p.slug,
  p.medida,
  p.price,
  p.discounted_price,
  p.stock,
  p.is_active,
  (p.id = 16),
  CASE 
    WHEN p.images IS NOT NULL AND jsonb_typeof(p.images) = 'array' THEN p.images->>0
    WHEN p.images IS NOT NULL AND jsonb_typeof(p.images) = 'object' THEN 
      COALESCE(p.images->'previews'->>0, p.images->'thumbnails'->>0, p.images->>'main')
    ELSE NULL
  END,
  p.created_at,
  p.updated_at
FROM products p
WHERE p.id IN (16, 17, 18, 19)
ON CONFLICT (product_id, variant_slug) DO UPDATE SET
  price_list = EXCLUDED.price_list,
  price_sale = EXCLUDED.price_sale,
  stock = EXCLUDED.stock;

DELETE FROM products WHERE id IN (17, 18, 19);

UPDATE products SET 
  slug = 'cielorrasos',
  name = 'Cielorrasos'
WHERE id = 16;

-- ===================================
-- GRUPO 6: Látex Muros (IDs 20-22)
-- ===================================
INSERT INTO product_variants (
  product_id, aikon_id, variant_slug, measure, 
  price_list, price_sale, stock, is_active, is_default,
  image_url, created_at, updated_at
)
SELECT
  20,
  p.aikon_id,
  p.slug,
  p.medida,
  p.price,
  p.discounted_price,
  p.stock,
  p.is_active,
  (p.id = 20),
  CASE 
    WHEN p.images IS NOT NULL AND jsonb_typeof(p.images) = 'array' THEN p.images->>0
    WHEN p.images IS NOT NULL AND jsonb_typeof(p.images) = 'object' THEN 
      COALESCE(p.images->'previews'->>0, p.images->'thumbnails'->>0, p.images->>'main')
    ELSE NULL
  END,
  p.created_at,
  p.updated_at
FROM products p
WHERE p.id IN (20, 21, 22)
ON CONFLICT (product_id, variant_slug) DO UPDATE SET
  price_list = EXCLUDED.price_list,
  price_sale = EXCLUDED.price_sale,
  stock = EXCLUDED.stock;

DELETE FROM products WHERE id IN (21, 22);

UPDATE products SET 
  slug = 'latex-muros',
  name = 'Látex Muros'
WHERE id = 20;

-- ===================================
-- GRUPO 7: Recuplast Interior (IDs 23-26)
-- ===================================
INSERT INTO product_variants (
  product_id, aikon_id, variant_slug, measure, 
  price_list, price_sale, stock, is_active, is_default,
  image_url, created_at, updated_at
)
SELECT
  23,
  p.aikon_id,
  p.slug,
  p.medida,
  p.price,
  p.discounted_price,
  p.stock,
  p.is_active,
  (p.id = 23),
  CASE 
    WHEN p.images IS NOT NULL AND jsonb_typeof(p.images) = 'array' THEN p.images->>0
    WHEN p.images IS NOT NULL AND jsonb_typeof(p.images) = 'object' THEN 
      COALESCE(p.images->'previews'->>0, p.images->'thumbnails'->>0, p.images->>'main')
    ELSE NULL
  END,
  p.created_at,
  p.updated_at
FROM products p
WHERE p.id IN (23, 24, 25, 26)
ON CONFLICT (product_id, variant_slug) DO UPDATE SET
  price_list = EXCLUDED.price_list,
  price_sale = EXCLUDED.price_sale,
  stock = EXCLUDED.stock;

DELETE FROM products WHERE id IN (24, 25, 26);

UPDATE products SET 
  slug = 'recuplast-interior',
  name = 'Recuplast Interior'
WHERE id = 23;

-- ===================================
-- GRUPO 8: Recuplast Baño y Cocina (IDs 27-28)
-- ===================================
INSERT INTO product_variants (
  product_id, aikon_id, variant_slug, measure, 
  price_list, price_sale, stock, is_active, is_default,
  image_url, created_at, updated_at
)
SELECT
  27,
  p.aikon_id,
  p.slug,
  p.medida,
  p.price,
  p.discounted_price,
  p.stock,
  p.is_active,
  (p.id = 27),
  CASE 
    WHEN p.images IS NOT NULL AND jsonb_typeof(p.images) = 'array' THEN p.images->>0
    WHEN p.images IS NOT NULL AND jsonb_typeof(p.images) = 'object' THEN 
      COALESCE(p.images->'previews'->>0, p.images->'thumbnails'->>0, p.images->>'main')
    ELSE NULL
  END,
  p.created_at,
  p.updated_at
FROM products p
WHERE p.id IN (27, 28)
ON CONFLICT (product_id, variant_slug) DO UPDATE SET
  price_list = EXCLUDED.price_list,
  price_sale = EXCLUDED.price_sale,
  stock = EXCLUDED.stock;

DELETE FROM products WHERE id = 28;

UPDATE products SET 
  slug = 'recuplast-bano-cocina',
  name = 'Recuplast Baño y Cocina Antihumedad'
WHERE id = 27;

-- ===================================
-- GRUPO 9: Poximix Interior (IDs 29-32)
-- ===================================
INSERT INTO product_variants (
  product_id, aikon_id, variant_slug, measure, 
  price_list, price_sale, stock, is_active, is_default,
  image_url, created_at, updated_at
)
SELECT
  29,
  p.aikon_id,
  p.slug,
  p.medida,
  p.price,
  p.discounted_price,
  p.stock,
  p.is_active,
  (p.id = 29),
  CASE 
    WHEN p.images IS NOT NULL AND jsonb_typeof(p.images) = 'array' THEN p.images->>0
    WHEN p.images IS NOT NULL AND jsonb_typeof(p.images) = 'object' THEN 
      COALESCE(p.images->'previews'->>0, p.images->'thumbnails'->>0, p.images->>'main')
    ELSE NULL
  END,
  p.created_at,
  p.updated_at
FROM products p
WHERE p.id IN (29, 30, 31, 32)
ON CONFLICT (product_id, variant_slug) DO UPDATE SET
  price_list = EXCLUDED.price_list,
  price_sale = EXCLUDED.price_sale,
  stock = EXCLUDED.stock;

DELETE FROM products WHERE id IN (30, 31, 32);

UPDATE products SET 
  slug = 'poximix-interior',
  name = 'Poximix Interior'
WHERE id = 29;

-- ===================================
-- GRUPO 10: Barniz Campbell (IDs 33, 37)
-- ===================================
INSERT INTO product_variants (
  product_id, aikon_id, variant_slug, measure, 
  price_list, price_sale, stock, is_active, is_default,
  image_url, created_at, updated_at
)
SELECT
  33,
  p.aikon_id,
  p.slug,
  p.medida,
  p.price,
  p.discounted_price,
  p.stock,
  p.is_active,
  (p.id = 33),
  CASE 
    WHEN p.images IS NOT NULL AND jsonb_typeof(p.images) = 'array' THEN p.images->>0
    WHEN p.images IS NOT NULL AND jsonb_typeof(p.images) = 'object' THEN 
      COALESCE(p.images->'previews'->>0, p.images->'thumbnails'->>0, p.images->>'main')
    ELSE NULL
  END,
  p.created_at,
  p.updated_at
FROM products p
WHERE p.id IN (33, 37)
ON CONFLICT (product_id, variant_slug) DO UPDATE SET
  price_list = EXCLUDED.price_list,
  price_sale = EXCLUDED.price_sale,
  stock = EXCLUDED.stock;

DELETE FROM products WHERE id = 37;

UPDATE products SET 
  slug = 'barniz-campbell',
  name = 'Barniz Campbell'
WHERE id = 33;

-- ===================================
-- GRUPO 11: Impregnante Danzke DUPLICADO (IDs 70-72)
-- CASO ESPECIAL: Consolidar con ID 35
-- ===================================
-- Solo ID 70 tiene variantes nuevas (1L Satinado)
-- IDs 71 y 72 ya existen en producto 35, solo eliminamos

-- Primero verificar qué color tiene ID 70
-- Luego crear variantes 1L Satinado para los 6 colores si no existen

INSERT INTO product_variants (
  product_id, aikon_id, variant_slug, color_name, measure, finish,
  price_list, price_sale, stock, is_active, is_default,
  image_url, created_at, updated_at
)
SELECT
  35, -- Consolidar en producto 35 existente
  p.aikon_id,
  REPLACE(p.slug, 'impregnante-danzke-', 'impregnante-danzke-1l-satinado-'),
  CASE 
    WHEN p.name ILIKE '%caoba%' OR p.slug ILIKE '%caoba%' THEN 'CAOBA'
    WHEN p.name ILIKE '%cedro%' OR p.slug ILIKE '%cedro%' THEN 'CEDRO'
    WHEN p.name ILIKE '%cristal%' OR p.slug ILIKE '%cristal%' THEN 'CRISTAL'
    WHEN p.name ILIKE '%nogal%' OR p.slug ILIKE '%nogal%' THEN 'NOGAL'
    WHEN p.name ILIKE '%pino%' OR p.slug ILIKE '%pino%' THEN 'PINO'
    WHEN p.name ILIKE '%roble%' OR p.slug ILIKE '%roble%' THEN 'ROBLE'
    ELSE NULL
  END,
  p.medida,
  'Satinado', -- ID 70 es Satinado
  p.price,
  p.discounted_price,
  p.stock,
  p.is_active,
  false, -- No es default
  CASE 
    WHEN p.images IS NOT NULL AND jsonb_typeof(p.images) = 'array' THEN p.images->>0
    WHEN p.images IS NOT NULL AND jsonb_typeof(p.images) = 'object' THEN 
      COALESCE(p.images->'previews'->>0, p.images->'thumbnails'->>0, p.images->>'main')
    ELSE NULL
  END,
  p.created_at,
  p.updated_at
FROM products p
WHERE p.id = 70
ON CONFLICT (product_id, variant_slug) DO NOTHING; -- Evitar duplicados

DELETE FROM products WHERE id IN (70, 71, 72);

-- ===================================
-- GRUPO 12: Látex Muros (IDs 20-22)
-- Ya procesado arriba
-- ===================================

-- ===================================
-- GRUPO 13: Recuplast Frentes (IDs 39-42)
-- ===================================
INSERT INTO product_variants (
  product_id, aikon_id, variant_slug, measure, 
  price_list, price_sale, stock, is_active, is_default,
  image_url, created_at, updated_at
)
SELECT
  39,
  p.aikon_id,
  p.slug,
  p.medida,
  p.price,
  p.discounted_price,
  p.stock,
  p.is_active,
  (p.id = 39),
  CASE 
    WHEN p.images IS NOT NULL AND jsonb_typeof(p.images) = 'array' THEN p.images->>0
    WHEN p.images IS NOT NULL AND jsonb_typeof(p.images) = 'object' THEN 
      COALESCE(p.images->'previews'->>0, p.images->'thumbnails'->>0, p.images->>'main')
    ELSE NULL
  END,
  p.created_at,
  p.updated_at
FROM products p
WHERE p.id IN (39, 40, 41, 42)
ON CONFLICT (product_id, variant_slug) DO UPDATE SET
  price_list = EXCLUDED.price_list,
  price_sale = EXCLUDED.price_sale,
  stock = EXCLUDED.stock;

DELETE FROM products WHERE id IN (40, 41, 42);

UPDATE products SET 
  slug = 'recuplast-frentes',
  name = 'Recuplast Frentes'
WHERE id = 39;

-- ===================================
-- GRUPO 14: Poximix Exterior (IDs 48-51)
-- ===================================
INSERT INTO product_variants (
  product_id, aikon_id, variant_slug, measure, 
  price_list, price_sale, stock, is_active, is_default,
  image_url, created_at, updated_at
)
SELECT
  48,
  p.aikon_id,
  p.slug,
  p.medida,
  p.price,
  p.discounted_price,
  p.stock,
  p.is_active,
  (p.id = 48),
  CASE 
    WHEN p.images IS NOT NULL AND jsonb_typeof(p.images) = 'array' THEN p.images->>0
    WHEN p.images IS NOT NULL AND jsonb_typeof(p.images) = 'object' THEN 
      COALESCE(p.images->'previews'->>0, p.images->'thumbnails'->>0, p.images->>'main')
    ELSE NULL
  END,
  p.created_at,
  p.updated_at
FROM products p
WHERE p.id IN (48, 49, 50, 51)
ON CONFLICT (product_id, variant_slug) DO UPDATE SET
  price_list = EXCLUDED.price_list,
  price_sale = EXCLUDED.price_sale,
  stock = EXCLUDED.stock;

DELETE FROM products WHERE id IN (49, 50, 51);

UPDATE products SET 
  slug = 'poximix-exterior',
  name = 'Poximix Exterior'
WHERE id = 48;

-- ===================================
-- GRUPO 15: Cinta Papel Blanca (IDs 52-55)
-- ===================================
INSERT INTO product_variants (
  product_id, aikon_id, variant_slug, measure, 
  price_list, price_sale, stock, is_active, is_default,
  image_url, created_at, updated_at
)
SELECT
  52,
  p.aikon_id,
  p.slug,
  p.medida,
  p.price,
  p.discounted_price,
  p.stock,
  p.is_active,
  (p.id = 52),
  CASE 
    WHEN p.images IS NOT NULL AND jsonb_typeof(p.images) = 'array' THEN p.images->>0
    WHEN p.images IS NOT NULL AND jsonb_typeof(p.images) = 'object' THEN 
      COALESCE(p.images->'previews'->>0, p.images->'thumbnails'->>0, p.images->>'main')
    ELSE NULL
  END,
  p.created_at,
  p.updated_at
FROM products p
WHERE p.id IN (52, 53, 54, 55)
ON CONFLICT (product_id, variant_slug) DO UPDATE SET
  price_list = EXCLUDED.price_list,
  price_sale = EXCLUDED.price_sale,
  stock = EXCLUDED.stock;

DELETE FROM products WHERE id IN (53, 54, 55);

UPDATE products SET 
  slug = 'cinta-papel-blanca',
  name = 'Cinta Papel Blanca'
WHERE id = 52;

-- ===================================
-- GRUPO 16: Techos Poliuretánico (IDs 57-59)
-- ===================================
INSERT INTO product_variants (
  product_id, aikon_id, variant_slug, measure, 
  price_list, price_sale, stock, is_active, is_default,
  image_url, created_at, updated_at
)
SELECT
  57,
  p.aikon_id,
  p.slug,
  p.medida,
  p.price,
  p.discounted_price,
  p.stock,
  p.is_active,
  (p.id = 57),
  CASE 
    WHEN p.images IS NOT NULL AND jsonb_typeof(p.images) = 'array' THEN p.images->>0
    WHEN p.images IS NOT NULL AND jsonb_typeof(p.images) = 'object' THEN 
      COALESCE(p.images->'previews'->>0, p.images->'thumbnails'->>0, p.images->>'main')
    ELSE NULL
  END,
  p.created_at,
  p.updated_at
FROM products p
WHERE p.id IN (57, 58, 59)
ON CONFLICT (product_id, variant_slug) DO UPDATE SET
  price_list = EXCLUDED.price_list,
  price_sale = EXCLUDED.price_sale,
  stock = EXCLUDED.stock;

DELETE FROM products WHERE id IN (58, 59);

UPDATE products SET 
  slug = 'techos-poliuretanico',
  name = 'Techos Poliuretánico'
WHERE id = 57;

-- ===================================
-- GRUPO 17: Lija al Agua (IDs 87-91)
-- ===================================
INSERT INTO product_variants (
  product_id, aikon_id, variant_slug, measure, 
  price_list, price_sale, stock, is_active, is_default,
  image_url, created_at, updated_at
)
SELECT
  87,
  p.aikon_id,
  p.slug,
  p.medida,
  p.price,
  p.discounted_price,
  p.stock,
  p.is_active,
  (p.id = 87),
  CASE 
    WHEN p.images IS NOT NULL AND jsonb_typeof(p.images) = 'array' THEN p.images->>0
    WHEN p.images IS NOT NULL AND jsonb_typeof(p.images) = 'object' THEN 
      COALESCE(p.images->'previews'->>0, p.images->'thumbnails'->>0, p.images->>'main')
    ELSE NULL
  END,
  p.created_at,
  p.updated_at
FROM products p
WHERE p.id IN (87, 88, 89, 90, 91)
ON CONFLICT (product_id, variant_slug) DO UPDATE SET
  price_list = EXCLUDED.price_list,
  price_sale = EXCLUDED.price_sale,
  stock = EXCLUDED.stock;

DELETE FROM products WHERE id IN (88, 89, 90, 91);

UPDATE products SET 
  slug = 'lija-al-agua',
  name = 'Lija al Agua'
WHERE id = 87;

-- ===================================
-- RESUMEN DE CONSOLIDACIÓN
-- ===================================
-- Productos eliminados: 51 (de 54, ya que 70-72 solo eliminan 3)
-- Variantes creadas: ~54
-- Productos finales: 25 (63 - 38 eliminados)

