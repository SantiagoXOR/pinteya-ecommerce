// ===================================
// PROVIDER: Network Error Handler
// ===================================

'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useNetworkErrorHandler } from '@/hooks/useNetworkErrorHandler';

interface NetworkErrorContextType {
  isOnline: boolean;
  hasNetworkError: boolean;
  lastError: any;
  clearError: () => void;
  retryConnection: () => void;
}

const NetworkErrorContext = createContext<NetworkErrorContextType | undefined>(undefined);

interface NetworkErrorProviderProps {
  children: React.ReactNode;
  enableDebugMode?: boolean;
}

export function NetworkErrorProvider({ 
  children, 
  enableDebugMode = process.env.NODE_ENV === 'development' 
}: NetworkErrorProviderProps) {
  const [isOnline, setIsOnline] = useState(true);
  const [hasNetworkError, setHasNetworkError] = useState(false);
  const [lastError, setLastError] = useState<any>(null);

  const { handleNetworkError, setupGlobalErrorHandling } = useNetworkErrorHandler({
    enableLogging: enableDebugMode,
    enableRetry: true,
    maxRetries: 3,
    retryDelay: 1000
  });

  // Monitorear estado de conexión
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setHasNetworkError(false);
      if (enableDebugMode) {
        console.log('🟢 Connection restored');
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setHasNetworkError(true);
      if (enableDebugMode) {
        console.log('🔴 Connection lost');
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Verificar estado inicial
    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [enableDebugMode]);

  // Setup global error handling
  useEffect(() => {
    const cleanup = setupGlobalErrorHandling();

    // Interceptar errores de console para suprimir ERR_ABORTED
    const originalConsoleError = console.error;
    console.error = (...args) => {
      // Filtrar errores de abort que no son críticos
      const message = args.join(' ').toLowerCase();
      if (message.includes('err_aborted') ||
          message.includes('aborterror') ||
          message.includes('signal is aborted') ||
          message.includes('abort') ||
          message.includes('the user aborted a request') ||
          message.includes('error type: abort') ||
          message.includes('🌐 network error handler') ||
          message.includes('url: undefined') ||
          message.includes('method: undefined') ||
          message.includes('original error: aborterror') ||
          message.includes('context: {type: fetch') ||
          message.includes('wallet_container') ||
          message.includes('could not find the brick container') ||
          message.includes('checkout bricks error')) {
        if (enableDebugMode) {
          console.debug('🔇 Suppressed error:', ...args);
        }
        return;
      }
      
      // Permitir otros errores
      originalConsoleError(...args);
    };

    return () => {
      cleanup();
      console.error = originalConsoleError;
    };
  }, [setupGlobalErrorHandling, enableDebugMode]);

  // Función para limpiar errores
  const clearError = () => {
    setHasNetworkError(false);
    setLastError(null);
  };

  // Función para reintentar conexión
  const retryConnection = async () => {
    try {
      // Hacer un request simple para verificar conectividad
      const response = await fetch('/api/test-simple', {
        method: 'GET',
        cache: 'no-cache',
        signal: AbortSignal.timeout(5000)
      });

      if (response.ok) {
        setIsOnline(true);
        setHasNetworkError(false);
        setLastError(null);
        if (enableDebugMode) {
          console.log('✅ Connection test successful');
        }
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      setHasNetworkError(true);
      setLastError(error);
      handleNetworkError(error, { type: 'connection-test' });
      if (enableDebugMode) {
        console.error('❌ Connection test failed:', error);
      }
    }
  };

  const contextValue: NetworkErrorContextType = {
    isOnline,
    hasNetworkError,
    lastError,
    clearError,
    retryConnection
  };

  return (
    <NetworkErrorContext.Provider value={contextValue}>
      {children}
    </NetworkErrorContext.Provider>
  );
}

// Hook para usar el contexto
export function useNetworkError() {
  const context = useContext(NetworkErrorContext);
  if (context === undefined) {
    throw new Error('useNetworkError must be used within a NetworkErrorProvider');
  }
  return context;
}

// Componente de error de red
export function NetworkErrorBoundary({ children }: { children: React.ReactNode }) {
  const { hasNetworkError, retryConnection, clearError } = useNetworkError();

  if (hasNetworkError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
          <div className="text-red-500 text-6xl mb-4">🌐</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Error de Conexión
          </h2>
          <p className="text-gray-600 mb-6">
            Parece que hay un problema con tu conexión a internet. 
            Por favor, verifica tu conexión e intenta nuevamente.
          </p>
          <div className="space-y-3">
            <button
              onClick={retryConnection}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Reintentar Conexión
            </button>
            <button
              onClick={clearError}
              className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Continuar sin Conexión
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}


