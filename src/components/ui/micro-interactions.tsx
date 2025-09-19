"use client";

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/core/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Heart, ShoppingCart, Star, Zap } from 'lucide-react';

// ===================================
// MICRO-INTERACCIONES - PINTEYA E-COMMERCE
// ===================================

interface AnimatedButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'cart';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  success?: boolean;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}

interface FloatingActionProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'success' | 'warning';
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  className?: string;
}

interface PulseIndicatorProps {
  active?: boolean;
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  className?: string;
}

// ===================================
// BOTÓN ANIMADO CON ESTADOS
// ===================================

export const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  success = false,
  onClick,
  className,
  disabled = false
}) => {
  const [isPressed, setIsPressed] = useState(false);

  const variants = {
    primary: 'bg-blaze-orange-600 hover:bg-blaze-orange-700 text-white',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-800',
    success: 'bg-fun-green-600 hover:bg-fun-green-700 text-white',
    cart: 'bg-bright-sun-400 hover:bg-bright-sun-500 text-gray-900'
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  return (
    <motion.button
      className={cn(
        'relative overflow-hidden rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2',
        variants[variant],
        sizes[size],
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      whileHover={!disabled ? { scale: 1.02 } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      onClick={onClick}
      disabled={disabled || loading}
    >
      {/* Efecto de ondas */}
      <AnimatePresence>
        {isPressed && (
          <motion.div
            className="absolute inset-0 bg-white/20 rounded-full"
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: 4, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
          />
        )}
      </AnimatePresence>

      {/* Contenido del botón */}
      <div className="relative flex items-center justify-center gap-2">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex items-center gap-2"
            >
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              Cargando...
            </motion.div>
          ) : success ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              ¡Agregado!
            </motion.div>
          ) : (
            <motion.div
              key="default"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              {children}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.button>
  );
};

// ===================================
// ACCIÓN FLOTANTE ANIMADA
// ===================================

export const FloatingAction: React.FC<FloatingActionProps> = ({
  icon,
  label,
  onClick,
  variant = 'primary',
  position = 'bottom-right',
  className
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const variants = {
    primary: 'bg-blaze-orange-600 hover:bg-blaze-orange-700 text-white',
    secondary: 'bg-gray-600 hover:bg-gray-700 text-white',
    success: 'bg-fun-green-600 hover:bg-fun-green-700 text-white',
    warning: 'bg-bright-sun-500 hover:bg-bright-sun-600 text-gray-900'
  };

  const positions = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'top-right': 'top-6 right-6',
    'top-left': 'top-6 left-6'
  };

  return (
    <motion.div
      className={cn(
        'fixed z-50 flex items-center gap-3',
        positions[position],
        className
      )}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.05 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      {/* Label animado */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, x: position.includes('right') ? 20 : -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: position.includes('right') ? 20 : -20 }}
            className="bg-gray-900 text-white px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap shadow-lg"
          >
            {label}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Botón principal */}
      <motion.button
        className={cn(
          'w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2',
          variants[variant]
        )}
        whileTap={{ scale: 0.9 }}
        onClick={onClick}
      >
        {icon}
      </motion.button>
    </motion.div>
  );
};

// ===================================
// INDICADOR DE PULSO
// ===================================

export const PulseIndicator: React.FC<PulseIndicatorProps> = ({
  active = true,
  size = 'md',
  color = 'primary',
  className
}) => {
  const sizes = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  };

  const colors = {
    primary: 'bg-blaze-orange-600',
    secondary: 'bg-gray-600',
    success: 'bg-fun-green-600',
    warning: 'bg-bright-sun-500',
    error: 'bg-red-600'
  };

  if (!active) {return null;}

  return (
    <div className={cn('relative flex items-center justify-center', className)}>
      {/* Círculo principal */}
      <div className={cn('rounded-full', sizes[size], colors[color])} />
      
      {/* Ondas de pulso */}
      <div className={cn(
        'absolute rounded-full animate-ping',
        sizes[size],
        colors[color],
        'opacity-75'
      )} />
      <div 
        className={cn(
          'absolute rounded-full animate-ping',
          sizes[size],
          colors[color],
          'opacity-50'
        )}
        style={{ animationDelay: '0.5s' }}
      />
    </div>
  );
};

// ===================================
// CONTADOR ANIMADO
// ===================================

export const AnimatedCounter: React.FC<{
  value: number;
  duration?: number;
  className?: string;
}> = ({ value, duration = 1000, className }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) {startTime = timestamp;}
      const progress = Math.min((timestamp - startTime) / duration, 1);
      
      setDisplayValue(Math.floor(progress * value));
      
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [value, duration]);

  return (
    <motion.span
      className={className}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      key={value}
    >
      {displayValue.toLocaleString()}
    </motion.span>
  );
};

// ===================================
// RATING INTERACTIVO
// ===================================

export const InteractiveRating: React.FC<{
  value: number;
  onChange?: (value: number) => void;
  readonly?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}> = ({ 
  value, 
  onChange, 
  readonly = false, 
  size = 'md',
  className 
}) => {
  const [hoverValue, setHoverValue] = useState(0);

  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  return (
    <div className={cn('flex items-center gap-1', className)}>
      {Array.from({ length: 5 }).map((_, i) => {
        const starValue = i + 1;
        const isActive = (hoverValue || value) >= starValue;

        return (
          <motion.button
            key={i}
            className={cn(
              'transition-colors duration-200 focus:outline-none',
              readonly && 'cursor-default'
            )}
            whileHover={!readonly ? { scale: 1.1 } : {}}
            whileTap={!readonly ? { scale: 0.9 } : {}}
            onMouseEnter={() => !readonly && setHoverValue(starValue)}
            onMouseLeave={() => !readonly && setHoverValue(0)}
            onClick={() => !readonly && onChange?.(starValue)}
            disabled={readonly}
          >
            <Star
              className={cn(
                sizes[size],
                isActive 
                  ? 'text-bright-sun-400 fill-current' 
                  : 'text-gray-300'
              )}
            />
          </motion.button>
        );
      })}
    </div>
  );
};









