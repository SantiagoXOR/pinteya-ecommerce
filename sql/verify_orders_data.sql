-- ===================================
-- VERIFICACIÓN DE DATOS DE ÓRDENES
-- ===================================
-- Script SQL para inspeccionar la integridad de las órdenes
-- Ejecutar en Supabase SQL Editor o cliente PostgreSQL

-- ===================================
-- 1. RESUMEN GENERAL DE ÓRDENES
-- ===================================

SELECT 
    'RESUMEN GENERAL' as seccion,
    COUNT(*) as total_ordenes,
    COUNT(DISTINCT user_id) as usuarios_unicos,
    SUM(CASE WHEN order_number IS NOT NULL THEN 1 ELSE 0 END) as con_order_number,
    SUM(CASE WHEN payer_info IS NOT NULL THEN 1 ELSE 0 END) as con_payer_info,
    SUM(CASE WHEN shipping_address IS NOT NULL THEN 1 ELSE 0 END) as con_shipping_address,
    SUM(CASE WHEN whatsapp_message IS NOT NULL THEN 1 ELSE 0 END) as con_whatsapp_message,
    AVG(total_amount) as promedio_total,
    MIN(created_at) as orden_mas_antigua,
    MAX(created_at) as orden_mas_reciente
FROM public.orders;

-- ===================================
-- 2. ÓRDENES RECIENTES (ÚLTIMAS 10)
-- ===================================

SELECT 
    'ÓRDENES RECIENTES' as seccion,
    id,
    order_number,
    total_amount,
    status,
    payment_status,
    CASE 
        WHEN payer_info IS NOT NULL THEN '✅' 
        ELSE '❌' 
    END as tiene_payer_info,
    CASE 
        WHEN shipping_address IS NOT NULL THEN '✅' 
        ELSE '❌' 
    END as tiene_shipping_address,
    CASE 
        WHEN whatsapp_message IS NOT NULL THEN '✅' 
        ELSE '❌' 
    END as tiene_whatsapp_message,
    created_at
FROM public.orders 
ORDER BY created_at DESC 
LIMIT 10;

-- ===================================
-- 3. ÓRDENES CON PROBLEMAS
-- ===================================

-- Órdenes sin order_number
SELECT 
    'SIN ORDER_NUMBER' as problema,
    id,
    created_at,
    total_amount
FROM public.orders 
WHERE order_number IS NULL
ORDER BY created_at DESC;

-- Órdenes sin payer_info
SELECT 
    'SIN PAYER_INFO' as problema,
    id,
    order_number,
    created_at,
    total_amount
FROM public.orders 
WHERE payer_info IS NULL
ORDER BY created_at DESC;

-- Órdenes sin shipping_address
SELECT 
    'SIN SHIPPING_ADDRESS' as problema,
    id,
    order_number,
    created_at,
    total_amount
FROM public.orders 
WHERE shipping_address IS NULL
ORDER BY created_at DESC;

-- Órdenes recientes sin whatsapp_message (últimos 7 días)
SELECT 
    'SIN WHATSAPP_MESSAGE (7 días)' as problema,
    id,
    order_number,
    created_at,
    total_amount
FROM public.orders 
WHERE whatsapp_message IS NULL 
    AND created_at > NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;

-- ===================================
-- 4. VALIDACIÓN DE PAYER_INFO
-- ===================================

-- Estructura de payer_info
SELECT 
    'PAYER_INFO ESTRUCTURA' as seccion,
    COUNT(*) as total_con_payer_info,
    SUM(CASE WHEN payer_info ? 'name' THEN 1 ELSE 0 END) as tiene_name,
    SUM(CASE WHEN payer_info ? 'email' THEN 1 ELSE 0 END) as tiene_email,
    SUM(CASE WHEN payer_info ? 'phone' THEN 1 ELSE 0 END) as tiene_phone,
    SUM(CASE WHEN payer_info ? 'surname' THEN 1 ELSE 0 END) as tiene_surname
FROM public.orders 
WHERE payer_info IS NOT NULL;

-- Ejemplos de payer_info
SELECT 
    'PAYER_INFO EJEMPLOS' as seccion,
    id,
    order_number,
    payer_info
FROM public.orders 
WHERE payer_info IS NOT NULL
ORDER BY created_at DESC 
LIMIT 5;

-- ===================================
-- 5. VALIDACIÓN DE SHIPPING_ADDRESS
-- ===================================

