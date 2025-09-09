-- ===================================
-- PINTEYA E-COMMERCE - CREAR TABLA DE CARRITO
-- ===================================
-- Ejecutar este script en el SQL Editor de Supabase Dashboard
-- URL: https://supabase.com/dashboard/project/aakzspzfulgftqlgwkpb/sql

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

-- 7. Crear vista para carrito con información de productos
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

-- 8. Grant para la vista
GRANT SELECT ON cart_items_with_products TO authenticated;

-- 9. Comentarios para documentación
COMMENT ON TABLE cart_items IS 'Tabla para almacenar items del carrito de compras de usuarios autenticados';
COMMENT ON COLUMN cart_items.user_id IS 'ID del usuario propietario del carrito';
COMMENT ON COLUMN cart_items.product_id IS 'ID del producto en el carrito';
COMMENT ON COLUMN cart_items.quantity IS 'Cantidad del producto en el carrito';

-- 10. Verificar que la tabla se creó correctamente
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'cart_items' 
ORDER BY ordinal_position;

-- ===================================
-- INSTRUCCIONES:
-- 1. Copiar todo este script
-- 2. Ir a https://supabase.com/dashboard/project/aakzspzfulgftqlgwkpb/sql
-- 3. Pegar el script en el editor
-- 4. Hacer click en "Run"
-- 5. Verificar que no hay errores
-- ===================================
