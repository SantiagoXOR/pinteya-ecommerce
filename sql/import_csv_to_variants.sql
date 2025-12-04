-- Script para importar datos del CSV productos_pinteya.csv con soporte para variantes
-- Este script maneja productos con múltiples colores y medidas

BEGIN;

-- 1. Crear tabla temporal para importar el CSV
CREATE TEMP TABLE temp_csv_products (
    id INTEGER,
    nombre TEXT,
    marca TEXT,
    categoria TEXT,
    codigo_aikon TEXT,
    color TEXT,
    medida TEXT,
    terminacion TEXT
);

-- 2. Función para procesar múltiples valores separados por comas
CREATE OR REPLACE FUNCTION split_and_trim(input_text TEXT, delimiter TEXT DEFAULT ',')
RETURNS TEXT[] AS $$
BEGIN
    IF input_text IS NULL OR input_text = '' THEN
        RETURN ARRAY[]::TEXT[];
    END IF;
    
    RETURN ARRAY(
        SELECT TRIM(unnest(string_to_array(input_text, delimiter)))
    );
END;
$$ LANGUAGE plpgsql;

-- 3. Función para generar slug único
CREATE OR REPLACE FUNCTION generate_unique_slug(base_text TEXT, table_name TEXT DEFAULT 'products')
RETURNS TEXT AS $$
DECLARE
    base_slug TEXT;
    final_slug TEXT;
    counter INTEGER := 0;
    exists_check BOOLEAN;
BEGIN
    -- Generar slug base
    base_slug := lower(regexp_replace(
        regexp_replace(
            regexp_replace(base_text, '[áàäâ]', 'a', 'g'),
            '[éèëê]', 'e', 'g'
        ),
        '[^a-z0-9]+', '-', 'g'
    ));
    base_slug := trim(both '-' from base_slug);
    
    final_slug := base_slug;
    
    -- Verificar unicidad
    LOOP
        IF table_name = 'products' THEN
            SELECT EXISTS(SELECT 1 FROM products WHERE slug = final_slug) INTO exists_check;
        ELSE
            SELECT EXISTS(SELECT 1 FROM product_variants WHERE variant_slug = final_slug) INTO exists_check;
        END IF;
        
        IF NOT exists_check THEN
            EXIT;
        END IF;
        
        counter := counter + 1;
        final_slug := base_slug || '-' || counter;
    END LOOP;
    
    RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- 4. Función para obtener o crear categoría
CREATE OR REPLACE FUNCTION get_or_create_category(category_name TEXT)
RETURNS INTEGER AS $$
DECLARE
    category_id INTEGER;
    category_slug TEXT;
BEGIN
    -- Buscar categoría existente
    SELECT id INTO category_id
    FROM categories
    WHERE UPPER(name) = UPPER(TRIM(category_name));
    
    IF category_id IS NOT NULL THEN
        RETURN category_id;
    END IF;
    
    -- Crear nueva categoría
    category_slug := generate_unique_slug(category_name, 'categories');
    
    INSERT INTO categories (name, slug, description, is_active)
    VALUES (
        TRIM(category_name),
        category_slug,
        'Categoría importada desde CSV',
        true
    )
    RETURNING id INTO category_id;
    
    RETURN category_id;
END;
$$ LANGUAGE plpgsql;

-- 5. Función principal para procesar productos del CSV
CREATE OR REPLACE FUNCTION process_csv_products()
RETURNS VOID AS $$
DECLARE
    csv_row RECORD;
    product_id INTEGER;
    category_id INTEGER;
    product_slug TEXT;
    colors TEXT[];
    medidas TEXT[];
    color_item TEXT;
    medida_item TEXT;
    variant_counter INTEGER;
    is_first_variant BOOLEAN;
    aikon_base TEXT;
    variant_aikon TEXT;
    variant_slug TEXT;
