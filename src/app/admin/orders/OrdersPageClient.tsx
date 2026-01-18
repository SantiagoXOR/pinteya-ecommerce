'use client'

import { Suspense, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Package,
  BarChart3,
  TrendingUp,
  Plus,
  RefreshCw,
  Download,
  FileText,
  DollarSign,
  Clock,
  CheckCircle,
  ShoppingCart,
  ShieldAlert,
} from '@/lib/optimized-imports'
import { useOrdersEnterprise } from '@/hooks/admin/useOrdersEnterprise'
import { OrderBulkOperations } from '@/components/admin/orders/OrderBulkOperations'
import { OrderList } from '@/components/admin/orders/OrderList'
import { NewOrderModal } from '@/components/admin/orders/NewOrderModal'
import { ExportOrdersModal } from '@/components/admin/orders/ExportOrdersModal'
import { OrderDetailsModal } from '@/components/admin/orders/OrderDetailsModal'
import { EditOrderModal } from '@/components/admin/orders/EditOrderModal'
import { LoadingSkeleton } from '@/components/ui/loading-skeleton'
import { ErrorBoundary } from '@/components/ui/error-boundary'
import { AdminLayout } from '@/components/admin/layout/AdminLayout'
import { AdminContentWrapper } from '@/components/admin/layout/AdminContentWrapper'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { normalizeProductTitle } from '@/lib/core/utils'

// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================

