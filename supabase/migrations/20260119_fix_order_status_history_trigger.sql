-- ===================================
-- MIGRACIÓN: Corregir Trigger de Order Status History
-- Fecha: 2026-01-19 (Aplicada: 2026-01-20)
-- Descripción: Agrega tracking del estado inicial y mejora el trigger existente
-- Problema: No se registraba el historial de cambios de estado
-- Estado: APLICADA VIA MCP
-- ===================================

-- ===================================
-- 0. PERMITIR NULL EN PREVIOUS_STATUS
-- ===================================

-- Permitir NULL en previous_status para registrar estados iniciales
ALTER TABLE public.order_status_history 
    ALTER COLUMN previous_status DROP NOT NULL;

-- Comentario explicativo
COMMENT ON COLUMN public.order_status_history.previous_status IS 
    'Estado anterior de la orden. NULL indica estado inicial (primera vez que se registra)';

-- ===================================
-- 1. FUNCIÓN PARA REGISTRAR ESTADO INICIAL
-- ===================================

-- Función que registra el estado inicial cuando se crea una orden
CREATE OR REPLACE FUNCTION log_order_initial_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Registrar el estado inicial de la orden
    INSERT INTO public.order_status_history (
        order_id,
        previous_status,
        new_status,
        reason,
        metadata
    ) VALUES (
        NEW.id,
        NULL, -- No hay estado previo
        NEW.status,
        'Estado inicial al crear la orden',
        jsonb_build_object(
            'trigger', 'initial',
            'created_at', NEW.created_at,
            'payment_status', NEW.payment_status,
            'payment_method', NEW.payment_method,
            'order_number', NEW.order_number
        )
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear trigger para INSERT
DROP TRIGGER IF EXISTS trigger_log_order_initial_status ON public.orders;
CREATE TRIGGER trigger_log_order_initial_status
    AFTER INSERT ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION log_order_initial_status();

-- ===================================
-- 2. MEJORAR FUNCIÓN DE CAMBIO DE ESTADO
-- ===================================

-- Recrear función con SECURITY DEFINER para bypassear RLS
CREATE OR REPLACE FUNCTION log_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Solo registrar si el estado realmente cambió
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO public.order_status_history (
            order_id,
            previous_status,
            new_status,
            reason,
            metadata
        ) VALUES (
            NEW.id,
            OLD.status,
            NEW.status,
            'Cambio de estado automático',
            jsonb_build_object(
                'trigger', 'automatic',
                'updated_at', NEW.updated_at,
                'previous_payment_status', OLD.payment_status,
                'new_payment_status', NEW.payment_status,
                'changed_via', 'database_trigger'
            )
        );
    END IF;
    
    -- También registrar cambios de payment_status si el status principal no cambió
    IF OLD.status IS NOT DISTINCT FROM NEW.status 
       AND OLD.payment_status IS DISTINCT FROM NEW.payment_status THEN
        INSERT INTO public.order_status_history (
            order_id,
            previous_status,
            new_status,
            reason,
            metadata
        ) VALUES (
            NEW.id,
            NEW.status, -- El estado principal no cambió
            NEW.status,
            'Cambio de estado de pago',
            jsonb_build_object(
                'trigger', 'payment_status_change',
                'updated_at', NEW.updated_at,
                'previous_payment_status', OLD.payment_status,
                'new_payment_status', NEW.payment_status
            )
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recrear trigger de UPDATE
DROP TRIGGER IF EXISTS trigger_log_order_status_change ON public.orders;
CREATE TRIGGER trigger_log_order_status_change
    AFTER UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION log_order_status_change();

-- ===================================
-- 3. REGISTRAR HISTORIAL PARA ÓRDENES EXISTENTES (Sin historial)
-- ===================================

-- Registrar estado inicial para órdenes que no tienen historial
INSERT INTO public.order_status_history (order_id, previous_status, new_status, reason, metadata)
SELECT 
    o.id,
    NULL,
    o.status,
    'Estado retroactivo - migración',
    jsonb_build_object(
        'trigger', 'migration',
        'migrated_at', NOW(),
        'original_created_at', o.created_at,
        'payment_status', o.payment_status
    )
FROM public.orders o
WHERE NOT EXISTS (
    SELECT 1 FROM public.order_status_history h 
    WHERE h.order_id = o.id
);

-- ===================================
-- 4. COMENTARIOS DE DOCUMENTACIÓN
-- ===================================

COMMENT ON FUNCTION log_order_initial_status() IS 'Registra el estado inicial cuando se crea una orden nueva';
COMMENT ON FUNCTION log_order_status_change() IS 'Registra cambios de estado y payment_status en órdenes existentes';

-- ===================================
-- FIN DE MIGRACIÓN
-- ===================================
