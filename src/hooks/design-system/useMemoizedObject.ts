import { useMemo } from 'react';

/**
 * Hook para memoizar objetos de configuración
 */
export function useMemoizedConfig<T extends Record<string, any>>(
  config: T,
  deps: React.DependencyList
): T {
  return useMemo(() => config, deps);
}

/**
 * Hook para memoizar estilos
 */
export function useMemoizedStyles<T extends Record<string, any>>(
  styles: T,
  deps: React.DependencyList = []
): T {
  return useMemo(() => styles, deps);
}

/**
 * Hook para memoizar props complejas
 */
export function useMemoizedProps<T extends Record<string, any>>(
  props: T,
  deps: React.DependencyList
): T {
  return useMemo(() => props, deps);
}
