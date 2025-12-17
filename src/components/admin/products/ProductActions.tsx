'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Plus,
  Download,
  Upload,
  Trash2,
  Edit,
  Eye,
  MoreHorizontal,
  Copy,
  Archive,
  AlertTriangle,
  Settings,
  Tag,
  Package,
  CheckCircle,
  XCircle,
  FileText,
  BarChart3,
  X,
} from '@/lib/optimized-imports'
import { cn } from '@/lib/core/utils'
import { useProductNotifications } from '@/hooks/admin/useProductNotifications'
import { BrandSelector } from './BrandSelector'
import { CategorySelector } from './CategorySelector'
import { MeasureSelector } from './MeasureSelector'
import { ColorPickerField } from './ColorPickerField'

interface Product {
  id: string
  name: string
  status: 'active' | 'inactive' | 'draft'
}

interface Category {
  id: number
  name: string
  slug?: string
}

interface ProductActionsProps {
  selectedProducts?: Product[]
  categories?: Category[] // ✅ NUEVO: Categorías reales desde la BD
  onCreateProduct?: () => void
  onEditProduct?: (productId: string) => void
  onViewProduct?: (productId: string) => void
  onDeleteProduct?: (productId: string) => void
  onBulkDelete?: (productIds: string[]) => void
  onBulkEdit?: (productIds: string[], updates: Partial<Product>) => void
  onBulkStatusChange?: (productIds: string[], status: 'active' | 'inactive' | 'draft') => void
  onBulkCategoryChange?: (productIds: string[], categoryId: number) => void
  onBulkPriceUpdate?: (
    productIds: string[],
    priceChange: { type: 'percentage' | 'fixed'; value: number }
  ) => void
  onDuplicateProduct?: (productId: string) => void
  onExportProducts?: (format?: 'csv' | 'xlsx' | 'json') => void
  onImportProducts?: () => void
  onBulkArchive?: (productIds: string[]) => void
  onGenerateReport?: () => void
  isLoading?: boolean
  className?: string
  // Prop para controlar el dropdown desde fuera
  externalShowBulkActions?: boolean
  onExternalBulkActionsChange?: (show: boolean) => void
  // Prop para controlar el modal de exportación desde fuera
  externalShowExportModal?: boolean
  onExternalExportModalChange?: (show: boolean) => void
}

