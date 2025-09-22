'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Search, Palette, Eye, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/core/utils';
import { ProductType } from '@/utils/product-utils';

// ===================================
// TIPOS Y INTERFACES
// ===================================

export interface ColorOption {
  id: string;
  name: string;
  displayName: string;
  hex: string;
  category: string;
  family: string;
  isPopular?: boolean;
  description?: string;
}

interface AdvancedColorPickerProps {
  colors?: ColorOption[];
  selectedColor: string;
  onColorChange: (colorId: string) => void;
  showSearch?: boolean;
  showCategories?: boolean;
  showPreview?: boolean;
  maxDisplayColors?: number;
  className?: string;
  productType?: ProductType; // Nuevo prop para filtrar colores según el tipo de producto
}

// ===================================
// PALETA DE COLORES PARA PINTURAS
// ===================================

export const PAINT_COLORS: ColorOption[] = [
  // ===================================
  // COLORES PARA PRODUCTOS DE MADERA
  // ===================================
  // Tonos naturales y cálidos específicos para productos de madera
  { id: 'blanco-puro', name: 'blanco-puro', displayName: 'Blanco Puro', hex: '#FFFFFF', category: 'Madera', family: 'Blancos', isPopular: true, description: 'Blanco clásico para madera' },
  { id: 'crema', name: 'crema', displayName: 'Crema', hex: '#F5F5DC', category: 'Madera', family: 'Blancos', isPopular: true, description: 'Tono cremoso natural' },
  { id: 'cedro', name: 'cedro', displayName: 'Cedro', hex: '#D2691E', category: 'Madera', family: 'Marrones', isPopular: true, description: 'Tono natural de cedro' },
  { id: 'caoba', name: 'caoba', displayName: 'Caoba', hex: '#C04000', category: 'Madera', family: 'Marrones', isPopular: true, description: 'Marrón rojizo elegante' },
  { id: 'roble-britanico', name: 'roble-britanico', displayName: 'Roble Británico', hex: '#8B4513', category: 'Madera', family: 'Marrones', isPopular: true, description: 'Marrón clásico de roble' },
  { id: 'roble-oscuro-satinado', name: 'roble-oscuro-satinado', displayName: 'Roble Oscuro Satinado', hex: '#654321', category: 'Madera', family: 'Marrones', isPopular: true, description: 'Roble oscuro con acabado satinado' },
  { id: 'nogal', name: 'nogal', displayName: 'Nogal', hex: '#5D4037', category: 'Madera', family: 'Marrones', description: 'Marrón profundo de nogal' },
  { id: 'natural', name: 'natural', displayName: 'Natural', hex: '#DEB887', category: 'Madera', family: 'Marrones', description: 'Tono madera natural' },

  // ===================================
  // COLORES PARA PRODUCTOS SINTÉTICOS
  // ===================================
  // Paleta oficial de 17 colores para productos sintéticos
  { id: 'aluminio', name: 'aluminio', displayName: 'Aluminio', hex: '#A8A8A8', category: 'Sintético', family: 'Grises', isPopular: true, description: 'Gris aluminio metálico' },
  { id: 'amarillo', name: 'amarillo', displayName: 'Amarillo', hex: '#FFFF00', category: 'Sintético', family: 'Amarillos', isPopular: true, description: 'Amarillo puro vibrante' },
  { id: 'amarillo-mediano', name: 'amarillo-mediano', displayName: 'Amarillo Mediano', hex: '#FFD700', category: 'Sintético', family: 'Amarillos', isPopular: true, description: 'Amarillo dorado mediano' },
  { id: 'azul-marino', name: 'azul-marino', displayName: 'Azul Marino', hex: '#000080', category: 'Sintético', family: 'Azules', isPopular: true, description: 'Azul marino profundo' },
  { id: 'azul-traful', name: 'azul-traful', displayName: 'Azul Traful', hex: '#4682B4', category: 'Sintético', family: 'Azules', isPopular: true, description: 'Azul acero traful' },
  { id: 'bermellon', name: 'bermellon', displayName: 'Bermellón', hex: '#E34234', category: 'Sintético', family: 'Rojos', isPopular: true, description: 'Rojo bermellón intenso' },
  { id: 'blanco', name: 'blanco', displayName: 'Blanco', hex: '#FFFFFF', category: 'Sintético', family: 'Blancos', isPopular: true, description: 'Blanco puro para sintéticos' },
  { id: 'gris', name: 'gris', displayName: 'Gris', hex: '#808080', category: 'Sintético', family: 'Grises', isPopular: true, description: 'Gris neutro estándar' },
  { id: 'gris-espacial', name: 'gris-espacial', displayName: 'Gris Espacial', hex: '#696969', category: 'Sintético', family: 'Grises', isPopular: true, description: 'Gris espacial oscuro' },
  { id: 'gris-perla', name: 'gris-perla', displayName: 'Gris Perla', hex: '#C0C0C0', category: 'Sintético', family: 'Grises', isPopular: true, description: 'Gris perla claro' },
  { id: 'marfil', name: 'marfil', displayName: 'Marfil', hex: '#FFFFF0', category: 'Sintético', family: 'Blancos', isPopular: true, description: 'Blanco marfil cálido' },
  { id: 'marron', name: 'marron', displayName: 'Marrón', hex: '#8B4513', category: 'Sintético', family: 'Marrones', isPopular: true, description: 'Marrón silla de montar' },
  { id: 'naranja', name: 'naranja', displayName: 'Naranja', hex: '#FF8C00', category: 'Sintético', family: 'Naranjas', isPopular: true, description: 'Naranja vibrante' },
  { id: 'negro', name: 'negro', displayName: 'Negro', hex: '#000000', category: 'Sintético', family: 'Negros', isPopular: true, description: 'Negro puro para sintéticos' },
  { id: 'tostado', name: 'tostado', displayName: 'Tostado', hex: '#D2B48C', category: 'Sintético', family: 'Marrones', isPopular: true, description: 'Beige tostado cálido' },
  { id: 'verde-ingles', name: 'verde-ingles', displayName: 'Verde Inglés', hex: '#355E3B', category: 'Sintético', family: 'Verdes', isPopular: true, description: 'Verde profundo y elegante' },
  { id: 'verde-noche', name: 'verde-noche', displayName: 'Verde Noche', hex: '#013220', category: 'Sintético', family: 'Verdes', isPopular: true, description: 'Verde muy oscuro nocturno' },

  // ===================================
  // COLORES GENERALES (NEUTROS)
  // ===================================
  // Blancos y Neutros generales
  { id: 'blanco-roto', name: 'blanco-roto', displayName: 'Blanco Roto', hex: '#FEFEFE', category: 'Neutros', family: 'Blancos', description: 'Blanco suave con matiz cálido' },
  { id: 'marfil', name: 'marfil', displayName: 'Marfil', hex: '#FFFFF0', category: 'Neutros', family: 'Blancos', description: 'Blanco cremoso elegante' },
  { id: 'gris-perla', name: 'gris-perla', displayName: 'Gris Perla', hex: '#E8E8E8', category: 'Neutros', family: 'Grises', isPopular: true },
  { id: 'gris-plata', name: 'gris-plata', displayName: 'Gris Plata', hex: '#C0C0C0', category: 'Neutros', family: 'Grises' },
  { id: 'gris-antracita', name: 'gris-antracita', displayName: 'Gris Antracita', hex: '#36454F', category: 'Neutros', family: 'Grises' },

  // Azules generales
  { id: 'azul-cielo', name: 'azul-cielo', displayName: 'Azul Cielo', hex: '#87CEEB', category: 'Fríos', family: 'Azules', isPopular: true, description: 'Azul suave y relajante' },
  { id: 'azul-marino', name: 'azul-marino', displayName: 'Azul Marino', hex: '#000080', category: 'Fríos', family: 'Azules', description: 'Azul profundo y elegante' },
  { id: 'azul-turquesa', name: 'azul-turquesa', displayName: 'Azul Turquesa', hex: '#40E0D0', category: 'Fríos', family: 'Azules' },
  { id: 'azul-petroleo', name: 'azul-petroleo', displayName: 'Azul Petróleo', hex: '#2F4F4F', category: 'Fríos', family: 'Azules' },

  // Verdes generales
  { id: 'verde-menta', name: 'verde-menta', displayName: 'Verde Menta', hex: '#98FB98', category: 'Fríos', family: 'Verdes', isPopular: true },
  { id: 'verde-oliva', name: 'verde-oliva', displayName: 'Verde Oliva', hex: '#808000', category: 'Fríos', family: 'Verdes' },
  { id: 'verde-bosque', name: 'verde-bosque', displayName: 'Verde Bosque', hex: '#228B22', category: 'Fríos', family: 'Verdes' },
  { id: 'verde-salvia', name: 'verde-salvia', displayName: 'Verde Salvia', hex: '#9CAF88', category: 'Fríos', family: 'Verdes' },

  // Rojos y Rosas generales
  { id: 'rojo-coral', name: 'rojo-coral', displayName: 'Rojo Coral', hex: '#FF7F50', category: 'Cálidos', family: 'Rojos', isPopular: true },
  { id: 'rojo-vino', name: 'rojo-vino', displayName: 'Rojo Vino', hex: '#722F37', category: 'Cálidos', family: 'Rojos' },
  { id: 'rosa-empolvado', name: 'rosa-empolvado', displayName: 'Rosa Empolvado', hex: '#DDA0DD', category: 'Cálidos', family: 'Rosas' },
  { id: 'rosa-cuarzo', name: 'rosa-cuarzo', displayName: 'Rosa Cuarzo', hex: '#F7CAC9', category: 'Cálidos', family: 'Rosas' },

  // Amarillos y Naranjas generales
  { id: 'amarillo-manteca', name: 'amarillo-manteca', displayName: 'Amarillo Manteca', hex: '#FFDB58', category: 'Cálidos', family: 'Amarillos', isPopular: true },
  { id: 'amarillo-mostaza', name: 'amarillo-mostaza', displayName: 'Amarillo Mostaza', hex: '#FFDB58', category: 'Cálidos', family: 'Amarillos' },
  { id: 'naranja-terracota', name: 'naranja-terracota', displayName: 'Naranja Terracota', hex: '#E2725B', category: 'Cálidos', family: 'Naranjas' },
  { id: 'naranja-durazno', name: 'naranja-durazno', displayName: 'Naranja Durazno', hex: '#FFCBA4', category: 'Cálidos', family: 'Naranjas' },

  // Marrones y Tierras generales
  { id: 'marron-chocolate', name: 'marron-chocolate', displayName: 'Marrón Chocolate', hex: '#7B3F00', category: 'Tierras', family: 'Marrones' },
  { id: 'marron-cafe', name: 'marron-cafe', displayName: 'Marrón Café', hex: '#6F4E37', category: 'Tierras', family: 'Marrones' },
  { id: 'beige-arena', name: 'beige-arena', displayName: 'Beige Arena', hex: '#F5F5DC', category: 'Tierras', family: 'Beijes', isPopular: true },
  { id: 'ocre-dorado', name: 'ocre-dorado', displayName: 'Ocre Dorado', hex: '#CC7722', category: 'Tierras', family: 'Ocres' },

  // Violetas y Púrpuras generales
  { id: 'violeta-lavanda', name: 'violeta-lavanda', displayName: 'Violeta Lavanda', hex: '#E6E6FA', category: 'Fríos', family: 'Violetas' },
  { id: 'purpura-real', name: 'purpura-real', displayName: 'Púrpura Real', hex: '#663399', category: 'Fríos', family: 'Violetas' },

  // Negros generales
  { id: 'negro-carbon', name: 'negro-carbon', displayName: 'Negro Carbón', hex: '#36454F', category: 'Neutros', family: 'Negros' },
  { id: 'negro-mate', name: 'negro-mate', displayName: 'Negro Mate', hex: '#28282B', category: 'Neutros', family: 'Negros' }
];

