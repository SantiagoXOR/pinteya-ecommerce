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
  AlertTriangle
} from 'lucide-react';
import { cn } from '@/lib/utils';

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
  onDuplicateProduct?: (productId: string) => void;
  onExportProducts?: () => void;
  onImportProducts?: () => void;
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
  onDuplicateProduct,
  onExportProducts,
  onImportProducts,
  isLoading = false,
  className
}: ProductActionsProps) {
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const hasSelectedProducts = selectedProducts.length > 0;
  const selectedCount = selectedProducts.length;

  const handleBulkDelete = () => {
    if (onBulkDelete && selectedProducts.length > 0) {
      onBulkDelete(selectedProducts.map(p => p.id));
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className={cn("flex items-center justify-between", className)}>
      {/* Bulk Actions */}
      {hasSelectedProducts && (
        <div className="flex items-center space-x-3 bg-blaze-orange-50 border border-blaze-orange-200 rounded-lg px-4 py-2">
          <span className="text-sm font-medium text-blaze-orange-800">
            {selectedCount} producto{selectedCount !== 1 ? 's' : ''} seleccionado{selectedCount !== 1 ? 's' : ''}
          </span>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isLoading}
              className="flex items-center space-x-1 px-3 py-1 text-sm text-red-700 bg-red-100 hover:bg-red-200 rounded-md transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              <span>Eliminar</span>
            </button>
            
            <button
              onClick={() => setShowBulkActions(!showBulkActions)}
              className="flex items-center space-x-1 px-3 py-1 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              <MoreHorizontal className="w-4 h-4" />
              <span>Más acciones</span>
            </button>
          </div>
        </div>
      )}

      {/* Primary Actions */}
      <div className="flex items-center space-x-3 ml-auto">
        {/* Import/Export */}
        <div className="flex items-center space-x-2">
          <button
            onClick={onImportProducts}
            disabled={isLoading}
            className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors disabled:opacity-50"
          >
            <Upload className="w-4 h-4" />
            <span className="hidden sm:inline">Importar</span>
          </button>
          
          <button
            onClick={onExportProducts}
            disabled={isLoading}
            className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Exportar</span>
          </button>
        </div>

        {/* Create Product */}
        <button
          onClick={onCreateProduct}
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
  isLoading?: boolean;
}

export function ProductRowActions({
  product,
  onEdit,
  onView,
  onDelete,
  onDuplicate,
  isLoading = false
}: ProductRowActionsProps) {
  const [showActions, setShowActions] = useState(false);

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
              onClick={() => {
                onEdit?.(product.id);
                setShowActions(false);
              }}
              className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              <Edit className="w-4 h-4" />
              <span>Editar</span>
            </button>
            
            <button
              onClick={() => {
                onDuplicate?.(product.id);
                setShowActions(false);
              }}
              className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              <Copy className="w-4 h-4" />
              <span>Duplicar</span>
            </button>
            
            <div className="border-t border-gray-200 my-1"></div>
            
            <button
              onClick={() => {
                onDelete?.(product.id);
                setShowActions(false);
              }}
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