BEGIN
    -- Procesar cada fila del CSV
    FOR csv_row IN SELECT * FROM temp_csv_products LOOP
        
        -- Obtener o crear categoría
        category_id := get_or_create_category(csv_row.categoria);
        
        -- Generar slug único para el producto
        product_slug := generate_unique_slug(csv_row.nombre);
        
        -- Verificar si el producto ya existe
        SELECT id INTO product_id
        FROM products
        WHERE slug = product_slug;
        
        -- Si no existe, crear el producto base
        IF product_id IS NULL THEN
            INSERT INTO products (
                name,
                slug,
                description,
                category_id,
                brand,
                price,
                discounted_price,
                stock,
                is_active,
                images,
                created_at,
                updated_at
            )
            VALUES (
                TRIM(csv_row.nombre),
                product_slug,
                'Producto importado desde CSV - ' || TRIM(csv_row.nombre),
                category_id,
                TRIM(csv_row.marca),
                0, -- Precio por defecto, se actualizará con las variantes
                0,
                0, -- Stock por defecto, se actualizará con las variantes
                true,
                '{"main": "", "gallery": [], "previews": [], "thumbnail": "", "thumbnails": []}',
                NOW(),
                NOW()
            )
            RETURNING id INTO product_id;
        END IF;
        
        -- Procesar colores y medidas
        colors := split_and_trim(csv_row.color);
        medidas := split_and_trim(csv_row.medida);
        
        -- Si no hay colores o medidas específicas, usar valores por defecto
        IF array_length(colors, 1) IS NULL OR colors = ARRAY[''] THEN
            colors := ARRAY['ESTÁNDAR'];
        END IF;
        
        IF array_length(medidas, 1) IS NULL OR medidas = ARRAY[''] THEN
            medidas := ARRAY['ÚNICO'];
        END IF;
        
        -- Crear variantes para cada combinación de color y medida
        variant_counter := 0;
        is_first_variant := true;
        aikon_base := COALESCE(csv_row.codigo_aikon, 'SKU-' || product_id);
        
        FOREACH color_item IN ARRAY colors LOOP
            FOREACH medida_item IN ARRAY medidas LOOP
                variant_counter := variant_counter + 1;
                
                -- Generar código aikon único para la variante
                IF variant_counter = 1 AND csv_row.codigo_aikon IS NOT NULL THEN
                    variant_aikon := csv_row.codigo_aikon;
                ELSE
                    variant_aikon := aikon_base || '-V' || variant_counter;
                END IF;
                
                -- Generar slug único para la variante
                variant_slug := generate_unique_slug(
                    csv_row.nombre || '-' || color_item || '-' || medida_item,
                    'product_variants'
                );
                
                -- Insertar variante (si no existe ya)
                INSERT INTO product_variants (
                    product_id,
                    aikon_id,
                    variant_slug,
                    color_name,
                    measure,
                    finish,
                    price_list,
                    price_sale,
                    stock,
                    is_active,
                    is_default,
                    created_at,
                    updated_at
                )
                VALUES (
                    product_id,
                    variant_aikon,
                    variant_slug,
                    UPPER(TRIM(color_item)),
                    UPPER(TRIM(medida_item)),
                    CASE 
                        WHEN csv_row.terminacion IS NOT NULL AND csv_row.terminacion != '' 
                        THEN UPPER(TRIM(csv_row.terminacion))
                        ELSE NULL 
                    END,
                    0, -- Precio por defecto
                    0, -- Precio de venta por defecto
                    0, -- Stock por defecto
                    true,
                    is_first_variant, -- Solo la primera variante es por defecto
                    NOW(),
                    NOW()
                )
                ON CONFLICT (aikon_id) DO NOTHING; -- Evitar duplicados
                
                is_first_variant := false;
            END LOOP;
        END LOOP;
        
        RAISE NOTICE 'Procesado producto: % (ID: %) con % variantes', 
                     csv_row.nombre, product_id, variant_counter;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 6. Instrucciones para importar el CSV
-- NOTA: Ejecutar manualmente después de cargar los datos del CSV

/*
-- Para cargar el CSV, usar uno de estos métodos:

-- Método 1: COPY desde archivo (requiere permisos de superusuario)
COPY temp_csv_products(id, nombre, marca, categoria, codigo_aikon, color, medida, terminacion)
FROM 'C:\Users\marti\Desktop\DESARROLLOSW\BOILERPLATTE E-COMMERCE\productos_pinteya.csv'
WITH (FORMAT csv, HEADER true, DELIMITER ',', ENCODING 'UTF8');

-- Método 2: Insertar datos manualmente (más seguro)
-- INSERT INTO temp_csv_products VALUES 
-- (1, 'Cielorraso', 'ALBA', 'PINTURAS', 'ALB001', 'BLANCO', '1L,4L,10L,20L', 'MATE'),
-- (2, 'Látex Muros', 'ALBA', 'PINTURAS', 'ALB002', 'BLANCO,HUESO', '4L,10L', 'SATINADO'),
-- ... (continuar con todos los productos del CSV)
*/

-- 7. Ejecutar el procesamiento después de cargar los datos
-- SELECT process_csv_products();

-- 8. Limpiar tabla temporal
-- DROP TABLE temp_csv_products;

-- 9. Mostrar estadísticas finales
CREATE OR REPLACE FUNCTION show_import_stats()
RETURNS TABLE (
    descripcion TEXT,
    cantidad BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        'Productos totales'::TEXT as descripcion,
        COUNT(*)::BIGINT as cantidad
    FROM products
    UNION ALL
    SELECT 
        'Categorías totales'::TEXT as descripcion,
        COUNT(*)::BIGINT as cantidad
    FROM categories
    UNION ALL
    SELECT 
        'Variantes totales'::TEXT as descripcion,
        COUNT(*)::BIGINT as cantidad
    FROM product_variants
    UNION ALL
    SELECT 
        'Productos con variantes'::TEXT as descripcion,
        COUNT(DISTINCT product_id)::BIGINT as cantidad
    FROM product_variants
    UNION ALL
    SELECT 
        'Variantes por defecto'::TEXT as descripcion,
        COUNT(*)::BIGINT as cantidad
    FROM product_variants
    WHERE is_default = true;
END;
$$ LANGUAGE plpgsql;

COMMIT;

-- Mostrar instrucciones
SELECT 'INSTRUCCIONES DE USO:' as mensaje
UNION ALL
SELECT '1. Cargar datos del CSV en temp_csv_products'
UNION ALL
SELECT '2. Ejecutar: SELECT process_csv_products();'
UNION ALL
SELECT '3. Verificar: SELECT * FROM show_import_stats();'
UNION ALL
SELECT '4. Limpiar: DROP TABLE temp_csv_products;';