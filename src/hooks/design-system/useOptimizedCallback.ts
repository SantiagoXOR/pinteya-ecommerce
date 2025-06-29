import { useCallback } from 'react';

/**
 * Hook para crear callbacks optimizados para el Design System
 */
export function useOptimizedCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList
): T {
  return useCallback(callback, deps);
}

/**
 * Hook para crear handlers de eventos optimizados
 */
export function useEventHandler<T = Event>(
  handler: (event: T) => void,
  deps: React.DependencyList = []
) {
  return useCallback(handler, deps);
}

/**
 * Hook para crear handlers de formulario optimizados
 */
export function useFormHandler<T = HTMLFormElement>(
  handler: (event: React.FormEvent<T>) => void,
  deps: React.DependencyList = []
) {
  return useCallback(handler, deps);
}
