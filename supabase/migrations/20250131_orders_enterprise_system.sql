-- ===================================
-- PINTEYA E-COMMERCE - ORDERS ENTERPRISE SYSTEM MIGRATION
-- ===================================
-- Fecha: Enero 2025
-- Descripción: Migración para sistema enterprise de órdenes con audit trail,
--              historial de estados, notas administrativas y métricas

-- ===================================
-- 1. ACTUALIZAR TABLA ORDERS EXISTENTE
-- ===================================

-- Agregar columnas faltantes a la tabla orders
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS order_number VARCHAR(100) UNIQUE,
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS fulfillment_status VARCHAR(50) DEFAULT 'unfulfilled',
ADD COLUMN IF NOT EXISTS tracking_number VARCHAR(100),
ADD COLUMN IF NOT EXISTS carrier VARCHAR(50),
ADD COLUMN IF NOT EXISTS estimated_delivery TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS admin_notes TEXT,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Actualizar columnas existentes si es necesario
ALTER TABLE public.orders 
ALTER COLUMN status SET DEFAULT 'pending',
ALTER COLUMN total_amount TYPE DECIMAL(12,2),
ALTER COLUMN currency SET DEFAULT 'ARS';

-- Generar order_number para órdenes existentes que no lo tengan
UPDATE public.orders 
SET order_number = 'ORD-' || EXTRACT(EPOCH FROM created_at)::bigint || '-' || SUBSTRING(id::text, 1, 8)
WHERE order_number IS NULL;

-- ===================================
-- 2. TABLA DE HISTORIAL DE ESTADOS
-- ===================================

CREATE TABLE IF NOT EXISTS public.order_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    previous_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    changed_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    reason TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_status_values CHECK (
        new_status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded', 'returned')
    ),
    CONSTRAINT valid_previous_status_values CHECK (
        previous_status IS NULL OR 
        previous_status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded', 'returned')
    )
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_order_status_history_order_id ON public.order_status_history(order_id);
CREATE INDEX IF NOT EXISTS idx_order_status_history_created_at ON public.order_status_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_status_history_new_status ON public.order_status_history(new_status);

-- ===================================
-- 3. TABLA DE NOTAS ADMINISTRATIVAS
-- ===================================

CREATE TABLE IF NOT EXISTS public.order_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    admin_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    note_type VARCHAR(20) DEFAULT 'internal' CHECK (note_type IN ('internal', 'customer', 'system')),
    content TEXT NOT NULL,
    is_visible_to_customer BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_order_notes_order_id ON public.order_notes(order_id);
CREATE INDEX IF NOT EXISTS idx_order_notes_created_at ON public.order_notes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_notes_type ON public.order_notes(note_type);
CREATE INDEX IF NOT EXISTS idx_order_notes_visible ON public.order_notes(is_visible_to_customer);

-- ===================================
-- 4. TABLA DE MÉTRICAS DIARIAS
-- ===================================

CREATE TABLE IF NOT EXISTS public.order_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL,
    total_orders INTEGER DEFAULT 0,
    total_revenue DECIMAL(12,2) DEFAULT 0,
    avg_order_value DECIMAL(10,2) DEFAULT 0,
    orders_by_status JSONB DEFAULT '{}',
    orders_by_payment_status JSONB DEFAULT '{}',
    top_products JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraint para una entrada por día
    UNIQUE(date)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_order_metrics_date ON public.order_metrics(date DESC);

-- ===================================
-- 5. ÍNDICES ADICIONALES PARA ORDERS
-- ===================================

-- Índices para mejorar performance de consultas admin
CREATE INDEX IF NOT EXISTS idx_orders_admin_list ON public.orders(created_at DESC, status);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);

-- Índice para búsqueda de texto
CREATE INDEX IF NOT EXISTS idx_orders_search ON public.orders 
USING gin(to_tsvector('spanish', COALESCE(order_number, '') || ' ' || COALESCE(notes, '') || ' ' || COALESCE(admin_notes, '')));

-- ===================================
-- 6. FUNCIONES PARA AUTOMATIZACIÓN
-- ===================================

