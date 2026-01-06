'use client'

import * as React from 'react'
import * as SheetPrimitive from '@radix-ui/react-dialog'
import { cva, type VariantProps } from 'class-variance-authority'
import { X } from '@/lib/optimized-imports'

import { cn } from '@/lib/utils'

const Sheet = SheetPrimitive.Root

const SheetTrigger = SheetPrimitive.Trigger

const SheetClose = SheetPrimitive.Close

const SheetPortal = SheetPrimitive.Portal

const SheetOverlay = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Overlay> & { side?: 'top' | 'bottom' | 'left' | 'right' }
>(({ className, side, ...props }, ref) => {
  // ⚡ FASE 11-16: Código de debugging deshabilitado en producción
// Los requests a 127.0.0.1:7242 estaban causando timeouts y bloqueando la carga
  
  // Cuando el sheet es de tipo "bottom", hacer que el overlay no bloquee eventos en el área del bottom bar
  // Usamos estilos inline con !important para sobrescribir el inset-0 de Radix UI
  const overlayStyle = side === 'bottom' 
    ? { 
        top: '0',
        left: '0',
        right: '0',
        bottom: '64px',
        pointerEvents: 'auto' as const
      }
    : undefined;

  // Cuando el sheet es de tipo "bottom", usar pointer-events: none y manejar el cierre manualmente
  // Esto permite que los eventos pasen a través del overlay al bottom bar
  const overlayRef = React.useRef<HTMLDivElement>(null);
  
  React.useEffect(() => {
    if (side === 'bottom' && overlayRef.current) {
      // Agregar listener global para cerrar el modal cuando se hace click fuera del bottom bar
      const handleDocumentClick = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        const bottomNav = document.querySelector('[class*="z-bottom-nav"]') as HTMLElement;
        // Usar el selector correcto de Radix UI para el contenido del sheet
        const sheetContent = document.querySelector('[role="dialog"]') as HTMLElement;
        const isInsideBottomNav = bottomNav && (bottomNav.contains(target) || target.closest('[class*="z-bottom-nav"]'));
        const isInsideSheetContent = sheetContent && sheetContent.contains(target);
        const isBottomNavArea = bottomNav && (e.clientY > window.innerHeight - 80);
        
        // ⚡ FASE 11-16: Código de debugging deshabilitado en producción
// Los requests a 127.0.0.1:7242 estaban causando timeouts y bloqueando la carga
        
        // Si el click es en el área del bottom bar o dentro del bottom nav, NO cerrar el modal
        if (isInsideBottomNav || isBottomNavArea) {
          e.stopPropagation();
          e.preventDefault();
          return;
        }
        
        // Si el click NO es en el bottom bar ni en el contenido del sheet, cerrar el modal
        if (!isInsideSheetContent) {
          const dialogRoot = document.querySelector('[data-radix-dialog-root]');
          if (dialogRoot) {
            // Usar el método onOpenChange de Radix UI para cerrar el modal
            const closeEvent = new CustomEvent('radix-dialog-close');
            dialogRoot.dispatchEvent(closeEvent);
            // También intentar encontrar y hacer click en el botón de cerrar
            const closeButton = dialogRoot.querySelector('[data-radix-dialog-close]') as HTMLElement;
            if (closeButton) {
              closeButton.click();
            }
          }
        }
      };
      
      // Usar capture phase para interceptar antes que otros handlers
      document.addEventListener('click', handleDocumentClick, true);
      return () => {
        document.removeEventListener('click', handleDocumentClick, true);
      };
    }
  }, [side]);

  return (
    <SheetPrimitive.Overlay
      ref={(node) => {
        if (typeof ref === 'function') {
          ref(node);
        } else if (ref) {
          ref.current = node;
        }
        overlayRef.current = node;
      }}
      className={cn(
        'fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
        side === 'bottom' && 'pointer-events-none',
        className
      )}
      style={overlayStyle}
      onPointerDown={handlePointerDown}
      onClick={(e) => {
        // ⚡ FASE 11-16: Código de debugging deshabilitado en producción
// Los requests a 127.0.0.1:7242 estaban causando timeouts y bloqueando la carga
        // Si el overlay tiene pointer-events: none, no hacer nada aquí
        // El cierre se maneja en el listener global
        if (side === 'bottom') {
          e.stopPropagation();
          e.preventDefault();
          return;
        }
        // Para otros tipos de sheet, permitir que Radix UI maneje el cierre normalmente
      }}
      {...props}
    />
  );
})
SheetOverlay.displayName = SheetPrimitive.Overlay.displayName

const sheetVariants = cva(
  'fixed z-50 gap-4 bg-background p-6 shadow-lg transition ease-in-out data-[state=closed]:duration-300 data-[state=open]:duration-500 data-[state=open]:animate-in data-[state=closed]:animate-out',
  {
    variants: {
      side: {
        top: 'inset-x-0 top-0 border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top',
        bottom:
          'inset-x-0 border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom',
        left: 'inset-y-0 left-0 h-full w-3/4 border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:max-w-sm',
        right:
          'inset-y-0 right-0 h-full w-3/4 border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-sm',
      },
    },
    defaultVariants: {
      side: 'right',
    },
  }
)

interface SheetContentProps
  extends React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content>,
    VariantProps<typeof sheetVariants> {}

const SheetContent = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Content>,
  SheetContentProps
