"use client";

import Image from "next/image";
import { useState } from "react";

interface OptimizedCartIconProps {
  width?: number;
  height?: number;
  className?: string;
  alt?: string;
}

export const OptimizedCartIcon = ({
  width = 32,
  height = 32,
  className = "w-8 h-8",
  alt = "Carrito"
}: OptimizedCartIconProps) => {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  const handleImageError = () => {
    setImageError(true);
    setIsLoading(false);
  };

  // Fallback SVG si las imágenes fallan
  if (imageError) {
    return (
      <svg 
        width={width} 
        height={height} 
        className={className}
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="#ea5a17" 
        strokeWidth="2"
        strokeLinecap="round" 
        strokeLinejoin="round"
      >
        <circle cx="9" cy="21" r="1"></circle>
        <circle cx="20" cy="21" r="1"></circle>
        <path d="m1 1 4 4 2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
      </svg>
    );
  }

  return (
    <div className="relative">
      {/* Skeleton loader */}
      {isLoading && (
        <div 
          className={`${className} bg-orange-200 animate-pulse rounded`}
          style={{ width, height }}
        />
      )}
      
      {/* Imagen optimizada con soporte WebP */}
      <picture>
        <source 
          srcSet="/images/categories/carrito.webp" 
          type="image/webp" 
        />
        <Image
          src="/images/categories/carrito.png"
          alt={alt}
          width={width}
          height={height}
          className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-200`}
          onLoad={handleImageLoad}
          onError={handleImageError}
          sizes={`${width}px`}
        />
      </picture>
    </div>
  );
};