export function ProductActions({
  selectedProducts = [],
  categories = [], // ✅ NUEVO: Recibir categorías reales
  onCreateProduct,
  onEditProduct,
  onViewProduct,
  onDeleteProduct,
  onBulkDelete,
  onBulkEdit,
  onBulkStatusChange,
  onBulkCategoryChange,
  onBulkPriceUpdate,
  onDuplicateProduct,
  onExportProducts,
  onImportProducts,
  onBulkArchive,
  onGenerateReport,
  isLoading = false,
  className,
  externalShowBulkActions,
  onExternalBulkActionsChange,
  externalShowExportModal,
  onExternalExportModalChange,
}: ProductActionsProps) {
  const notifications = useProductNotifications()
  const [internalShowBulkActions, setInternalShowBulkActions] = useState(false)
  const [internalShowExportOptions, setInternalShowExportOptions] = useState(false)
  
  // Usar el estado externo si está disponible, sino usar el interno
  const showBulkActions = externalShowBulkActions !== undefined ? externalShowBulkActions : internalShowBulkActions
  const setShowBulkActions = (value: boolean) => {
    if (onExternalBulkActionsChange) {
      onExternalBulkActionsChange(value)
    } else {
      setInternalShowBulkActions(value)
    }
  }
  
  // Usar el estado externo para el modal de exportación si está disponible
  const showExportOptions = externalShowExportModal !== undefined ? externalShowExportModal : internalShowExportOptions
  const setShowExportOptions = (value: boolean) => {
    if (onExternalExportModalChange) {
      onExternalExportModalChange(value)
    } else {
      setInternalShowExportOptions(value)
    }
  }
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showBulkEditModal, setShowBulkEditModal] = useState(false)
  const [bulkEditData, setBulkEditData] = useState({
    status: '',
    categoryIds: [] as number[], // ✅ Cambiado a array para multi-select
    brand: '',
    stock: '',
    stockAdjustment: { type: 'set' as 'set' | 'add' | 'subtract', value: '' },
    price: '',
    discountedPrice: '',
    priceChange: { type: 'percentage' as const, value: 0 },
    medidas: [] as string[], // ✅ Cambiado a array
    color: '',
    colorHex: '',
  })

  const selectedCount = selectedProducts.length
  const hasSelection = selectedCount > 0

  const handleBulkDelete = async () => {
    if (onBulkDelete && selectedProducts.length > 0) {
      try {
        await onBulkDelete(selectedProducts.map(p => p.id))
        notifications.showBulkActionSuccess({ selectedCount: selectedProducts.length, action: 'delete' })
        setShowDeleteConfirm(false)
      } catch (error) {
        notifications.showBulkActionError('eliminar productos', error instanceof Error ? error.message : 'Error desconocido')
      }
    }
  }

  const handleBulkStatusChange = async (status: 'active' | 'inactive' | 'draft') => {
    if (onBulkStatusChange && selectedProducts.length > 0) {
      try {
        await onBulkStatusChange(
          selectedProducts.map(p => p.id),
          status
        )
        notifications.showBulkActionSuccess({ selectedCount: selectedProducts.length, action: `update_status_${status}` })
        setShowBulkActions(false)
      } catch (error) {
        notifications.showBulkActionError('cambiar estado', error instanceof Error ? error.message : 'Error desconocido')
      }
    }
  }

  const handleBulkArchive = async () => {
    if (onBulkArchive && selectedProducts.length > 0) {
      try {
        await onBulkArchive(selectedProducts.map(p => p.id))
        notifications.showBulkActionSuccess({ selectedCount: selectedProducts.length, action: 'archive' })
        setShowBulkActions(false)
      } catch (error) {
        notifications.showBulkActionError('archivar productos', error instanceof Error ? error.message : 'Error desconocido')
      }
    }
  }

  const handleExport = async (format: 'csv' | 'xlsx' | 'json') => {
    if (onExportProducts) {
      try {
        notifications.showProcessingInfo(`Exportando productos en formato ${format.toUpperCase()}...`)
        await onExportProducts(format)
        // Estimamos que exporta todos los productos visibles
        notifications.showExportSuccess({ format: format.toUpperCase() as 'CSV' | 'Excel' | 'JSON', recordCount: selectedCount || 0 })
        setShowExportOptions(false)
      } catch (error) {
        notifications.showExportError(format.toUpperCase(), error instanceof Error ? error.message : 'Error desconocido')
      }
    }
  }

  const handleImport = async () => {
    if (onImportProducts) {
      try {
        notifications.showProcessingInfo('Importando productos...')
        await onImportProducts()
        // Asumimos que importa exitosamente, la función onImportProducts debería pasar los datos
        notifications.showImportSuccess({ format: 'CSV', successCount: 0, errorCount: 0, recordCount: 0 })
      } catch (error) {
        notifications.showImportError('CSV', error instanceof Error ? error.message : 'Error desconocido')
      }
    }
  }

  const handleCreateProduct = async () => {
    if (onCreateProduct) {
      try {
        await onCreateProduct()
        notifications.showProductCreated({ productName: 'Nuevo producto' })
      } catch (error) {
        notifications.showProductCreationError(error instanceof Error ? error.message : 'Error desconocido')
      }
    }
  }

  return (
    <div className={cn('flex items-center justify-between', className)}>

      {/* Bulk Actions Dropdown - Se activa desde ProductFilters */}
      {showBulkActions && hasSelection && (
        <div className='fixed inset-0 z-40' onClick={() => setShowBulkActions(false)}>
          <div className='absolute right-4 top-20 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50' onClick={(e) => e.stopPropagation()}>
            <div className='py-2'>
              {/* Status Changes */}
              <div className='px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b'>
                Cambiar Estado
              </div>
              <button
                onClick={() => {
                  handleBulkStatusChange('active')
                  setShowBulkActions(false)
                }}
                className='flex items-center space-x-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50'
              >
                <CheckCircle className='w-4 h-4 text-green-500' />
                <span>Activar productos</span>
              </button>
              <button
                onClick={() => {
                  handleBulkStatusChange('inactive')
                  setShowBulkActions(false)
                }}
                className='flex items-center space-x-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50'
              >
                <XCircle className='w-4 h-4 text-red-500' />
                <span>Desactivar productos</span>
              </button>
              <button
                onClick={() => {
                  handleBulkStatusChange('draft')
                  setShowBulkActions(false)
                }}
                className='flex items-center space-x-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50'
              >
                <FileText className='w-4 h-4 text-yellow-500' />
                <span>Marcar como borrador</span>
              </button>

              <div className='border-t border-gray-200 my-2'></div>

              {/* Other Actions */}
              <div className='px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b'>
                Otras Acciones
              </div>
              <button
                onClick={() => {
                  setShowBulkEditModal(true)
                  setShowBulkActions(false)
                }}
                className='flex items-center space-x-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50'
              >
                <Edit className='w-4 h-4 text-blue-500' />
                <span>Edición masiva</span>
              </button>
              <button
                onClick={() => {
                  handleBulkArchive()
                  setShowBulkActions(false)
                }}
                className='flex items-center space-x-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50'
              >
                <Archive className='w-4 h-4 text-purple-500' />
                <span>Archivar productos</span>
              </button>

              <div className='border-t border-gray-200 my-2'></div>

              {/* Danger Zone */}
              <button
                onClick={() => {
                  setShowDeleteConfirm(true)
                  setShowBulkActions(false)
                }}
                className='flex items-center space-x-3 w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50'
              >
                <Trash2 className='w-4 h-4' />
                <span>Eliminar seleccionados</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export Options Modal */}
      {showExportOptions && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50' onClick={() => setShowExportOptions(false)}>
          <div className='bg-white rounded-lg p-6 max-w-md w-full mx-4' onClick={(e) => e.stopPropagation()}>
            <h3 className='text-lg font-semibold mb-4'>Exportar productos</h3>
            <div className='space-y-2'>
              <button
                onClick={() => handleExport('csv')}
                className='flex items-center space-x-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg'
              >
                <FileText className='w-4 h-4 text-green-500' />
                <span>Exportar como CSV</span>
              </button>
              <button
                onClick={() => handleExport('xlsx')}
                className='flex items-center space-x-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg'
              >
                <Package className='w-4 h-4 text-blue-500' />
                <span>Exportar como Excel</span>
              </button>
              <button
                onClick={() => handleExport('json')}
                className='flex items-center space-x-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg'
              >
                <FileText className='w-4 h-4 text-purple-500' />
                <span>Exportar como JSON</span>
              </button>
            </div>
            <button
              onClick={() => setShowExportOptions(false)}
              className='mt-4 w-full px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors'
            >
              Cancelar
            </button>
          </div>
        </div>
      )}


      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
          <div className='bg-white rounded-lg p-6 max-w-md w-full mx-4'>
            <div className='flex items-center space-x-3 mb-4'>
              <div className='w-10 h-10 bg-red-100 rounded-full flex items-center justify-center'>
                <AlertTriangle className='w-5 h-5 text-red-600' />
              </div>
              <div>
                <h3 className='text-lg font-medium text-gray-900'>Confirmar eliminación</h3>
                <p className='text-sm text-gray-600'>Esta acción no se puede deshacer.</p>
              </div>
            </div>

            <p className='text-sm text-gray-700 mb-6'>
              ¿Estás seguro de que quieres eliminar {selectedCount} producto
              {selectedCount !== 1 ? 's' : ''}?
            </p>

            <div className='flex items-center justify-end space-x-3'>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className='px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors'
              >
                Cancelar
              </button>
              <button
                onClick={handleBulkDelete}
                disabled={isLoading}
                className='px-4 py-2 text-sm text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50'
              >
                {isLoading ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Edit Modal */}
      {showBulkEditModal && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
          <div className='bg-white rounded-lg p-6 max-w-3xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col'>
            <div className='flex items-center justify-between mb-4'>
              <h3 className='text-lg font-medium text-gray-900'>Editar productos masivamente</h3>
              <button
                onClick={() => setShowBulkEditModal(false)}
                className='text-gray-400 hover:text-gray-600'
              >
                <X className='w-5 h-5' />
              </button>
            </div>

            <div className='space-y-4 flex-1 overflow-y-auto pr-2'>
              {/* Categorías (Multi-select) */}
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Categorías {bulkEditData.categoryIds.length > 0 && `(${bulkEditData.categoryIds.length} seleccionadas)`}
                </label>
                <CategorySelector
                  value={bulkEditData.categoryIds}
                  onChange={(categoryIds) => {
                    const ids = Array.isArray(categoryIds) ? categoryIds : categoryIds ? [categoryIds] : []
                    setBulkEditData(prev => ({ ...prev, categoryIds: ids }))
                  }}
                  multiple={true}
                  placeholder='Selecciona categorías (dejar vacío para no cambiar)'
                />
                {bulkEditData.categoryIds.length > 0 && (
                  <p className='text-xs text-gray-500 mt-1'>
                    Se aplicarán todas las categorías seleccionadas a los productos
                  </p>
                )}
              </div>

              {/* Estado */}
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>Estado</label>
                <select
                  value={bulkEditData.status || ''}
                  onChange={e =>
                    setBulkEditData(prev => ({
                      ...prev,
                      status: e.target.value as 'active' | 'inactive' | 'draft' | '',
                    }))
                  }
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blaze-orange-500 focus:border-transparent'
                >
                  <option value=''>Sin cambios</option>
                  <option value='active'>Activo</option>
                  <option value='inactive'>Inactivo</option>
                  <option value='draft'>Borrador</option>
                </select>
              </div>

              {/* Marca */}
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>Marca</label>
                <BrandSelector
                  value={bulkEditData.brand || ''}
                  onChange={(brand) => setBulkEditData(prev => ({ ...prev, brand }))}
                  placeholder='Selecciona o crea una marca'
                  allowCreate={true}
                />
                {bulkEditData.brand && (
                  <p className='text-xs text-gray-500 mt-1'>
                    Se aplicará la marca "{bulkEditData.brand}" a todos los productos seleccionados
                  </p>
                )}
              </div>

              {/* Stock */}
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>Stock</label>
                <div className='flex space-x-2'>
                  <select
                    value={bulkEditData.stockAdjustment.type}
                    onChange={e =>
                      setBulkEditData(prev => ({
                        ...prev,
                        stockAdjustment: {
                          ...prev.stockAdjustment,
                          type: e.target.value as 'set' | 'add' | 'subtract',
                        },
                      }))
                    }
                    className='px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blaze-orange-500 focus:border-transparent'
                  >
                    <option value='set'>Establecer</option>
                    <option value='add'>Sumar</option>
                    <option value='subtract'>Restar</option>
                  </select>
                  <input
                    type='number'
                    value={bulkEditData.stockAdjustment.value}
                    onChange={e =>
                      setBulkEditData(prev => ({
                        ...prev,
                        stockAdjustment: {
                          ...prev.stockAdjustment,
                          value: e.target.value,
                        },
                      }))
                    }
                    className='flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blaze-orange-500 focus:border-transparent'
                    placeholder='0'
                    min='0'
                  />
                </div>
              </div>

              {/* Precio Base */}
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>Precio Base</label>
                <input
                  type='number'
                  step='0.01'
                  value={bulkEditData.price}
                  onChange={e => setBulkEditData(prev => ({ ...prev, price: e.target.value }))}
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blaze-orange-500 focus:border-transparent'
                  placeholder='Dejar vacío para no cambiar'
                  min='0'
                />
              </div>

              {/* Precio con Descuento */}
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>Precio con Descuento</label>
                <input
                  type='number'
                  step='0.01'
                  value={bulkEditData.discountedPrice}
                  onChange={e => setBulkEditData(prev => ({ ...prev, discountedPrice: e.target.value }))}
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blaze-orange-500 focus:border-transparent'
                  placeholder='Dejar vacío para no cambiar'
                  min='0'
                />
              </div>

              {/* Ajuste de precio (porcentaje o fijo) */}
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Ajuste de precio
                </label>
                <div className='flex space-x-2'>
                  <select
                    value={bulkEditData.priceChange.type}
                    onChange={e =>
                      setBulkEditData(prev => ({
                        ...prev,
                        priceChange: {
                          ...prev.priceChange,
                          type: e.target.value as 'percentage' | 'fixed',
                        },
                      }))
                    }
                    className='px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blaze-orange-500 focus:border-transparent'
                  >
                    <option value='percentage'>Porcentaje (%)</option>
                    <option value='fixed'>Cantidad fija ($)</option>
                  </select>
                  <input
                    type='number'
                    step='0.01'
                    value={bulkEditData.priceChange.value || ''}
                    onChange={e =>
                      setBulkEditData(prev => ({
                        ...prev,
                        priceChange: {
                          ...prev.priceChange,
                          value: parseFloat(e.target.value) || 0,
                        },
                      }))
                    }
                    className='flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blaze-orange-500 focus:border-transparent'
                    placeholder={bulkEditData.priceChange.type === 'percentage' ? 'Ej: 10 (aumenta 10%)' : 'Ej: 100 (suma $100)'}
                  />
                </div>
                {bulkEditData.priceChange.value !== 0 && (
                  <p className='text-xs text-gray-500 mt-1'>
                    {bulkEditData.priceChange.type === 'percentage' 
                      ? `Se ${bulkEditData.priceChange.value > 0 ? 'aumentará' : 'reducirá'} el precio en ${Math.abs(bulkEditData.priceChange.value)}%`
                      : `Se ${bulkEditData.priceChange.value > 0 ? 'sumará' : 'restará'} $${Math.abs(bulkEditData.priceChange.value)} al precio`
                    }
                  </p>
                )}
              </div>

              {/* Medidas */}
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Medidas {bulkEditData.medidas.length > 0 && `(${bulkEditData.medidas.length} seleccionadas)`}
                </label>
                <MeasureSelector
                  value={bulkEditData.medidas}
                  onChange={(medidas) => setBulkEditData(prev => ({ ...prev, medidas }))}
                  placeholder='Selecciona o agrega medidas'
                />
                {bulkEditData.medidas.length > 0 && (
                  <p className='text-xs text-gray-500 mt-1'>
                    Se aplicarán todas las medidas seleccionadas a los productos
                  </p>
                )}
              </div>

              {/* Color */}
              <div>
                <ColorPickerField
                  colorName={bulkEditData.color}
                  colorHex={bulkEditData.colorHex}
                  onColorChange={(name, hex) => setBulkEditData(prev => ({ 
                    ...prev, 
                    color: name, 
                    colorHex: hex || undefined 
                  }))}
                  label='Color'
                />
                {bulkEditData.color && (
                  <p className='text-xs text-gray-500 mt-1'>
                    Se aplicará el color "{bulkEditData.color}" a todos los productos seleccionados
                  </p>
                )}
              </div>

            </div>

            <div className='flex justify-end space-x-3 mt-6'>
              <button
                onClick={() => {
                  setShowBulkEditModal(false)
                  setBulkEditData({
                    status: '',
                    categoryIds: [],
                    brand: '',
                    stock: '',
                    stockAdjustment: { type: 'set' as const, value: '' },
                    price: '',
                    discountedPrice: '',
                    priceChange: { type: 'percentage' as const, value: 0 },
                    medidas: [],
                    color: '',
                    colorHex: '',
                  })
                }}
                className='px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors'
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (onBulkEdit && selectedProducts.length > 0) {
                    const updates: any = {}
                    
                    // Estado
                    if (bulkEditData.status) {
                      updates.status = bulkEditData.status
                    }
                    
                    // Categorías (multi-select)
                    if (bulkEditData.categoryIds.length > 0) {
                      // Aplicar cada categoría seleccionada
                      bulkEditData.categoryIds.forEach(categoryId => {
                        onBulkCategoryChange?.(
                          selectedProducts.map(p => p.id),
                          categoryId
                        )
                      })
                    }
                    
                    // Marca
                    if (bulkEditData.brand.trim()) {
                      updates.brand = bulkEditData.brand.trim()
                    }
                    
                    // Stock
                    if (bulkEditData.stockAdjustment.value) {
                      const stockValue = parseInt(bulkEditData.stockAdjustment.value)
                      if (!isNaN(stockValue)) {
                        updates.stockAdjustment = {
                          type: bulkEditData.stockAdjustment.type,
                          value: stockValue,
                        }
                      }
                    }
                    
                    // Precio base
                    if (bulkEditData.price) {
                      const priceValue = parseFloat(bulkEditData.price)
                      if (!isNaN(priceValue) && priceValue >= 0) {
                        updates.price = priceValue
                      }
                    }
                    
                    // Precio con descuento
                    if (bulkEditData.discountedPrice) {
                      const discountedValue = parseFloat(bulkEditData.discountedPrice)
                      if (!isNaN(discountedValue) && discountedValue >= 0) {
                        updates.discounted_price = discountedValue
                      }
                    }
                    
                    // Ajuste de precio (porcentaje o fijo)
                    if (bulkEditData.priceChange.value !== 0) {
                      onBulkPriceUpdate?.(
                        selectedProducts.map(p => p.id),
                        bulkEditData.priceChange
                      )
                    }
                    
                    // Medidas (array)
                    if (bulkEditData.medidas.length > 0) {
                      updates.medidas = bulkEditData.medidas
                    }
                    
                    // Color
                    if (bulkEditData.color.trim()) {
                      updates.color = bulkEditData.color.trim()
                      if (bulkEditData.colorHex) {
                        updates.color_hex = bulkEditData.colorHex
                      }
                    }
                    
                    // Aplicar actualizaciones
                    const hasUpdates = Object.keys(updates).length > 0 || 
                                      bulkEditData.categoryIds.length > 0 || 
                                      bulkEditData.priceChange.value !== 0
                    
                    if (hasUpdates) {
                      onBulkEdit(selectedProducts.map(p => p.id), updates)
                    }
                  }
                  
                  // Resetear formulario
                  setShowBulkEditModal(false)
                  setBulkEditData({
                    status: '',
                    categoryIds: [],
                    brand: '',
                    stock: '',
                    stockAdjustment: { type: 'set' as const, value: '' },
                    price: '',
                    discountedPrice: '',
                    priceChange: { type: 'percentage' as const, value: 0 },
                    medidas: [],
                    color: '',
                    colorHex: '',
                  })
                }}
                className='px-4 py-2 text-sm text-white bg-blaze-orange-600 hover:bg-blaze-orange-700 rounded-lg transition-colors'
              >
                Aplicar cambios
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Individual Product Actions Component
interface ProductRowActionsProps {
  product: Product
  onEdit?: (productId: string) => void
  onView?: (productId: string) => void
  onDelete?: (productId: string) => void
  onDuplicate?: (productId: string) => void
  onToggleStatus?: (productId: string) => void
  onManageInventory?: (productId: string) => void
  isLoading?: boolean
}

