'use client';

import { useState } from 'react';
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
  BarChart3
} from 'lucide-react';
import { cn } from '@/lib/core/utils';
import { useProductNotifications } from '@/hooks/admin/useProductNotifications';

interface Product {
  id: string;
  name: string;
  status: 'active' | 'inactive' | 'draft';
}

interface ProductActionsProps {
  selectedProducts?: Product[];
  onCreateProduct?: () => void;
  onEditProduct?: (productId: string) => void;
  onViewProduct?: (productId: string) => void;
  onDeleteProduct?: (productId: string) => void;
  onBulkDelete?: (productIds: string[]) => void;
  onBulkEdit?: (productIds: string[], updates: Partial<Product>) => void;
  onBulkStatusChange?: (productIds: string[], status: Product['status']) => void;
  onBulkCategoryChange?: (productIds: string[], categoryId: number) => void;
  onBulkPriceUpdate?: (productIds: string[], priceChange: { type: 'percentage' | 'fixed', value: number }) => void;
  onDuplicateProduct?: (productId: string) => void;
  onExportProducts?: (format?: 'csv' | 'xlsx' | 'json') => void;
  onImportProducts?: () => void;
  onBulkArchive?: (productIds: string[]) => void;
  onGenerateReport?: () => void;
  isLoading?: boolean;
  className?: string;
}

