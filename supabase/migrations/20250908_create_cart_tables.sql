-- ===================================
-- PINTEYA E-COMMERCE - TABLAS DE CARRITO
-- ===================================
-- Migración para crear las tablas necesarias para el carrito de compras
-- Fecha: 2025-09-08
-- Autor: Code Review - Flujo de Compra

-- 1. Crear tabla de items del carrito
CREATE TABLE IF NOT EXISTS cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraint único para evitar duplicados
  UNIQUE(user_id, product_id)
);

-- 2. Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_product_id ON cart_items(product_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_created_at ON cart_items(created_at);

-- 3. Crear función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_cart_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Crear trigger para updated_at
DROP TRIGGER IF EXISTS trigger_cart_items_updated_at ON cart_items;
CREATE TRIGGER trigger_cart_items_updated_at
  BEFORE UPDATE ON cart_items
  FOR EACH ROW
  EXECUTE FUNCTION update_cart_items_updated_at();

-- 5. Habilitar Row Level Security (RLS)
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

-- 6. Crear políticas RLS para carrito
-- Política: Los usuarios solo pueden ver sus propios items del carrito
CREATE POLICY "Users can view own cart items" 
ON cart_items FOR SELECT 
USING (auth.uid() = user_id);

-- Política: Los usuarios solo pueden insertar items en su propio carrito
CREATE POLICY "Users can insert own cart items" 
ON cart_items FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Política: Los usuarios solo pueden actualizar sus propios items del carrito
CREATE POLICY "Users can update own cart items" 
ON cart_items FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Política: Los usuarios solo pueden eliminar sus propios items del carrito
CREATE POLICY "Users can delete own cart items" 
ON cart_items FOR DELETE 
USING (auth.uid() = user_id);

-- 7. Crear función para limpiar carritos antiguos (opcional)
CREATE OR REPLACE FUNCTION cleanup_old_cart_items()
RETURNS void AS $$
BEGIN
  -- Eliminar items del carrito más antiguos de 30 días
  DELETE FROM cart_items 
  WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- 8. Crear vista para carrito con información de productos
CREATE OR REPLACE VIEW cart_items_with_products AS
SELECT 
  ci.id,
  ci.user_id,
  ci.product_id,
  ci.quantity,
  ci.created_at,
  ci.updated_at,
  p.name as product_name,
  p.price as product_price,
  p.discounted_price,
  p.images as product_images,
  p.stock,
  p.brand,
  c.name as category_name,
  -- Calcular subtotal
  (ci.quantity * COALESCE(p.discounted_price, p.price)) as subtotal
FROM cart_items ci
JOIN products p ON ci.product_id = p.id
LEFT JOIN categories c ON p.category_id = c.id;

-- 9. Crear función para obtener resumen del carrito
CREATE OR REPLACE FUNCTION get_cart_summary(user_uuid UUID)
RETURNS TABLE(
  total_items BIGINT,
  total_amount NUMERIC,
  item_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(ci.quantity), 0) as total_items,
    COALESCE(SUM(ci.quantity * COALESCE(p.discounted_price, p.price)), 0) as total_amount,
    COALESCE(COUNT(ci.id)::INTEGER, 0) as item_count
  FROM cart_items ci
  JOIN products p ON ci.product_id = p.id
  WHERE ci.user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Crear función para agregar/actualizar item en carrito (upsert)
CREATE OR REPLACE FUNCTION upsert_cart_item(
  user_uuid UUID,
  product_id_param INTEGER,
  quantity_param INTEGER
)
RETURNS TABLE(
  id UUID,
  user_id UUID,
  product_id INTEGER,
  quantity INTEGER,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  INSERT INTO cart_items (user_id, product_id, quantity)
  VALUES (user_uuid, product_id_param, quantity_param)
  ON CONFLICT (user_id, product_id)
  DO UPDATE SET 
    quantity = cart_items.quantity + quantity_param,
    updated_at = NOW()
  RETURNING 
    cart_items.id,
    cart_items.user_id,
    cart_items.product_id,
    cart_items.quantity,
    cart_items.created_at,
    cart_items.updated_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Grants para funciones
GRANT EXECUTE ON FUNCTION get_cart_summary(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION upsert_cart_item(UUID, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_old_cart_items() TO service_role;

-- 12. Grant para la vista
GRANT SELECT ON cart_items_with_products TO authenticated;

-- 13. Comentarios para documentación
COMMENT ON TABLE cart_items IS 'Tabla para almacenar items del carrito de compras de usuarios autenticados';
COMMENT ON COLUMN cart_items.user_id IS 'ID del usuario propietario del carrito';
COMMENT ON COLUMN cart_items.product_id IS 'ID del producto en el carrito';
COMMENT ON COLUMN cart_items.quantity IS 'Cantidad del producto en el carrito';
COMMENT ON FUNCTION get_cart_summary(UUID) IS 'Obtiene resumen del carrito: total items, monto total, cantidad de productos únicos';
COMMENT ON FUNCTION upsert_cart_item(UUID, INTEGER, INTEGER) IS 'Agrega o actualiza un item en el carrito (suma cantidades si ya existe)';

-- ===================================
-- FIN DE MIGRACIÓN
-- ===================================
