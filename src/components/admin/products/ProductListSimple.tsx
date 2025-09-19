'use client';

import { useProductList } from '@/hooks/admin/useProductList';

export function ProductListSimple() {
  const { products, isLoading, error } = useProductList();

  if (isLoading) {
    return <div className="p-4">Cargando productos...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">Error: {error instanceof Error ? error.message : String(error) || 'Error desconocido'}</div>;
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Lista de Productos (Simple)</h2>
      <div className="space-y-2">
        {products.map((product) => (
          <div key={product.id} className="border p-3 rounded">
            <h3 className="font-medium">{product.name}</h3>
            <p className="text-sm text-gray-600">{product.description}</p>
            <p className="text-sm">Precio: ${product.price}</p>
            <p className="text-sm">Stock: {product.stock}</p>
          </div>
        ))}
      </div>
    </div>
  );
}









