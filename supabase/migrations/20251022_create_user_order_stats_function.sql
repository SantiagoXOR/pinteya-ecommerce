-- =====================================================
-- FUNCIÓN: Obtener estadísticas de órdenes por usuario
-- Fecha: 22 de Octubre, 2025
-- Propósito: Calcular stats de órdenes para lista de usuarios en admin
-- =====================================================

-- Eliminar función si existe
DROP FUNCTION IF EXISTS get_user_order_stats(uuid[]);

-- Crear función
CREATE OR REPLACE FUNCTION get_user_order_stats(user_ids uuid[])
RETURNS TABLE (
  user_id uuid,
  total_orders bigint,
  total_spent numeric,
  last_order_date timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.user_id,
    COUNT(o.id)::bigint as total_orders,
    COALESCE(SUM(o.total), 0)::numeric as total_spent,
    MAX(o.created_at) as last_order_date
  FROM orders o
  WHERE o.user_id = ANY(user_ids)
  GROUP BY o.user_id;
END;
$$;

-- Agregar comentario
COMMENT ON FUNCTION get_user_order_stats(uuid[]) IS 
'[CREADO 2025-10-22] Obtiene estadísticas de órdenes (total, gasto, última orden) para un array de user IDs. Usado en panel admin de clientes.';

-- Verificar que se creó correctamente
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'get_user_order_stats'
  ) THEN
    RAISE NOTICE '✅ Función get_user_order_stats creada exitosamente';
  ELSE
    RAISE EXCEPTION 'ERROR: La función get_user_order_stats no se creó correctamente';
  END IF;
END;
$$;

