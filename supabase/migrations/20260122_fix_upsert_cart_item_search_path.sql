-- ===================================
-- CORREGIR SEARCH_PATH EN upsert_cart_item
-- Fecha: 2026-01-22
-- ===================================
-- Descripción: Corrige el warning de seguridad sobre search_path mutable
-- en la función upsert_cart_item agregando SET search_path = ''

BEGIN;

-- Actualizar función upsert_cart_item con search_path fijo
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
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  INSERT INTO public.cart_items (user_id, product_id, variant_id, tenant_id, quantity)
  VALUES (user_uuid, product_id_param, variant_id_param, tenant_id_param, quantity_param)
  ON CONFLICT (user_id, product_id, variant_id, tenant_id)
  DO UPDATE SET 
    quantity = public.cart_items.quantity + quantity_param,
    updated_at = NOW()
  RETURNING 
    public.cart_items.id,
    public.cart_items.user_id,
    public.cart_items.product_id,
    public.cart_items.variant_id,
    public.cart_items.tenant_id,
    public.cart_items.quantity,
    public.cart_items.created_at,
    public.cart_items.updated_at;
END;
$$;

-- Actualizar grants (ya debería existir, pero por si acaso)
GRANT EXECUTE ON FUNCTION upsert_cart_item(UUID, INTEGER, BIGINT, UUID, INTEGER) TO authenticated;

-- Comentario actualizado
COMMENT ON FUNCTION upsert_cart_item IS 
'Agrega o actualiza un item en el carrito considerando variante y tenant. Suma cantidades si ya existe. Search path fijo para seguridad.';

COMMIT;
