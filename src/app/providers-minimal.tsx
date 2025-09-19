"use client";

import React from "react";
import { SessionProvider } from "next-auth/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Crear QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutos
      gcTime: 1000 * 60 * 10, // 10 minutos
    },
  },
});

interface ProvidersProps {
  children: React.ReactNode;
}

export default function ProvidersMinimal({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <div className="app-content-wrapper">
          <h1>Minimal Test</h1>
          {children}
        </div>
      </QueryClientProvider>
    </SessionProvider>
  );
}









