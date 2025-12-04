-- ===================================
-- PINTEYA E-COMMERCE - AGREGAR COLUMNAS FALTANTES A ORDERS
-- ===================================
-- Fecha: Enero 18, 2025
-- Descripción: Agregar columnas faltantes para completar funcionalidad de órdenes
--              y WhatsApp notifications

-- ===================================
-- 1. AGREGAR COLUMNAS FALTANTES A ORDERS
-- ===================================

-- Agregar columna para información del pagador (MercadoPago)
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS payer_info JSONB;

-- Agregar columna para referencia externa (usado por create-cash-order)
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS external_reference VARCHAR(255);

-- Agregar columna para enlace de notificación WhatsApp
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS whatsapp_notification_link TEXT;

-- Agregar columna para fecha de generación del mensaje WhatsApp
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS whatsapp_generated_at TIMESTAMP WITH TIME ZONE;

-- Agregar columna total como alias para total_amount (para compatibilidad)
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS total DECIMAL(12,2);

-- ===================================
-- 2. CREAR ÍNDICES PARA NUEVAS COLUMNAS
-- ===================================

-- Índice para búsqueda por referencia externa
CREATE INDEX IF NOT EXISTS idx_orders_external_reference 
ON public.orders(external_reference) 
WHERE external_reference IS NOT NULL;

-- Índice para búsqueda por datos del pagador (email)
CREATE INDEX IF NOT EXISTS idx_orders_payer_email 
ON public.orders USING gin((payer_info->>'email')) 
WHERE payer_info IS NOT NULL;

-- Índice para búsqueda por teléfono del pagador
CREATE INDEX IF NOT EXISTS idx_orders_payer_phone 
ON public.orders USING gin((payer_info->>'phone')) 
WHERE payer_info IS NOT NULL;

-- Índice para órdenes con WhatsApp generado
CREATE INDEX IF NOT EXISTS idx_orders_whatsapp_generated 
ON public.orders(whatsapp_generated_at) 
WHERE whatsapp_generated_at IS NOT NULL;

-- ===================================
-- 3. ACTUALIZAR DATOS EXISTENTES
-- ===================================

-- Actualizar columna total con valores de total_amount para órdenes existentes
UPDATE public.orders 
SET total = total_amount 
WHERE total IS NULL AND total_amount IS NOT NULL;

-- ===================================
-- 4. AGREGAR COMENTARIOS PARA DOCUMENTACIÓN
-- ===================================

COMMENT ON COLUMN public.orders.payer_info IS 'Información del pagador (nombre, email, teléfono, identificación)';
COMMENT ON COLUMN public.orders.external_reference IS 'Referencia externa para identificar la orden en sistemas externos';
COMMENT ON COLUMN public.orders.whatsapp_notification_link IS 'Enlace de WhatsApp para notificar al cliente sobre su orden';
COMMENT ON COLUMN public.orders.whatsapp_generated_at IS 'Fecha y hora cuando se generó el mensaje de WhatsApp';
COMMENT ON COLUMN public.orders.total IS 'Total de la orden (alias para total_amount para compatibilidad)';

-- ===================================
-- 5. VERIFICAR INTEGRIDAD
-- ===================================

-- Verificar que las columnas se agregaron correctamente
DO $$
DECLARE
    column_exists BOOLEAN;
BEGIN
    -- Verificar payer_info
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'payer_info'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        RAISE EXCEPTION 'Error: Columna payer_info no se agregó correctamente';
    END IF;
    
    -- Verificar external_reference
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'external_reference'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        RAISE EXCEPTION 'Error: Columna external_reference no se agregó correctamente';
    END IF;
    
    -- Verificar whatsapp_notification_link
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'whatsapp_notification_link'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        RAISE EXCEPTION 'Error: Columna whatsapp_notification_link no se agregó correctamente';
    END IF;
    
    -- Verificar whatsapp_generated_at
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'whatsapp_generated_at'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        RAISE EXCEPTION 'Error: Columna whatsapp_generated_at no se agregó correctamente';
    END IF;
    
    -- Verificar total
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'total'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        RAISE EXCEPTION 'Error: Columna total no se agregó correctamente';
    END IF;
    
    RAISE NOTICE '✅ Todas las columnas se agregaron correctamente a la tabla orders';
END $$;

-- ===================================
-- FIN DE MIGRACIÓN
-- ===================================
