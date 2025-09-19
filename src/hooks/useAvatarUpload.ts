'use client';

import { useState, useCallback } from 'react';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

interface UseAvatarUploadReturn {
  uploading: boolean;
  progress: number;
  error: string | null;
  preview: string | null;
  uploadAvatar: (file: File) => Promise<string | null>;
  deleteAvatar: () => Promise<boolean>;
  validateFile: (file: File) => { valid: boolean; error?: string };
  generatePreview: (file: File) => void;
  clearPreview: () => void;
}

// Configuración de validación de archivos
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_DIMENSIONS = { width: 2048, height: 2048 };

export function useAvatarUpload(): UseAvatarUploadReturn {
  const { isSignedIn } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  // Función para validar archivos
  const validateFile = useCallback((file: File): { valid: boolean; error?: string } => {
    // Verificar tipo de archivo
    if (!ALLOWED_TYPES.includes(file.type)) {
      return {
        valid: false,
        error: 'Tipo de archivo no permitido. Solo se permiten imágenes JPG, PNG y WebP.',
      };
    }

    // Verificar tamaño
    if (file.size > MAX_FILE_SIZE) {
      return {
        valid: false,
        error: 'El archivo es demasiado grande. El tamaño máximo es 5MB.',
      };
    }

    return { valid: true };
  }, []);

  // Función para generar preview
  const generatePreview = useCallback((file: File) => {
    const validation = validateFile(file);
    if (!validation.valid) {
      setError(validation.error || 'Archivo no válido');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setPreview(e.target.result as string);
        setError(null);
      }
    };
    reader.onerror = () => {
      setError('Error al leer el archivo');
    };
    reader.readAsDataURL(file);
  }, [validateFile]);

  // Función para limpiar preview
  const clearPreview = useCallback(() => {
    setPreview(null);
    setError(null);
    setProgress(0);
  }, []);

  // Función para validar dimensiones de imagen
  const validateImageDimensions = useCallback((file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const isValid = img.width <= MAX_DIMENSIONS.width && img.height <= MAX_DIMENSIONS.height;
        if (!isValid) {
          setError(`Las dimensiones máximas permitidas son ${MAX_DIMENSIONS.width}x${MAX_DIMENSIONS.height}px`);
        }
        resolve(isValid);
      };
      img.onerror = () => {
        setError('Error al validar las dimensiones de la imagen');
        resolve(false);
      };
      img.src = URL.createObjectURL(file);
    });
  }, []);

  // Función para subir avatar
  const uploadAvatar = useCallback(async (file: File): Promise<string | null> => {
    if (!isSignedIn) {
      toast.error('Debes estar autenticado para subir un avatar');
      return null;
    }

    // Validar archivo
    const validation = validateFile(file);
    if (!validation.valid) {
      setError(validation.error || 'Archivo no válido');
      toast.error(validation.error || 'Archivo no válido');
      return null;
    }

    // Validar dimensiones
    const dimensionsValid = await validateImageDimensions(file);
    if (!dimensionsValid) {
      toast.error('Las dimensiones de la imagen no son válidas');
      return null;
    }

    try {
      setUploading(true);
      setError(null);
      setProgress(0);

      const formData = new FormData();
      formData.append('avatar', file);

      // Simular progreso de subida
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 100);

      const response = await fetch('/api/user/avatar', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (!response.ok) {
        throw new Error('Error al subir el avatar');
      }

      const result = await response.json();
      
      if (result.success && result.avatar_url) {
        toast.success('Avatar subido correctamente');
        clearPreview();
        return result.avatar_url;
      } else {
        throw new Error(result.error || 'Error al subir el avatar');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Error al subir avatar:', err);
      return null;
    } finally {
      setUploading(false);
      setProgress(0);
    }
  }, [isSignedIn, validateFile, validateImageDimensions, clearPreview]);

  // Función para eliminar avatar
  const deleteAvatar = useCallback(async (): Promise<boolean> => {
    if (!isSignedIn) {
      toast.error('Debes estar autenticado para eliminar tu avatar');
      return false;
    }

    try {
      setUploading(true);
      setError(null);

      const response = await fetch('/api/user/avatar', {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Error al eliminar el avatar');
      }

      const result = await response.json();
      
      if (result.success) {
        toast.success('Avatar eliminado correctamente');
        clearPreview();
        return true;
      } else {
        throw new Error(result.error || 'Error al eliminar el avatar');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Error al eliminar avatar:', err);
      return false;
    } finally {
      setUploading(false);
    }
  }, [isSignedIn, clearPreview]);

  return {
    uploading,
    progress,
    error,
    preview,
    uploadAvatar,
    deleteAvatar,
    validateFile,
    generatePreview,
    clearPreview,
  };
}









