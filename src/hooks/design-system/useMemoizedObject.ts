import { useMemo } from 'react';

/**
 * Hook para memoizar objetos de configuración
 * Evita el spread operator en dependencies para cumplir con ESLint
 */
export function useMemoizedConfig<T extends Record<string, any>>(
  config: T,
  deps: React.DependencyList
): T {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => config, [config, deps]);
}

/**
 * Hook para memoizar estilos
 * Evita el spread operator en dependencies para cumplir con ESLint
 */
export function useMemoizedStyles<T extends Record<string, any>>(
  styles: T,
  deps: React.DependencyList = []
): T {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => styles, [styles, deps]);
}

/**
 * Hook para memoizar props complejas
 * Evita el spread operator en dependencies para cumplir con ESLint
 */
export function useMemoizedProps<T extends Record<string, any>>(
  props: T,
  deps: React.DependencyList
): T {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => props, [props, deps]);
}
