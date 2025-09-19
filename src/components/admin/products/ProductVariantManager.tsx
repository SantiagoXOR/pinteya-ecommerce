'use client';

import { useState } from 'react';
import { AdminCard } from '../ui/AdminCard';
import { Plus, X, Edit, Trash2, Palette, Package } from 'lucide-react';
import { cn } from '@/lib/core/utils';

interface ProductVariant {
  name: string;
  options: string[];
}

interface ProductVariantManagerProps {
  variants: ProductVariant[];
  onChange: (variants: ProductVariant[]) => void;
  error?: string;
  className?: string;
}

export function ProductVariantManager({
  variants = [],
  onChange,
  error,
  className
}: ProductVariantManagerProps) {
  const [editingVariant, setEditingVariant] = useState<number | null>(null);
  const [newVariantName, setNewVariantName] = useState('');
  const [newOption, setNewOption] = useState('');

  // Predefined variant types
  const variantTypes = [
    { name: 'Color', icon: Palette, options: ['Blanco', 'Negro', 'Rojo', 'Azul', 'Verde'] },
    { name: 'Tamaño', icon: Package, options: ['XS', 'S', 'M', 'L', 'XL'] },
    { name: 'Material', icon: Package, options: ['Algodón', 'Poliéster', 'Lana', 'Seda'] },
    { name: 'Capacidad', icon: Package, options: ['1L', '4L', '10L', '20L'] },
  ];

  // Add new variant
  const addVariant = (name: string, initialOptions: string[] = []) => {
    const newVariant: ProductVariant = {
      name,
      options: initialOptions,
    };
    onChange([...variants, newVariant]);
    setNewVariantName('');
  };

  // Remove variant
  const removeVariant = (index: number) => {
    const newVariants = variants.filter((_, i) => i !== index);
    onChange(newVariants);
  };

  // Update variant name
  const updateVariantName = (index: number, name: string) => {
    const newVariants = [...variants];
    newVariants[index] = { ...newVariants[index], name };
    onChange(newVariants);
  };

  // Add option to variant
  const addOption = (variantIndex: number, option: string) => {
    if (!option.trim()) {return;}
    
    const newVariants = [...variants];
    const variant = newVariants[variantIndex];
    
    if (!variant.options.includes(option.trim())) {
      variant.options.push(option.trim());
      onChange(newVariants);
    }
    
    setNewOption('');
  };

  // Remove option from variant
  const removeOption = (variantIndex: number, optionIndex: number) => {
    const newVariants = [...variants];
    newVariants[variantIndex].options.splice(optionIndex, 1);
    onChange(newVariants);
  };

  // Generate variant combinations
  const generateCombinations = () => {
    if (variants.length === 0) {return [];}
    
    const combinations: string[][] = [[]];
    
    variants.forEach(variant => {
      const newCombinations: string[][] = [];
      combinations.forEach(combination => {
        variant.options.forEach(option => {
          newCombinations.push([...combination, option]);
        });
      });
      combinations.length = 0;
      combinations.push(...newCombinations);
    });
    
    return combinations;
  };

  const combinations = generateCombinations();

  return (
    <div className={cn("space-y-6", className)}>
      <AdminCard title="Gestión de Variantes" className="p-6">
        <div className="space-y-6">
          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h5 className="text-sm font-medium text-blue-800 mb-2">
              ¿Qué son las variantes?
            </h5>
            <p className="text-xs text-blue-700">
              Las variantes permiten ofrecer el mismo producto en diferentes opciones como color, tamaño, material, etc. 
              Cada combinación de variantes creará un producto único con su propio precio y stock.
            </p>
          </div>

          {/* Quick Add Variants */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">
              Tipos de Variantes Comunes
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {variantTypes.map((type, index) => {
                const Icon = type.icon;
                const exists = variants.some(v => v.name.toLowerCase() === type.name.toLowerCase());
                
                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() => !exists && addVariant(type.name, type.options)}
                    disabled={exists}
                    className={cn(
                      "p-3 border rounded-lg text-left transition-colors",
                      exists 
                        ? "border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed"
                        : "border-gray-300 hover:border-blaze-orange-300 hover:bg-blaze-orange-50"
                    )}
                  >
                    <Icon className="w-5 h-5 mb-2" />
                    <div className="text-sm font-medium">{type.name}</div>
                    <div className="text-xs text-gray-500">
                      {exists ? 'Ya agregado' : `${type.options.length} opciones`}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Variant */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">
              Agregar Variante Personalizada
            </h4>
            <div className="flex space-x-3">
              <input
                type="text"
                value={newVariantName}
                onChange={(e) => setNewVariantName(e.target.value)}
                placeholder="Nombre de la variante (ej: Acabado)"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blaze-orange-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => newVariantName.trim() && addVariant(newVariantName.trim())}
                disabled={!newVariantName.trim()}
                className="px-4 py-2 bg-blaze-orange-600 text-white rounded-lg hover:bg-blaze-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="text-red-600 text-sm">
              {error instanceof Error ? error.message : String(error) || 'Ha ocurrido un error'}
            </div>
          )}

          {/* Existing Variants */}
          {variants.length > 0 && (
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-900">
                Variantes Configuradas ({variants.length})
              </h4>
              
              {variants.map((variant, variantIndex) => (
                <div key={variantIndex} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    {editingVariant === variantIndex ? (
                      <div className="flex items-center space-x-2 flex-1">
                        <input
                          type="text"
                          value={variant.name}
                          onChange={(e) => updateVariantName(variantIndex, e.target.value)}
                          className="flex-1 px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blaze-orange-500"
                        />
                        <button
                          type="button"
                          onClick={() => setEditingVariant(null)}
                          className="text-green-600 hover:text-green-700"
                        >
                          ✓
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <h5 className="font-medium text-gray-900">{variant.name}</h5>
                        <button
                          type="button"
                          onClick={() => setEditingVariant(variantIndex)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                    
                    <button
                      type="button"
                      onClick={() => removeVariant(variantIndex)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Options */}
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {variant.options.map((option, optionIndex) => (
                        <span
                          key={optionIndex}
                          className="inline-flex items-center space-x-1 px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm"
                        >
                          <span>{option}</span>
                          <button
                            type="button"
                            onClick={() => removeOption(variantIndex, optionIndex)}
                            className="text-gray-500 hover:text-red-500"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>

                    {/* Add Option */}
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={newOption}
                        onChange={(e) => setNewOption(e.target.value)}
                        placeholder={`Nueva opción para ${variant.name}`}
                        className="flex-1 px-3 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blaze-orange-500"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            addOption(variantIndex, newOption);
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => addOption(variantIndex, newOption)}
                        disabled={!newOption.trim()}
                        className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50"
                      >
                        Agregar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Variant Combinations Preview */}
          {combinations.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-900">
                Combinaciones Generadas ({combinations.length})
              </h4>
              
              {combinations.length <= 20 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                  {combinations.map((combination, index) => (
                    <div
                      key={index}
                      className="px-3 py-2 bg-gray-50 rounded text-sm text-gray-700"
                    >
                      {combination.join(' / ')}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    Se generarán {combinations.length} combinaciones. 
                    Considera reducir las opciones si es demasiado complejo de gestionar.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Tips */}
          {variants.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-sm">
                No hay variantes configuradas. Agrega variantes si tu producto tiene diferentes opciones.
              </p>
            </div>
          )}
        </div>
      </AdminCard>
    </div>
  );
}









