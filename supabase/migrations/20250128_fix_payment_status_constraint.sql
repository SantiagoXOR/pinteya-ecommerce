-- ===================================
-- PINTEYA E-COMMERCE - CORREGIR CONSTRAINT payment_status
-- ===================================
-- Fecha: Enero 28, 2025
-- Descripción: Agregar 'cash_on_delivery' a los valores permitidos en el constraint
--              de payment_status para soportar órdenes de pago contra entrega

-- ===================================
-- 1. ELIMINAR CONSTRAINT EXISTENTE (si existe)
-- ===================================

-- Eliminar constraint existente si existe
ALTER TABLE public.orders 
DROP CONSTRAINT IF EXISTS orders_payment_status_check;

-- ===================================
-- 2. CREAR NUEVO CONSTRAINT CON VALORES COMPLETOS
-- ===================================

-- Crear constraint con todos los valores permitidos incluyendo cash_on_delivery
ALTER TABLE public.orders 
ADD CONSTRAINT orders_payment_status_check 
CHECK (payment_status IN (
  'pending',           -- Pendiente de pago
  'paid',             -- Pagada
  'failed',           -- Falló el pago
  'refunded',         -- Reembolsada
  'cash_on_delivery'  -- Pago contra entrega (nuevo)
));

-- ===================================
-- 3. COMENTARIOS PARA DOCUMENTACIÓN
-- ===================================

COMMENT ON CONSTRAINT orders_payment_status_check ON public.orders IS 
'Valida que payment_status sea uno de los valores permitidos: pending, paid, failed, refunded, cash_on_delivery';

-- ===================================
-- FIN DE MIGRACIÓN
-- ===================================


