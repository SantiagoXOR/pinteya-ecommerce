-- ===================================
-- AGREGAR SOPORTE DE VARIANTES AL CARRITO
-- Fecha: 27 de Octubre, 2025
-- ===================================

-- Agregar columna variant_id a cart_items
ALTER TABLE cart_items ADD COLUMN IF NOT EXISTS variant_id BIGINT;

-- Agregar foreign key (sin ON DELETE para evitar eliminar items si se borra variante)
ALTER TABLE cart_items
  ADD CONSTRAINT fk_cart_items_variant_id
  FOREIGN KEY (variant_id)
  REFERENCES product_variants(id)
  ON DELETE SET NULL;

-- Índice para performance
CREATE INDEX IF NOT EXISTS idx_cart_items_variant_id 
  ON cart_items(variant_id);

-- Actualizar items existentes: asignar variante default
UPDATE cart_items ci
SET variant_id = (
  SELECT pv.id 
  FROM product_variants pv 
  WHERE pv.product_id = ci.product_id 
    AND pv.is_default = true 
  LIMIT 1
)
WHERE variant_id IS NULL
  AND EXISTS (
    SELECT 1 FROM product_variants 
    WHERE product_id = ci.product_id
  );

-- Comentarios
COMMENT ON COLUMN cart_items.variant_id IS 'ID de la variante específica seleccionada por el usuario';
