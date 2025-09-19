'use client';

import React, { useEffect, useRef } from 'react';
import { X, ChevronLeft, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/core/utils';
import { useModal, ModalType } from '@/contexts/ModalContext';

interface MobileModalOverlayProps {
  children: React.ReactNode;
  title?: string;
  type: ModalType;
  size?: 'small' | 'medium' | 'large' | 'fullscreen';
  position?: 'bottom' | 'center' | 'top';
  showBackButton?: boolean;
  showCloseButton?: boolean;
  allowSwipeDown?: boolean;
  className?: string;
}

export function MobileModalOverlay({
  children,
  title,
  type,
  size = 'medium',
  position = 'bottom',
  showBackButton = true,
  showCloseButton = true,
  allowSwipeDown = true,
  className
}: MobileModalOverlayProps) {
  const { modalState, closeModal, goBack, canGoBack } = useModal();
  const modalRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef<number>(0);
  const currentYRef = useRef<number>(0);
  const isDraggingRef = useRef<boolean>(false);

  const isActive = modalState.activeModal === type;
  const isTransitioning = modalState.isTransitioning;

  // Configuraciones de tamaño
  const sizeClasses = {
    small: 'max-h-[40vh]',
    medium: 'max-h-[60vh]',
    large: 'max-h-[80vh]',
    fullscreen: 'h-full max-h-full'
  };

  // Configuraciones de posición
  const positionClasses = {
    bottom: 'bottom-0 rounded-t-2xl',
    center: 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-2xl',
    top: 'top-0 rounded-b-2xl'
  };

  // Manejar gestos de swipe para cerrar (solo en mobile)
  useEffect(() => {
    if (!allowSwipeDown || !isActive || position !== 'bottom') return;

    const modal = modalRef.current;
    if (!modal) return;

    const handleTouchStart = (e: TouchEvent) => {
      startYRef.current = e.touches[0].clientY;
      isDraggingRef.current = true;
      modal.style.transition = 'none';
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDraggingRef.current) return;

      currentYRef.current = e.touches[0].clientY;
      const deltaY = currentYRef.current - startYRef.current;

      // Solo permitir arrastrar hacia abajo
      if (deltaY > 0) {
        modal.style.transform = `translateY(${deltaY}px)`;
      }
    };

    const handleTouchEnd = () => {
      if (!isDraggingRef.current) return;

      const deltaY = currentYRef.current - startYRef.current;
      modal.style.transition = 'transform 0.3s ease-out';

      // Si se arrastró más de 100px hacia abajo, cerrar modal
      if (deltaY > 100) {
        closeModal();
      } else {
        // Volver a la posición original
        modal.style.transform = 'translateY(0)';
      }

      isDraggingRef.current = false;
    };

    modal.addEventListener('touchstart', handleTouchStart, { passive: true });
    modal.addEventListener('touchmove', handleTouchMove, { passive: true });
    modal.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      modal.removeEventListener('touchstart', handleTouchStart);
      modal.removeEventListener('touchmove', handleTouchMove);
      modal.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isActive, allowSwipeDown, position, closeModal]);

  // Manejar click en backdrop
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      closeModal();
    }
  };

  if (!isActive) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-end justify-center",
        "bg-black/50 backdrop-blur-sm",
        "transition-opacity duration-300",
        isTransitioning ? "opacity-0" : "opacity-100",
        position === 'center' && "items-center",
        position === 'top' && "items-start"
      )}
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        className={cn(
          "w-full bg-white shadow-2xl",
          "transform transition-transform duration-300 ease-out",
          "overflow-hidden",
          sizeClasses[size],
          positionClasses[position],
          isTransitioning ? "translate-y-full" : "translate-y-0",
          position === 'center' && (isTransitioning ? "scale-95 opacity-0" : "scale-100 opacity-100"),
          position === 'top' && (isTransitioning ? "-translate-y-full" : "translate-y-0"),
          // Responsive adjustments
          "md:max-w-lg md:mx-auto",
          position === 'bottom' && "md:rounded-2xl md:mb-4",
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle para swipe (solo en mobile y position bottom) */}
        {allowSwipeDown && position === 'bottom' && (
          <div className="flex justify-center pt-2 pb-1 md:hidden">
            <div className="w-8 h-1 bg-gray-300 rounded-full" />
          </div>
        )}

        {/* Header */}
        {(title || showBackButton || showCloseButton) && (
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              {showBackButton && canGoBack && (
                <button
                  onClick={goBack}
                  className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                  aria-label="Volver"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-600" />
                </button>
              )}
              {title && (
                <h2 className="text-lg font-semibold text-gray-900 truncate">
                  {title}
                </h2>
              )}
            </div>

            {showCloseButton && (
              <button
                onClick={closeModal}
                className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Cerrar"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}

// Componente específico para modales de navegación
export function NavigationModalOverlay({
  children,
  title,
  type,
  className,
  ...props
}: Omit<MobileModalOverlayProps, 'size' | 'position'>) {
  return (
    <MobileModalOverlay
      {...props}
      type={type}
      title={title}
      size="large"
      position="bottom"
      className={cn("md:max-w-2xl", className)}
    >
      {children}
    </MobileModalOverlay>
  );
}

// Componente específico para modales de información
export function InfoModalOverlay({
  children,
  title,
  type,
  className,
  ...props
}: Omit<MobileModalOverlayProps, 'size' | 'position'>) {
  return (
    <MobileModalOverlay
      {...props}
      type={type}
      title={title}
      size="medium"
      position="center"
      className={cn("md:max-w-md", className)}
    >
      {children}
    </MobileModalOverlay>
  );
}

// Componente específico para modales de pantalla completa
export function FullscreenModalOverlay({
  children,
  title,
  type,
  className,
  ...props
}: Omit<MobileModalOverlayProps, 'size' | 'position'>) {
  return (
    <MobileModalOverlay
      {...props}
      type={type}
      title={title}
      size="fullscreen"
      position="center"
      allowSwipeDown={false}
      className={cn("md:max-w-4xl md:max-h-[90vh]", className)}
    >
      {children}
    </MobileModalOverlay>
  );
}









