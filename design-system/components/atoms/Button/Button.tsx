/**
 * 🔘 Pinteya Design System - Button Component
 * 
 * Componente Button optimizado para e-commerce de pinturería
 * Variantes específicas para diferentes acciones de compra
 */

import React, { forwardRef } from 'react';
import { cn } from '@/lib/core/utils';
import { colors } from '../../../tokens/colors';
import { spacing } from '../../../tokens/spacing';
import { ecommerceTypography } from '../../../tokens/typography';

// 🎯 Tipos y Interfaces
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Variante visual del botón */
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'success';
  
  /** Tamaño del botón */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  
  /** Ancho completo */
  fullWidth?: boolean;
  
  /** Estado de carga */
  loading?: boolean;
  
  /** Icono al inicio */
  startIcon?: React.ReactNode;
  
  /** Icono al final */
  endIcon?: React.ReactNode;
  
  /** Solo icono (sin texto) */
  iconOnly?: boolean;
  
  /** Texto del botón */
  children?: React.ReactNode;
  
  /** Clase CSS adicional */
  className?: string;
}

// 🎨 Estilos Base
const buttonBaseStyles = `
  inline-flex items-center justify-center
  font-medium rounded-lg
  transition-all duration-200 ease-in-out
  focus:outline-none focus:ring-2 focus:ring-offset-2
  disabled:opacity-50 disabled:cursor-not-allowed
  active:scale-95
  select-none
`;

// 🎨 Variantes de Color
const buttonVariants = {
  primary: `
    bg-[${colors.primary[500]}] text-white
    hover:bg-[${colors.primary[600]}] 
    focus:ring-[${colors.primary[500]}]
    shadow-sm hover:shadow-md
  `,
  
  secondary: `
    bg-[${colors.secondary[500]}] text-white
    hover:bg-[${colors.secondary[600]}]
    focus:ring-[${colors.secondary[500]}]
    shadow-sm hover:shadow-md
  `,
  
  outline: `
    bg-transparent border-2 border-[${colors.primary[500]}]
    text-[${colors.primary[500]}]
    hover:bg-[${colors.primary[500]}] hover:text-white
    focus:ring-[${colors.primary[500]}]
  `,
  
  ghost: `
    bg-transparent text-[${colors.text.primary}]
    hover:bg-[${colors.neutral[100]}]
    focus:ring-[${colors.primary[500]}]
  `,
  
  destructive: `
    bg-[${colors.error[500]}] text-white
    hover:bg-[${colors.error[600]}]
    focus:ring-[${colors.error[500]}]
    shadow-sm hover:shadow-md
  `,
  
  success: `
    bg-[${colors.success[500]}] text-white
    hover:bg-[${colors.success[600]}]
    focus:ring-[${colors.success[500]}]
    shadow-sm hover:shadow-md
  `,
};

// 📏 Tamaños
const buttonSizes = {
  sm: `
    h-8 px-3 text-sm
    gap-1.5
  `,
  
  md: `
    h-10 px-4 text-base
    gap-2
  `,
  
  lg: `
    h-12 px-6 text-lg
    gap-2.5
  `,
  
  xl: `
    h-14 px-8 text-xl
    gap-3
  `,
};

// 🎯 Tamaños para iconOnly
const iconOnlySizes = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-12 w-12',
  xl: 'h-14 w-14',
};

// 🔄 Spinner de Loading
const LoadingSpinner = ({ size }: { size: 'sm' | 'md' | 'lg' | 'xl' }) => {
  const spinnerSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
    xl: 'w-6 h-6',
  };

  return (
    <svg
      className={cn('animate-spin', spinnerSizes[size])}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
};

// 🔘 Componente Button
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      loading = false,
      startIcon,
      endIcon,
      iconOnly = false,
      children,
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    // 🎨 Construcción de clases CSS
    const buttonClasses = cn(
      buttonBaseStyles,
      buttonVariants[variant],
      iconOnly ? iconOnlySizes[size] : buttonSizes[size],
      fullWidth && 'w-full',
      loading && 'cursor-wait',
      className
    );

    // 🔄 Contenido del botón
    const buttonContent = (
      <>
        {loading && <LoadingSpinner size={size} />}
        {!loading && startIcon && (
          <span className="flex-shrink-0">{startIcon}</span>
        )}
        {!iconOnly && children && (
          <span className={loading ? 'opacity-0' : ''}>{children}</span>
        )}
        {!loading && endIcon && (
          <span className="flex-shrink-0">{endIcon}</span>
        )}
      </>
    );

    return (
      <button
        ref={ref}
        className={buttonClasses}
        disabled={disabled || loading}
        {...props}
      >
        {buttonContent}
      </button>
    );
  }
);

Button.displayName = 'Button';

// 🛒 Variantes Específicas E-commerce
export const AddToCartButton = forwardRef<HTMLButtonElement, Omit<ButtonProps, 'variant'>>(
  (props, ref) => (
    <Button ref={ref} variant="primary" {...props}>
      {props.children || 'Agregar al carrito'}
    </Button>
  )
);

export const BuyNowButton = forwardRef<HTMLButtonElement, Omit<ButtonProps, 'variant'>>(
  (props, ref) => (
    <Button ref={ref} variant="secondary" {...props}>
      {props.children || 'Comprar ahora'}
    </Button>
  )
);

export const WishlistButton = forwardRef<HTMLButtonElement, Omit<ButtonProps, 'variant' | 'iconOnly'>>(
  (props, ref) => (
    <Button ref={ref} variant="ghost" iconOnly {...props}>
      {props.children || '♡'}
    </Button>
  )
);

AddToCartButton.displayName = 'AddToCartButton';
BuyNowButton.displayName = 'BuyNowButton';
WishlistButton.displayName = 'WishlistButton';
