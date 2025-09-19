// ===================================
// PINTEYA E-COMMERCE - ORDERS DEV PERSISTENCE HOOK
// Hook para persistir estado de órdenes durante Fast Refresh en desarrollo
// ===================================

'use client';

import { useCallback, useRef, useEffect } from 'react';
import { StrictOrderEnterprise } from '@/types/orders-enterprise';
import { StrictOrderFilters } from './useOrdersEnterpriseStrict';

// ===================================
// TIPOS Y CONFIGURACIÓN
// ===================================

interface PersistedOrdersState {
  orders: StrictOrderEnterprise[];
  pagination: any;
  analytics: any;
  filters: StrictOrderFilters;
  lastFetchTime: number;
  hasData: boolean;
}

interface DevPersistenceOptions {
  enabled: boolean;
  maxAge: number; // Tiempo máximo para considerar datos válidos (ms)
  storageKey: string;
}

// ===================================
// STORAGE GLOBAL PARA DESARROLLO
// ===================================

// Usar Map global para persistir entre Fast Refresh
const globalDevStorage = new Map<string, PersistedOrdersState>();

// ===================================
// UTILIDADES
// ===================================

function isValidPersistedState(state: any): state is PersistedOrdersState {
  return (
    state &&
    typeof state === 'object' &&
    Array.isArray(state.orders) &&
    typeof state.lastFetchTime === 'number' &&
    typeof state.hasData === 'boolean'
  );
}

function isStateExpired(state: PersistedOrdersState, maxAge: number): boolean {
  return Date.now() - state.lastFetchTime > maxAge;
}

// ===================================
// HOOK DE PERSISTENCIA PARA DESARROLLO
// ===================================

export interface UseOrdersDevPersistenceReturn {
  getPersistedState: () => PersistedOrdersState | null;
  persistState: (state: Partial<PersistedOrdersState>) => void;
  clearPersistedState: () => void;
  hasValidPersistedData: () => boolean;
}

export function useOrdersDevPersistence(
  options: DevPersistenceOptions
): UseOrdersDevPersistenceReturn {
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const getPersistedState = useCallback((): PersistedOrdersState | null => {
    if (!optionsRef.current.enabled || process.env.NODE_ENV !== 'development') {
      return null;
    }

    try {
      const state = globalDevStorage.get(optionsRef.current.storageKey);
      
      if (!state || !isValidPersistedState(state)) {
        return null;
      }

      if (isStateExpired(state, optionsRef.current.maxAge)) {
        globalDevStorage.delete(optionsRef.current.storageKey);
        return null;
      }

      return state;
    } catch (error) {
      console.warn('[useOrdersDevPersistence] Error getting persisted state:', error);
      return null;
    }
  }, []);

  const persistState = useCallback((newState: Partial<PersistedOrdersState>): void => {
    if (!optionsRef.current.enabled || process.env.NODE_ENV !== 'development') {
      return;
    }

    try {
      const currentState = globalDevStorage.get(optionsRef.current.storageKey);
      
      const updatedState: PersistedOrdersState = {
        orders: [],
        pagination: null,
        analytics: null,
        filters: {} as StrictOrderFilters,
        lastFetchTime: Date.now(),
        hasData: false,
        ...currentState,
        ...newState,
      };

      globalDevStorage.set(optionsRef.current.storageKey, updatedState);

      if (process.env.NODE_ENV === 'development') {
        console.log('[useOrdersDevPersistence] State persisted:', {
          key: optionsRef.current.storageKey,
          ordersCount: updatedState.orders.length,
          hasData: updatedState.hasData,
          age: Date.now() - updatedState.lastFetchTime
        });
      }
    } catch (error) {
      console.warn('[useOrdersDevPersistence] Error persisting state:', error);
    }
  }, []);

  const clearPersistedState = useCallback((): void => {
    if (!optionsRef.current.enabled || process.env.NODE_ENV !== 'development') {
      return;
    }

    globalDevStorage.delete(optionsRef.current.storageKey);
    
    if (process.env.NODE_ENV === 'development') {
      console.log('[useOrdersDevPersistence] Persisted state cleared');
    }
  }, []);

  const hasValidPersistedData = useCallback((): boolean => {
    const state = getPersistedState();
    return state !== null && state.hasData && state.orders.length > 0;
  }, [getPersistedState]);

  // Cleanup al desmontar (solo en producción o cuando se deshabilita)
  useEffect(() => {
    return () => {
      if (!optionsRef.current.enabled || process.env.NODE_ENV !== 'development') {
        clearPersistedState();
      }
    };
  }, [clearPersistedState]);

  return {
    getPersistedState,
    persistState,
    clearPersistedState,
    hasValidPersistedData
  };
}

// ===================================
// HOOK HELPER PARA INTEGRACIÓN FÁCIL
// ===================================

export function useOrdersDevState(storageKey: string = 'orders-dev-state') {
  return useOrdersDevPersistence({
    enabled: true,
    maxAge: 5 * 60 * 1000, // 5 minutos
    storageKey
  });
}









