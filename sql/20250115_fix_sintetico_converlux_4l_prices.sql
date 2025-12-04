-- Migración para corregir precios de variantes 4L de Sintético Converlux
-- Fecha: 2025-01-15
-- Descripción: Actualizar precios de variantes 4L de Sintético Converlux
-- Precio correcto: PRECIO DE LISTA $57,422.00 | CON DESCUENTO $40,195.40

-- Verificar variantes actuales de 4L de Sintético Converlux
SELECT 
    pv.id,
    pv.product_id,
    p.name as product_name,
    pv.measure,
    pv.color_name,
    pv.price_list,
    pv.price_sale,
    pv.stock
FROM product_variants pv
JOIN products p ON pv.product_id = p.id
WHERE p.name ILIKE '%sintético converlux%'
  AND pv.measure ILIKE '%4L%'
ORDER BY pv.id;

-- Actualizar precios de variantes 4L de Sintético Converlux
UPDATE product_variants 
SET 
    price_list = 57422.00,
    price_sale = 40195.40,
    updated_at = NOW()
WHERE product_id IN (
    SELECT id FROM products 
    WHERE name ILIKE '%sintético converlux%'
)
AND measure ILIKE '%4L%';

-- Verificar que la actualización fue exitosa
SELECT 
    pv.id,
    pv.product_id,
    p.name as product_name,
    pv.measure,
    pv.color_name,
    pv.price_list,
    pv.price_sale,
    pv.stock,
    pv.updated_at
FROM product_variants pv
JOIN products p ON pv.product_id = p.id
WHERE p.name ILIKE '%sintético converlux%'
  AND pv.measure ILIKE '%4L%'
ORDER BY pv.id;

-- Mostrar resumen de la migración
SELECT 
    COUNT(*) as variantes_actualizadas,
    'Sintético Converlux 4L' as producto,
    'Precio lista: $57,422.00 | Precio descuento: $40,195.40' as precios_aplicados
FROM product_variants pv
JOIN products p ON pv.product_id = p.id
WHERE p.name ILIKE '%sintético converlux%'
  AND pv.measure ILIKE '%4L%'
  AND pv.price_sale = 40195.40;
