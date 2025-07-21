/**
 * Componente optimizado para el logo de Pinteya
 * Incluye fallbacks automáticos y optimización de performance
 */

import React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { 
  pinteyaMobileLogoProps, 
  pinteyaDesktopLogoProps, 
  pinteyaHeroLogoProps,
  pinteyaMobileLogoPngProps,
  pinteyaDesktopLogoPngProps
} from '@/utils/imageOptimization';

export type LogoVariant = 'mobile' | 'desktop' | 'hero';
export type LogoFormat = 'webp' | 'png' | 'auto';

interface OptimizedLogoProps {
  variant?: LogoVariant;
  format?: LogoFormat;
  className?: string;
  onClick?: () => void;
  'data-testid'?: string;
}

/**
 * Obtiene las props del logo según la variante
 */
const getLogoProps = (variant: LogoVariant, format: LogoFormat) => {
  const baseProps = {
    mobile: format === 'png' ? pinteyaMobileLogoPngProps : pinteyaMobileLogoProps,
    desktop: format === 'png' ? pinteyaDesktopLogoPngProps : pinteyaDesktopLogoProps,
    hero: pinteyaHeroLogoProps
  };

  return baseProps[variant];
};

/**
 * Componente de logo optimizado con fallbacks automáticos
 */
export const OptimizedLogo: React.FC<OptimizedLogoProps> = ({
  variant = 'desktop',
  format = 'auto',
  className,
  onClick,
  'data-testid': testId
}) => {
  const logoProps = getLogoProps(variant, format);
  
  // Clases base según la variante
  const baseClasses = {
    mobile: 'h-16 w-16 group-hover:scale-105 group-active:scale-95 transition-all duration-200',
    desktop: 'h-10 w-auto group-hover:scale-105 transition-transform duration-200',
    hero: 'h-20 w-auto'
  };

  const combinedClassName = cn(
    baseClasses[variant],
    logoProps.className,
    className
  );

  return (
    <Image
      {...logoProps}
      className={combinedClassName}
      onClick={onClick}
      data-testid={testId}
      // Fallback automático para WebP
      onError={(e) => {
        const target = e.target as HTMLImageElement;
        if (target.src.includes('.webp')) {
          // Cambiar a PNG si WebP falla
          const pngSrc = target.src.replace('.webp', '.png');
          target.src = pngSrc;
        }
      }}
    />
  );
};

/**
 * Componente específico para el logo del header
 */
export const HeaderLogo: React.FC<{
  isMobile?: boolean;
  className?: string;
  onClick?: () => void;
}> = ({ isMobile = false, className, onClick }) => {
  return (
    <OptimizedLogo
      variant={isMobile ? 'mobile' : 'desktop'}
      format="auto"
      className={className}
      onClick={onClick}
      data-testid={isMobile ? 'mobile-logo' : 'desktop-logo'}
    />
  );
};

/**
 * Componente para el logo en secciones hero
 */
export const HeroLogo: React.FC<{
  className?: string;
  onClick?: () => void;
}> = ({ className, onClick }) => {
  return (
    <OptimizedLogo
      variant="hero"
      format="auto"
      className={className}
      onClick={onClick}
      data-testid="hero-logo"
    />
  );
};

export default OptimizedLogo;
