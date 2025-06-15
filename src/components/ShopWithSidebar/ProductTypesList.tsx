// ===================================
// PINTEYA E-COMMERCE - LISTA DE TIPOS DE PRODUCTOS
// ===================================

import React from 'react';
import { PRODUCT_CATEGORIES } from '@/constants/shop';

interface ProductType {
  name: string;
  slug: string;
  description: string;
  products: number;
}

interface ProductTypesListProps {
  onCategorySelect: (slug: string) => void;
  selectedCategory: string;
}

const ProductTypesList: React.FC<ProductTypesListProps> = ({
  onCategorySelect,
  selectedCategory,
}) => {
  // Tipos de productos relevantes para pinturería (datos dinámicos)
  const productTypes: ProductType[] = Object.values(PRODUCT_CATEGORIES).map(category => ({
    name: category.name,
    slug: category.slug,
    description: category.description,
    // TODO: Obtener conteo real desde la API
    products: 0,
  }));

  return (
    <div className="mb-7.5">
      <h3 className="font-medium text-dark text-lg mb-4">
        Tipos de Productos
      </h3>
      <ul className="space-y-2">
        {productTypes.map((type) => (
          <li key={type.slug}>
            <button
              onClick={() => onCategorySelect(type.slug)}
              className={`w-full text-left p-2 rounded transition-colors ${
                selectedCategory === type.slug
                  ? 'bg-primary text-white'
                  : 'hover:bg-gray-100'
              }`}
              title={type.description}
            >
              <span className="flex justify-between items-center">
                <span className="font-medium">{type.name}</span>
                {type.products > 0 && (
                  <span className="text-sm text-gray-500">
                    ({type.products})
                  </span>
                )}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ProductTypesList;