-- Función para actualizar métricas diarias
CREATE OR REPLACE FUNCTION update_daily_order_metrics(target_date DATE DEFAULT CURRENT_DATE)
RETURNS void AS $$
BEGIN
    INSERT INTO public.order_metrics (
        date,
        total_orders,
        total_revenue,
        avg_order_value,
        orders_by_status,
        orders_by_payment_status,
        updated_at
    )
    SELECT 
        target_date,
        COUNT(*) as total_orders,
        COALESCE(SUM(total_amount), 0) as total_revenue,
        CASE 
            WHEN COUNT(*) > 0 THEN COALESCE(SUM(total_amount), 0) / COUNT(*)
            ELSE 0
        END as avg_order_value,
        jsonb_object_agg(status, status_count) as orders_by_status,
        jsonb_object_agg(payment_status, payment_count) as orders_by_payment_status,
        NOW()
    FROM (
        SELECT 
            status,
            payment_status,
            total_amount,
            COUNT(*) OVER (PARTITION BY status) as status_count,
            COUNT(*) OVER (PARTITION BY payment_status) as payment_count
        FROM public.orders 
        WHERE DATE(created_at) = target_date
    ) order_stats
    ON CONFLICT (date) 
    DO UPDATE SET
        total_orders = EXCLUDED.total_orders,
        total_revenue = EXCLUDED.total_revenue,
        avg_order_value = EXCLUDED.avg_order_value,
        orders_by_status = EXCLUDED.orders_by_status,
        orders_by_payment_status = EXCLUDED.orders_by_payment_status,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Función para obtener tendencias diarias
CREATE OR REPLACE FUNCTION get_daily_order_trends(
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE
)
RETURNS TABLE (
    date DATE,
    total_orders BIGINT,
    total_revenue NUMERIC,
    avg_order_value NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        DATE(o.created_at) as date,
        COUNT(*) as total_orders,
        COALESCE(SUM(o.total_amount), 0) as total_revenue,
        CASE 
            WHEN COUNT(*) > 0 THEN COALESCE(SUM(o.total_amount), 0) / COUNT(*)
            ELSE 0
        END as avg_order_value
    FROM public.orders o
    WHERE o.created_at >= start_date 
        AND o.created_at <= end_date
        AND o.status != 'cancelled'
    GROUP BY DATE(o.created_at)
    ORDER BY DATE(o.created_at);
END;
$$ LANGUAGE plpgsql;

-- ===================================
-- 7. TRIGGERS PARA AUTOMATIZACIÓN
-- ===================================

-- Trigger para registrar cambios de estado automáticamente
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
            'Cambio automático del sistema',
            jsonb_build_object(
                'trigger', 'automatic',
                'updated_at', NEW.updated_at,
                'previous_payment_status', OLD.payment_status,
                'new_payment_status', NEW.payment_status
            )
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger
DROP TRIGGER IF EXISTS trigger_log_order_status_change ON public.orders;
CREATE TRIGGER trigger_log_order_status_change
    AFTER UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION log_order_status_change();

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger a tablas relevantes
DROP TRIGGER IF EXISTS trigger_update_orders_updated_at ON public.orders;
CREATE TRIGGER trigger_update_orders_updated_at
    BEFORE UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_order_notes_updated_at ON public.order_notes;
CREATE TRIGGER trigger_update_order_notes_updated_at
    BEFORE UPDATE ON public.order_notes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ===================================
-- 8. RLS POLICIES PARA SEGURIDAD
-- ===================================

-- Habilitar RLS en las nuevas tablas
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_metrics ENABLE ROW LEVEL SECURITY;

-- Policies para order_status_history
CREATE POLICY "Admin can view all order status history" ON public.order_status_history
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admin can insert order status history" ON public.order_status_history
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Policies para order_notes
CREATE POLICY "Admin can manage all order notes" ON public.order_notes
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Users can view customer-visible notes for their orders" ON public.order_notes
    FOR SELECT USING (
        is_visible_to_customer = true AND
        EXISTS (
            SELECT 1 FROM public.orders o
            JOIN public.user_profiles up ON o.user_id = up.id
            WHERE o.id = order_notes.order_id AND up.id = auth.uid()
        )
    );

-- Policies para order_metrics
CREATE POLICY "Admin can manage order metrics" ON public.order_metrics
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ===================================
-- 9. DATOS INICIALES Y LIMPIEZA
-- ===================================

-- Actualizar métricas para los últimos 30 días
DO $$
DECLARE
    current_date DATE := CURRENT_DATE;
    i INTEGER := 0;
BEGIN
    WHILE i < 30 LOOP
        PERFORM update_daily_order_metrics(current_date - i);
        i := i + 1;
    END LOOP;
END $$;

-- ===================================
-- COMENTARIOS PARA DOCUMENTACIÓN
-- ===================================

COMMENT ON TABLE public.order_status_history IS 'Historial completo de cambios de estado de órdenes para audit trail';
COMMENT ON TABLE public.order_notes IS 'Notas administrativas y de comunicación para órdenes';
COMMENT ON TABLE public.order_metrics IS 'Métricas diarias agregadas para dashboard y reportes';

COMMENT ON FUNCTION update_daily_order_metrics(DATE) IS 'Actualiza métricas diarias de órdenes para fecha específica';
COMMENT ON FUNCTION get_daily_order_trends(TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE) IS 'Obtiene tendencias diarias de órdenes para rango de fechas';

-- ===================================
-- FIN DE MIGRACIÓN
-- ===================================