>(({ side = 'right', className, children, ...props }, ref) => {
  // Cuando el sheet es de tipo "bottom", usar un overlay personalizado que excluya el área del bottom bar
  const isBottom = side === 'bottom';
  const overlayRef = React.useRef<HTMLDivElement>(null);
  
  const contentRef = React.useRef<HTMLDivElement>(null);
  
  React.useEffect(() => {
    if (isBottom) {
      // ⚡ FASE 5: Usar requestAnimationFrame para agrupar lecturas de geometría
      const timeoutId = setTimeout(() => {
        if (contentRef.current) {
          // ⚡ FASE 5: Agrupar todas las lecturas de geometría en un solo requestAnimationFrame
          requestAnimationFrame(() => {
            if (contentRef.current) {
              // ⚡ FASE 11-16: Código de debugging deshabilitado en producción
// Los requests a 127.0.0.1:7242 estaban causando timeouts y bloqueando la carga
            }
          });
        }
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [isBottom, contentRef.current]);
  
  React.useEffect(() => {
    if (isBottom && contentRef.current) {
      
      // Listener global para manejar clicks cuando el overlay tiene pointer-events: none
      const handleDocumentClick = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        const bottomNav = document.querySelector('[class*="z-bottom-nav"]') as HTMLElement;
        const sheetContent = document.querySelector('[role="dialog"]') as HTMLElement;
        const isInsideBottomNav = bottomNav && (bottomNav.contains(target) || target.closest('[class*="z-bottom-nav"]'));
        const isInsideSheetContent = sheetContent && sheetContent.contains(target);
        const isBottomNavArea = bottomNav && (e.clientY > window.innerHeight - 80);
        
        // ⚡ FASE 11-16: Código de debugging deshabilitado en producción
// Los requests a 127.0.0.1:7242 estaban causando timeouts y bloqueando la carga
        
        // Si el click es en el área del bottom bar o dentro del bottom nav, permitir que el evento pase
        if (isInsideBottomNav || isBottomNavArea) {
          // No hacer nada, permitir que el evento llegue al bottom bar
          return;
        }
        
        // Si el click NO es en el bottom bar ni en el contenido del sheet, cerrar el modal
        if (!isInsideSheetContent && !isInsideBottomNav && !isBottomNavArea) {
          const dialogRoot = document.querySelector('[data-radix-dialog-root]');
          if (dialogRoot) {
            const closeButton = dialogRoot.querySelector('[data-radix-dialog-close]') as HTMLElement;
            if (closeButton) {
              closeButton.click();
            }
          }
        }
      };
      
      // Usar capture phase para interceptar antes que otros handlers
      document.addEventListener('click', handleDocumentClick, true);
      return () => {
        document.removeEventListener('click', handleDocumentClick, true);
      };
    }
  }, [isBottom]);

  return (
    <SheetPortal>
      {isBottom ? (
        // Overlay personalizado que excluye el área del bottom bar (64px)
        // Usar pointer-events: none para que los eventos pasen al bottom bar
        <div
          ref={overlayRef}
          className="fixed bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
          style={{ 
            top: 0,
            left: 0,
            right: 0,
            bottom: '64px',
            pointerEvents: 'none',
            zIndex: 1200
          }}
          data-radix-dialog-overlay
        />
      ) : (
        <SheetOverlay side={side} />
      )}
      <SheetPrimitive.Content 
        ref={(node) => {
          if (typeof ref === 'function') {
            ref(node);
          } else if (ref) {
            ref.current = node;
          }
          contentRef.current = node;
        }} 
        className={cn(sheetVariants({ side }), isBottom && '!bottom-[64px] !max-h-[calc(100vh-64px)]', className)} 
        style={isBottom ? { 
          bottom: '64px',
          maxHeight: 'calc(100vh - 64px)',
          zIndex: 1200
        } : undefined}
        onPointerDown={(e) => {
          if (isBottom) {
            // ⚡ FASE 5: Agrupar lecturas de geometría en requestAnimationFrame
            requestAnimationFrame(() => {
              // ⚡ FASE 11-16: Código de debugging deshabilitado en producción
// Los requests a 127.0.0.1:7242 estaban causando timeouts y bloqueando la carga
              // Si el click es en el área del bottom bar o dentro del bottom nav, NO capturar el evento
              // Permitir que el evento pase al bottom bar
              if (isBottomNavArea || isInsideBottomNav) {
                // No hacer nada, permitir que el evento llegue al bottom bar
                e.stopPropagation();
                e.preventDefault();
                return;
              }
            });
          }
        }}
        onClick={(e) => {
          if (isBottom) {
            // ⚡ FASE 11-16: Código de debugging deshabilitado en producción
// Los requests a 127.0.0.1:7242 estaban causando timeouts y bloqueando la carga
            // Si el click es en el área del bottom bar o dentro del bottom nav, NO capturar el evento
            if (isBottomNavArea || isInsideBottomNav) {
              e.stopPropagation();
              e.preventDefault();
              return;
            }
          }
        }}
        {...props}
      >
        <SheetPrimitive.Close className='absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary'>
          <X className='h-4 w-4 text-gray-900' />
          <span className='sr-only'>Close</span>
        </SheetPrimitive.Close>
        {children}
      </SheetPrimitive.Content>
    </SheetPortal>
  );
})
SheetContent.displayName = SheetPrimitive.Content.displayName

const SheetHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col space-y-2 text-center sm:text-left', className)} {...props} />
)
SheetHeader.displayName = 'SheetHeader'

const SheetFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2', className)}
    {...props}
  />
)
SheetFooter.displayName = 'SheetFooter'

const SheetTitle = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Title>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Title
    ref={ref}
    className={cn('text-lg font-semibold text-foreground', className)}
    {...props}
  />
))
SheetTitle.displayName = SheetPrimitive.Title.displayName

const SheetDescription = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Description>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Description
    ref={ref}
    className={cn('text-sm text-muted-foreground', className)}
    {...props}
  />
))
SheetDescription.displayName = SheetPrimitive.Description.displayName

export {
  Sheet,
  SheetPortal,
  SheetOverlay,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
}
