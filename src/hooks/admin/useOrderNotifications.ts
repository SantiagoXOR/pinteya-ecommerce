/**
 * Hook de Notificaciones para Panel Administrativo de Órdenes
 * Basado en mejores prácticas de e-commerce (Shopify, WooCommerce)
 */

import { useCallback } from 'react';
import { toast } from '@/components/ui/use-toast';

// ===================================
// TIPOS
// ===================================

export interface OrderNotificationOptions {
  orderId?: number | string;
  customerName?: string;
  amount?: number;
  productCount?: number;
  duration?: number;
}

export interface BulkActionOptions {
  selectedCount: number;
  action: string;
  duration?: number;
}

export interface ExportOptions {
  format: 'CSV' | 'Excel';
  recordCount: number;
  duration?: number;
}

// ===================================
// HOOK PRINCIPAL
// ===================================

export const useOrderNotifications = () => {
  
  // ===================================
  // NOTIFICACIONES DE ÉXITO
  // ===================================

  const showOrderCreated = useCallback((options: OrderNotificationOptions) => {
    const { orderId, customerName, amount } = options;
    
    return toast({
      variant: 'success',
      title: '✅ Orden creada exitosamente',
      description: `Orden #${orderId} para ${customerName || 'cliente'} por $${amount?.toLocaleString() || '0'}`,
      duration: 4000,
    });
  }, []);

  const showOrderUpdated = useCallback((options: OrderNotificationOptions) => {
    const { orderId, changes } = options;

    return toast({
      variant: 'success',
      title: '✅ Orden actualizada',
      description: `Los cambios en la orden #${orderId} se guardaron correctamente${changes ? ` (${changes} cambios)` : ''}`,
      duration: 3000,
    });
  }, []);

  const showOrderUpdateError = useCallback((error: string) => {
    return toast({
      variant: 'destructive',
      title: '❌ Error al actualizar orden',
      description: error || 'No se pudo actualizar la orden',
      duration: 5000,
    });
  }, []);

  const showOrderStatusChanged = useCallback((orderId: number | string, newStatus: string) => {
    const statusLabels: Record<string, string> = {
      'pending': 'Pendiente',
      'processing': 'Procesando',
      'shipped': 'Enviado',
      'delivered': 'Entregado',
      'cancelled': 'Cancelado',
      'refunded': 'Reembolsado'
    };

    return toast({
      variant: 'success',
      title: '🔄 Estado actualizado',
      description: `Orden #${orderId} cambió a: ${statusLabels[newStatus] || newStatus}`,
      duration: 3000,
    });
  }, []);

  const showBulkActionSuccess = useCallback((options: BulkActionOptions) => {
    const { selectedCount, action } = options;
    
    return toast({
      variant: 'success',
      title: '✅ Acción en lote completada',
      description: `${action} aplicado a ${selectedCount} órdenes exitosamente`,
      duration: 4000,
    });
  }, []);

  const showExportSuccess = useCallback((options: ExportOptions) => {
    const { format, recordCount } = options;
    
    return toast({
      variant: 'success',
      title: '📊 Exportación completada',
      description: `${recordCount} órdenes exportadas en formato ${format}`,
      duration: 5000,
    });
  }, []);

  const showDataRefreshed = useCallback((recordCount: number) => {
    return toast({
      variant: 'success',
      title: '🔄 Datos actualizados',
      description: `${recordCount} órdenes cargadas exitosamente`,
      duration: 2000,
    });
  }, []);

  // ===================================
  // NOTIFICACIONES DE ERROR
  // ===================================

  const showOrderCreationError = useCallback((error: string) => {
    return toast({
      variant: 'destructive',
      title: '❌ Error al crear orden',
      description: error || 'No se pudo crear la orden. Intenta nuevamente.',
      duration: 6000,
    });
  }, []);



  const showBulkActionError = useCallback((action: string, error: string) => {
    return toast({
      variant: 'destructive',
      title: '❌ Error en acción en lote',
      description: `No se pudo completar ${action}: ${error}`,
      duration: 6000,
    });
  }, []);

  const showExportError = useCallback((format: string, error: string) => {
    return toast({
      variant: 'destructive',
      title: '❌ Error en exportación',
      description: `No se pudo exportar en formato ${format}: ${error}`,
      duration: 6000,
    });
  }, []);

  const showNetworkError = useCallback((action: string) => {
    return toast({
      variant: 'destructive',
      title: '🌐 Error de conexión',
      description: `No se pudo ${action}. Verifica tu conexión a internet.`,
      duration: 6000,
    });
  }, []);

  // ===================================
  // NOTIFICACIONES DE ADVERTENCIA
  // ===================================

  const showValidationWarning = useCallback((message: string) => {
    return toast({
      variant: 'warning',
      title: '⚠️ Datos incompletos',
      description: message,
      duration: 5000,
    });
  }, []);

  const showStockWarning = useCallback((productName: string, availableStock: number) => {
    return toast({
      variant: 'warning',
      title: '⚠️ Stock limitado',
      description: `${productName} tiene solo ${availableStock} unidades disponibles`,
      duration: 5000,
    });
  }, []);

  // ===================================
  // NOTIFICACIONES DE CONFIRMACIÓN
  // ===================================

  const showDeleteConfirmation = useCallback((orderId: number | string, onConfirm: () => void) => {
    return toast({
      variant: 'destructive',
      title: '🗑️ Confirmar eliminación',
      description: `¿Estás seguro de eliminar la orden #${orderId}? Esta acción no se puede deshacer.`,
      duration: 0, // No auto-dismiss
    });
  }, []);

  // ===================================
  // NOTIFICACIONES INFORMATIVAS
  // ===================================

  const showProcessingInfo = useCallback((action: string) => {
    return toast({
      variant: 'default',
      title: '⏳ Procesando...',
      description: `${action} en progreso, por favor espera`,
      duration: 0, // Se debe cerrar manualmente
    });
  }, []);

  const showFilterApplied = useCallback((filterCount: number, totalResults: number) => {
    return toast({
      variant: 'default',
      title: '🔍 Filtros aplicados',
      description: `${filterCount} filtros activos - ${totalResults} órdenes encontradas`,
      duration: 3000,
    });
  }, []);

  // ===================================
  // UTILIDADES
  // ===================================

  const dismissAll = useCallback(() => {
    // Implementar lógica para cerrar todos los toasts si es necesario
    console.log('Dismissing all toasts');
  }, []);

  return {
    // Éxito
    showOrderCreated,
    showOrderUpdated,
    showOrderStatusChanged,
    showBulkActionSuccess,
    showExportSuccess,
    showDataRefreshed,
    
    // Errores
    showOrderCreationError,
    showOrderUpdateError,
    showBulkActionError,
    showExportError,
    showNetworkError,
    
    // Advertencias
    showValidationWarning,
    showStockWarning,
    
    // Confirmaciones
    showDeleteConfirmation,
    
    // Información
    showProcessingInfo,
    showFilterApplied,
    
    // Utilidades
    dismissAll,
  };
};

export default useOrderNotifications;