export function ProductRowActions({
  product,
  onEdit,
  onView,
  onDelete,
  onDuplicate,
  onToggleStatus,
  onManageInventory,
  isLoading = false,
}: ProductRowActionsProps) {
  const notifications = useProductNotifications()
  const [showActions, setShowActions] = useState(false)
  const [overlayActive, setOverlayActive] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number } | null>(null)

  // Calcular posición del dropdown cuando se abre (a la derecha del botón)
  useEffect(() => {
    if (showActions && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setDropdownPosition({
        top: rect.top, // Alineado verticalmente con el botón
        left: rect.right + 8, // 8px de margen a la derecha del botón
      })
    } else {
      setDropdownPosition(null)
    }
  }, [showActions])

  const handleEdit = async () => {
    if (onEdit) {
      try {
        await onEdit(product.id)
        notifications.showProductUpdated({ productName: product.name })
        setShowActions(false)
      } catch (error) {
        notifications.showProductUpdateError(error instanceof Error ? error.message : 'Error desconocido', product.name)
      }
    }
  }

  const handleDelete = async () => {
    if (onDelete) {
      try {
        await onDelete(product.id)
        notifications.showProductDeleted({ productName: product.name })
        setShowActions(false)
      } catch (error) {
        notifications.showProductDeleteError(error instanceof Error ? error.message : 'Error desconocido', product.name)
      }
    }
  }

  const handleDuplicate = async () => {
    if (onDuplicate) {
      try {
        await onDuplicate(product.id)
        notifications.showProductDuplicated({ productName: product.name })
        setShowActions(false)
      } catch (error) {
        notifications.showProductCreationError(error instanceof Error ? error.message : 'Error al duplicar')
      }
    }
  }

  const handleToggleStatus = async () => {
    if (onToggleStatus) {
      try {
        await onToggleStatus(product.id)
        const newStatus = product.status === 'active' ? 'inactive' : 'active'
        notifications.showProductStatusChanged(product.name, newStatus)
        setShowActions(false)
      } catch (error) {
        notifications.showProductUpdateError(error instanceof Error ? error.message : 'Error al cambiar estado', product.name)
      }
    }
  }

  const handleManageInventory = async () => {
    if (onManageInventory) {
      try {
        await onManageInventory(product.id)
        notifications.showInventoryUpdated({ productName: product.name, stock: 0 })
        setShowActions(false)
      } catch (error) {
        notifications.showProductUpdateError(error instanceof Error ? error.message : 'Error al actualizar inventario', product.name)
      }
    }
  }

  // Cerrar el menú cuando se hace clic fuera
  useEffect(() => {
    if (!showActions) return

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      // Excluir el overlay del contenedor del menú
      const isOverlay = target?.classList?.contains('fixed') && target?.classList?.contains('inset-0')
      const isInsideMenu = target?.closest('.product-actions-menu') && !isOverlay
      // También verificar si es un botón o elemento interactivo dentro del menú
      const isInteractiveElement = target?.closest('button, a, input, select, textarea, [role="button"]')
      const isInsideDropdown = target?.closest('.absolute.right-0.top-full') // El dropdown del menú
      
      // #region agent log
      try {
        const targetInfo = target ? {
          tagName: target.tagName || 'unknown',
          className: typeof target.className === 'string' ? target.className.substring(0, 50) : String(target.className || '').substring(0, 50),
          isOverlay,
          isInsideMenu: !!isInsideMenu,
          isInteractiveElement: !!isInteractiveElement,
          isInsideDropdown: !!isInsideDropdown
        } : { tagName: 'null', className: 'null' }
        fetch('http://127.0.0.1:7242/ingest/b2bb30a6-4e88-4195-96cd-35106ab29a7d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ProductActions.tsx:handleClickOutside',message:'Click outside detected',data:{productId:product.id,...targetInfo},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'E'})}).catch(()=>{});
      } catch (e) {
        // Ignorar errores de serialización
      }
      // #endregion
      
      // Solo cerrar si no está dentro del menú, no es el overlay, y no es un elemento interactivo del dropdown
      if (!isInsideMenu && !isOverlay && !isInsideDropdown) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/b2bb30a6-4e88-4195-96cd-35106ab29a7d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ProductActions.tsx:closing-menu',message:'Closing menu from click outside',data:{productId:product.id},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'E'})}).catch(()=>{});
        // #endregion
        setShowActions(false)
        setOverlayActive(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showActions, product.id])

  // #region agent log
  useEffect(() => {
    fetch('http://127.0.0.1:7242/ingest/b2bb30a6-4e88-4195-96cd-35106ab29a7d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ProductActions.tsx:showActions-change',message:'showActions state changed',data:{showActions,productId:product.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
  }, [showActions, product.id]);
  // #endregion

  return (
    <div className='relative product-actions-menu'>
      <button
        ref={buttonRef}
        type='button'
        onMouseEnter={() => {
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/b2bb30a6-4e88-4195-96cd-35106ab29a7d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ProductActions.tsx:button-mouseenter',message:'Button mouseenter',data:{productId:product.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'A'})}).catch(()=>{});
          // #endregion
        }}
        onMouseDown={(e) => {
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/b2bb30a6-4e88-4195-96cd-35106ab29a7d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ProductActions.tsx:button-mousedown',message:'Button mousedown',data:{productId:product.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'A'})}).catch(()=>{});
          // #endregion
          e.stopPropagation()
        }}
        onClick={(e) => {
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/b2bb30a6-4e88-4195-96cd-35106ab29a7d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ProductActions.tsx:button-click',message:'Button clicked',data:{productId:product.id,currentShowActions:showActions},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'A'})}).catch(()=>{});
          // #endregion
          e.stopPropagation()
          e.preventDefault()
          const newValue = !showActions
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/b2bb30a6-4e88-4195-96cd-35106ab29a7d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ProductActions.tsx:setShowActions',message:'Setting showActions',data:{productId:product.id,newValue,oldValue:showActions},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'A'})}).catch(()=>{});
          // #endregion
          setShowActions(newValue)
          if (newValue) {
            // Activar el overlay después de un delay más largo para evitar que capture el mismo click
            setOverlayActive(false)
            setTimeout(() => {
              setOverlayActive(true)
            }, 100)
          } else {
            setOverlayActive(false)
          }
        }}
        className='p-1 rounded hover:bg-gray-100 transition-colors relative'
        aria-label='Acciones del producto'
        style={{ pointerEvents: 'auto' }}
      >
        <MoreHorizontal className='w-4 h-4 text-gray-500' />
      </button>

      {showActions && (
        <>
          {overlayActive && (
            <div 
              className='fixed inset-0 z-[60] product-actions-overlay' 
              onMouseDown={(e) => {
                // #region agent log
                fetch('http://127.0.0.1:7242/ingest/b2bb30a6-4e88-4195-96cd-35106ab29a7d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ProductActions.tsx:overlay-mousedown',message:'Overlay mousedown - closing menu',data:{productId:product.id},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'B'})}).catch(()=>{});
                // #endregion
                e.preventDefault()
                setShowActions(false)
                setOverlayActive(false)
              }}
            />
          )}
          {dropdownPosition && (
            <div 
              className='fixed w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-[70]'
              style={{
                top: `${dropdownPosition.top}px`,
                left: `${dropdownPosition.left}px`,
              }}
              onClick={(e) => e.stopPropagation()}
            >
            <div className='py-1'>
              <button
                type='button'
                onClick={() => {
                  onView?.(product.id)
                  setShowActions(false)
                }}
                className='flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50'
              >
                <Eye className='w-4 h-4' />
                <span>Ver detalles</span>
              </button>

              <button
                type='button'
                onClick={handleEdit}
                className='flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50'
              >
                <Edit className='w-4 h-4' />
                <span>Editar</span>
              </button>

              {onToggleStatus && (
                <button
                  type='button'
                  onClick={handleToggleStatus}
                  className='flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50'
                >
                  {product.status === 'active' ? (
                    <>
                      <XCircle className='w-4 h-4 text-red-500' />
                      <span>Desactivar</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className='w-4 h-4 text-green-500' />
                      <span>Activar</span>
                    </>
                  )}
                </button>
              )}

              {onManageInventory && (
                <button
                  type='button'
                  onClick={handleManageInventory}
                  className='flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50'
                >
                  <Package className='w-4 h-4 text-blue-500' />
                  <span>Gestionar stock</span>
                </button>
              )}

              <button
                type='button'
                onClick={handleDuplicate}
                className='flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50'
              >
                <Copy className='w-4 h-4' />
                <span>Duplicar</span>
              </button>

              <div className='border-t border-gray-200 my-1'></div>

              <button
                type='button'
                onClick={handleDelete}
                disabled={isLoading}
                className='flex items-center space-x-2 w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50 disabled:opacity-50'
              >
                <Trash2 className='w-4 h-4' />
                <span>Eliminar</span>
              </button>
            </div>
          </div>
          )}
        </>
      )}
    </div>
  )
}
