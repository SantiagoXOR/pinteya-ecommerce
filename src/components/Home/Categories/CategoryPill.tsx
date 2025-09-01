/**
 * CategoryPill Component
 * Componente para mostrar categorías como pills/badges
 */

import React from 'react';

interface CategoryPillProps {
  category: {
    id: string;
    name: string;
    slug: string;
    count?: number;
  };
  isSelected?: boolean;
  onClick?: (category: any) => void;
  className?: string;
}

export const CategoryPill: React.FC<CategoryPillProps> = ({
  category,
  isSelected = false,
  onClick,
  className = '',
}) => {
  const handleClick = () => {
    if (onClick) {
      onClick(category);
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`
        inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium
        transition-all duration-200 border
        ${isSelected 
          ? 'bg-primary text-white border-primary' 
          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
        }
        ${className}
      `}
      data-testid={`category-pill-${category.slug}`}
    >
      {category.name}
      {category.count !== undefined && (
        <span className="ml-1.5 text-xs opacity-75">
          ({category.count})
        </span>
      )}
    </button>
  );
};

export default CategoryPill;
