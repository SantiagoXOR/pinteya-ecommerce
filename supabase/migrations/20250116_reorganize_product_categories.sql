-- ===================================
-- REORGANIZACIÓN DE CATEGORÍAS DE PRODUCTOS - PINTEYA E-COMMERCE
-- De 12 categorías a 8 categorías optimizadas
-- Fecha: 2025-01-16
-- ===================================

-- PASO 1: Crear nuevas categorías con sus imágenes
-- ===================================

-- 1. Paredes (fusiona Interiores + parte de Exteriores)
INSERT INTO categories (id, name, slug, parent_id, image_url, created_at, updated_at)
VALUES (38, 'Paredes', 'paredes', NULL, 'https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/categories/interiores.webp', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET 
    image_url = EXCLUDED.image_url,
    updated_at = NOW();

-- 2. Metales y Maderas (fusiona Maderas + Sintéticos)
INSERT INTO categories (id, name, slug, parent_id, image_url, created_at, updated_at)
VALUES (39, 'Metales y Maderas', 'metales-y-maderas', NULL, 'https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/categories/maderas.webp', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET 
    image_url = EXCLUDED.image_url,
    updated_at = NOW();

-- 3. Complementos (renombra Profesionales)
INSERT INTO categories (id, name, slug, parent_id, image_url, created_at, updated_at)
VALUES (40, 'Complementos', 'complementos', NULL, 'https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/categories/profesionales.webp', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET 
    image_url = EXCLUDED.image_url,
    updated_at = NOW();

-- 4. Antihumedad (renombra Humedades)
INSERT INTO categories (id, name, slug, parent_id, image_url, created_at, updated_at)
VALUES (41, 'Antihumedad', 'antihumedad', NULL, 'https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/categories/humedades.webp', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET 
    image_url = EXCLUDED.image_url,
    updated_at = NOW();

-- 5. Pisos (nueva categoría para barnices)
INSERT INTO categories (id, name, slug, parent_id, image_url, created_at, updated_at)
VALUES (42, 'Pisos', 'pisos', NULL, 'https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/categories/terminaciones.webp', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET 
    image_url = EXCLUDED.image_url,
    updated_at = NOW();

-- Nota: Techos (35), Reparaciones (33) y Piscinas (37) se mantienen


-- PASO 2: Migrar productos a nuevas categorías
-- ===================================

-- 2.1 Migrar productos de INTERIORES a PAREDES (7 productos)
UPDATE products 
SET category_id = 38, updated_at = NOW()
WHERE category_id = 29
  AND name IN ('Látex Interior', 'Recuplast Interior');

-- 2.2 Migrar productos de EXTERIORES a PAREDES (10 productos - excepto Poximix Exterior)
UPDATE products 
SET category_id = 38, updated_at = NOW()
WHERE category_id = 27
  AND name IN ('Látex Frentes', 'Látex Muros', 'Recuplast Frentes');

-- 2.3 Migrar Poximix Exterior de EXTERIORES a REPARACIONES (4 productos)
UPDATE products 
SET category_id = 33, updated_at = NOW()
WHERE category_id = 27
  AND name = 'Poximix Exterior';

-- 2.4 Migrar productos de MADERAS a METALES Y MADERAS (4 productos)
UPDATE products 
SET category_id = 39, updated_at = NOW()
WHERE category_id = 30
  AND name = 'Impregnante Danzke';

-- 2.5 Migrar productos de SINTÉTICOS a METALES Y MADERAS (2 productos)
UPDATE products 
SET category_id = 39, updated_at = NOW()
WHERE category_id = 34
  AND name = 'Sintético Converlux';

-- 2.6 Migrar productos de PROFESIONALES a COMPLEMENTOS (17 productos)
UPDATE products 
SET category_id = 40, updated_at = NOW()
WHERE category_id = 32;

-- 2.7 Migrar productos de HUMEDADES a ANTIHUMEDAD (2 productos)
UPDATE products 
SET category_id = 41, updated_at = NOW()
WHERE category_id = 28
  AND name = 'Recuplast Baño y Cocina Antihumedad';

-- 2.8 Migrar productos de TERMINACIONES a PISOS (2 productos - Barniz Campbell)
UPDATE products 
SET category_id = 42, updated_at = NOW()
WHERE category_id = 36
  AND name = 'Barniz Campbell';


-- PASO 3: Eliminar categorías obsoletas
-- ===================================

-- Verificar que no queden productos en las categorías antiguas
DO $$
DECLARE
    products_in_old_categories INTEGER;
BEGIN
    SELECT COUNT(*) INTO products_in_old_categories
    FROM products
    WHERE category_id IN (26, 27, 28, 29, 30, 31, 32, 34, 36);
    
    IF products_in_old_categories > 0 THEN
        RAISE EXCEPTION 'Aún hay % productos en categorías antiguas. Revisar migración.', products_in_old_categories;
    END IF;
END $$;

-- Eliminar categorías obsoletas (solo si no tienen productos)
DELETE FROM categories WHERE id IN (
    26, -- Accesorios (vacía)
    27, -- Exteriores (migrada a Paredes y Reparaciones)
    28, -- Humedades (migrada a Antihumedad)
    29, -- Interiores (migrada a Paredes)
    30, -- Maderas (migrada a Metales y Maderas)
    31, -- Preparaciones (vacía)
    32, -- Profesionales (migrada a Complementos)
    34, -- Sintéticos (migrada a Metales y Maderas)
    36  -- Terminaciones (migrada a Pisos)
);


-- PASO 4: Verificación y reporte
-- ===================================

-- Mostrar resumen de productos por categoría nueva
DO $$
DECLARE
    rec RECORD;
BEGIN
    RAISE NOTICE '=== RESUMEN DE REORGANIZACIÓN DE CATEGORÍAS ===';
    RAISE NOTICE '';
    
    FOR rec IN 
        SELECT 
            c.name as category_name,
            COUNT(p.id) as product_count
        FROM categories c
        LEFT JOIN products p ON p.category_id = c.id
        WHERE c.id IN (33, 35, 37, 38, 39, 40, 41, 42)
        GROUP BY c.id, c.name
        ORDER BY c.id
    LOOP
        RAISE NOTICE '% : % productos', rec.category_name, rec.product_count;
    END LOOP;
    
    RAISE NOTICE '';
    RAISE NOTICE '=== Migración completada exitosamente ===';
END $$;

-- Crear índice para mejorar consultas por categoría
CREATE INDEX IF NOT EXISTS idx_products_category_id_active 
ON products(category_id, is_active);

-- Actualizar estadísticas
ANALYZE categories;
ANALYZE products;

