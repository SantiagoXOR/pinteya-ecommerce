-- ===================================
-- SISTEMA DE VARIANTES DE PRODUCTOS
-- Fecha: 27 de Octubre, 2025
-- ===================================

-- 1. CREAR TABLA product_variants
CREATE TABLE IF NOT EXISTS product_variants (
    id BIGSERIAL PRIMARY KEY,
    
    -- Relación con producto padre
    product_id BIGINT NOT NULL,
    
    -- SKU único por variante
    sku VARCHAR(100) UNIQUE NOT NULL,
    
    -- Precios específicos de la variante
    price DECIMAL(10,2) NOT NULL,
    discounted_price DECIMAL(10,2),
    
    -- Stock específico de la variante
    stock INTEGER DEFAULT 0 NOT NULL,
    
    -- Atributos de variante
    color VARCHAR(50),           -- Ej: NULL, \"Brillante\", \"Satinado\", \"Blanco\"
    medida VARCHAR(50),          -- Ej: \"1L\", \"4L\", \"10L\", \"Grano 40\"
    terminacion VARCHAR(50),     -- Ej: \"Mate\", \"Satinado\", \"Brillante\"
    
    -- Código de proveedor
    aikon_id VARCHAR(100),
    
    -- Imágenes específicas de la variante (opcional)
    images JSONB DEFAULT '{}',
    
    -- Variante por defecto (solo una debe ser true por producto)
    is_default BOOLEAN DEFAULT false,
    
    -- Estado
    is_active BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key a tabla products
    CONSTRAINT fk_product_variants_product 
        FOREIGN KEY (product_id) 
        REFERENCES products(id) 
        ON DELETE CASCADE
);

-- 2. ÍNDICES PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id 
    ON product_variants(product_id);

CREATE INDEX IF NOT EXISTS idx_product_variants_sku 
    ON product_variants(sku);

CREATE INDEX IF NOT EXISTS idx_product_variants_stock 
    ON product_variants(stock) 
    WHERE is_active = true AND stock > 0;

CREATE INDEX IF NOT EXISTS idx_product_variants_default 
    ON product_variants(product_id, is_default) 
    WHERE is_default = true;

-- Índice compuesto para búsquedas por atributos
CREATE INDEX IF NOT EXISTS idx_product_variants_attributes 
    ON product_variants(color, medida, terminacion) 
    WHERE is_active = true;

-- 3. CONSTRAINTS
-- Solo una variante default por producto
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_default_per_product 
    ON product_variants(product_id) 
    WHERE is_default = true;

-- SKU único
ALTER TABLE product_variants 
    ADD CONSTRAINT unique_sku UNIQUE (sku);

-- 4. TRIGGER PARA updated_at
CREATE OR REPLACE FUNCTION update_product_variants_updated_at()
RETURNS TRIGGER AS \$\$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
\$\$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_product_variants_updated_at
    BEFORE UPDATE ON product_variants
    FOR EACH ROW
    EXECUTE FUNCTION update_product_variants_updated_at();

-- 5. RLS POLICIES
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;

-- Lectura pública de variantes activas
CREATE POLICY \"Allow public read active variants\" 
    ON product_variants
    FOR SELECT 
    USING (is_active = true);

-- Solo admins pueden insertar/actualizar/eliminar
CREATE POLICY \"Allow admin insert variants\" 
    ON product_variants
    FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid()
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

CREATE POLICY \"Allow admin update variants\" 
    ON product_variants
    FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid()
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

CREATE POLICY \"Allow admin delete variants\" 
    ON product_variants
    FOR DELETE 
    USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid()
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- 6. FUNCIÓN HELPER: Obtener variante default de un producto
CREATE OR REPLACE FUNCTION get_default_variant(p_product_id BIGINT)
RETURNS product_variants AS \$\$
DECLARE
    variant product_variants;
BEGIN
    SELECT * INTO variant
    FROM product_variants
    WHERE product_id = p_product_id
    AND is_default = true
    AND is_active = true
    LIMIT 1;
    
    -- Si no hay default, retornar la primera activa
    IF variant IS NULL THEN
        SELECT * INTO variant
        FROM product_variants
        WHERE product_id = p_product_id
        AND is_active = true
        ORDER BY id ASC
        LIMIT 1;
    END IF;
    
    RETURN variant;
END;
\$\$ LANGUAGE plpgsql;

-- 7. FUNCIÓN HELPER: Obtener precio mínimo/máximo de un producto
CREATE OR REPLACE FUNCTION get_product_price_range(p_product_id BIGINT)
RETURNS TABLE(min_price DECIMAL, max_price DECIMAL, has_discount BOOLEAN) AS \$\$
BEGIN
    RETURN QUERY
    SELECT 
        MIN(COALESCE(discounted_price, price)) as min_price,
        MAX(price) as max_price,
        BOOL_OR(discounted_price IS NOT NULL) as has_discount
    FROM product_variants
    WHERE product_id = p_product_id
    AND is_active = true;
END;
\$\$ LANGUAGE plpgsql;

-- 8. VISTA: Productos con sus variantes (para compatibilidad)
CREATE OR REPLACE VIEW products_with_variants AS
SELECT 
    p.id as product_id,
    p.name,
    p.slug,
    p.description,
    p.category_id,
    p.brand,
    p.images as product_images,
    p.is_active as product_is_active,
    p.created_at as product_created_at,
    p.updated_at as product_updated_at,
    
    -- Datos de variante default
    v.id as variant_id,
    v.sku,
    v.price,
    v.discounted_price,
    v.stock,
    v.color,
    v.medida,
    v.terminacion,
    v.aikon_id,
    v.images as variant_images,
    
    -- Conteo de variantes
    (SELECT COUNT(*) FROM product_variants WHERE product_id = p.id AND is_active = true) as total_variants
FROM products p
LEFT JOIN product_variants v ON v.product_id = p.id AND v.is_default = true
WHERE p.is_active = true;

-- 9. COMENTARIOS
COMMENT ON TABLE product_variants IS 'Variantes de productos (color, tamaño, acabado, etc.)';
COMMENT ON COLUMN product_variants.product_id IS 'ID del producto padre';
COMMENT ON COLUMN product_variants.sku IS 'SKU único de la variante';
COMMENT ON COLUMN product_variants.color IS 'Color o acabado de la variante';
COMMENT ON COLUMN product_variants.medida IS 'Tamaño o capacidad de la variante';
COMMENT ON COLUMN product_variants.terminacion IS 'Terminación o acabado de la variante';
COMMENT ON COLUMN product_variants.is_default IS 'Indica si es la variante mostrada por defecto';

COMMENT ON FUNCTION get_default_variant IS 'Obtiene la variante default de un producto';
COMMENT ON FUNCTION get_product_price_range IS 'Obtiene rango de precios de un producto';
COMMENT ON VIEW products_with_variants IS 'Vista de productos con su variante default';
