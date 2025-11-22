-- ===================================
-- PINTEYA E-COMMERCE - AGREGAR COLUMNA payment_method A ORDERS
-- ===================================
-- Fecha: Enero 28, 2025
-- Descripción: Agregar columna payment_method a la tabla orders para compatibilidad
--              con el código que intenta insertar este campo
--
-- NOTA: Esta columna es opcional ya que payment_method también se guarda
--       en payer_info (JSONB), pero agregarla permite consultas más directas

-- ===================================
-- 1. AGREGAR COLUMNA payment_method
-- ===================================

-- Agregar columna para método de pago
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(100);

-- ===================================
-- 2. ACTUALIZAR DATOS EXISTENTES
-- ===================================

-- Actualizar payment_method desde payer_info para órdenes existentes
UPDATE public.orders 
SET payment_method = payer_info->>'payment_method'
WHERE payment_method IS NULL 
  AND payer_info IS NOT NULL 
  AND payer_info->>'payment_method' IS NOT NULL;

-- Actualizar payment_method basado en payment_status para órdenes sin payer_info
UPDATE public.orders 
SET payment_method = CASE 
  WHEN payment_status = 'cash_on_delivery' THEN 'cash'
  WHEN payment_status = 'pending' AND payer_info->>'payment_method' = 'mercadopago' THEN 'mercadopago'
  ELSE 'unknown'
END
WHERE payment_method IS NULL;

-- ===================================
-- 3. CREAR ÍNDICE PARA PERFORMANCE
-- ===================================

-- Índice para búsqueda por método de pago
CREATE INDEX IF NOT EXISTS idx_orders_payment_method 
ON public.orders(payment_method) 
WHERE payment_method IS NOT NULL;

-- ===================================
-- 4. COMENTARIOS PARA DOCUMENTACIÓN
-- ===================================

COMMENT ON COLUMN public.orders.payment_method IS 'Método de pago utilizado (cash, mercadopago, etc.). También se guarda en payer_info para compatibilidad.';

-- ===================================
-- FIN DE MIGRACIÓN
-- ===================================


