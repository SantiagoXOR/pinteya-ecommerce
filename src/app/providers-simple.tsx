"use client";

import React, { useState, useEffect } from "react";
import { SessionProvider } from "next-auth/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReduxProvider } from "@/redux/provider";
import HeaderNextAuth from "@/components/Header/HeaderNextAuth";

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

export default function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <ReduxProvider>
          <div className="app-content-wrapper">
            <HeaderNextAuth />
            {children}
          </div>
        </ReduxProvider>
      </QueryClientProvider>
    </SessionProvider>
  );
}









