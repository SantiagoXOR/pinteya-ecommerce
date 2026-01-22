-- ===================================
-- ACTUALIZAR CONSTRAINT ÚNICA CART_ITEMS
-- Fecha: 2026-01-22
-- ===================================
-- Descripción: Actualiza la constraint única de cart_items de 
-- UNIQUE(user_id, product_id) a UNIQUE(user_id, product_id, variant_id, tenant_id)
-- para permitir que los usuarios tengan el mismo producto con diferentes variantes
-- y en diferentes tenants.

BEGIN;

-- 1. Asignar tenant_id a items sin tenant (usar tenant por defecto: pinteya)
UPDATE cart_items 
SET tenant_id = (SELECT id FROM tenants WHERE slug = 'pinteya' LIMIT 1)
WHERE tenant_id IS NULL;

-- 2. Asignar variant_id NULL a items sin variante (si es necesario)
-- Nota: Esto ya debería estar manejado por la migración anterior, pero lo incluimos
-- por seguridad para evitar problemas con la constraint
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

-- 3. Eliminar constraint única antigua
-- PostgreSQL genera automáticamente nombres como: cart_items_user_id_product_id_key
ALTER TABLE cart_items 
DROP CONSTRAINT IF EXISTS cart_items_user_id_product_id_key;

-- También intentar eliminar si tiene otro nombre posible
DO $$
DECLARE
  constraint_name TEXT;
BEGIN
  -- Buscar el nombre real de la constraint
  SELECT conname INTO constraint_name
  FROM pg_constraint
  WHERE conrelid = 'cart_items'::regclass
    AND contype = 'u'
    AND array_length(conkey, 1) = 2
    AND conkey[1] = (SELECT attnum FROM pg_attribute WHERE attrelid = 'cart_items'::regclass AND attname = 'user_id')
    AND conkey[2] = (SELECT attnum FROM pg_attribute WHERE attrelid = 'cart_items'::regclass AND attname = 'product_id')
  LIMIT 1;
  
  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE cart_items DROP CONSTRAINT IF EXISTS %I', constraint_name);
  END IF;
END $$;

-- 4. Crear nueva constraint única
ALTER TABLE cart_items 
ADD CONSTRAINT cart_items_user_product_variant_tenant_unique 
UNIQUE (user_id, product_id, variant_id, tenant_id);

-- 5. Actualizar función upsert_cart_item
CREATE OR REPLACE FUNCTION upsert_cart_item(
  user_uuid UUID,
  product_id_param INTEGER,
  variant_id_param BIGINT DEFAULT NULL,
  tenant_id_param UUID DEFAULT NULL,
  quantity_param INTEGER DEFAULT 1
)
RETURNS TABLE(
  id UUID,
  user_id UUID,
  product_id INTEGER,
  variant_id BIGINT,
  tenant_id UUID,
  quantity INTEGER,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  INSERT INTO cart_items (user_id, product_id, variant_id, tenant_id, quantity)
  VALUES (user_uuid, product_id_param, variant_id_param, tenant_id_param, quantity_param)
  ON CONFLICT (user_id, product_id, variant_id, tenant_id)
  DO UPDATE SET 
    quantity = cart_items.quantity + quantity_param,
    updated_at = NOW()
  RETURNING 
    cart_items.id,
    cart_items.user_id,
    cart_items.product_id,
    cart_items.variant_id,
    cart_items.tenant_id,
    cart_items.quantity,
    cart_items.created_at,
    cart_items.updated_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Actualizar grants
GRANT EXECUTE ON FUNCTION upsert_cart_item(UUID, INTEGER, BIGINT, UUID, INTEGER) TO authenticated;

-- 7. Crear índice compuesto para mejorar performance de consultas
CREATE INDEX IF NOT EXISTS idx_cart_items_user_tenant 
ON cart_items(user_id, tenant_id);

-- 8. Comentarios
COMMENT ON CONSTRAINT cart_items_user_product_variant_tenant_unique ON cart_items IS 
'Constraint única que permite a usuarios tener el mismo producto con diferentes variantes y en diferentes tenants';

COMMENT ON FUNCTION upsert_cart_item IS 
'Agrega o actualiza un item en el carrito considerando variante y tenant. Suma cantidades si ya existe.';

COMMIT;
