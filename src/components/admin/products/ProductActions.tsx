'use client'

import { useState } from 'react'
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
}: ProductActionsProps) {
  const notifications = useProductNotifications()
  const [showBulkActions, setShowBulkActions] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showBulkEditModal, setShowBulkEditModal] = useState(false)
  const [showExportOptions, setShowExportOptions] = useState(false)
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
      {/* Bulk Actions */}
      {hasSelection && (
        <div className='flex items-center space-x-3'>
          <span className='text-sm text-gray-600 font-medium'>
            {selectedCount} producto{selectedCount !== 1 ? 's' : ''} seleccionado
            {selectedCount !== 1 ? 's' : ''}
          </span>

          <div className='relative'>
            <button
              onClick={() => setShowBulkActions(!showBulkActions)}
              className='flex items-center space-x-2 px-4 py-2 text-sm bg-blaze-orange-100 text-blaze-orange-800 hover:bg-blaze-orange-200 rounded-lg transition-colors font-medium'
            >
              <Settings className='w-4 h-4' />
              <span>Acciones masivas</span>
            </button>

            {showBulkActions && (
              <div className='absolute left-0 top-full mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50'>
                <div className='py-2'>
                  {/* Status Changes */}
                  <div className='px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b'>
                    Cambiar Estado
                  </div>
                  <button
                    onClick={() => handleBulkStatusChange('active')}
                    className='flex items-center space-x-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50'
                  >
                    <CheckCircle className='w-4 h-4 text-green-500' />
                    <span>Activar productos</span>
                  </button>
                  <button
                    onClick={() => handleBulkStatusChange('inactive')}
                    className='flex items-center space-x-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50'
                  >
                    <XCircle className='w-4 h-4 text-red-500' />
                    <span>Desactivar productos</span>
                  </button>
                  <button
                    onClick={() => handleBulkStatusChange('draft')}
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
                    onClick={() => setShowBulkEditModal(true)}
                    className='flex items-center space-x-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50'
                  >
                    <Edit className='w-4 h-4 text-blue-500' />
                    <span>Edición masiva</span>
                  </button>
                  <button
                    onClick={handleBulkArchive}
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
            )}
          </div>
        </div>
      )}

      {/* Primary Actions */}
      <div className='flex items-center space-x-3 ml-auto'>
        {/* Import/Export */}
        <div className='flex items-center space-x-2'>
          <button
            onClick={handleImport}
            disabled={isLoading}
            className='flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors disabled:opacity-50'
          >
            <Upload className='w-4 h-4' />
            <span className='hidden sm:inline'>Importar</span>
          </button>

          <div className='relative'>
            <button
              onClick={() => setShowExportOptions(!showExportOptions)}
              disabled={isLoading}
              className='flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors disabled:opacity-50'
            >
              <Download className='w-4 h-4' />
              <span className='hidden sm:inline'>Exportar</span>
            </button>

            {showExportOptions && (
              <div className='absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50'>
                <div className='py-2'>
                  <button
                    onClick={() => handleExport('csv')}
                    className='flex items-center space-x-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50'
                  >
                    <FileText className='w-4 h-4 text-green-500' />
                    <span>Exportar como CSV</span>
                  </button>
                  <button
                    onClick={() => handleExport('xlsx')}
                    className='flex items-center space-x-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50'
                  >
                    <Package className='w-4 h-4 text-blue-500' />
                    <span>Exportar como Excel</span>
                  </button>
                  <button
                    onClick={() => handleExport('json')}
                    className='flex items-center space-x-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50'
                  >
                    <FileText className='w-4 h-4 text-purple-500' />
                    <span>Exportar como JSON</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {onGenerateReport && (
            <button
              onClick={onGenerateReport}
              disabled={isLoading}
              className='flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors disabled:opacity-50'
            >
              <BarChart3 className='w-4 h-4' />
              <span className='hidden sm:inline'>Reporte</span>
            </button>
          )}
        </div>

        {/* Create Product */}
        <button
          onClick={handleCreateProduct}
          disabled={isLoading}
          className='flex items-center space-x-2 px-4 py-2 bg-blaze-orange-600 hover:bg-blaze-orange-700 text-white rounded-lg transition-colors disabled:opacity-50'
        >
          <Plus className='w-4 h-4' />
          <span>Nuevo Producto</span>
        </button>
      </div>

      {/* Bulk Actions Dropdown */}
      {showBulkActions && hasSelection && (
        <div className='absolute top-full left-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50'>
          <div className='py-1'>
            <button
              onClick={() => {
                // Handle bulk status change
                setShowBulkActions(false)
              }}
              className='flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50'
            >
              <Archive className='w-4 h-4' />
              <span>Cambiar estado</span>
            </button>

            <button
              onClick={() => {
                // Handle bulk duplicate
                setShowBulkActions(false)
              }}
              className='flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50'
            >
              <Copy className='w-4 h-4' />
              <span>Duplicar</span>
            </button>

            <div className='border-t border-gray-200 my-1'></div>

            <button
              onClick={() => {
                setShowDeleteConfirm(true)
                setShowBulkActions(false)
              }}
              className='flex items-center space-x-2 w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50'
            >
              <Trash2 className='w-4 h-4' />
              <span>Eliminar seleccionados</span>
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

  return (
    <div className='relative'>
      <button
        onClick={() => setShowActions(!showActions)}
        className='p-1 rounded hover:bg-gray-100 transition-colors'
      >
        <MoreHorizontal className='w-4 h-4 text-gray-500' />
      </button>

      {showActions && (
        <div className='absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50'>
          <div className='py-1'>
            <button
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
              onClick={handleEdit}
              className='flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50'
            >
              <Edit className='w-4 h-4' />
              <span>Editar</span>
            </button>

            {onToggleStatus && (
              <button
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
                onClick={handleManageInventory}
                className='flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50'
              >
                <Package className='w-4 h-4 text-blue-500' />
                <span>Gestionar stock</span>
              </button>
            )}

            <button
              onClick={handleDuplicate}
              className='flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50'
            >
              <Copy className='w-4 h-4' />
              <span>Duplicar</span>
            </button>

            <div className='border-t border-gray-200 my-1'></div>

            <button
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
    </div>
  )
}
