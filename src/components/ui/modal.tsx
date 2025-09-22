"use client"

import * as React from "react"
import { X, ShoppingCart, Heart, Eye, AlertTriangle, CheckCircle, Info } from "lucide-react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import * as VisuallyHidden from "@radix-ui/react-visually-hidden"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./alert-dialog"

// Modal básico para contenido general
export interface ModalProps {
  children: React.ReactNode
  trigger?: React.ReactNode
  title?: string
  description?: string
  size?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "full"
  variant?: "default" | "elevated" | "fullscreen"
  showCloseButton?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
  className?: string
}

export function Modal({
  children,
  trigger,
  title,
  description,
  size = "md",
  variant = "default",
  showCloseButton = true,
  open,
  onOpenChange,
  className,
}: ModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent
        size={size}
        variant={variant}
        showCloseButton={showCloseButton}
        className={className}
      >
        {(title || description) && (
          <DialogHeader>
            {title && <DialogTitle>{title}</DialogTitle>}
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>
        )}
        {children}
      </DialogContent>
    </Dialog>
  )
}

// Modal de confirmación con variantes semánticas
export interface ConfirmModalProps {
  children?: React.ReactNode
  trigger?: React.ReactNode
  title: string
  description?: string
  confirmText?: string
  cancelText?: string
  variant?: "default" | "destructive" | "warning" | "success" | "info"
  onConfirm?: () => void
  onCancel?: () => void
  open?: boolean
  onOpenChange?: (open: boolean) => void
  loading?: boolean
}

const confirmModalIcons = {
  default: Info,
  destructive: AlertTriangle,
  warning: AlertTriangle,
  success: CheckCircle,
  info: Info,
}

export function ConfirmModal({
  children,
  trigger,
  title,
  description,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  variant = "default",
  onConfirm,
  onCancel,
  open,
  onOpenChange,
  loading = false,
}: ConfirmModalProps) {
  const Icon = confirmModalIcons[variant]

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      {trigger && <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>}
      <AlertDialogContent variant={variant}>
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className={cn(
              "flex h-10 w-10 items-center justify-center rounded-full",
              {
                "bg-blue-100 text-blue-600": variant === "default" || variant === "info",
                "bg-red-100 text-red-600": variant === "destructive",
                "bg-yellow-100 text-yellow-600": variant === "warning",
                "bg-green-100 text-green-600": variant === "success",
              }
            )}>
              <Icon className="h-5 w-5" />
            </div>
            <AlertDialogTitle>{title}</AlertDialogTitle>
          </div>
          {description && (
            <AlertDialogDescription className="mt-2">
              {description}
            </AlertDialogDescription>
          )}
        </AlertDialogHeader>
        {children}
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel} disabled={loading}>
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={loading}
            className={cn({
              "bg-red-600 hover:bg-red-700": variant === "destructive",
              "bg-yellow-600 hover:bg-yellow-700": variant === "warning",
              "bg-green-600 hover:bg-green-700": variant === "success",
            })}
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Procesando...
              </div>
            ) : (
              confirmText
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

// Modal específico para Quick View de productos
export interface QuickViewModalProps {
  children: React.ReactNode
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function QuickViewModal({
  children,
  trigger,
  open,
  onOpenChange,
}: QuickViewModalProps) {
  // Debug: Verificar que onOpenChange se propaga correctamente
  console.log('QuickViewModal - onOpenChange recibido:', typeof onOpenChange, onOpenChange);
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent
        size="4xl"
        variant="elevated"
        showCloseButton={true}
        className="max-h-[90vh] overflow-y-auto"
      >
        <DialogHeader>
          <VisuallyHidden.Root>
            <DialogTitle>Vista rápida del producto</DialogTitle>
          </VisuallyHidden.Root>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  )
}

// Modal para agregar al carrito con animación
export interface AddToCartModalProps {
  children?: React.ReactNode
  trigger?: React.ReactNode
  productName: string
  productImage?: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onContinueShopping?: () => void
  onGoToCart?: () => void
}

export function AddToCartModal({
  children,
  trigger,
  productName,
  productImage,
  open,
  onOpenChange,
  onContinueShopping,
  onGoToCart,
}: AddToCartModalProps) {
  return (
    <Modal
      trigger={trigger}
      size="md"
      variant="elevated"
      open={open}
      onOpenChange={onOpenChange}
      title="¡Producto agregado al carrito!"
    >
      <div className="flex flex-col items-center gap-4 py-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        
        {productImage && (
          <img
            src={productImage}
            alt={productName}
            className="h-20 w-20 rounded-lg object-cover"
          />
        )}
        
        <p className="text-center text-gray-600">
          <span className="font-medium">{productName}</span> se agregó correctamente a tu carrito
        </p>
        
        {children}
        
        <div className="flex w-full gap-3">
          <button
            onClick={onContinueShopping}
            className="flex-1 rounded-button border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-900 transition-colors hover:bg-gray-50"
          >
            Seguir comprando
          </button>
          <button
            onClick={onGoToCart}
            className="flex-1 rounded-button bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
          >
            <ShoppingCart className="mr-2 h-4 w-4" />
            Ver carrito
          </button>
        </div>
      </div>
    </Modal>
  )
}

// Hook para manejar modales de forma más sencilla
export function useModal(defaultOpen = false) {
  const [open, setOpen] = React.useState(defaultOpen)
  
  const openModal = React.useCallback(() => setOpen(true), [])
  const closeModal = React.useCallback(() => setOpen(false), [])
  const toggleModal = React.useCallback(() => setOpen(prev => !prev), [])
  
  return {
    open,
    openModal,
    closeModal,
    toggleModal,
    setOpen,
  }
}