export function ProductActions({
  selectedProducts = [],
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
  className
}: ProductActionsProps) {
  const notifications = useProductNotifications();
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showBulkEditModal, setShowBulkEditModal] = useState(false);
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [bulkEditData, setBulkEditData] = useState({
    status: '',
    categoryId: '',
    priceChange: { type: 'percentage' as const, value: 0 }
  });

  const selectedCount = selectedProducts.length;
  const hasSelection = selectedCount > 0;

  const handleBulkDelete = async () => {
    if (onBulkDelete && selectedProducts.length > 0) {
      try {
        await onBulkDelete(selectedProducts.map(p => p.id));
        notifications.bulkDeleteSuccess(selectedProducts.length);
        setShowDeleteConfirm(false);
      } catch (error) {
        notifications.bulkDeleteError(error as Error);
      }
    }
  };

  const handleBulkStatusChange = async (status: Product['status']) => {
    if (onBulkStatusChange && selectedProducts.length > 0) {
      try {
        await onBulkStatusChange(selectedProducts.map(p => p.id), status);
        notifications.bulkStatusChangeSuccess(selectedProducts.length, status);
        setShowBulkActions(false);
      } catch (error) {
        notifications.bulkStatusChangeError(error as Error);
      }
    }
  };

  const handleBulkArchive = async () => {
    if (onBulkArchive && selectedProducts.length > 0) {
      try {
        await onBulkArchive(selectedProducts.map(p => p.id));
        notifications.bulkArchiveSuccess(selectedProducts.length);
        setShowBulkActions(false);
      } catch (error) {
        notifications.bulkArchiveError(error as Error);
      }
    }
  };

  const handleExport = async (format: 'csv' | 'xlsx' | 'json') => {
    if (onExportProducts) {
      try {
        notifications.exportStarted(format);
        await onExportProducts(format);
        notifications.exportSuccess(format);
        setShowExportOptions(false);
      } catch (error) {
        notifications.exportError(error as Error, format);
      }
    }
  };

  const handleImport = async () => {
    if (onImportProducts) {
      try {
        notifications.importStarted();
        await onImportProducts();
        notifications.importSuccess();
      } catch (error) {
        notifications.importError(error as Error);
      }
    }
  };

  const handleCreateProduct = async () => {
    if (onCreateProduct) {
      try {
        await onCreateProduct();
        notifications.createSuccess();
      } catch (error) {
        notifications.createError(error as Error);
      }
    }
  };

  return (
    <div className={cn("flex items-center justify-between", className)}>
      {/* Bulk Actions */}
      {hasSelection && (
        <div className="flex items-center space-x-3">
          <span className="text-sm text-gray-600 font-medium">
            {selectedCount} producto{selectedCount !== 1 ? 's' : ''} seleccionado{selectedCount !== 1 ? 's' : ''}
          </span>
          
          <div className="relative">
            <button
              onClick={() => setShowBulkActions(!showBulkActions)}
              className="flex items-center space-x-2 px-4 py-2 text-sm bg-blaze-orange-100 text-blaze-orange-800 hover:bg-blaze-orange-200 rounded-lg transition-colors font-medium"
            >
              <Settings className="w-4 h-4" />
              <span>Acciones masivas</span>
            </button>

            {showBulkActions && (
              <div className="absolute left-0 top-full mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                <div className="py-2">
                  {/* Status Changes */}
                  <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b">
                    Cambiar Estado
                  </div>
                  <button
                    onClick={() => handleBulkStatusChange('active')}
                    className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Activar productos</span>
                  </button>
                  <button
                    onClick={() => handleBulkStatusChange('inactive')}
                    className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <XCircle className="w-4 h-4 text-red-500" />
                    <span>Desactivar productos</span>
                  </button>
                  <button
                    onClick={() => handleBulkStatusChange('draft')}
                    className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <FileText className="w-4 h-4 text-yellow-500" />
                    <span>Marcar como borrador</span>
                  </button>

                  <div className="border-t border-gray-200 my-2"></div>

                  {/* Other Actions */}
                  <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b">
                    Otras Acciones
                  </div>
                  <button
                    onClick={() => setShowBulkEditModal(true)}
                    className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <Edit className="w-4 h-4 text-blue-500" />
                    <span>Edición masiva</span>
                  </button>
                  <button
                    onClick={handleBulkArchive}
                    className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <Archive className="w-4 h-4 text-purple-500" />
                    <span>Archivar productos</span>
                  </button>

                  <div className="border-t border-gray-200 my-2"></div>

                  {/* Danger Zone */}
                  <button
                    onClick={() => {
                      setShowDeleteConfirm(true);
                      setShowBulkActions(false);
                    }}
                    className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Eliminar seleccionados</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Primary Actions */}
      <div className="flex items-center space-x-3 ml-auto">
        {/* Import/Export */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleImport}
            disabled={isLoading}
            className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors disabled:opacity-50"
          >
            <Upload className="w-4 h-4" />
            <span className="hidden sm:inline">Importar</span>
          </button>
          
          <div className="relative">
            <button
              onClick={() => setShowExportOptions(!showExportOptions)}
              disabled={isLoading}
              className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Exportar</span>
            </button>

            {showExportOptions && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                <div className="py-2">
                  <button
                    onClick={() => handleExport('csv')}
                    className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <FileText className="w-4 h-4 text-green-500" />
                    <span>Exportar como CSV</span>
                  </button>
                  <button
                    onClick={() => handleExport('xlsx')}
                    className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <Package className="w-4 h-4 text-blue-500" />
                    <span>Exportar como Excel</span>
                  </button>
                  <button
                    onClick={() => handleExport('json')}
                    className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <FileText className="w-4 h-4 text-purple-500" />
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
              className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors disabled:opacity-50"
            >
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Reporte</span>
            </button>
          )}
        </div>

        {/* Create Product */}
        <button
          onClick={handleCreateProduct}
          disabled={isLoading}
          className="flex items-center space-x-2 px-4 py-2 bg-blaze-orange-600 hover:bg-blaze-orange-700 text-white rounded-lg transition-colors disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Producto</span>
        </button>
      </div>

      {/* Bulk Actions Dropdown */}
      {showBulkActions && hasSelectedProducts && (
        <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="py-1">
            <button
              onClick={() => {
                // Handle bulk status change
                setShowBulkActions(false);
              }}
              className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              <Archive className="w-4 h-4" />
              <span>Cambiar estado</span>
            </button>
            
            <button
              onClick={() => {
                // Handle bulk duplicate
                setShowBulkActions(false);
              }}
              className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              <Copy className="w-4 h-4" />
              <span>Duplicar</span>
            </button>
            
            <div className="border-t border-gray-200 my-1"></div>
            
            <button
              onClick={() => {
                setShowDeleteConfirm(true);
                setShowBulkActions(false);
              }}
              className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
              <span>Eliminar seleccionados</span>
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  Confirmar eliminación
                </h3>
                <p className="text-sm text-gray-600">
                  Esta acción no se puede deshacer.
                </p>
              </div>
            </div>
            
            <p className="text-sm text-gray-700 mb-6">
              ¿Estás seguro de que quieres eliminar {selectedCount} producto{selectedCount !== 1 ? 's' : ''}?
            </p>
            
            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleBulkDelete}
                disabled={isLoading}
                className="px-4 py-2 text-sm text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Edit Modal */}
      {showBulkEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Editar productos masivamente
              </h3>
              <button
                 onClick={() => setShowBulkEditModal(false)}
                 className="text-gray-400 hover:text-gray-600"
               >
                 <X className="w-5 h-5" />
               </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categoría
                </label>
                <select
                  value={bulkEditData.categoryId || ''}
                  onChange={(e) => setBulkEditData(prev => ({ ...prev, categoryId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blaze-orange-500 focus:border-transparent"
                >
                  <option value="">Sin cambios</option>
                  <option value="1">Electrónicos</option>
                  <option value="2">Ropa</option>
                  <option value="3">Hogar</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estado
                </label>
                <select
                  value={bulkEditData.status || ''}
                  onChange={(e) => setBulkEditData(prev => ({ ...prev, status: e.target.value as 'active' | 'inactive' | 'draft' | '' }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blaze-orange-500 focus:border-transparent"
                >
                  <option value="">Sin cambios</option>
                  <option value="active">Activo</option>
                  <option value="inactive">Inactivo</option>
                  <option value="draft">Borrador</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ajuste de precio
                </label>
                <div className="flex space-x-2">
                  <select
                    value={bulkEditData.priceChange.type}
                    onChange={(e) => setBulkEditData(prev => ({ ...prev, priceChange: { ...prev.priceChange, type: e.target.value as 'percentage' | 'fixed' } }))}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blaze-orange-500 focus:border-transparent"
                  >
                    <option value="percentage">Porcentaje</option>
                    <option value="fixed">Cantidad fija</option>
                  </select>
                  <input
                    type="number"
                    value={bulkEditData.priceChange.value}
                    onChange={(e) => setBulkEditData(prev => ({ ...prev, priceChange: { ...prev.priceChange, value: parseFloat(e.target.value) || 0 } }))}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blaze-orange-500 focus:border-transparent"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowBulkEditModal(false)}
                className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (onBulkEdit && selectedProducts.length > 0) {
                    const updates: any = {};
                    if (bulkEditData.status) {updates.status = bulkEditData.status;}
                    if (bulkEditData.categoryId) {
                      onBulkCategoryChange?.(selectedProducts.map(p => p.id), parseInt(bulkEditData.categoryId));
                    }
                    if (bulkEditData.priceChange.value !== 0) {
                      onBulkPriceUpdate?.(selectedProducts.map(p => p.id), bulkEditData.priceChange);
                    }
                    onBulkEdit(selectedProducts.map(p => p.id), updates);
                  }
                  setShowBulkEditModal(false);
                  setBulkEditData({
                    status: '',
                    categoryId: '',
                    priceChange: { type: 'percentage' as const, value: 0 }
                  });
                }}
                className="px-4 py-2 text-sm text-white bg-blaze-orange-600 hover:bg-blaze-orange-700 rounded-lg transition-colors"
              >
                Aplicar cambios
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Individual Product Actions Component
interface ProductRowActionsProps {
  product: Product;
  onEdit?: (productId: string) => void;
  onView?: (productId: string) => void;
  onDelete?: (productId: string) => void;
  onDuplicate?: (productId: string) => void;
  onToggleStatus?: (productId: string) => void;
  onManageInventory?: (productId: string) => void;
  isLoading?: boolean;
}

export function ProductRowActions({
  product,
  onEdit,
  onView,
  onDelete,
  onDuplicate,
  onToggleStatus,
  onManageInventory,
  isLoading = false
}: ProductRowActionsProps) {
  const notifications = useProductNotifications();
  const [showActions, setShowActions] = useState(false);

  const handleEdit = async () => {
    if (onEdit) {
      try {
        await onEdit(product.id);
        notifications.updateSuccess(product.name);
        setShowActions(false);
      } catch (error) {
        notifications.updateError(error as Error);
      }
    }
  };

  const handleDelete = async () => {
    if (onDelete) {
      try {
        await onDelete(product.id);
        notifications.deleteSuccess(product.name);
        setShowActions(false);
      } catch (error) {
        notifications.deleteError(error as Error);
      }
    }
  };

  const handleDuplicate = async () => {
    if (onDuplicate) {
      try {
        await onDuplicate(product.id);
        notifications.duplicateSuccess(product.name);
        setShowActions(false);
      } catch (error) {
        notifications.duplicateError(error as Error);
      }
    }
  };

  const handleToggleStatus = async () => {
    if (onToggleStatus) {
      try {
        await onToggleStatus(product.id);
        const newStatus = product.status === 'active' ? 'inactive' : 'active';
        notifications.statusChangeSuccess(product.name, newStatus);
        setShowActions(false);
      } catch (error) {
        notifications.statusChangeError(error as Error);
      }
    }
  };

  const handleManageInventory = async () => {
    if (onManageInventory) {
      try {
        await onManageInventory(product.id);
        notifications.inventoryUpdateSuccess(product.name);
        setShowActions(false);
      } catch (error) {
        notifications.inventoryUpdateError(error as Error);
      }
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowActions(!showActions)}
        className="p-1 rounded hover:bg-gray-100 transition-colors"
      >
        <MoreHorizontal className="w-4 h-4 text-gray-500" />
      </button>

      {showActions && (
        <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="py-1">
            <button
              onClick={() => {
                onView?.(product.id);
                setShowActions(false);
              }}
              className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              <Eye className="w-4 h-4" />
              <span>Ver detalles</span>
            </button>
            
            <button
              onClick={handleEdit}
              className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              <Edit className="w-4 h-4" />
              <span>Editar</span>
            </button>
            
            {onToggleStatus && (
              <button
                onClick={handleToggleStatus}
                className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                {product.status === 'active' ? (
                  <>
                    <XCircle className="w-4 h-4 text-red-500" />
                    <span>Desactivar</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Activar</span>
                  </>
                )}
              </button>
            )}
            
            {onManageInventory && (
              <button
                onClick={handleManageInventory}
                className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <Package className="w-4 h-4 text-blue-500" />
                <span>Gestionar stock</span>
              </button>
            )}
            
            <button
              onClick={handleDuplicate}
              className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              <Copy className="w-4 h-4" />
              <span>Duplicar</span>
            </button>
            
            <div className="border-t border-gray-200 my-1"></div>
            
            <button
              onClick={handleDelete}
              disabled={isLoading}
              className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50 disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              <span>Eliminar</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}









