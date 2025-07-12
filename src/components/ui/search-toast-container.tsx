// ===================================
// COMPONENTE: SearchToastContainer - Contenedor de toasts para búsquedas
// ===================================

"use client";

import React from 'react';
import { Toast } from './feedback';
import { AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';
import type { ToastNotification } from '@/hooks/useSearchToast';

// ===================================
// TIPOS
// ===================================

export interface SearchToastContainerProps {
  toasts: ToastNotification[];
  onRemoveToast: (id: string) => void;
  className?: string;
}

// ===================================
// UTILIDADES
// ===================================

function getToastIcon(type: ToastNotification['type']) {
  switch (type) {
    case 'success':
      return <CheckCircle className="w-5 h-5" />;
    case 'error':
      return <AlertCircle className="w-5 h-5" />;
    case 'warning':
      return <AlertTriangle className="w-5 h-5" />;
    case 'info':
      return <Info className="w-5 h-5" />;
    default:
      return <Info className="w-5 h-5" />;
  }
}

function getToastVariant(type: ToastNotification['type']) {
  switch (type) {
    case 'success':
      return 'success';
    case 'error':
      return 'error';
    case 'warning':
      return 'warning';
    case 'info':
      return 'info';
    default:
      return 'info';
  }
}

// ===================================
// COMPONENTE PRINCIPAL
// ===================================

export const SearchToastContainer: React.FC<SearchToastContainerProps> = ({
  toasts,
  onRemoveToast,
  className = '',
}) => {
  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className={`fixed top-4 right-4 z-50 space-y-2 ${className}`}>
      {toasts.map((toast) => (
        <div key={toast.id} className="animate-slide-in-right">
          <Toast
            variant={getToastVariant(toast.type)}
            position="top-right"
            animation="slide-in"
            title={toast.title}
            description={toast.description}
            icon={getToastIcon(toast.type)}
            closable={true}
            duration={toast.duration}
            onClose={() => onRemoveToast(toast.id)}
            className="min-w-[320px] max-w-[400px] shadow-lg border-l-4"
          >
            {/* Botón de acción si existe */}
            {toast.action && (
              <div className="mt-2 pt-2 border-t border-current/20">
                <button
                  onClick={toast.action.onClick}
                  className="text-sm font-medium underline hover:no-underline transition-all"
                >
                  {toast.action.label}
                </button>
              </div>
            )}
          </Toast>
        </div>
      ))}
    </div>
  );
};

// ===================================
// COMPONENTE SIMPLIFICADO PARA HEADER
// ===================================

export interface SearchToastProps {
  toasts: ToastNotification[];
  onRemoveToast: (id: string) => void;
}

export const SearchToast: React.FC<SearchToastProps> = ({
  toasts,
  onRemoveToast,
}) => {
  return (
    <SearchToastContainer
      toasts={toasts}
      onRemoveToast={onRemoveToast}
      className="md:top-20 lg:top-24" // Ajustar para header sticky
    />
  );
};

export default SearchToastContainer;
