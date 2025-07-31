'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { AdminCard } from '../ui/AdminCard';
import { 
  Upload, 
  X, 
  Star, 
  StarOff, 
  Move, 
  Edit, 
  Trash2, 
  Image as ImageIcon,
  Plus,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProductImage {
  url: string;
  alt?: string;
  is_primary?: boolean;
}

interface ProductImageManagerProps {
  images: ProductImage[];
  onChange: (images: ProductImage[]) => void;
  error?: string;
  maxImages?: number;
  className?: string;
}

export function ProductImageManager({
  images = [],
  onChange,
  error,
  maxImages = 10,
  className
}: ProductImageManagerProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingAlt, setEditingAlt] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file upload
  const handleFileUpload = async (files: FileList) => {
    if (files.length === 0) return;
    
    const remainingSlots = maxImages - images.length;
    const filesToUpload = Array.from(files).slice(0, remainingSlots);
    
    setUploading(true);
    
    try {
      const uploadPromises = filesToUpload.map(async (file) => {
        // TODO: Implement actual file upload to your storage service
        // For now, we'll create a local URL
        const url = URL.createObjectURL(file);
        
        return {
          url,
          alt: file.name.replace(/\.[^/.]+$/, ''), // Remove extension
          is_primary: images.length === 0, // First image is primary
        };
      });
      
      const newImages = await Promise.all(uploadPromises);
      onChange([...images, ...newImages]);
    } catch (error) {
      console.error('Error uploading images:', error);
    } finally {
      setUploading(false);
    }
  };

  // Handle drag and drop
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (draggedIndex === null) return;
    
    const newImages = [...images];
    const draggedImage = newImages[draggedIndex];
    
    // Remove dragged item
    newImages.splice(draggedIndex, 1);
    
    // Insert at new position
    newImages.splice(dropIndex, 0, draggedImage);
    
    onChange(newImages);
    setDraggedIndex(null);
  };

  // Set primary image
  const setPrimaryImage = (index: number) => {
    const newImages = images.map((img, i) => ({
      ...img,
      is_primary: i === index,
    }));
    onChange(newImages);
  };

  // Remove image
  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    
    // If we removed the primary image, make the first one primary
    if (images[index].is_primary && newImages.length > 0) {
      newImages[0].is_primary = true;
    }
    
    onChange(newImages);
  };

  // Edit alt text
  const startEditingAlt = (index: number) => {
    setEditingIndex(index);
    setEditingAlt(images[index].alt || '');
  };

  const saveAltText = () => {
    if (editingIndex === null) return;
    
    const newImages = [...images];
    newImages[editingIndex] = {
      ...newImages[editingIndex],
      alt: editingAlt,
    };
    
    onChange(newImages);
    setEditingIndex(null);
    setEditingAlt('');
  };

  const cancelEditingAlt = () => {
    setEditingIndex(null);
    setEditingAlt('');
  };

  return (
    <div className={cn("space-y-6", className)}>
      <AdminCard title="Gestión de Imágenes" className="p-6">
        <div className="space-y-6">
          {/* Upload Area */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
            <div className="text-center">
              <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
              <div className="mt-4">
                <label htmlFor="file-upload" className="cursor-pointer">
                  <span className="mt-2 block text-sm font-medium text-gray-900">
                    Arrastra imágenes aquí o{' '}
                    <span className="text-blaze-orange-600 hover:text-blaze-orange-500">
                      selecciona archivos
                    </span>
                  </span>
                </label>
                <input
                  ref={fileInputRef}
                  id="file-upload"
                  name="file-upload"
                  type="file"
                  className="sr-only"
                  multiple
                  accept="image/*"
                  onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                PNG, JPG, GIF hasta 10MB. Máximo {maxImages} imágenes.
              </p>
              
              {images.length >= maxImages && (
                <div className="mt-3 flex items-center justify-center space-x-2 text-yellow-600">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">Límite de imágenes alcanzado</span>
                </div>
              )}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="text-red-600 text-sm">{error}</div>
          )}

          {/* Images Grid */}
          {images.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-gray-900">
                  Imágenes del Producto ({images.length}/{maxImages})
                </h4>
                <p className="text-xs text-gray-500">
                  Arrastra para reordenar
                </p>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {images.map((image, index) => (
                  <div
                    key={index}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, index)}
                    className={cn(
                      "relative group border-2 rounded-lg overflow-hidden cursor-move transition-all",
                      image.is_primary 
                        ? "border-blaze-orange-500 ring-2 ring-blaze-orange-200" 
                        : "border-gray-200 hover:border-gray-300",
                      draggedIndex === index && "opacity-50"
                    )}
                  >
                    {/* Image */}
                    <div className="aspect-square relative">
                      <Image
                        src={image.url}
                        alt={image.alt || `Imagen ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                      
                      {/* Primary Badge */}
                      {image.is_primary && (
                        <div className="absolute top-2 left-2 bg-blaze-orange-600 text-white text-xs px-2 py-1 rounded">
                          Principal
                        </div>
                      )}
                      
                      {/* Actions Overlay */}
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <div className="flex space-x-2">
                          {/* Set Primary */}
                          <button
                            type="button"
                            onClick={() => setPrimaryImage(index)}
                            className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
                            title={image.is_primary ? "Es imagen principal" : "Establecer como principal"}
                          >
                            {image.is_primary ? (
                              <Star className="w-4 h-4 text-yellow-500 fill-current" />
                            ) : (
                              <StarOff className="w-4 h-4 text-gray-600" />
                            )}
                          </button>
                          
                          {/* Edit Alt */}
                          <button
                            type="button"
                            onClick={() => startEditingAlt(index)}
                            className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
                            title="Editar texto alternativo"
                          >
                            <Edit className="w-4 h-4 text-gray-600" />
                          </button>
                          
                          {/* Remove */}
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="p-2 bg-white rounded-full hover:bg-red-100 transition-colors"
                            title="Eliminar imagen"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    {/* Alt Text */}
                    <div className="p-2 bg-white">
                      {editingIndex === index ? (
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={editingAlt}
                            onChange={(e) => setEditingAlt(e.target.value)}
                            className="w-full text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blaze-orange-500"
                            placeholder="Texto alternativo"
                          />
                          <div className="flex space-x-1">
                            <button
                              type="button"
                              onClick={saveAltText}
                              className="flex-1 text-xs bg-blaze-orange-600 text-white px-2 py-1 rounded hover:bg-blaze-orange-700"
                            >
                              Guardar
                            </button>
                            <button
                              type="button"
                              onClick={cancelEditingAlt}
                              className="flex-1 text-xs bg-gray-300 text-gray-700 px-2 py-1 rounded hover:bg-gray-400"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-gray-600 truncate">
                          {image.alt || 'Sin texto alternativo'}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
                
                {/* Add More Button */}
                {images.length < maxImages && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center hover:border-blaze-orange-400 hover:bg-blaze-orange-50 transition-colors"
                  >
                    <Plus className="w-8 h-8 text-gray-400" />
                    <span className="text-xs text-gray-500 mt-2">Agregar más</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Upload Progress */}
          {uploading && (
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blaze-orange-600"></div>
              <span>Subiendo imágenes...</span>
            </div>
          )}

          {/* Tips */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h5 className="text-sm font-medium text-blue-800 mb-2">
              Consejos para mejores imágenes:
            </h5>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• Usa imágenes de alta calidad (mínimo 800x800px)</li>
              <li>• La primera imagen será la imagen principal del producto</li>
              <li>• Incluye diferentes ángulos y detalles del producto</li>
              <li>• Agrega texto alternativo para mejorar la accesibilidad</li>
              <li>• Arrastra las imágenes para cambiar el orden</li>
            </ul>
          </div>
        </div>
      </AdminCard>
    </div>
  );
}
