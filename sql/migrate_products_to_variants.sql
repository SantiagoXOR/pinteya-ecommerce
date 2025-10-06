-- Script de migración para mover datos de products a product_variants
-- Este script migra los datos existentes manteniendo la integridad referencial

BEGIN;

-- 1. Crear la tabla product_variants (ejecutar create_product_variants_table.sql primero)

-- 2. Migrar datos existentes de products a product_variants
INSERT INTO product_variants (
    product_id,
    aikon_id,
    variant_slug,
    color_name,
    measure,
    price_list,
    price_sale,
    stock,
    is_active,
    is_default,
    created_at,
    updated_at
)
SELECT 
    p.id as product_id,
    COALESCE(p.aikon_id, 'SKU-' || p.id) as aikon_id, -- Usar aikon_id existente o generar uno
    p.slug || '-default' as variant_slug, -- Crear slug único para la variante
    UPPER(TRIM(p.color)) as color_name, -- Normalizar color
    UPPER(TRIM(p.medida)) as measure, -- Normalizar medida
    p.price as price_list,
    COALESCE(p.discounted_price, p.price) as price_sale,
    p.stock,
    p.is_active,
    true as is_default, -- Marcar como variante por defecto
    p.created_at,
    p.updated_at
FROM products p
WHERE p.aikon_id IS NOT NULL 
   OR p.color IS NOT NULL 
   OR p.medida IS NOT NULL;

-- 3. Actualizar productos que no tienen aikon_id, color o medida
-- Crear variantes por defecto para productos sin estas características
INSERT INTO product_variants (
    product_id,
    aikon_id,
    variant_slug,
    color_name,
    measure,
    price_list,
    price_sale,
    stock,
    is_active,
    is_default,
    created_at,
    updated_at
)
SELECT 
    p.id as product_id,
    'SKU-' || p.id as aikon_id,
    p.slug || '-default' as variant_slug,
    'ESTÁNDAR' as color_name,
    'ÚNICO' as measure,
    p.price as price_list,
    COALESCE(p.discounted_price, p.price) as price_sale,
    p.stock,
    p.is_active,
    true as is_default,
    p.created_at,
    p.updated_at
FROM products p
WHERE p.id NOT IN (SELECT DISTINCT product_id FROM product_variants);

-- 4. Verificar que todos los productos tienen al menos una variante
DO $$
DECLARE
    products_without_variants INTEGER;
BEGIN
    SELECT COUNT(*) INTO products_without_variants
    FROM products p
    LEFT JOIN product_variants pv ON p.id = pv.product_id
    WHERE pv.product_id IS NULL;
    
    IF products_without_variants > 0 THEN
        RAISE EXCEPTION 'Hay % productos sin variantes después de la migración', products_without_variants;
    END IF;
    
    RAISE NOTICE 'Migración completada exitosamente. Todos los productos tienen variantes.';
END $$;

-- 5. Crear vista para mantener compatibilidad con consultas existentes
CREATE OR REPLACE VIEW products_with_default_variant AS
SELECT 
    p.id,
    p.name,
    p.slug,
    p.description,
    p.category_id,
    p.images,
    p.brand,
    p.created_at as product_created_at,
    p.updated_at as product_updated_at,
    
    -- Datos de la variante por defecto
    pv.id as variant_id,
    pv.aikon_id,
    pv.color_name as color,
    pv.measure as medida,
    pv.price_list as price,
    pv.price_sale as discounted_price,
    pv.stock,
    pv.is_active,
    pv.image_url as variant_image,
    pv.created_at as variant_created_at,
    pv.updated_at as variant_updated_at
FROM products p
LEFT JOIN product_variants pv ON p.id = pv.product_id AND pv.is_default = true;

-- 6. Comentar las columnas que se van a deprecar en products
-- NOTA: No eliminar aún para mantener compatibilidad durante la transición
COMMENT ON COLUMN products.aikon_id IS 'DEPRECATED: Usar product_variants.aikon_id';
COMMENT ON COLUMN products.color IS 'DEPRECATED: Usar product_variants.color_name';
COMMENT ON COLUMN products.medida IS 'DEPRECATED: Usar product_variants.measure';
COMMENT ON COLUMN products.price IS 'DEPRECATED: Usar product_variants.price_list';
COMMENT ON COLUMN products.discounted_price IS 'DEPRECATED: Usar product_variants.price_sale';
COMMENT ON COLUMN products.stock IS 'DEPRECATED: Usar product_variants.stock';

-- 7. Crear función para obtener todas las variantes de un producto
CREATE OR REPLACE FUNCTION get_product_variants(product_id_param INTEGER)
RETURNS TABLE (
    variant_id INTEGER,
    aikon_id VARCHAR(50),
    color_name VARCHAR(100),
    color_hex VARCHAR(7),
    measure VARCHAR(50),
    finish VARCHAR(50),
    price_list DECIMAL(10,2),
    price_sale DECIMAL(10,2),
    stock INTEGER,
    is_active BOOLEAN,
    is_default BOOLEAN,
    image_url TEXT,
    variant_slug VARCHAR(255)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pv.id,
        pv.aikon_id,
        pv.color_name,
        pv.color_hex,
        pv.measure,
        pv.finish,
        pv.price_list,
        pv.price_sale,
        pv.stock,
        pv.is_active,
        pv.is_default,
        pv.image_url,
        pv.variant_slug
    FROM product_variants pv
    WHERE pv.product_id = product_id_param
    ORDER BY pv.is_default DESC, pv.color_name, pv.measure;
END;
$$ LANGUAGE plpgsql;

-- 8. Crear función para obtener la variante por defecto de un producto
CREATE OR REPLACE FUNCTION get_default_variant(product_id_param INTEGER)
RETURNS product_variants AS $$
DECLARE
    default_variant product_variants;
BEGIN
    SELECT * INTO default_variant
    FROM product_variants
    WHERE product_id = product_id_param AND is_default = true
    LIMIT 1;
    
    -- Si no hay variante por defecto, tomar la primera activa
    IF default_variant IS NULL THEN
        SELECT * INTO default_variant
        FROM product_variants
        WHERE product_id = product_id_param AND is_active = true
        ORDER BY created_at ASC
        LIMIT 1;
    END IF;
    
    RETURN default_variant;
END;
$$ LANGUAGE plpgsql;

COMMIT;

-- Mostrar estadísticas de la migración
SELECT 
    'Productos totales' as descripcion,
    COUNT(*) as cantidad
FROM products
UNION ALL
SELECT 
    'Variantes creadas' as descripcion,
    COUNT(*) as cantidad
FROM product_variants
UNION ALL
SELECT 
    'Productos con variantes' as descripcion,
    COUNT(DISTINCT product_id) as cantidad
FROM product_variants
UNION ALL
SELECT 
    'Variantes por defecto' as descripcion,
    COUNT(*) as cantidad
FROM product_variants
WHERE is_default = true;