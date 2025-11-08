-- ===================================
-- PINTEYA E-COMMERCE - MIGRACIÓN COMPLETA A SISTEMA DE VARIANTES
-- ===================================
-- Este script debe ejecutarse en el siguiente orden:
-- 1. Crear tabla product_variants
-- 2. Migrar datos existentes
-- 3. Importar datos del CSV
-- 4. Crear vistas de compatibilidad
-- ===================================

-- PASO 1: CREAR TABLA PRODUCT_VARIANTS
-- ===================================

-- Crear tabla product_variants
CREATE TABLE IF NOT EXISTS product_variants (
  id BIGSERIAL PRIMARY KEY,
  product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  aikon_id VARCHAR(50) UNIQUE NOT NULL, -- Código único del SKU/variante
  variant_slug VARCHAR(255) UNIQUE NOT NULL, -- Slug único para la variante
  
  -- Atributos de la variante
  color_name VARCHAR(100), -- Nombre del color (ej: "Blanco", "Rojo Óxido")
  color_hex VARCHAR(7), -- Código hexadecimal del color (ej: "#FFFFFF")
  measure VARCHAR(50), -- Medida/capacidad (ej: "1L", "4L", "20L")
  finish VARCHAR(100), -- Terminación (ej: "Brillante", "Satinado", "Mate")
  
  -- Precios y stock específicos de la variante
  price_list DECIMAL(10,2) NOT NULL, -- Precio de lista
  price_sale DECIMAL(10,2), -- Precio de venta (con descuento)
  stock INTEGER DEFAULT 0 NOT NULL,
  
  -- Estado y configuración
  is_active BOOLEAN DEFAULT true NOT NULL,
  is_default BOOLEAN DEFAULT false NOT NULL, -- Solo una variante por producto puede ser default
  
  -- Imagen específica de la variante (opcional)
  image_url TEXT,
  
  -- Metadatos adicionales (JSON)
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_aikon_id ON product_variants(aikon_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_active ON product_variants(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_product_variants_default ON product_variants(product_id, is_default) WHERE is_default = true;
CREATE INDEX IF NOT EXISTS idx_product_variants_color ON product_variants(color_name) WHERE color_name IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_product_variants_measure ON product_variants(measure) WHERE measure IS NOT NULL;

-- Constraint para asegurar que solo haya una variante por defecto por producto
CREATE UNIQUE INDEX IF NOT EXISTS idx_product_variants_unique_default 
ON product_variants(product_id) 
WHERE is_default = true;

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_product_variants_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_product_variants_updated_at
  BEFORE UPDATE ON product_variants
  FOR EACH ROW
  EXECUTE FUNCTION update_product_variants_updated_at();

-- Función para asegurar que siempre haya una variante por defecto
CREATE OR REPLACE FUNCTION ensure_default_variant()
RETURNS TRIGGER AS $$
BEGIN
  -- Si se está eliminando la variante por defecto
  IF TG_OP = 'DELETE' AND OLD.is_default = true THEN
    -- Buscar otra variante activa del mismo producto para hacerla por defecto
    UPDATE product_variants 
    SET is_default = true 
    WHERE id = (
      SELECT id 
      FROM product_variants 
      WHERE product_id = OLD.product_id 
        AND id != OLD.id 
        AND is_active = true 
      ORDER BY created_at ASC 
      LIMIT 1
    );
  END IF;
  
  -- Si se está insertando una nueva variante por defecto
  IF TG_OP = 'INSERT' AND NEW.is_default = true THEN
    -- Quitar el flag de default de otras variantes del mismo producto
    UPDATE product_variants 
    SET is_default = false 
    WHERE product_id = NEW.product_id 
      AND id != NEW.id;
  END IF;
  
  -- Si se está actualizando una variante para ser por defecto
  IF TG_OP = 'UPDATE' AND NEW.is_default = true AND OLD.is_default = false THEN
    -- Quitar el flag de default de otras variantes del mismo producto
    UPDATE product_variants 
    SET is_default = false 
    WHERE product_id = NEW.product_id 
      AND id != NEW.id;
  END IF;
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_ensure_default_variant
  AFTER INSERT OR UPDATE OR DELETE ON product_variants
  FOR EACH ROW
  EXECUTE FUNCTION ensure_default_variant();

-- ===================================
-- PASO 2: MIGRAR DATOS EXISTENTES
-- ===================================

-- Función para migrar productos existentes a variantes
CREATE OR REPLACE FUNCTION migrate_existing_products_to_variants()
RETURNS TABLE(migrated_count INTEGER, error_count INTEGER) AS $$
DECLARE
  product_record RECORD;
  variant_slug TEXT;
  migrated INTEGER := 0;
  errors INTEGER := 0;
BEGIN
  -- Iterar sobre todos los productos existentes
  FOR product_record IN 
    SELECT id, name, slug, aikon_id, color, medida, price, discounted_price, stock, is_active
    FROM products 
    WHERE is_active = true
  LOOP
    BEGIN
      -- Generar slug único para la variante
      variant_slug := product_record.slug || '-default';
      
      -- Si ya existe, agregar sufijo numérico
      WHILE EXISTS (SELECT 1 FROM product_variants WHERE variant_slug = variant_slug) LOOP
        variant_slug := product_record.slug || '-default-' || (random() * 1000)::INTEGER;
      END LOOP;
      
      -- Insertar variante por defecto
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
        metadata
      ) VALUES (
        product_record.id,
        COALESCE(product_record.aikon_id, 'LEGACY-' || product_record.id),
        variant_slug,
        product_record.color,
        product_record.medida,
        product_record.price,
        product_record.discounted_price,
        product_record.stock,
        product_record.is_active,
        true, -- Es la variante por defecto
        jsonb_build_object('migrated_from_legacy', true, 'migration_date', NOW())
      );
      
      migrated := migrated + 1;
      
    EXCEPTION WHEN OTHERS THEN
      errors := errors + 1;
      RAISE NOTICE 'Error migrando producto ID %: %', product_record.id, SQLERRM;
    END;
  END LOOP;
  
  RETURN QUERY SELECT migrated, errors;
END;
$$ LANGUAGE plpgsql;

-- Ejecutar migración de datos existentes
SELECT * FROM migrate_existing_products_to_variants();

-- ===================================
-- PASO 3: PREPARAR IMPORTACIÓN DEL CSV
-- ===================================

-- Crear tabla temporal para importar CSV
CREATE TEMP TABLE IF NOT EXISTS temp_csv_products (
  nombre TEXT,
  codigo_aikon TEXT,
  color TEXT,
  medida TEXT,
  terminacion TEXT,
  precio_lista DECIMAL(10,2),
  precio_venta DECIMAL(10,2),
  stock INTEGER,
  categoria TEXT,
  marca TEXT,
  descripcion TEXT
);

-- Función para procesar múltiples valores separados por comas
CREATE OR REPLACE FUNCTION split_and_trim(input_text TEXT, delimiter TEXT DEFAULT ',')
RETURNS TEXT[] AS $$
BEGIN
  IF input_text IS NULL OR input_text = '' THEN
    RETURN ARRAY[]::TEXT[];
  END IF;
  
  RETURN array_agg(trim(unnest))
  FROM unnest(string_to_array(input_text, delimiter)) AS unnest
  WHERE trim(unnest) != '';
END;
$$ LANGUAGE plpgsql;

-- Función para generar slug único
CREATE OR REPLACE FUNCTION generate_unique_slug(base_name TEXT, suffix TEXT DEFAULT '')
RETURNS TEXT AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 1;
BEGIN
  -- Crear slug base
  base_slug := lower(regexp_replace(
    regexp_replace(base_name || CASE WHEN suffix != '' THEN '-' || suffix ELSE '' END, '[^a-zA-Z0-9\s-]', '', 'g'),
    '\s+', '-', 'g'
  ));
  
  final_slug := base_slug;
  
  -- Verificar unicidad
  WHILE EXISTS (SELECT 1 FROM products WHERE slug = final_slug) LOOP
    final_slug := base_slug || '-' || counter;
    counter := counter + 1;
  END LOOP;
  
  RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- Función para obtener o crear categoría
CREATE OR REPLACE FUNCTION get_or_create_category(category_name TEXT)
RETURNS INTEGER AS $$
DECLARE
  category_id INTEGER;
  category_slug TEXT;
BEGIN
  -- Buscar categoría existente
  SELECT id INTO category_id 
  FROM categories 
  WHERE LOWER(name) = LOWER(category_name);
  
  -- Si no existe, crearla
  IF category_id IS NULL THEN
    category_slug := generate_unique_slug(category_name);
    
    INSERT INTO categories (name, slug, description, is_active)
    VALUES (category_name, category_slug, 'Categoría importada desde CSV', true)
    RETURNING id INTO category_id;
  END IF;
  
  RETURN category_id;
END;
$$ LANGUAGE plpgsql;

-- Función principal para procesar productos del CSV
CREATE OR REPLACE FUNCTION process_csv_products()
RETURNS TABLE(
  processed_products INTEGER,
  created_variants INTEGER,
  errors INTEGER,
  error_details TEXT[]
) AS $$
DECLARE
  csv_record RECORD;
  product_id INTEGER;
  category_id INTEGER;
  product_slug TEXT;
  variant_slug TEXT;
  colors TEXT[];
  measures TEXT[];
  color_item TEXT;
  measure_item TEXT;
  base_aikon TEXT;
  variant_aikon TEXT;
  processed INTEGER := 0;
  variants_created INTEGER := 0;
  error_count INTEGER := 0;
  error_list TEXT[] := ARRAY[]::TEXT[];
  counter INTEGER;
BEGIN
  -- Procesar cada registro del CSV
  FOR csv_record IN SELECT * FROM temp_csv_products LOOP
    BEGIN
      -- Obtener o crear categoría
      category_id := get_or_create_category(csv_record.categoria);
      
      -- Generar slug único para el producto
      product_slug := generate_unique_slug(csv_record.nombre);
      
      -- Buscar si el producto ya existe (por nombre similar)
      SELECT id INTO product_id 
      FROM products 
      WHERE LOWER(name) = LOWER(csv_record.nombre)
      LIMIT 1;
      
      -- Si no existe, crear producto base
      IF product_id IS NULL THEN
        INSERT INTO products (
          name, slug, description, brand, category_id, 
          price, discounted_price, stock, is_active,
          created_at, updated_at
        ) VALUES (
          csv_record.nombre,
          product_slug,
          COALESCE(csv_record.descripcion, 'Producto importado desde CSV'),
          csv_record.marca,
          category_id,
          csv_record.precio_lista,
          NULLIF(csv_record.precio_venta, csv_record.precio_lista),
          COALESCE(csv_record.stock, 0),
          true,
          NOW(),
          NOW()
        ) RETURNING id INTO product_id;
      END IF;
      
      processed := processed + 1;
      
      -- Procesar colores y medidas
      colors := split_and_trim(COALESCE(csv_record.color, 'Sin Color'));
      measures := split_and_trim(COALESCE(csv_record.medida, 'Estándar'));
      
      -- Si no hay colores o medidas, usar valores por defecto
      IF array_length(colors, 1) IS NULL THEN
        colors := ARRAY['Sin Color'];
      END IF;
      
      IF array_length(measures, 1) IS NULL THEN
        measures := ARRAY['Estándar'];
      END IF;
      
      -- Crear variantes para cada combinación de color y medida
      counter := 1;
      FOREACH color_item IN ARRAY colors LOOP
        FOREACH measure_item IN ARRAY measures LOOP
          -- Generar código Aikon único
          base_aikon := COALESCE(csv_record.codigo_aikon, 'CSV-' || product_id);
          variant_aikon := base_aikon || '-' || counter;
          
          -- Verificar unicidad del código Aikon
          WHILE EXISTS (SELECT 1 FROM product_variants WHERE aikon_id = variant_aikon) LOOP
            counter := counter + 1;
            variant_aikon := base_aikon || '-' || counter;
          END LOOP;
          
          -- Generar slug único para la variante
          variant_slug := product_slug || '-' || 
                         lower(regexp_replace(color_item, '[^a-zA-Z0-9]', '', 'g')) || '-' ||
                         lower(regexp_replace(measure_item, '[^a-zA-Z0-9]', '', 'g'));
          
          -- Verificar unicidad del slug
          WHILE EXISTS (SELECT 1 FROM product_variants WHERE variant_slug = variant_slug) LOOP
            variant_slug := variant_slug || '-' || counter;
            counter := counter + 1;
          END LOOP;
          
          -- Insertar variante
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
            metadata
          ) VALUES (
            product_id,
            variant_aikon,
            variant_slug,
            color_item,
            measure_item,
            csv_record.terminacion,
            csv_record.precio_lista,
            NULLIF(csv_record.precio_venta, csv_record.precio_lista),
            COALESCE(csv_record.stock, 0),
            true,
            (counter = 1), -- Primera variante es por defecto
            jsonb_build_object(
              'imported_from_csv', true,
              'import_date', NOW(),
              'original_aikon', csv_record.codigo_aikon
            )
          );
          
          variants_created := variants_created + 1;
          counter := counter + 1;
        END LOOP;
      END LOOP;
      
    EXCEPTION WHEN OTHERS THEN
      error_count := error_count + 1;
      error_list := array_append(error_list, 
        'Error procesando ' || csv_record.nombre || ': ' || SQLERRM);
    END;
  END LOOP;
  
  RETURN QUERY SELECT processed, variants_created, error_count, error_list;
END;
$$ LANGUAGE plpgsql;

-- ===================================
-- PASO 4: CREAR VISTAS DE COMPATIBILIDAD
-- ===================================

-- Vista para mantener compatibilidad con el sistema anterior
CREATE OR REPLACE VIEW products_with_default_variant AS
SELECT 
  p.id,
  p.name,
  p.slug,
  p.description,
  p.brand,
  p.category_id,
  p.images,
  p.created_at,
  p.updated_at,
  p.is_active,
  -- Campos de la variante por defecto
  COALESCE(pv.aikon_id, p.aikon_id) as aikon_id,
  COALESCE(pv.color_name, p.color) as color,
  COALESCE(pv.measure, p.medida) as medida,
  COALESCE(pv.price_list, p.price) as price,
  COALESCE(pv.price_sale, p.discounted_price) as discounted_price,
  COALESCE(pv.stock, p.stock) as stock,
  -- Información adicional de variantes
  pv.id as variant_id,
  pv.variant_slug,
  pv.color_hex,
  pv.finish,
  pv.image_url as variant_image_url,
  (SELECT COUNT(*) FROM product_variants WHERE product_id = p.id AND is_active = true) as variant_count
FROM products p
LEFT JOIN product_variants pv ON p.id = pv.product_id AND pv.is_default = true
WHERE p.is_active = true;

-- Funciones auxiliares para obtener variantes
CREATE OR REPLACE FUNCTION get_product_variants(product_id_param INTEGER)
RETURNS TABLE(
  id INTEGER,
  aikon_id VARCHAR(50),
  variant_slug VARCHAR(255),
  color_name VARCHAR(100),
  color_hex VARCHAR(7),
  measure VARCHAR(50),
  finish VARCHAR(100),
  price_list DECIMAL(10,2),
  price_sale DECIMAL(10,2),
  stock INTEGER,
  is_active BOOLEAN,
  is_default BOOLEAN,
  image_url TEXT,
  metadata JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pv.id::INTEGER,
    pv.aikon_id,
    pv.variant_slug,
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
    pv.metadata
  FROM product_variants pv
  WHERE pv.product_id = product_id_param
    AND pv.is_active = true
  ORDER BY pv.is_default DESC, pv.created_at ASC;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_default_variant(product_id_param INTEGER)
RETURNS TABLE(
  id INTEGER,
  aikon_id VARCHAR(50),
  variant_slug VARCHAR(255),
  color_name VARCHAR(100),
  color_hex VARCHAR(7),
  measure VARCHAR(50),
  finish VARCHAR(100),
  price_list DECIMAL(10,2),
  price_sale DECIMAL(10,2),
  stock INTEGER,
  image_url TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pv.id::INTEGER,
    pv.aikon_id,
    pv.variant_slug,
    pv.color_name,
    pv.color_hex,
    pv.measure,
    pv.finish,
    pv.price_list,
    pv.price_sale,
    pv.stock,
    pv.image_url
  FROM product_variants pv
  WHERE pv.product_id = product_id_param
    AND pv.is_default = true
    AND pv.is_active = true
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- ===================================
-- PASO 5: FUNCIÓN PARA MOSTRAR ESTADÍSTICAS
-- ===================================

CREATE OR REPLACE FUNCTION show_migration_stats()
RETURNS TABLE(
  total_products INTEGER,
  total_variants INTEGER,
  products_with_variants INTEGER,
  products_without_variants INTEGER,
  avg_variants_per_product DECIMAL(5,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*)::INTEGER FROM products WHERE is_active = true) as total_products,
    (SELECT COUNT(*)::INTEGER FROM product_variants WHERE is_active = true) as total_variants,
    (SELECT COUNT(DISTINCT product_id)::INTEGER FROM product_variants WHERE is_active = true) as products_with_variants,
    (SELECT COUNT(*)::INTEGER FROM products p WHERE is_active = true AND NOT EXISTS (
      SELECT 1 FROM product_variants pv WHERE pv.product_id = p.id AND pv.is_active = true
    )) as products_without_variants,
    (SELECT ROUND(AVG(variant_count), 2) FROM (
      SELECT COUNT(*) as variant_count 
      FROM product_variants 
      WHERE is_active = true 
      GROUP BY product_id
    ) sub) as avg_variants_per_product;
END;
$$ LANGUAGE plpgsql;

-- ===================================
-- INSTRUCCIONES DE USO
-- ===================================

/*
INSTRUCCIONES PARA EJECUTAR LA MIGRACIÓN:

1. Ejecutar este script completo en Supabase SQL Editor

2. Para importar el CSV, primero cargar los datos en la tabla temporal:
   
   COPY temp_csv_products(nombre, codigo_aikon, color, medida, terminacion, precio_lista, precio_venta, stock, categoria, marca, descripcion)
   FROM '/ruta/al/productos_pinteya.csv'
   DELIMITER ','
   CSV HEADER;

3. Ejecutar el procesamiento del CSV:
   
   SELECT * FROM process_csv_products();

4. Verificar estadísticas de migración:
   
   SELECT * FROM show_migration_stats();

5. Opcional: Comentar campos legacy en la tabla products:
   
   COMMENT ON COLUMN products.aikon_id IS 'DEPRECATED: Usar product_variants.aikon_id';
   COMMENT ON COLUMN products.color IS 'DEPRECATED: Usar product_variants.color_name';
   COMMENT ON COLUMN products.medida IS 'DEPRECATED: Usar product_variants.measure';

NOTAS IMPORTANTES:
- Las APIs ya están actualizadas para usar el nuevo sistema de variantes
- Se mantiene compatibilidad con el sistema anterior mediante la vista products_with_default_variant
- Cada producto tendrá al menos una variante por defecto
- Los códigos Aikon serán únicos en toda la tabla de variantes
*/