// ===================================
// FUNCIONES AUXILIARES
// ===================================

const getCategoryDisplayName = (category: string): string => {
  const categoryNames: Record<string, string> = {
    'all': 'Todos',
    'Madera': 'Madera',
    'Sintético': 'Sintético',
    'Neutros': 'Neutros',
    'Cálidos': 'Cálidos',
    'Fríos': 'Fríos',
    'Tierras': 'Tierras'
  };
  
  return categoryNames[category] || category;
};

// ===================================
// COMPONENTE PRINCIPAL
// ===================================

export const AdvancedColorPicker: React.FC<AdvancedColorPickerProps> = ({
  colors = PAINT_COLORS,
  selectedColor,
  onColorChange,
  showSearch = true,
  showCategories = true,
  showPreview = true,
  maxDisplayColors = 24,
  className,
  productType
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showAllColors, setShowAllColors] = useState(false);

  // Filtrar colores según el tipo de producto
  const availableColors = useMemo(() => {
    console.log('🎨 AdvancedColorPicker - Debug Info:', {
      productType,
      hasProductType: !!productType,
      allowedColorCategories: productType?.allowedColorCategories,
      totalColors: colors.length
    });
    
    if (!productType || !productType.allowedColorCategories) {
      console.log('⚠️ No hay restricciones de color, mostrando todos los colores');
      return colors; // Si no hay restricciones, mostrar todos los colores
    }
    
    let filtered = colors.filter(color => 
      productType.allowedColorCategories!.includes(color.category)
    );
    
    // Para productos de látex, excluir completamente los colores de madera
    const isLatexProduct = productType.allowedColorCategories!.includes('Látex') && productType.allowedColorCategories!.length === 1;
    if (isLatexProduct) {
      filtered = filtered.filter(color => color.category !== 'Madera');
      console.log('🎨 Latex product detected - excluding wood colors');
    }
    
    console.log('✅ Colores filtrados:', {
      allowedCategories: productType.allowedColorCategories,
      filteredCount: filtered.length,
      originalCount: colors.length,
      filteredColors: filtered.map(c => ({ name: c.displayName, category: c.category }))
    });
    
    return filtered;
  }, [colors, productType]);

  // Obtener categorías únicas basadas en los colores disponibles
  const categories = useMemo(() => {
    const cats = Array.from(new Set(availableColors.map(color => color.category)));
    
    // Ordenar categorías con prioridad específica
    const categoryOrder = ['Madera', 'Sintético', 'Neutros', 'Cálidos', 'Fríos', 'Tierras'];
    const sortedCats = cats.sort((a, b) => {
      const indexA = categoryOrder.indexOf(a);
      const indexB = categoryOrder.indexOf(b);
      if (indexA === -1 && indexB === -1) return a.localeCompare(b);
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    });
    
    // Para productos sintéticos, solo mostrar la categoría Sintético (sin "Todos")
    if (productType?.allowedColorCategories?.includes('Sintético') && 
        productType.allowedColorCategories.length === 1) {
      return ['Sintético'];
    }
    
    // Para productos de madera, solo mostrar la categoría Madera (sin "Todos")
    if (productType?.allowedColorCategories?.includes('Madera') && 
        productType.allowedColorCategories.length === 1) {
      return ['Madera'];
    }
    
    return ['all', ...sortedCats];
  }, [availableColors, productType]);

  // Inicializar selectedCategory correctamente para productos sintéticos y de madera
  useEffect(() => {
    if (productType?.allowedColorCategories?.includes('Sintético') && 
        productType.allowedColorCategories.length === 1) {
      setSelectedCategory('Sintético');
    } else if (productType?.allowedColorCategories?.includes('Madera') && 
               productType.allowedColorCategories.length === 1) {
      setSelectedCategory('Madera');
    }
  }, [productType]);

  // Filtrar colores
  const filteredColors = useMemo(() => {
    let filtered = availableColors;

    // Filtrar por categoría
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(color => color.category === selectedCategory);
    }

    // Filtrar por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(color => 
        color.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        color.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        color.family.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  }, [availableColors, selectedCategory, searchTerm]);

  // Colores a mostrar (con límite)
  const displayColors = useMemo(() => {
    if (showAllColors) return filteredColors;
    return filteredColors.slice(0, maxDisplayColors);
  }, [filteredColors, showAllColors, maxDisplayColors]);

  // Color seleccionado actual
  const currentColor = availableColors.find(color => color.id === selectedColor);

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header con título y color seleccionado */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Palette className="w-5 h-5 text-blaze-orange-600" />
          <h4 className="text-sm font-medium text-gray-900">Color</h4>
        </div>
        {currentColor && showPreview && (
          <div className="flex items-center gap-2">
            <div 
              className="w-6 h-6 rounded-full border-2 border-gray-300"
              style={{ backgroundColor: currentColor.hex }}
            />
            <span className="text-sm font-medium text-gray-700">
              {currentColor.displayName}
            </span>
          </div>
        )}
      </div>



      {/* Filtros por categoría */}
      {showCategories && (
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              className={cn(
                "text-xs",
                selectedCategory === category && "bg-blaze-orange-600 hover:bg-blaze-orange-700"
              )}
            >
              {getCategoryDisplayName(category)}
            </Button>
          ))}
        </div>
      )}

      {/* Colores populares */}
      {selectedCategory === 'all' && !searchTerm && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              Populares
            </Badge>
          </div>
          <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2">
            {colors.filter(color => {
              // Para productos látex, excluir colores de Madera y Sintético de los populares
              if (productType?.allowedColorCategories?.includes('Látex') && 
                  productType.allowedColorCategories.length === 1) {
                return color.isPopular && color.category !== 'Madera' && color.category !== 'Sintético';
              }
              return color.isPopular;
            }).map((color) => (
              <ColorSwatch
                key={color.id}
                color={color}
                isSelected={selectedColor === color.id}
                onClick={() => onColorChange(color.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Grid de colores filtrados por categoría */}
      {selectedCategory !== 'all' && (
        <div className="space-y-2">
          <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-2">
            {filteredColors.map((color) => (
              <ColorSwatch
                key={color.id}
                color={color}
                isSelected={selectedColor === color.id}
                onClick={() => onColorChange(color.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Información del color seleccionado */}
      {currentColor && (
        <div className="bg-gray-50 p-4 rounded-lg space-y-2">
          <div className="flex items-center gap-3">
            <div 
              className="w-12 h-12 rounded-lg border-2 border-gray-300 shadow-sm"
              style={{ backgroundColor: currentColor.hex }}
            />
            <div className="flex-1">
              <h5 className="font-medium text-gray-900">{currentColor.displayName}</h5>
              <p className="text-sm text-gray-600">{currentColor.family} • {currentColor.category}</p>
              <p className="text-xs text-gray-500 font-mono">{currentColor.hex}</p>
            </div>
          </div>
          {currentColor.description && (
            <p className="text-sm text-gray-600 italic">{currentColor.description}</p>
          )}
        </div>
      )}
    </div>
  );
};

// ===================================
// COMPONENTE COLOR SWATCH
// ===================================

interface ColorSwatchProps {
  color: ColorOption;
  isSelected: boolean;
  onClick: () => void;
}

const ColorSwatch: React.FC<ColorSwatchProps> = ({ color, isSelected, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative w-10 h-10 rounded-lg border-2 transition-all duration-200 hover:scale-110 hover:shadow-md group",
        isSelected 
          ? "border-blaze-orange-500 ring-2 ring-blaze-orange-200 shadow-md" 
          : "border-gray-300 hover:border-gray-400"
      )}
      style={{ 
        backgroundColor: color.hex,
        boxShadow: color.hex === '#FFFFFF' ? 'inset 0 0 0 1px #E5E7EB' : 'none'
      }}
      title={color.displayName}
      aria-label={`Seleccionar color ${color.displayName}`}
    >
      {isSelected && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Check className="w-4 h-4 text-white drop-shadow-md" style={{
            color: color.hex === '#FFFFFF' || color.hex === '#FFFFF0' ? '#000000' : '#FFFFFF'
          }} />
        </div>
      )}
      
      {/* Tooltip con nombre del color */}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
        {color.displayName}
      </div>
    </button>
  );
};

export default AdvancedColorPicker;