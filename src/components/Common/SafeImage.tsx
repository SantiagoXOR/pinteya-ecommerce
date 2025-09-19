import React from 'react';
import Image from 'next/image';

interface SafeImageProps {
  src?: string | null;
  alt: string;
  width: number;
  height: number;
  className?: string;
  fallbackText?: string;
  fallbackClassName?: string;
}

/**
 * Componente SafeImage que maneja imágenes de manera segura
 * Muestra un placeholder cuando la imagen no está disponible
 */
const SafeImage: React.FC<SafeImageProps> = ({
  src,
  alt,
  width,
  height,
  className = '',
  fallbackText = 'No Image',
  fallbackClassName = ''
}) => {
  // Si no hay src o es una cadena vacía, mostrar fallback
  if (!src || src.trim() === '') {
    return (
      <div 
        className={`bg-gray-200 flex items-center justify-center rounded ${fallbackClassName}`}
        style={{ width: `${width}px`, height: `${height}px` }}
      >
        <span className="text-gray-400 text-xs text-center px-2">
          {fallbackText}
        </span>
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
    />
  );
};

export default SafeImage;









