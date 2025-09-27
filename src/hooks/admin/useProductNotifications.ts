/**
 * Hook de Notificaciones para Panel Administrativo de Productos
 * Basado en mejores prácticas de e-commerce (Shopify, WooCommerce)
 */

import { useCallback } from 'react'
import { toast } from '@/components/ui/use-toast'

// ===================================
// TIPOS
// ===================================

export interface ProductNotificationOptions {
  productId?: number | string
  productName?: string
  sku?: string
  price?: number
  stock?: number
  duration?: number
  changes?: string
}

export interface BulkProductActionOptions {
  selectedCount: number
  action: string
  duration?: number
  affectedProducts?: string[]
}

export interface ProductExportOptions {
  format: 'CSV' | 'Excel' | 'JSON'
  recordCount: number
  duration?: number
}

export interface ProductImportOptions {
  format: 'CSV' | 'Excel' | 'JSON'
  recordCount: number
  successCount: number
  errorCount: number
  duration?: number
}

export interface InventoryNotificationOptions {
  productName: string
  currentStock: number
  threshold?: number
  action?: 'low_stock' | 'out_of_stock' | 'restocked'
  duration?: number
}

// ===================================
// HOOK PRINCIPAL
// ===================================

export const useProductNotifications = () => {
  // ===================================
  // NOTIFICACIONES DE ÉXITO - CRUD
  // ===================================

  const showProductCreated = useCallback((options: ProductNotificationOptions) => {
    const { productId, productName, sku, price } = options

    return toast({
      variant: 'success',
      title: '✅ Producto creado exitosamente',
      description: `${productName || 'Producto'} ${sku ? `(${sku})` : ''} ${price ? `- $${price.toLocaleString()}` : ''} ha sido creado`,
      duration: 4000,
    })
  }, [])

  const showProductUpdated = useCallback((options: ProductNotificationOptions) => {
    const { productId, productName, changes } = options

    return toast({
      variant: 'success',
      title: '✅ Producto actualizado',
      description: `${productName || `Producto #${productId}`} se actualizó correctamente${changes ? ` (${changes})` : ''}`,
      duration: 3000,
    })
  }, [])

  const showProductDeleted = useCallback((options: ProductNotificationOptions) => {
    const { productName, productId } = options

    return toast({
      variant: 'success',
      title: '🗑️ Producto eliminado',
      description: `${productName || `Producto #${productId}`} ha sido eliminado exitosamente`,
      duration: 3000,
    })
  }, [])

  const showProductDuplicated = useCallback((options: ProductNotificationOptions) => {
    const { productName, productId } = options

    return toast({
      variant: 'success',
      title: '📋 Producto duplicado',
      description: `Se creó una copia de ${productName || `Producto #${productId}`}`,
      duration: 3000,
    })
  }, [])

  // ===================================
  // NOTIFICACIONES DE ESTADO
  // ===================================

  const showProductStatusChanged = useCallback((productName: string, newStatus: string) => {
    const statusLabels: Record<string, string> = {
      active: 'Activo',
      inactive: 'Inactivo',
      draft: 'Borrador',
      archived: 'Archivado',
    }

    return toast({
      variant: 'success',
      title: '🔄 Estado actualizado',
      description: `${productName} cambió a: ${statusLabels[newStatus] || newStatus}`,
      duration: 3000,
    })
  }, [])

  // ===================================
  // NOTIFICACIONES DE INVENTARIO
  // ===================================

  const showInventoryUpdated = useCallback((options: ProductNotificationOptions) => {
    const { productName, stock } = options

    return toast({
      variant: 'success',
      title: '📦 Inventario actualizado',
      description: `${productName}: ${stock} unidades en stock`,
      duration: 3000,
    })
  }, [])

  const showLowStockAlert = useCallback((options: InventoryNotificationOptions) => {
    const { productName, currentStock, threshold } = options

    return toast({
      variant: 'warning',
      title: '⚠️ Stock bajo',
      description: `${productName} tiene solo ${currentStock} unidades${threshold ? ` (mínimo: ${threshold})` : ''}`,
      duration: 6000,
    })
  }, [])

  const showOutOfStockAlert = useCallback((productName: string) => {
    return toast({
      variant: 'destructive',
      title: '🚫 Sin stock',
      description: `${productName} está agotado`,
      duration: 6000,
    })
  }, [])

  const showRestockedAlert = useCallback((options: InventoryNotificationOptions) => {
    const { productName, currentStock } = options

    return toast({
      variant: 'success',
      title: '📈 Producto reabastecido',
      description: `${productName} ahora tiene ${currentStock} unidades en stock`,
      duration: 4000,
    })
  }, [])

  // ===================================
  // NOTIFICACIONES DE OPERACIONES MASIVAS
  // ===================================

  const showBulkActionSuccess = useCallback((options: BulkProductActionOptions) => {
    const { selectedCount, action } = options

    const actionLabels: Record<string, string> = {
      delete: 'eliminación',
      activate: 'activación',
      deactivate: 'desactivación',
      archive: 'archivado',
      update_price: 'actualización de precios',
      update_category: 'cambio de categoría',
      update_stock: 'actualización de inventario',
    }

    return toast({
      variant: 'success',
      title: '✅ Acción en lote completada',
      description: `${actionLabels[action] || action} aplicada a ${selectedCount} productos exitosamente`,
      duration: 4000,
    })
  }, [])

  const showBulkActionPartial = useCallback(
    (successCount: number, errorCount: number, action: string) => {
      return toast({
        variant: 'warning',
        title: '⚠️ Acción parcialmente completada',
        description: `${action}: ${successCount} exitosos, ${errorCount} con errores`,
        duration: 5000,
      })
    },
    []
  )

  // ===================================
  // NOTIFICACIONES DE IMPORTACIÓN/EXPORTACIÓN
  // ===================================

  const showExportSuccess = useCallback((options: ProductExportOptions) => {
    const { format, recordCount } = options

    return toast({
      variant: 'success',
      title: '📊 Exportación completada',
      description: `${recordCount} productos exportados en formato ${format}`,
      duration: 5000,
    })
  }, [])

  const showImportSuccess = useCallback((options: ProductImportOptions) => {
    const { format, successCount, errorCount } = options

    if (errorCount === 0) {
      return toast({
        variant: 'success',
        title: '📥 Importación completada',
        description: `${successCount} productos importados exitosamente desde ${format}`,
        duration: 5000,
      })
    } else {
      return toast({
        variant: 'warning',
        title: '📥 Importación completada con errores',
        description: `${successCount} productos importados, ${errorCount} con errores`,
        duration: 6000,
      })
    }
  }, [])

  // ===================================
  // NOTIFICACIONES DE PROCESAMIENTO
  // ===================================

  const showProcessingInfo = useCallback((message: string) => {
    return toast({
      variant: 'info',
      title: '⏳ Procesando...',
      description: message,
      duration: 2000,
    })
  }, [])

  const showDataRefreshed = useCallback((recordCount: number) => {
    return toast({
      variant: 'success',
      title: '🔄 Datos actualizados',
      description: `${recordCount} productos cargados exitosamente`,
      duration: 2000,
    })
  }, [])

  // ===================================
  // NOTIFICACIONES DE ERROR
  // ===================================

  const showProductCreationError = useCallback((error: string) => {
    return toast({
      variant: 'destructive',
      title: '❌ Error al crear producto',
      description: error || 'No se pudo crear el producto. Intenta nuevamente.',
      duration: 6000,
    })
  }, [])

  const showProductUpdateError = useCallback((error: string, productName?: string) => {
    return toast({
      variant: 'destructive',
      title: '❌ Error al actualizar producto',
      description: `${productName ? `${productName}: ` : ''}${error || 'No se pudo actualizar el producto'}`,
      duration: 6000,
    })
  }, [])

  const showProductDeleteError = useCallback((error: string, productName?: string) => {
    return toast({
      variant: 'destructive',
      title: '❌ Error al eliminar producto',
      description: `${productName ? `${productName}: ` : ''}${error || 'No se pudo eliminar el producto'}`,
      duration: 6000,
    })
  }, [])

  const showBulkActionError = useCallback((action: string, error: string) => {
    return toast({
      variant: 'destructive',
      title: '❌ Error en acción en lote',
      description: `No se pudo completar ${action}: ${error}`,
      duration: 6000,
    })
  }, [])

  const showExportError = useCallback((format: string, error: string) => {
    return toast({
      variant: 'destructive',
      title: '❌ Error en exportación',
      description: `No se pudo exportar en formato ${format}: ${error}`,
      duration: 6000,
    })
  }, [])

  const showImportError = useCallback((format: string, error: string) => {
    return toast({
      variant: 'destructive',
      title: '❌ Error en importación',
      description: `No se pudo importar desde ${format}: ${error}`,
      duration: 6000,
    })
  }, [])

  const showNetworkError = useCallback((action: string) => {
    return toast({
      variant: 'destructive',
      title: '🌐 Error de conexión',
      description: `No se pudo ${action}. Verifica tu conexión a internet.`,
      duration: 6000,
    })
  }, [])

  // ===================================
  // NOTIFICACIONES DE ADVERTENCIA
  // ===================================

  const showValidationWarning = useCallback((message: string) => {
    return toast({
      variant: 'warning',
      title: '⚠️ Datos incompletos',
      description: message,
      duration: 5000,
    })
  }, [])

  const showDuplicateSkuWarning = useCallback((sku: string) => {
    return toast({
      variant: 'warning',
      title: '⚠️ SKU duplicado',
      description: `El SKU "${sku}" ya existe. Por favor, usa uno diferente.`,
      duration: 5000,
    })
  }, [])

  const showImageUploadWarning = useCallback((message: string) => {
    return toast({
      variant: 'warning',
      title: '⚠️ Problema con imágenes',
      description: message,
      duration: 5000,
    })
  }, [])

  const showVariantWarning = useCallback((message: string) => {
    return toast({
      variant: 'warning',
      title: '⚠️ Problema con variantes',
      description: message,
      duration: 5000,
    })
  }, [])

  // ===================================
  // NOTIFICACIONES DE INFORMACIÓN
  // ===================================

  const showInfoMessage = useCallback((title: string, message: string) => {
    return toast({
      variant: 'info',
      title: `ℹ️ ${title}`,
      description: message,
      duration: 4000,
    })
  }, [])

  // ===================================
  // RETURN DEL HOOK
  // ===================================

  return {
    // CRUD Operations
    showProductCreated,
    showProductUpdated,
    showProductDeleted,
    showProductDuplicated,
    showProductStatusChanged,

    // Inventory
    showInventoryUpdated,
    showLowStockAlert,
    showOutOfStockAlert,
    showRestockedAlert,

    // Bulk Operations
    showBulkActionSuccess,
    showBulkActionPartial,

    // Import/Export
    showExportSuccess,
    showImportSuccess,

    // Processing
    showProcessingInfo,
    showDataRefreshed,

    // Errors
    showProductCreationError,
    showProductUpdateError,
    showProductDeleteError,
    showBulkActionError,
    showExportError,
    showImportError,
    showNetworkError,

    // Warnings
    showValidationWarning,
    showDuplicateSkuWarning,
    showImageUploadWarning,
    showVariantWarning,

    // Info
    showInfoMessage,
  }
}

// ===================================
// EXPORT DEFAULT
// ===================================

export default useProductNotifications
