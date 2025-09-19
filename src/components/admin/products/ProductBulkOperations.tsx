// =====================================================
// COMPONENTE: ProductBulkOperations
// Descripción: Operaciones masivas para productos enterprise
// Incluye: Import/Export, Cambios masivos, Eliminación masiva
// =====================================================

'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Upload, 
  Download, 
  Edit, 
  Trash2, 
  Package, 
  AlertTriangle,
  CheckCircle,
  FileText,
  Settings,
  MoreHorizontal
} from 'lucide-react';
import { Product } from '@/hooks/admin/useProductsEnterprise';
import { cn } from '@/lib/core/utils';

// =====================================================
// INTERFACES
// =====================================================

interface ProductBulkOperationsProps {
  selectedProducts: Product[];
  categories: Array<{ id: number; name: string }>;
  onBulkUpdateStatus: (productIds: string[], status: 'active' | 'inactive') => Promise<void>;
  onBulkUpdateCategory: (productIds: string[], categoryId: number) => Promise<void>;
  onBulkDelete: (productIds: string[]) => Promise<void>;
  onImportProducts: (file: File) => Promise<void>;
  onExportProducts: () => Promise<void>;
  isLoading?: boolean;
  className?: string;
}

interface ImportDialogProps {
  onImport: (file: File) => Promise<void>;
  isLoading: boolean;
}

interface BulkEditDialogProps {
  selectedProducts: Product[];
  categories: Array<{ id: number; name: string }>;
  onUpdateStatus: (productIds: string[], status: 'active' | 'inactive') => Promise<void>;
  onUpdateCategory: (productIds: string[], categoryId: number) => Promise<void>;
  isLoading: boolean;
}

// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================

