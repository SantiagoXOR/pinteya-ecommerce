'use client';

import { useState, useRef, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
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
  AlertCircle,
  Loader2,
  Check
} from 'lucide-react';
import { cn } from '@/lib/core/utils';
import { toast } from 'react-hot-toast';

interface ProductImage {
  id?: string;
  url: string;
  alt_text?: string;
  is_primary?: boolean;
  display_order?: number;
  file_size?: number;
  file_type?: string;
}

interface ProductImageManagerEnterpriseProps {
  productId: string;
  images: ProductImage[];
  onChange: (images: ProductImage[]) => void;
  error?: string;
  maxImages?: number;
  className?: string;
}

// API functions
async function uploadImage(productId: string, file: File, altText?: string, isPrimary?: boolean) {
  const formData = new FormData();
  formData.append('file', file);
  if (altText) {formData.append('alt_text', altText);}
  if (isPrimary) {formData.append('is_primary', 'true');}

  const response = await fetch(`/api/admin/products/${productId}/images`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Error al subir imagen');
  }

  return response.json();
}

async function updateImage(productId: string, imageId: string, data: Partial<ProductImage>) {
  const response = await fetch(`/api/admin/products/${productId}/images/${imageId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Error al actualizar imagen');
  }

  return response.json();
}

async function deleteImage(productId: string, imageId: string) {
  const response = await fetch(`/api/admin/products/${productId}/images/${imageId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Error al eliminar imagen');
  }

  return response.json();
}

export function ProductImageManagerEnterprise({
  productId,
  images = [],
  onChange,
  error,
  maxImages = 10,
  className
}: ProductImageManagerEnterpriseProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingAlt, setEditingAlt] = useState('');
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  // Mutations
  const uploadMutation = useMutation({
    mutationFn: ({ file, altText, isPrimary }: { file: File, altText?: string, isPrimary?: boolean }) =>
      uploadImage(productId, file, altText, isPrimary),
    onSuccess: (data) => {
      const newImages = [...images, data.data];
      onChange(newImages);
      queryClient.invalidateQueries({ queryKey: ['admin-product', productId] });
      toast.success('Imagen subida exitosamente');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ imageId, data }: { imageId: string, data: Partial<ProductImage> }) =>
      updateImage(productId, imageId, data),
    onSuccess: (data) => {
      const updatedImages = images.map(img => 
        img.id === data.data.id ? data.data : img
      );
      onChange(updatedImages);
      queryClient.invalidateQueries({ queryKey: ['admin-product', productId] });
      toast.success('Imagen actualizada exitosamente');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (imageId: string) => deleteImage(productId, imageId),
    onSuccess: (_, imageId) => {
      const filteredImages = images.filter(img => img.id !== imageId);
      onChange(filteredImages);
      queryClient.invalidateQueries({ queryKey: ['admin-product', productId] });
      toast.success('Imagen eliminada exitosamente');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Validate file
  const validateFile = (file: File): string | null => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!allowedTypes.includes(file.type)) {
      return 'Tipo de archivo no permitido. Use JPG, PNG o WebP';
    }

    if (file.size > maxSize) {
      return 'El archivo es demasiado grande. Máximo 5MB';
    }

    if (images.length >= maxImages) {
      return `Máximo ${maxImages} imágenes permitidas`;
    }

    return null;
  };

  // Handle file upload
  const handleFileUpload = useCallback(async (files: FileList) => {
    if (files.length === 0) {return;}

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const validationError = validateFile(file);
      
      if (validationError) {
        toast.error(validationError);
        continue;
      }

      const isPrimary = images.length === 0; // First image is primary by default
      uploadMutation.mutate({ file, isPrimary });
    }
  }, [images.length, maxImages, uploadMutation]);

  // Handle drag and drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    handleFileUpload(files);
  }, [handleFileUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  // Handle file input change
  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFileUpload(e.target.files);
    }
  }, [handleFileUpload]);

  // Handle set as primary
  const handleSetPrimary = useCallback((imageId: string) => {
    if (!imageId) {return;}
    updateMutation.mutate({ imageId, data: { is_primary: true } });
  }, [updateMutation]);

  // Handle delete
  const handleDelete = useCallback((imageId: string) => {
    if (!imageId) {return;}
    if (confirm('¿Estás seguro de que quieres eliminar esta imagen?')) {
      deleteMutation.mutate(imageId);
    }
  }, [deleteMutation]);

  // Handle edit alt text
  const handleEditAlt = useCallback((index: number) => {
    setEditingIndex(index);
    setEditingAlt(images[index]?.alt_text || '');
  }, [images]);

  const handleSaveAlt = useCallback(() => {
    if (editingIndex === null) {return;}
    
    const image = images[editingIndex];
    if (!image?.id) {return;}

    updateMutation.mutate({ 
      imageId: image.id, 
      data: { alt_text: editingAlt } 
    });
    
    setEditingIndex(null);
    setEditingAlt('');
  }, [editingIndex, editingAlt, images, updateMutation]);

  const isLoading = uploadMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  return (
    <AdminCard className={cn("p-6", className)}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">
            Imágenes del Producto
          </h3>
          <span className="text-sm text-gray-500">
            {images.length} / {maxImages}
          </span>
        </div>

        {/* Error display */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <span className="text-sm text-red-700">
              {error instanceof Error ? error.message : error?.toString() || 'Error desconocido'}
            </span>
          </div>
        )}

        {/* Upload area */}
        <div
          className={cn(
            "border-2 border-dashed border-gray-300 rounded-lg p-6 text-center transition-colors",
            "hover:border-gray-400 focus:border-blaze-orange-500 focus:ring-2 focus:ring-blaze-orange-200",
            isLoading && "opacity-50 pointer-events-none"
          )}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileInputChange}
            className="hidden"
          />
          
          <div className="space-y-2">
            <Upload className="w-8 h-8 text-gray-400 mx-auto" />
            <div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-blaze-orange-600 hover:text-blaze-orange-500 font-medium"
                disabled={isLoading}
              >
                Subir imágenes
              </button>
              <span className="text-gray-500"> o arrastra y suelta aquí</span>
            </div>
            <p className="text-xs text-gray-500">
              PNG, JPG, WebP hasta 5MB cada una
            </p>
          </div>
        </div>

        {/* Images grid */}
        {images.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((image, index) => (
              <div
                key={image.id || index}
                className="relative group bg-gray-50 rounded-lg overflow-hidden aspect-square"
              >
                {/* Image */}
                <Image
                  src={image.url}
                  alt={image.alt_text || `Imagen ${index + 1}`}
                  fill
                  className="object-cover"
                />

                {/* Primary badge */}
                {image.is_primary && (
                  <div className="absolute top-2 left-2 bg-yellow-500 text-white px-2 py-1 rounded text-xs font-medium">
                    Principal
                  </div>
                )}

                {/* Actions overlay */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-2">
                    {!image.is_primary && (
                      <button
                        onClick={() => image.id && handleSetPrimary(image.id)}
                        className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
                        title="Establecer como principal"
                        disabled={isLoading}
                      >
                        <Star className="w-4 h-4 text-gray-600" />
                      </button>
                    )}
                    
                    <button
                      onClick={() => handleEditAlt(index)}
                      className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
                      title="Editar texto alternativo"
                      disabled={isLoading}
                    >
                      <Edit className="w-4 h-4 text-gray-600" />
                    </button>
                    
                    <button
                      onClick={() => image.id && handleDelete(image.id)}
                      className="p-2 bg-white rounded-full hover:bg-red-100 transition-colors"
                      title="Eliminar imagen"
                      disabled={isLoading}
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                </div>

                {/* Loading overlay */}
                {isLoading && (
                  <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-blaze-orange-600" />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Edit alt text modal */}
        {editingIndex !== null && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h4 className="text-lg font-medium mb-4">Editar Texto Alternativo</h4>
              <input
                type="text"
                value={editingAlt}
                onChange={(e) => setEditingAlt(e.target.value)}
                placeholder="Describe la imagen..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blaze-orange-500 focus:border-transparent"
              />
              <div className="flex gap-2 mt-4">
                <button
                  onClick={handleSaveAlt}
                  className="flex-1 bg-blaze-orange-600 text-white px-4 py-2 rounded-lg hover:bg-blaze-orange-700 transition-colors"
                  disabled={isLoading}
                >
                  Guardar
                </button>
                <button
                  onClick={() => setEditingIndex(null)}
                  className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                  disabled={isLoading}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminCard>
  );
}