-- Estructura de shipping_address
SELECT 
    'SHIPPING_ADDRESS ESTRUCTURA' as seccion,
    COUNT(*) as total_con_shipping_address,
    SUM(CASE WHEN shipping_address ? 'street_name' THEN 1 ELSE 0 END) as tiene_street_name,
    SUM(CASE WHEN shipping_address ? 'street_number' THEN 1 ELSE 0 END) as tiene_street_number,
    SUM(CASE WHEN shipping_address ? 'city_name' THEN 1 ELSE 0 END) as tiene_city_name,
    SUM(CASE WHEN shipping_address ? 'state_name' THEN 1 ELSE 0 END) as tiene_state_name,
    SUM(CASE WHEN shipping_address ? 'zip_code' THEN 1 ELSE 0 END) as tiene_zip_code
FROM public.orders 
WHERE shipping_address IS NOT NULL;

-- Ejemplos de shipping_address
SELECT 
    'SHIPPING_ADDRESS EJEMPLOS' as seccion,
    id,
    order_number,
    shipping_address
FROM public.orders 
WHERE shipping_address IS NOT NULL
ORDER BY created_at DESC 
LIMIT 5;

-- ===================================
-- 6. VALIDACIÓN DE ORDER_ITEMS
-- ===================================

-- Órdenes sin items
SELECT 
    'ÓRDENES SIN ITEMS' as problema,
    o.id,
    o.order_number,
    o.created_at,
    o.total_amount
FROM public.orders o
LEFT JOIN public.order_items oi ON o.id = oi.order_id
WHERE oi.id IS NULL
ORDER BY o.created_at DESC;

-- Conteo de items por orden
SELECT 
    'ITEMS POR ORDEN' as seccion,
    o.id,
    o.order_number,
    COUNT(oi.id) as items_count,
    SUM(oi.quantity * oi.price) as total_items,
    o.total_amount,
    CASE 
        WHEN ABS(o.total_amount - SUM(oi.quantity * oi.price)) < 0.01 THEN '✅' 
        ELSE '❌' 
    END as totales_coinciden
FROM public.orders o
LEFT JOIN public.order_items oi ON o.id = oi.order_id
GROUP BY o.id, o.order_number, o.total_amount
ORDER BY o.created_at DESC
LIMIT 10;

-- ===================================
-- 7. VALIDACIÓN DE WHATSAPP
-- ===================================

-- Órdenes con WhatsApp generado
SELECT 
    'WHATSAPP GENERADO' as seccion,
    COUNT(*) as total_con_whatsapp,
    SUM(CASE WHEN whatsapp_message IS NOT NULL THEN 1 ELSE 0 END) as con_mensaje,
    SUM(CASE WHEN whatsapp_notification_link IS NOT NULL THEN 1 ELSE 0 END) as con_enlace,
    SUM(CASE WHEN whatsapp_generated_at IS NOT NULL THEN 1 ELSE 0 END) as con_fecha_generacion
FROM public.orders;

-- Ejemplo de mensaje WhatsApp
SELECT 
    'WHATSAPP EJEMPLO' as seccion,
    id,
    order_number,
    LENGTH(whatsapp_message) as longitud_mensaje,
    LEFT(whatsapp_message, 100) || '...' as mensaje_preview
FROM public.orders 
WHERE whatsapp_message IS NOT NULL
ORDER BY created_at DESC 
LIMIT 3;

-- ===================================
-- 8. ESTADÍSTICAS POR FECHA
-- ===================================

-- Órdenes por día (últimos 7 días)
SELECT 
    'ÓRDENES POR DÍA (7 días)' as seccion,
    DATE(created_at) as fecha,
    COUNT(*) as ordenes,
    SUM(CASE WHEN payer_info IS NOT NULL THEN 1 ELSE 0 END) as con_payer_info,
    SUM(CASE WHEN whatsapp_message IS NOT NULL THEN 1 ELSE 0 END) as con_whatsapp,
    SUM(total_amount) as total_diario
FROM public.orders 
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY fecha DESC;

-- ===================================
-- 9. VERIFICACIÓN DE DUPLICADOS
-- ===================================

-- Order numbers duplicados
SELECT 
    'ORDER_NUMBERS DUPLICADOS' as problema,
    order_number,
    COUNT(*) as cantidad,
    ARRAY_AGG(id) as ids
FROM public.orders 
WHERE order_number IS NOT NULL
GROUP BY order_number
HAVING COUNT(*) > 1;

-- ===================================
-- 10. LIMPIEZA DE DATOS
-- ===================================

-- Órdenes huérfanas (sin user_id válido)
SELECT 
    'ÓRDENES HUÉRFANAS' as problema,
    COUNT(*) as cantidad
FROM public.orders o
LEFT JOIN public.user_profiles up ON o.user_id = up.id
WHERE o.user_id IS NOT NULL AND up.id IS NULL;

-- Órdenes con totales negativos o cero
SELECT 
    'TOTALES INVÁLIDOS' as problema,
    id,
    order_number,
    total_amount,
    created_at
FROM public.orders 
WHERE total_amount <= 0 OR total_amount IS NULL
ORDER BY created_at DESC;
