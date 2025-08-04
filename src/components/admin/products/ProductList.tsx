'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { AdminDataTable } from '../ui/AdminDataTable';
import { ProductFilters } from './ProductFilters';
import { ProductActions, ProductRowActions } from './ProductActions';
import { useProductList } from '@/hooks/admin/useProductList';
import { cn } from '@/lib/utils';
import { Package, AlertCircle, CheckCircle, Clock } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category_id: string;
  category_name?: string;
  image_url?: string;
  status: 'active' | 'inactive' | 'draft';
  created_at: string;
  updated_at: string;
}

interface ProductListProps {
  className?: string;
}

// Status Badge Component
function StatusBadge({ status }: { status: Product['status'] }) {
  const statusConfig = {
    active: {
      label: 'Activo',
      icon: CheckCircle,
      className: 'bg-green-100 text-green-800 border-green-200'
    },
    inactive: {
      label: 'Inactivo',
      icon: AlertCircle,
      className: 'bg-red-100 text-red-800 border-red-200'
    },
    draft: {
      label: 'Borrador',
      icon: Clock,
      className: 'bg-yellow-100 text-yellow-800 border-yellow-200'
    }
  };

  const config = statusConfig[status];
  const Icon = config && config.icon ? config.icon : Package;

  return (
    <span className={cn(
      "inline-flex items-center space-x-1 px-2 py-1 text-xs font-medium rounded-full border",
      config && config.className ? config.className : 'bg-gray-100 text-gray-800 border-gray-200'
    )}>
      <Icon className="w-3 h-3" />
      <span>{config && config.label ? config.label : 'Estado'}</span>
    </span>
  );
}

// Stock Badge Component
function StockBadge({ stock }: { stock: number }) {
  if (stock === 0) {
    return (
      <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
        Sin stock
      </span>
    );
  }
  
  if (stock <= 10) {
    return (
      <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
        Stock bajo
      </span>
    );
  }
  
  return (
    <span className="text-sm text-gray-900">
      {stock} unidades
    </span>
  );
}

export function ProductList({ className }: ProductListProps) {
  const router = useRouter();
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);

  const {
    products,
    total,
    currentPage,
    currentPageSize,
    isLoading,
    error,
    params,
    updateFilters,
    clearFilters,
    goToPage,
    changePageSize,
    deleteProduct,
    bulkDelete,
    isDeleting,
    isBulkDeleting
  } = useProductList();

  // Table columns configuration
  const columns = [
    {
      key: 'image_url',
      title: 'Imagen',
      width: '80px',
      render: (imageUrl: string, product: Product) => (
        <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={product.name}
              width={48}
              height={48}
              className="object-cover"
            />
          ) : (
            <Package className="w-6 h-6 text-gray-400" />
          )}
        </div>
      )
    },
    {
      key: 'name',
      title: 'Producto',
      sortable: true,
      render: (name: string, product: Product) => (
        <div>
          <div className="font-medium text-gray-900">{name}</div>
          <div className="text-sm text-gray-500 truncate max-w-xs">
            {product.description}
          </div>
        </div>
      )
    },
    {
      key: 'category_name',
      title: 'Categoría',
      sortable: true,
      render: (categoryName: string) => (
        <span className="text-sm text-gray-900">
          {categoryName || 'Sin categoría'}
        </span>
      )
    },
    {
      key: 'price',
      title: 'Precio',
      align: 'right' as const,
      sortable: true,
      render: (price: number) => (
        <span className="font-medium text-gray-900">
          ${price.toLocaleString('es-AR')}
        </span>
      )
    },
    {
      key: 'stock',
      title: 'Stock',
      align: 'center' as const,
      sortable: true,
      render: (stock: number) => <StockBadge stock={stock} />
    },
    {
      key: 'status',
      title: 'Estado',
      align: 'center' as const,
      sortable: true,
      render: (status: Product['status']) => <StatusBadge status={status} />
    },
    {
      key: 'created_at',
      title: 'Creado',
      sortable: true,
      render: (createdAt: string) => (
        <span className="text-sm text-gray-500">
          {new Date(createdAt).toLocaleDateString('es-AR')}
        </span>
      )
    },
    {
      key: 'actions',
      title: 'Acciones',
      width: '60px',
      render: (_: any, product: Product) => (
        <ProductRowActions
          product={product}
          onView={(id) => router.push(`/admin/products/${id}`)}
          onEdit={(id) => router.push(`/admin/products/${id}/edit`)}
          onDelete={handleDeleteProduct}
          onDuplicate={handleDuplicateProduct}
          isLoading={isDeleting}
        />
      )
    }
  ];

  // Event handlers
  const handleDeleteProduct = async (productId: string) => {
    const result = await deleteProduct(productId);
    if (!result.success) {
      // Handle error (show toast, etc.)
      console.error('Error deleting product:', result.error);
    }
  };

  const handleBulkDelete = async (productIds: string[]) => {
    const result = await bulkDelete(productIds);
    if (result.success) {
      setSelectedProducts([]);
    } else {
      // Handle error
      console.error('Error bulk deleting products:', result.error);
    }
  };

  const handleDuplicateProduct = (productId: string) => {
    // TODO: Implement product duplication
    console.log('Duplicate product:', productId);
  };

  const handleCreateProduct = () => {
    router.push('/admin/products/new');
  };

  const handleExportProducts = () => {
    // TODO: Implement export functionality
    console.log('Export products');
  };

  const handleImportProducts = () => {
    // TODO: Implement import functionality
    console.log('Import products');
  };

  const handleRowClick = (product: Product) => {
    router.push(`/admin/products/${product.id}`);
  };

  // Pagination configuration
  const paginationConfig = {
    page: currentPage,
    pageSize: currentPageSize,
    total,
    onPageChange: goToPage,
    onPageSizeChange: changePageSize
  };

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center space-x-3">
          <AlertCircle className="w-6 h-6 text-red-600" />
          <div>
            <h3 className="text-lg font-medium text-red-800">
              Error al cargar productos
            </h3>
            <p className="text-red-700 mt-1">
              {error.message}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Filters */}
      <ProductFilters
        filters={params.filters || {}}
        onFiltersChange={updateFilters}
        onClearFilters={clearFilters}
        categories={[]} // TODO: Load categories from API
      />

      {/* Actions */}
      <ProductActions
        selectedProducts={selectedProducts}
        onCreateProduct={handleCreateProduct}
        onBulkDelete={handleBulkDelete}
        onExportProducts={handleExportProducts}
        onImportProducts={handleImportProducts}
        isLoading={isDeleting || isBulkDeleting}
      />

      {/* Data Table */}
      <AdminDataTable
        data={products}
        columns={columns}
        loading={isLoading}
        pagination={paginationConfig}
        selectable
        onRowClick={handleRowClick}
        onSelectionChange={setSelectedProducts}
        className="shadow-sm"
      />

      {/* Summary */}
      {!isLoading && (
        <div className="text-sm text-gray-600 text-center">
          Mostrando {products.length} de {total} productos
        </div>
      )}
    </div>
  );
}
