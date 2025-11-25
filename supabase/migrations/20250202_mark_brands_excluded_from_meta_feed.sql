-- ===================================
-- MARCAR PRODUCTOS DE CIERTAS MARCAS COMO EXCLUIDOS DEL FEED META
-- Fecha: 2025-02-02
-- Descripción: Marca automáticamente los productos de marcas específicas como excluidos del feed XML de Meta
-- ===================================

-- 1. Asegurarse de que la columna existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'exclude_from_meta_feed'
    ) THEN
        ALTER TABLE products 
        ADD COLUMN exclude_from_meta_feed BOOLEAN NOT NULL DEFAULT false;
    END IF;
END $$;

-- 2. Marcar productos de marcas específicas como excluidos del feed de Meta
-- Las marcas se normalizan a minúsculas para comparación case-insensitive

UPDATE products
SET exclude_from_meta_feed = true
WHERE LOWER(TRIM(brand)) IN (
    '+color',
    '+ color',
    'mas color',
    'el galgo',
    'elgalgo',
    'duxol',
    'genérico',
    'generico',
    'genéricos',
    'genericos',
    'rapifix'
)
OR LOWER(TRIM(brand)) LIKE '%+color%'
OR LOWER(TRIM(brand)) LIKE '%el galgo%'
OR LOWER(TRIM(brand)) LIKE '%duxol%'
OR (LOWER(TRIM(brand)) LIKE '%genérico%' OR LOWER(TRIM(brand)) LIKE '%generico%')
OR LOWER(TRIM(brand)) LIKE '%rapifix%';

-- 3. Log de productos actualizados (solo para referencia, no se ejecuta en producción)
-- SELECT 
--     brand,
--     COUNT(*) as productos_excluidos
-- FROM products
-- WHERE exclude_from_meta_feed = true
-- GROUP BY brand
-- ORDER BY productos_excluidos DESC;

-- 4. Comentario
COMMENT ON COLUMN products.exclude_from_meta_feed IS 
    'Campo para excluir productos del feed XML de Meta Commerce Manager. Actualizado automáticamente para marcas: +COLOR, El Galgo, Duxol, Genérico, Rapifix';

