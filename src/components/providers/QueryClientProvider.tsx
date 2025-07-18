"use client";

// ===================================
// PROVIDER: TanStack Query Client
// ===================================

import { useState } from 'react';
import { QueryClient, QueryClientProvider as TanStackQueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClientConfig } from '@/lib/query-client';

interface QueryClientProviderProps {
  children: React.ReactNode;
}

export function QueryClientProvider({ children }: QueryClientProviderProps) {
  // Crear QueryClient en estado para evitar recreación en re-renders
  const [queryClient] = useState(() => new QueryClient(queryClientConfig));

  return (
    <TanStackQueryClientProvider client={queryClient}>
      {children}
      {/* DevTools solo en desarrollo */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools
          initialIsOpen={false}
        />
      )}
    </TanStackQueryClientProvider>
  );
}