export function ProductBulkOperations({
  selectedProducts,
  categories,
  onBulkUpdateStatus,
  onBulkUpdateCategory,
  onBulkDelete,
  onImportProducts,
  onExportProducts,
  isLoading = false,
  className
}: ProductBulkOperationsProps) {
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showBulkEditDialog, setShowBulkEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const selectedCount = selectedProducts.length;
  const hasSelection = selectedCount > 0;

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Operaciones Masivas
            </CardTitle>
            <CardDescription>
              Gestión avanzada de productos con operaciones masivas
            </CardDescription>
          </div>

          {hasSelection && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Package className="w-3 h-3" />
              {selectedCount} producto{selectedCount > 1 ? 's' : ''} seleccionado{selectedCount > 1 ? 's' : ''}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Import/Export */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-900">Import/Export</h4>
            <div className="flex flex-col gap-2">
              <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="justify-start">
                    <Upload className="w-4 h-4 mr-2" />
                    Importar CSV
                  </Button>
                </DialogTrigger>
                <ImportDialog 
                  onImport={onImportProducts}
                  isLoading={isLoading}
                />
              </Dialog>

              <Button 
                variant="outline" 
                size="sm" 
                onClick={onExportProducts}
                disabled={isLoading}
                className="justify-start"
              >
                <Download className="w-4 h-4 mr-2" />
                Exportar CSV
              </Button>
            </div>
          </div>

          {/* Edición Masiva */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-900">Edición Masiva</h4>
            <div className="flex flex-col gap-2">
              <Dialog open={showBulkEditDialog} onOpenChange={setShowBulkEditDialog}>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    disabled={!hasSelection || isLoading}
                    className="justify-start"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Editar Selección
                  </Button>
                </DialogTrigger>
                <BulkEditDialog
                  selectedProducts={selectedProducts}
                  categories={categories}
                  onUpdateStatus={onBulkUpdateStatus}
                  onUpdateCategory={onBulkUpdateCategory}
                  isLoading={isLoading}
                />
              </Dialog>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    disabled={!hasSelection || isLoading}
                    className="justify-start"
                  >
                    <MoreHorizontal className="w-4 h-4 mr-2" />
                    Acciones Rápidas
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuLabel>Cambiar Estado</DropdownMenuLabel>
                  <DropdownMenuItem 
                    onClick={() => onBulkUpdateStatus(selectedProducts.map(p => p.id), 'active')}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Activar productos
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => onBulkUpdateStatus(selectedProducts.map(p => p.id), 'inactive')}
                  >
                    <Package className="w-4 h-4 mr-2" />
                    Desactivar productos
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Eliminación */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-900">Eliminación</h4>
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
              <DialogTrigger asChild>
                <Button 
                  variant="destructive" 
                  size="sm" 
                  disabled={!hasSelection || isLoading}
                  className="justify-start"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Eliminar Selección
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                    Confirmar Eliminación
                  </DialogTitle>
                  <DialogDescription>
                    ¿Estás seguro de que quieres eliminar {selectedCount} producto{selectedCount > 1 ? 's' : ''}?
                    Esta acción no se puede deshacer.
                  </DialogDescription>
                </DialogHeader>
                <div className="max-h-40 overflow-y-auto">
                  <ul className="space-y-1 text-sm">
                    {selectedProducts.slice(0, 10).map((product) => (
                      <li key={product.id} className="flex items-center gap-2">
                        <Package className="w-3 h-3 text-gray-400" />
                        {product.name}
                      </li>
                    ))}
                    {selectedProducts.length > 10 && (
                      <li className="text-gray-500 italic">
                        ... y {selectedProducts.length - 10} más
                      </li>
                    )}
                  </ul>
                </div>
                <DialogFooter>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowDeleteDialog(false)}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={async () => {
                      await onBulkDelete(selectedProducts.map(p => p.id));
                      setShowDeleteDialog(false);
                    }}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Eliminando...' : 'Eliminar'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Estadísticas */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-900">Estadísticas</h4>
            <div className="text-sm text-gray-600 space-y-1">
              <div>Total seleccionados: {selectedCount}</div>
              {hasSelection && (
                <>
                  <div>
                    Activos: {selectedProducts.filter(p => p.is_active).length}
                  </div>
                  <div>
                    Inactivos: {selectedProducts.filter(p => !p.is_active).length}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// =====================================================
// DIALOG DE IMPORTACIÓN
// =====================================================

function ImportDialog({ onImport, isLoading }: ImportDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile);
    }
  };

  const handleImport = async () => {
    if (file) {
      await onImport(file);
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Importar Productos desde CSV
        </DialogTitle>
        <DialogDescription>
          Selecciona un archivo CSV con los productos a importar. 
          El archivo debe tener las columnas: nombre, descripción, precio, stock, categoría.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        <div>
          <Input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            className="cursor-pointer"
          />
        </div>

        {file && (
          <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
            <FileText className="w-4 h-4 text-green-600" />
            <span className="text-sm text-green-800">
              {file.name} ({(file.size / 1024).toFixed(1)} KB)
            </span>
          </div>
        )}

        <div className="text-xs text-gray-500">
          <p className="font-medium mb-1">Formato esperado:</p>
          <code className="bg-gray-100 p-2 rounded text-xs block">
            nombre,descripción,precio,stock,categoría<br/>
            "Pintura Blanca","Pintura látex blanca",1500,50,"Pinturas"
          </code>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" disabled={isLoading}>
          Cancelar
        </Button>
        <Button 
          onClick={handleImport} 
          disabled={!file || isLoading}
        >
          {isLoading ? 'Importando...' : 'Importar'}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

// =====================================================
// DIALOG DE EDICIÓN MASIVA
// =====================================================

function BulkEditDialog({ 
  selectedProducts, 
  categories, 
  onUpdateStatus, 
  onUpdateCategory, 
  isLoading 
}: BulkEditDialogProps) {
  const [operation, setOperation] = useState<'status' | 'category'>('status');
  const [newStatus, setNewStatus] = useState<'active' | 'inactive'>('active');
  const [newCategoryId, setNewCategoryId] = useState<number | null>(null);

  const handleApply = async () => {
    const productIds = selectedProducts.map(p => p.id);
    
    if (operation === 'status') {
      await onUpdateStatus(productIds, newStatus);
    } else if (operation === 'category' && newCategoryId) {
      await onUpdateCategory(productIds, newCategoryId);
    }
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Edit className="w-5 h-5" />
          Edición Masiva
        </DialogTitle>
        <DialogDescription>
          Aplicar cambios a {selectedProducts.length} producto{selectedProducts.length > 1 ? 's' : ''} seleccionado{selectedProducts.length > 1 ? 's' : ''}.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium">Operación</label>
          <Select value={operation} onValueChange={(value: 'status' | 'category') => setOperation(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="status">Cambiar Estado</SelectItem>
              <SelectItem value="category">Cambiar Categoría</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {operation === 'status' && (
          <div>
            <label className="text-sm font-medium">Nuevo Estado</label>
            <Select value={newStatus} onValueChange={(value: 'active' | 'inactive') => setNewStatus(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Activo</SelectItem>
                <SelectItem value="inactive">Inactivo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {operation === 'category' && (
          <div>
            <label className="text-sm font-medium">Nueva Categoría</label>
            <Select value={newCategoryId?.toString()} onValueChange={(value) => setNewCategoryId(parseInt(value))}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar categoría" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <DialogFooter>
        <Button variant="outline" disabled={isLoading}>
          Cancelar
        </Button>
        <Button 
          onClick={handleApply} 
          disabled={isLoading || (operation === 'category' && !newCategoryId)}
        >
          {isLoading ? 'Aplicando...' : 'Aplicar Cambios'}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}