export function OrdersPageClient() {
  // Estados de modales
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false)
  const [isExportModalOpen, setIsExportModalOpen] = useState(false)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  
  // Estado para selección múltiple de órdenes
  const [selectedOrders, setSelectedOrders] = useState<string[]>([])

  const {
    // Datos
    orders,
    stats,
    analytics,

    // Estados de carga
    isLoading,
    isLoadingOrders,
    isLoadingStats,

    // Errores
    error,

    // Filtros y paginación
    filters,
    updateFilters,
    resetFilters,
    pagination,

    // Operaciones
    refreshOrders,
    handleBulkOperation,
    handleOrderAction,
  } = useOrdersEnterprise()

  const isBypassAuthEnabled =
    process.env.BYPASS_AUTH === 'true' || process.env.NEXT_PUBLIC_BYPASS_AUTH === 'true'
  const bypassDescription = useMemo(() => {
    if (!isBypassAuthEnabled) {
      return null
    }
    return (
      <Alert className='border-amber-300 bg-amber-50 text-amber-900'>
        <ShieldAlert className='h-5 w-5 text-amber-600' />
        <AlertTitle>Bypass de autenticación activo</AlertTitle>
        <AlertDescription>
          Este entorno omite el login para pruebas locales. Recuerda deshabilitarlo antes de desplegar.
        </AlertDescription>
      </Alert>
    )
  }, [isBypassAuthEnabled])

  // Handlers de modales
  const handleViewOrder = (orderId: string) => {
    setSelectedOrderId(orderId)
    setIsDetailsModalOpen(true)
  }

  const handleEditOrder = (orderId: string) => {
    setSelectedOrderId(orderId)
    setIsEditModalOpen(true)
  }

  // Handler para ver historial de una orden
  const handleViewHistory = async (orderId: string) => {
    try {
      const response = await fetch(`/api/admin/orders/${orderId}/history`)
      if (!response.ok) {
        throw new Error('Error al obtener historial')
      }
      const data = await response.json()
      
      if (data.data && data.data.length > 0) {
        // Mostrar el historial en un toast con información
        const historyItems = data.data.slice(0, 5).map((item: any) => 
          `${item.previous_status} → ${item.new_status}`
        ).join('\n')
        toast.info(`Historial de cambios:\n${historyItems}`, {
          duration: 5000,
          description: `Última actualización: ${new Date(data.data[0].created_at).toLocaleDateString('es-AR')}`
        })
      } else {
        toast.info('Esta orden no tiene historial de cambios')
      }
    } catch (error) {
      toast.error('Error al cargar el historial')
      console.error('Error fetching history:', error)
    }
  }

  // Handler para imprimir orden
  const handlePrintOrder = async (orderId: string) => {
    try {
      // Obtener detalles de la orden
      const response = await fetch(`/api/admin/orders/${orderId}`)
      if (!response.ok) {
        throw new Error('Error al obtener datos de la orden')
      }
      const data = await response.json()
      const order = data.data?.order || data.data

      if (!order) {
        toast.error('No se encontraron datos de la orden')
        return
      }

      // Crear ventana de impresión
      const printWindow = window.open('', '_blank')
      if (!printWindow) {
        toast.error('El navegador bloqueó la ventana de impresión')
        return
      }

      const formatCurrency = (amount: number) => 
        new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(amount || 0)

      const formatDate = (dateString: string) =>
        dateString ? new Date(dateString).toLocaleDateString('es-AR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }) : 'No especificada'

      const clientName = order.payer_info?.name && order.payer_info?.surname
        ? `${order.payer_info.name} ${order.payer_info.surname}`
        : order.payer_info?.name 
        ? order.payer_info.name
        : order.user_profiles?.first_name
        ? `${order.user_profiles.first_name} ${order.user_profiles.last_name || ''}`
        : 'Cliente'

      const clientPhone = order.payer_info?.phone || order.user_profiles?.phone || 'No especificado'

      // Construir items con atributos
      const items = order.order_items?.map((item: any) => {
        const rawName = item.product_snapshot?.name || item.products?.name || 'Producto'
        const name = normalizeProductTitle(rawName)
        const price = item.product_snapshot?.price || item.price || item.unit_price || 0
        const color = item.product_snapshot?.color
        const medida = item.product_snapshot?.medida
        const finish = item.product_snapshot?.finish
        
        // Construir atributos como texto
        const attrs = []
        if (color) attrs.push(`Color: ${color}`)
        if (medida) attrs.push(`Medida: ${medida}`)
        if (finish) attrs.push(`Terminación: ${finish}`)
        const attrsText = attrs.length > 0 ? `<br><small style="color: #666;">${attrs.join(' | ')}</small>` : ''
        
        return `
          <tr>
            <td style="padding: 12px 8px; border-bottom: 1px solid #eee;">${name}${attrsText}</td>
            <td style="padding: 12px 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
            <td style="padding: 12px 8px; border-bottom: 1px solid #eee; text-align: right;">${formatCurrency(price)}</td>
            <td style="padding: 12px 8px; border-bottom: 1px solid #eee; text-align: right; font-weight: 600;">${formatCurrency(price * item.quantity)}</td>
          </tr>
        `
      }).join('') || '<tr><td colspan="4" style="text-align: center; padding: 20px;">Sin productos</td></tr>'

      // Construir dirección completa
      const addr = order.shipping_address || {}
      const streetFull = addr.street || `${addr.street_name || ''} ${addr.street_number || ''}`.trim()
      const addressParts = [streetFull]
      if (addr.apartment) addressParts.push(`Piso/Depto: ${addr.apartment}`)
      if (addr.city_name || addr.city) addressParts.push(addr.city_name || addr.city)
      if (addr.state_name || addr.state) addressParts.push(addr.state_name || addr.state)
      if (addr.zip_code) addressParts.push(`CP: ${addr.zip_code}`)
      const address = addressParts.filter(Boolean).join(', ') || 'No especificada'
      const observations = addr.observations || ''

      // Método de pago
      const paymentMethod = order.payment_method === 'mercadopago' ? 'MercadoPago' 
        : order.payment_method === 'cash' ? 'Efectivo al recibir' 
        : order.payment_method || 'No especificado'
      
      const paymentStatus = order.payment_status === 'paid' ? 'Pagado' 
        : order.payment_status === 'pending' ? 'Pendiente'
        : order.payment_status === 'cash_on_delivery' ? 'Al recibir'
        : order.payment_status || 'Pendiente'

      const orderStatus = order.status === 'pending' ? 'Pendiente'
        : order.status === 'processing' ? 'En Proceso'
        : order.status === 'shipped' ? 'Enviado'
        : order.status === 'delivered' ? 'Entregado'
        : order.status === 'cancelled' ? 'Cancelado'
        : order.status || 'Pendiente'

      // Logo SVG embebido como data URI (LOGO NEGATIVO.svg con color naranja #eb6313)
      const logoSvg = `data:image/svg+xml;base64,${btoa(`<?xml version="1.0" encoding="UTF-8"?><svg id="Capa_2" data-name="Capa 2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 620.92 333.98"><defs><style>.cls-1{fill:#eb6313;}</style></defs><g id="Capa_1-2" data-name="Capa 1"><g><g><path class="cls-1" d="M133.22,201.43c1.25,2.46,1.56,6.91,1.75,12.37.21,7.36.07,15.09-.37,22.6-.13,61.94-67.66,99.35-125.59,97.52-13.25-.91-9.35-8.73-4.24-17.33,18.95-31.73,12.42-68.49,13.53-103.69.21-4.08.42-9.77,2.53-12.47,1.7-2.14,4.64-2.17,7.22-2.23,5.59-.02,14.38,0,24.56,0,19.76,0,44.39,0,63.28,0,1.02,0,2.01,0,2.95,0,7.48.29,11.78-1.14,14.34,3.14l.05.09ZM77.44,219.88c-4.68.07-7.39,6.34-9.76,10.27-6.43,12.44-15.94,32.77-2.55,43.67,11.44,8.39,27.21-.67,28.46-14.15,1.26-10.54-3.4-21.14-8.04-30.42-2.63-4.81-4.53-8.65-8-9.37h-.11Z"/><path class="cls-1" d="M20.95,181.72c.86-2.66,3.56-5.79,5.57-8.15,5.88-6.82,13.28-12.28,18.03-20.02,6.7-10.55,6.69-22.97,5.91-35.16-1.55-21.93-5.95-43.78-7.29-65.62-2-20.82-.3-42.98,22.42-50.95,11.95-4.01,25.96-1.45,34.74,8,8.22,8.75,9.95,22.05,9.74,33.66-.24,29.55-8.6,59.74-7.86,89.4.5,19.43,12.45,27.58,24.1,40.97,4.92,6.28,8.51,11.11-.7,10.67-18.25.05-67.75-.09-94.98,0-5.72-.18-10.46.94-9.7-2.7l.02-.08Z"/></g><g><path class="cls-1" d="M222.94,20.74c-15.79-.41-43.67,0-59.26-.09-5.74-.37-5.12,5.56-5.08,9.65.06,28.28-.12,108.34.06,125.46.66,3.29,8.38,2.12,11.1,2.37,3.93,0,8.58,0,12.18,0,4.74.15,8.27-.92,7.96-5.96.04-6.54,0-18.58.01-27.45.17-5.61-1.35-12.04,6.48-11.72,17.39-.34,37.3,2.02,52.72-7.58,40.15-25.8,20.56-83.8-26-84.66h-.17ZM233.17,79.19c-6.57,6.41-16.57,4.9-25.01,5.09-4.65-.05-9.52.19-14.11-.11-3.01-.2-4.5-1.72-4.3-4.63-.03-6.23-.02-17.36.01-25.05-.24-5.83,3.5-5.12,7.87-5.21,4.25,0,8.7,0,12.99,0,6.76.12,12.59-.63,18.6,2.3,10.02,4.82,12.1,19.93,4.09,27.47l-.14.13Z"/><path class="cls-1" d="M285.98,157.18c.86.63,2.24.84,3.43.89,6.89.01,15.23.33,22.05-.16,1.78-.3,2.43-1.06,2.45-2.53.61-13.86,0-71.73.14-92.02.43-6.44-1.31-7.66-7.83-7.39-5.2.04-11.39-.09-16.73.07-1.81.14-4.95.18-4.83,2.46-.08,8.1-.05,40.84-.03,67.59,0,10.45,0,19.98.02,26.77.03,1.49.04,3.25,1.25,4.23l.09.07Z"/><path class="cls-1" d="M298.87,12.56c-26.13.91-21.78,40.48,3.91,35.84,14.34-2.02,19.26-19.82,10.18-30.12-3.32-3.77-8.24-5.83-13.87-5.73h-.22Z"/><path class="cls-1" d="M387.53,53.55c-7.62.07-15.23,2.42-21.36,6.99-6.77,5.34-5.23-4.01-11.3-4.49-5.24-.46-11.42-.09-16.6-.2-2.63.12-7.61-.6-7.49,3.03-.66,15.61.01,79.48-.14,95.29-.06,1.44.17,2.77,1.71,3.43,6.13,1.46,13.47.3,19.91.64,3.41.16,8.36-.34,7.78-4.82.05-5.5,0-16.34.01-26.63.55-16.7-4.94-45.18,19.44-45.44,17.43.74,18.91,18.46,18.08,32.27.12,13.66-.26,31.6.16,41.19,1.09,5.93,16.16,2.61,20.96,3.44,8.67.43,8.61-1.8,8.33-9.86-.91-23.88,2.19-47.15-1.78-67.26-4.46-16.25-20.8-28.11-37.52-27.58h-.19Z"/><path class="cls-1" d="M479.61,36.88c-.51-.58-1.47-.68-2.33-.71-4.7-.05-18.12-.05-23.18,0-4.1-.21-3.17,3.64-3.31,6.97,0,2.2,0,4.75,0,6.82-.05,3.65.05,5.67-3.76,5.92-2.78.57-8.44-1.07-9.86,1.93-.77,5.53-.18,15.49-.26,20.41.04,2.1,1.16,3.09,3.33,3.18,2.38.27,7.08-.15,9.2.49,1.24.4,1.34,1.35,1.35,3.16,0,6.13,0,21.88,0,31.53.06,6.52-.29,10.19.89,15.75,2.23,11.64,12.23,21.12,23.6,24.14,8.47,2.12,17.96,2.03,26.53,1.28,1.51-.48,1.54-2.01,1.6-3.41.04-4.57.03-14.71,0-19.56.57-5.12-4.98-3.98-8.73-4.2-8.72.56-15.04-5.24-14.43-13.64.13-6.86-.28-24.96.16-33.93.28-1.23,1.28-1.43,3.79-1.48,24.88-.47,18.29,4.1,19.22-20.28,0-3.97-.14-5.11-3.22-5.21-1.98-.09-4.02-.05-6.1-.06-3.72-.39-10.36.91-13.06-.88-.46-.5-.58-1.17-.68-1.89-.56-4.07.61-12.29-.66-16.18l-.11-.15Z"/><path class="cls-1" d="M566.65,53.42c-28.63-.69-53.87,22.85-53.96,51.83-1.84,35.07,30.49,60.07,64.13,54.89,8.61-1.12,16.43-3.96,23.56-8.66,6.04-4.05,11.44-9.23,15.08-15.47,1.21-2.47.09-3.33-3.11-4.14-5.28-1.19-14.83-3.46-19.47-4.38-5.01-1.08-7.77,3.12-11.88,5.03-12.08,6.21-28.87,1.94-35.19-10.42-1.26-2.49-1.98-3.97-.26-4.36,16.38-.26,59.7.11,72.47-.14,1.24-.21,1.68-.93,2.08-2.26.56-2.15.8-5.77.81-8.37.91-29.44-24.7-54.34-53.81-53.55h-.44ZM543.9,94.84c5.09-16.08,27.27-21.45,39.72-10.16,2.99,2.56,6.47,6.82,7.19,10.52-.02.32-.19.51-.5.61-6.25.28-27.7.01-37.48.1-4-.03-7.12.07-8.38-.06-.43-.09-.62-.34-.57-.82l.03-.19Z"/><path class="cls-1" d="M257.62,185.51c-9.08,9.41-20.84,33.44-27.91,42.65-.46.61-1.03,1.47-1.73,1.56-2.22-.28-3.71-4.47-5.05-6.29-6.3-10.59-13.43-22.64-19.85-33.41-.91-1.48-1.9-3.05-3.33-4.01-3.67-2.26-8.44-1.17-12.57-1.43-7.08-.01-14.89,0-21.84,0-1.88.13-8.54-.6-6.63,2.29,6.31,10.32,35.3,54.08,48.25,75.6,1.61,2.61,2.37,4.85,2.3,7.99.11,11.37-.21,25.62-.14,37.34.08,5.42,0,9.34.41,12.82.86,3.79,6.93,2.13,9.91,2.54,7.46-.22,16.4.46,23.81-.32,4.93-1.02,2.65-7.61,3.19-12.03.33-15.72-.69-33.64.38-45.35,1.79-5.53,5.15-8.63,8.26-13.88,11.76-17.68,32.6-48.61,41.63-62.98.68-1,1.6-2.84.46-3.44-1.07-.55-2.67-.51-4.05-.51-9.86.51-25.67-1.36-35.38.81l-.11.06Z"/><path class="cls-1" d="M325.67,185.47c-17.5,31.55-50.67,120.65-58.26,135.8-.62,1.96,3.57,1.71,4.88,1.87,7.06.18,15.64-.04,22.67.02,2.32,0,4.95.11,7.17-.39,4.71-1.07,5.44-7.19,7.39-11.13,2.06-5.44,3.77-9.58,10.05-8.94,5.83-.01,15.76,0,24.68,0,3.97,0,7.48,0,11.3,0,2.79.08,5.97-.29,8.53.61,4.83,1.98,5.71,9.06,7.87,13.4,2.58,7.48,7.47,6.48,14,6.45,8.02-.13,16.68.29,24.15-.17,1.09-.17,2.51-.64,2.09-1.92-7.49-17.94-40.66-97.49-55.68-133.14-1.84-4.43-7.25-3.16-11.12-3.38-5.02,0-10.81-.07-15.7.03-1.35.02-2.81.22-3.9.8l-.12.07ZM326.44,270.32c-.42-.82.02-2.06.35-3.02,2.94-7.81,7.66-18.92,11.14-27.04.51-.94,1.41-4.06,2.58-2.59,3.54,7.06,9.59,22.86,12.82,30.79,1.09,3.17-3.12,2.86-5.17,2.9-4.98-.03-10.72.04-16.07.03-1.81-.15-4.37.39-5.6-.98l-.05-.08Z"/><path class="cls-1" d="M435.13,291.17c-22.84.8-20.16,36.98,3.53,33.19,13.1-1.77,17.45-18.53,9.3-27.88-2.99-3.48-7.53-5.43-12.61-5.32h-.22Z"/><path class="cls-1" d="M448.23,275.62c1.15-1.03,1.22-2.79,1.34-4.3,1.11-21.85,3.78-70.93,4.27-83.77.32-2.97-3.53-2.86-5.65-2.95-6.35-.03-14.45,0-20.93-.01-3.06.31-10.37-1.23-10.04,3.19.65,13.08,3.66,71.91,4.4,85.48.04,1.46.54,2.51,2.2,2.99,4.39.89,8.51.29,13.19.48,3.4-.15,9.41.47,11.13-1.03l.09-.08Z"/></g></g></g></svg>`)}`

      // Generar QR code URL usando API pública de QR (solo si hay link de pago)
      const paymentLink = order.payment_link || order.init_point || ''
      const qrCodeUrl = paymentLink 
        ? `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(paymentLink)}`
        : ''

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Orden #${order.order_number || order.id} - Pinteya</title>
          <style>
            * { box-sizing: border-box; }
            body { 
              font-family: 'Segoe UI', Arial, sans-serif; 
              max-width: 800px; 
              margin: 0 auto; 
              padding: 30px;
              color: #333;
            }
            .header { 
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              border-bottom: 3px solid #eb6313;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .logo { 
              display: flex;
              align-items: center;
              gap: 12px;
            }
            .logo img {
              height: 60px;
              width: auto;
            }
            .order-meta {
              text-align: right;
            }
            .order-meta h2 {
              margin: 0 0 5px 0;
              font-size: 18px;
              color: #333;
            }
            .order-meta p {
              margin: 3px 0;
              font-size: 13px;
              color: #666;
            }
            .status-badge {
              display: inline-block;
              background: #fef3c7;
              color: #92400e;
              padding: 4px 12px;
              border-radius: 20px;
              font-size: 12px;
              font-weight: 600;
              margin-top: 8px;
            }
            .qr-section {
              text-align: center;
              margin-top: 20px;
              padding: 16px;
              background: #f8f9fa;
              border-radius: 8px;
              border: 1px dashed #eb6313;
            }
            .qr-section img {
              margin-bottom: 8px;
            }
            .qr-section p {
              margin: 4px 0;
              font-size: 12px;
              color: #666;
            }
            .qr-section .qr-title {
              font-weight: 600;
              color: #eb6313;
              font-size: 14px;
            }
            .info-grid { 
              display: grid; 
              grid-template-columns: 1fr 1fr; 
              gap: 20px; 
              margin-bottom: 25px; 
            }
            .info-box { 
              background: #fafafa; 
              padding: 16px; 
              border-radius: 8px; 
              border-left: 4px solid #f59e0b;
            }
            .info-box h3 { 
              margin: 0 0 12px 0; 
              color: #f59e0b; 
              font-size: 12px; 
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .info-box p { margin: 6px 0; font-size: 14px; }
            .info-box strong { color: #333; }
            .observations {
              background: #fef9c3;
              border-left-color: #eab308;
              margin-top: 10px;
              padding: 10px 12px;
              font-size: 13px;
            }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-bottom: 25px;
              font-size: 14px;
            }
            th { 
              background: #f59e0b; 
              color: white; 
              padding: 12px 8px; 
              text-align: left;
              font-weight: 600;
            }
            th:nth-child(2) { text-align: center; }
            th:nth-child(3), th:nth-child(4) { text-align: right; }
            td { vertical-align: top; }
            .totals {
              display: flex;
              justify-content: flex-end;
              margin-bottom: 30px;
            }
            .totals-box {
              background: #fafafa;
              padding: 16px 24px;
              border-radius: 8px;
              min-width: 250px;
            }
            .totals-row {
              display: flex;
              justify-content: space-between;
              margin: 6px 0;
              font-size: 14px;
            }
            .totals-row.total {
              font-size: 18px;
              font-weight: bold;
              color: #f59e0b;
              border-top: 2px solid #e5e5e5;
              padding-top: 10px;
              margin-top: 10px;
            }
            .footer {
              text-align: center;
              padding-top: 20px;
              border-top: 1px solid #eee;
              font-size: 12px;
              color: #999;
            }
            @media print { 
              body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">
              <img src="${logoSvg}" alt="Pinteya" />
            </div>
            <div class="order-meta">
              <h2>Orden #${order.order_number || order.id}</h2>
              <p>${formatDate(order.created_at)}</p>
              <span class="status-badge">${orderStatus}</span>
            </div>
          </div>

          <div class="info-grid">
            <div class="info-box">
              <h3>📦 Datos del Cliente</h3>
              <p><strong>Nombre:</strong> ${clientName}</p>
              <p><strong>Teléfono:</strong> ${clientPhone}</p>
            </div>
            <div class="info-box">
              <h3>💳 Método de Pago</h3>
              <p><strong>Método:</strong> ${paymentMethod}</p>
              <p><strong>Estado:</strong> ${paymentStatus}</p>
            </div>
          </div>

          <div class="info-box" style="margin-bottom: 25px;">
            <h3>📍 Dirección de Envío</h3>
            <p>${address}</p>
            ${observations ? `<div class="observations"><strong>Indicaciones:</strong> ${observations}</div>` : ''}
          </div>

          <table>
            <thead>
              <tr>
                <th>Producto</th>
                <th>Cant.</th>
                <th>Precio Unit.</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${items}
            </tbody>
          </table>

          <div class="totals">
            <div class="totals-box">
              <div class="totals-row total">
                <span>TOTAL:</span>
                <span>${formatCurrency(order.total)}</span>
              </div>
            </div>
          </div>

          ${qrCodeUrl ? `
          <div class="qr-section">
            <p class="qr-title">¿Preferís pagar con MercadoPago?</p>
            <img src="${qrCodeUrl}" alt="QR Pago" />
            <p>Escaneá el código QR para pagar online</p>
          </div>
          ` : ''}

          <div class="footer">
            <p>Gracias por tu compra en <strong>Pinteya</strong></p>
            <p>Este documento es un comprobante de tu pedido</p>
          </div>
        </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.focus()
      setTimeout(() => {
        printWindow.print()
      }, 250)

      toast.success('Preparando impresión...')
    } catch (error) {
      toast.error('Error al preparar la impresión')
      console.error('Error printing order:', error)
    }
  }

  // Handler para descargar orden como JSON
  const handleDownloadOrder = async (orderId: string) => {
    try {
      const response = await fetch(`/api/admin/orders/${orderId}`)
      if (!response.ok) {
        throw new Error('Error al obtener datos de la orden')
      }
      const data = await response.json()
      const order = data.data

      if (!order) {
        toast.error('No se encontraron datos de la orden')
        return
      }

      // Crear archivo JSON para descarga
      const jsonContent = JSON.stringify(order, null, 2)
      const blob = new Blob([jsonContent], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      
      const link = document.createElement('a')
      link.href = url
      link.download = `orden-${order.order_number || order.id}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast.success('Archivo descargado correctamente')
    } catch (error) {
      toast.error('Error al descargar la orden')
      console.error('Error downloading order:', error)
    }
  }

  // Handler con feedback visual
  // Handler para marcar como pagada
  const handleMarkAsPaid = async (orderId: string) => {
    const loadingToast = toast.loading('Marcando orden como pagada...')
    try {
      const response = await fetch(`/api/admin/orders/${orderId}/mark-paid`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payment_method: 'manual',
          notes: 'Marcado como pagado manualmente por administrador',
        }),
      })

      if (response.ok) {
        toast.success('Orden marcada como pagada', { id: loadingToast })
        refreshOrders()
      } else {
        toast.error('Error al marcar orden como pagada', { id: loadingToast })
      }
    } catch (error) {
      console.error('Error marking as paid:', error)
      toast.error('Error al marcar orden como pagada', { id: loadingToast })
    }
  }

  const handleOrderActionWithToast = async (action: string, orderId: string) => {
    // Manejar acciones especiales primero
    if (action === 'history') {
      handleViewHistory(orderId)
      return
    }
    if (action === 'print') {
      handlePrintOrder(orderId)
      return
    }
    if (action === 'mark_paid') {
      handleMarkAsPaid(orderId)
      return
    }

    // Mapear acciones a mensajes
    const actionMessages: Record<string, { loading: string; success: string }> = {
      process: {
        loading: 'Marcando orden como en proceso...',
        success: 'Orden marcada como en proceso',
      },
      deliver: {
        loading: 'Marcando orden como entregada...',
        success: 'Orden marcada como entregada',
      },
      ship: {
        loading: 'Marcando orden como enviada...',
        success: 'Orden marcada como enviada',
      },
      confirm: {
        loading: 'Confirmando orden...',
        success: 'Orden confirmada',
      },
      cancel: {
        loading: 'Cancelando orden...',
        success: 'Orden cancelada',
      },
      refund: {
        loading: 'Procesando reembolso...',
        success: 'Reembolso procesado',
      },
    }

    const messages = actionMessages[action]

    if (messages) {
      const loadingToast = toast.loading(messages.loading)
      try {
        await handleOrderAction(action, orderId)
        toast.success(messages.success, { id: loadingToast })
        refreshOrders() // Refrescar después de cualquier acción
      } catch (error) {
        toast.error('Error al actualizar la orden', { id: loadingToast })
        console.error('Error en acción de orden:', error)
      }
    } else {
      // Para acciones que no requieren actualización de estado
      handleOrderAction(action, orderId)
    }
  }

  // =====================================================
  // RENDER
  // =====================================================

  const breadcrumbs = [
    { label: 'Admin', href: '/admin' },
    { label: 'Órdenes' },
  ]

  return (
    <AdminLayout title='Órdenes' breadcrumbs={breadcrumbs}>
      <AdminContentWrapper>
        <div className='space-y-5 sm:space-y-6'>
          {bypassDescription}
          {/* Header con Gradiente - Responsive */}
          <div className='bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-2xl shadow-lg p-4 sm:p-6 text-white space-y-4'>
            <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4'>
              <div className='space-y-2'>
                <div className='flex items-center gap-3'>
                  <ShoppingCart className='w-6 h-6 sm:w-8 sm:h-8' />
                  <h1 className='text-2xl sm:text-3xl font-bold'>Gestión de Órdenes</h1>
                </div>
                <p className='text-indigo-100 text-sm sm:text-base'>
                  Administra y procesa todas las órdenes de tu tienda
                </p>
              </div>
              <div className='flex flex-col sm:flex-row w-full sm:w-auto gap-2 sm:gap-3'>
                <Button
                  variant='secondary'
                  onClick={() => refreshOrders()}
                  disabled={isLoading}
                  className='flex-1 flex items-center justify-center gap-2 bg-white/20 hover:bg-white/30 text-white border-white/30'
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                  <span>Actualizar</span>
                </Button>
                <Button
                  onClick={() => setIsNewOrderModalOpen(true)}
                  className='flex-1 flex items-center justify-center gap-2 bg-white text-indigo-600 hover:bg-indigo-50'
                >
                  <Plus className='w-4 h-4' />
                  <span>Nueva orden</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Stats Cards - Mobile First */}
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6'>
            {/* Total Órdenes */}
            <Card className='border-t-4 border-t-indigo-500 hover:shadow-lg transition-shadow'>
              <CardHeader className='flex flex-row items-center justify-between pb-2'>
                <CardTitle className='text-sm font-medium text-gray-600'>Total Órdenes</CardTitle>
                <div className='w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center'>
                  <Package className='h-5 w-5 text-indigo-600' />
                </div>
              </CardHeader>
              <CardContent>
                <div className='text-3xl font-bold text-gray-900' data-testid='stat-total-orders'>
                  {isLoadingStats ? (
                    <div className='h-9 w-20 bg-gray-200 animate-pulse rounded' />
                  ) : (
                    stats?.totalOrders || 0
                  )}
                </div>
                <p className='text-xs text-gray-500 mt-1'>En el sistema</p>
              </CardContent>
            </Card>

            {/* Órdenes Pendientes */}
            <Card className='border-t-4 border-t-yellow-500 hover:shadow-lg transition-shadow'>
              <CardHeader className='flex flex-row items-center justify-between pb-2'>
                <CardTitle className='text-sm font-medium text-gray-600'>Pendientes</CardTitle>
                <div className='w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center'>
                  <Clock className='h-5 w-5 text-yellow-600' />
                </div>
              </CardHeader>
              <CardContent>
                <div className='text-3xl font-bold text-gray-900' data-testid='stat-pending-orders'>
                  {isLoadingStats ? (
                    <div className='h-9 w-20 bg-gray-200 animate-pulse rounded' />
                  ) : (
                    stats?.pendingOrders || 0
                  )}
                </div>
                <p className='text-xs text-yellow-600 mt-1'>Requieren atención</p>
              </CardContent>
            </Card>

            {/* Órdenes Completadas */}
            <Card className='border-t-4 border-t-green-500 hover:shadow-lg transition-shadow'>
              <CardHeader className='flex flex-row items-center justify-between pb-2'>
                <CardTitle className='text-sm font-medium text-gray-600'>Completadas</CardTitle>
                <div className='w-10 h-10 rounded-full bg-green-100 flex items-center justify-center'>
                  <CheckCircle className='h-5 w-5 text-green-600' />
                </div>
              </CardHeader>
              <CardContent>
                <div className='text-3xl font-bold text-gray-900' data-testid='stat-completed-orders'>
                  {isLoadingStats ? (
                    <div className='h-9 w-20 bg-gray-200 animate-pulse rounded' />
                  ) : (
                    stats?.completedOrders || 0
                  )}
                </div>
                <p className='text-xs text-green-600 mt-1'>Entregadas exitosamente</p>
              </CardContent>
            </Card>

            {/* Ingresos Totales */}
            <Card className='border-t-4 border-t-purple-500 hover:shadow-lg transition-shadow'>
              <CardHeader className='flex flex-row items-center justify-between pb-2'>
                <CardTitle className='text-sm font-medium text-gray-600'>Ingresos Totales</CardTitle>
                <div className='w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center'>
                  <DollarSign className='h-5 w-5 text-purple-600' />
                </div>
              </CardHeader>
              <CardContent>
                <div className='text-3xl font-bold text-gray-900' data-testid='stat-total-revenue'>
                  {isLoadingStats ? (
                    <div className='h-9 w-32 bg-gray-200 animate-pulse rounded' />
                  ) : (
                    new Intl.NumberFormat('es-AR', {
                      style: 'currency',
                      currency: 'ARS',
                      minimumFractionDigits: 0,
                    }).format(stats?.totalRevenue || 0)
              )}
            </div>
                        <p className='text-xs text-gray-500 mt-1'>
                          {stats?.averageOrderValue
                            ? `Promedio: ${new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(stats.averageOrderValue)}`
                            : 'Promedio: $0'}
                        </p>
              </CardContent>
            </Card>
          </div>

          {/* Acciones Rápidas */}
          <Card>
            <CardHeader className='pb-3'>
              <CardTitle className='flex items-center gap-2'>
                <BarChart3 className='w-5 h-5' />
                <span>Acciones Rápidas</span>
              </CardTitle>
              <CardDescription>Herramientas para gestión de órdenes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4'>
                <Button
                  variant='outline'
                  className='flex items-center justify-center gap-2 h-16'
                  onClick={() => setIsExportModalOpen(true)}
                  type='button'
                >
                  <Download className='w-5 h-5' />
                  <span>Exportar CSV</span>
                </Button>
                <Button
                  variant='outline'
                  className='flex items-center justify-center gap-2 h-16'
                  onClick={() => {
                    toast.info('Generación de reportes disponible próximamente')
                  }}
                  type='button'
                >
                  <FileText className='w-5 h-5' />
                  <span>Generar Reportes</span>
                </Button>
                <Button
                  variant='outline'
                  className='flex items-center justify-center gap-2 h-16'
                  onClick={() => {
                    toast.info('Análisis avanzado llegará en la próxima iteración')
                  }}
                  type='button'
                >
                  <TrendingUp className='w-5 h-5' />
                  <span>Análisis de Ventas</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Tabs Mejoradas */}
          <Tabs
            defaultValue='all'
            className='w-full'
            onValueChange={(value) => {
              // Actualizar filtro de estado y resetear página
              if (value === 'all') {
                // Limpiar el filtro de estado
                resetFilters()
              } else if (value === 'pending') {
                updateFilters({ status: 'pending' as any, page: 1 })
              } else if (value === 'processing') {
                updateFilters({ status: 'processing' as any, page: 1 })
              } else if (value === 'completed') {
                updateFilters({ status: 'delivered' as any, page: 1 })
              }
            }}
          >
            <div className='flex flex-col gap-3 sm:gap-4 sm:flex-row sm:items-center sm:justify-between mb-4'>
              <TabsList className='bg-gray-100 p-1 rounded-lg flex flex-wrap gap-2'>
                <TabsTrigger
                  value='all'
                  className='data-[state=active]:bg-white data-[state=active]:shadow-sm px-6 py-2.5'
                >
                  Todas las Órdenes
                  {!isLoading && stats && stats.totalOrders > 0 && (
                    <span className='ml-2 bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full text-xs font-medium'>
                      {stats.totalOrders}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger
                  value='pending'
                  className='data-[state=active]:bg-white data-[state=active]:shadow-sm px-6 py-2.5'
                >
                  Pendientes
                  {!isLoading && stats && stats.pendingOrders > 0 && (
                    <span className='ml-2 bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full text-xs font-medium'>
                      {stats.pendingOrders}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger
                  value='processing'
                  className='data-[state=active]:bg-white data-[state=active]:shadow-sm px-6 py-2.5'
                >
                  En Proceso
                  {!isLoading && stats && stats.processingOrders > 0 && (
                    <span className='ml-2 bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full text-xs font-medium'>
                      {stats.processingOrders}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger
                  value='completed'
                  className='data-[state=active]:bg-white data-[state=active]:shadow-sm px-6 py-2.5'
                >
                  Completadas
                  {!isLoading && stats && stats.completedOrders > 0 && (
                    <span className='ml-2 bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-medium'>
                      {stats.completedOrders}
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>

              {/* Operaciones masivas si hay órdenes seleccionadas */}
              <OrderBulkOperations
                selectedOrders={selectedOrders}
                onBulkAction={(action: string, orderIds: string[]) => {
                  // Convertir la acción a un OrderStatus válido
                  const statusMap: Record<string, any> = {
                    confirm: 'confirmed',
                    process: 'processing',
                    ship: 'shipped',
                    deliver: 'delivered',
                    cancel: 'cancelled',
                  }
                  const status = statusMap[action] || 'pending'
                  handleBulkOperation(orderIds, status)
                  // Limpiar selección después de la operación
                  setSelectedOrders([])
                }} 
              />
            </div>

            {/* Tab: Todas las Órdenes */}
            <TabsContent value='all' className='mt-0'>
              <Card className='border-t-4 border-t-indigo-500'>
                <CardContent className='p-0'>
                  <ErrorBoundary>
                    <Suspense fallback={<LoadingSkeleton lines={5} variant="card" />}>
                      <OrderList
                        key={`orders-${filters.page}-${filters.limit}-${filters.status || 'all'}`}
                        orders={orders}
                        isLoading={isLoadingOrders}
                        error={error}
                        selectedOrders={selectedOrders}
                        setSelectedOrders={setSelectedOrders}
                        onOrderAction={(action, orderId) => {
                          if (action === 'view') {
                            handleViewOrder(orderId)
                          } else if (action === 'edit') {
                            handleEditOrder(orderId)
                          } else {
                            handleOrderActionWithToast(action, orderId)
                          }
                        }}
                        filters={filters}
                        updateFilters={updateFilters}
                        resetFilters={resetFilters}
                        pagination={pagination}
                      />
                    </Suspense>
                  </ErrorBoundary>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Pendientes */}
            <TabsContent value='pending' className='mt-0'>
              <Card className='border-t-4 border-t-yellow-500'>
                <CardContent className='p-0'>
                  <ErrorBoundary>
                    <Suspense fallback={<LoadingSkeleton lines={5} variant="card" />}>
                      <OrderList
                        key={`orders-pending-${filters.page}-${filters.limit}`}
                        orders={orders}
                        isLoading={isLoadingOrders}
                        error={error}
                        selectedOrders={selectedOrders}
                        setSelectedOrders={setSelectedOrders}
                        onOrderAction={(action, orderId) => {
                          if (action === 'view') {
                            handleViewOrder(orderId)
                          } else if (action === 'edit') {
                            handleEditOrder(orderId)
                          } else {
                            handleOrderActionWithToast(action, orderId)
                          }
                        }}
                        filters={filters}
                        updateFilters={updateFilters}
                        resetFilters={resetFilters}
                        pagination={pagination}
                      />
                    </Suspense>
                  </ErrorBoundary>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: En Proceso */}
            <TabsContent value='processing' className='mt-0'>
              <Card className='border-t-4 border-t-orange-500'>
                <CardContent className='p-0'>
                  <ErrorBoundary>
                    <Suspense fallback={<LoadingSkeleton lines={5} variant="card" />}>
                      <OrderList
                        key={`orders-processing-${filters.page}-${filters.limit}`}
                        orders={orders}
                        isLoading={isLoadingOrders}
                        error={error}
                        selectedOrders={selectedOrders}
                        setSelectedOrders={setSelectedOrders}
                        onOrderAction={(action, orderId) => {
                          if (action === 'view') {
                            handleViewOrder(orderId)
                          } else if (action === 'edit') {
                            handleEditOrder(orderId)
                          } else {
                            handleOrderActionWithToast(action, orderId)
                          }
                        }}
                        filters={filters}
                        updateFilters={updateFilters}
                        resetFilters={resetFilters}
                        pagination={pagination}
                      />
                    </Suspense>
                  </ErrorBoundary>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Completadas */}
            <TabsContent value='completed' className='mt-0'>
              <Card className='border-t-4 border-t-green-500'>
                <CardContent className='p-0'>
                  <ErrorBoundary>
                    <Suspense fallback={<LoadingSkeleton lines={5} variant="card" />}>
                      <OrderList
                        key={`orders-completed-${filters.page}-${filters.limit}`}
                        orders={orders}
                        isLoading={isLoadingOrders}
                        error={error}
                        selectedOrders={selectedOrders}
                        setSelectedOrders={setSelectedOrders}
                        onOrderAction={(action, orderId) => {
                          if (action === 'view') {
                            handleViewOrder(orderId)
                          } else if (action === 'edit') {
                            handleEditOrder(orderId)
                          } else {
                            handleOrderActionWithToast(action, orderId)
                          }
                        }}
                        filters={filters}
                        updateFilters={updateFilters}
                        resetFilters={resetFilters}
                        pagination={pagination}
                      />
                    </Suspense>
                  </ErrorBoundary>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Error Display */}
          {error && (
            <Card className='border-red-200 bg-red-50'>
              <CardContent className='pt-6'>
                <div className='flex items-center space-x-2 text-red-700'>
                  <div className='text-sm'>
                    Error: {error instanceof Error ? error.message : 'Error desconocido'}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Modales */}
        <NewOrderModal
          isOpen={isNewOrderModalOpen}
          onClose={() => setIsNewOrderModalOpen(false)}
          onOrderCreated={() => {
            setIsNewOrderModalOpen(false)
            refreshOrders()
          }}
        />

        <ExportOrdersModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          totalOrders={stats?.totalOrders || 0}
        />

        {selectedOrderId && (
          <>
            <OrderDetailsModal
              orderId={selectedOrderId}
              isOpen={isDetailsModalOpen}
              onClose={() => {
                setIsDetailsModalOpen(false)
                setSelectedOrderId(null)
              }}
              onOrderUpdated={() => {
                refreshOrders()
              }}
            />

            <EditOrderModal
              orderId={selectedOrderId}
              isOpen={isEditModalOpen}
              onClose={() => {
                setIsEditModalOpen(false)
                setSelectedOrderId(null)
              }}
              onOrderUpdated={() => {
                setIsEditModalOpen(false)
                setSelectedOrderId(null)
                refreshOrders()
              }}
            />
          </>
        )}
      </AdminContentWrapper>
    </AdminLayout>
  )
}
