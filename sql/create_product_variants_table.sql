-- Crear tabla product_variants para manejar variantes de productos
-- Esta tabla permitirá escalabilidad para productos con múltiples colores, medidas, terminaciones, etc.

CREATE TABLE IF NOT EXISTS product_variants (
    id SERIAL PRIMARY KEY,
    
    -- Relación con producto padre
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    
    -- Identificadores únicos
    aikon_id VARCHAR(50) UNIQUE NOT NULL, -- SKU/código único del proveedor
    variant_slug VARCHAR(255) UNIQUE NOT NULL, -- slug único para SEO
    
    -- Características de la variante
    color_name VARCHAR(100), -- Nombre del color (ej: "BLANCO", "AZUL MARINO")
    color_hex VARCHAR(7), -- Código hexadecimal del color (opcional)
    measure VARCHAR(50), -- Medida (1L, 4L, 10KG, Nº10, etc.)
    finish VARCHAR(50), -- Terminación (Brillante, Satinado, Mate)
    
    -- Precios y stock específicos por variante
    price_list DECIMAL(10,2) NOT NULL CHECK (price_list > 0),
    price_sale DECIMAL(10,2) CHECK (price_sale > 0),
    stock INTEGER DEFAULT 0 CHECK (stock >= 0),
    
    -- Estado y configuración
    is_active BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false, -- Para elegir la variante por defecto
    
    -- Imagen específica de la variante (opcional)
    image_url TEXT,
    
    -- Metadatos adicionales (JSON para flexibilidad futura)
    metadata JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Índices para performance
    CONSTRAINT unique_product_default UNIQUE (product_id, is_default) DEFERRABLE INITIALLY DEFERRED
);

-- Índices para optimizar consultas
CREATE INDEX idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX idx_product_variants_aikon_id ON product_variants(aikon_id);
CREATE INDEX idx_product_variants_active ON product_variants(is_active);
CREATE INDEX idx_product_variants_default ON product_variants(product_id, is_default);
CREATE INDEX idx_product_variants_color ON product_variants(color_name);
CREATE INDEX idx_product_variants_measure ON product_variants(measure);

-- Trigger para actualizar updated_at
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

-- Función para asegurar que solo hay una variante por defecto por producto
CREATE OR REPLACE FUNCTION ensure_single_default_variant()
RETURNS TRIGGER AS $$
BEGIN
    -- Si se está marcando como default, desmarcar las otras del mismo producto
    IF NEW.is_default = true THEN
        UPDATE product_variants 
        SET is_default = false 
        WHERE product_id = NEW.product_id 
        AND id != COALESCE(NEW.id, -1);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_ensure_single_default_variant
    BEFORE INSERT OR UPDATE ON product_variants
    FOR EACH ROW
    EXECUTE FUNCTION ensure_single_default_variant();

-- Comentarios para documentación
COMMENT ON TABLE product_variants IS 'Tabla de variantes de productos para manejar diferentes colores, medidas, terminaciones y precios';
COMMENT ON COLUMN product_variants.aikon_id IS 'Código SKU único del proveedor (ej: código Aikon)';
COMMENT ON COLUMN product_variants.variant_slug IS 'Slug único para SEO de la variante';
COMMENT ON COLUMN product_variants.is_default IS 'Indica si esta es la variante por defecto del producto';
COMMENT ON COLUMN product_variants.metadata IS 'Metadatos adicionales en formato JSON para extensibilidad futura';