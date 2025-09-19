/**
 * Layout específico para la aplicación de drivers
 * Incluye navegación mobile-first y contexto específico
 */

import React from 'react';
import { Metadata } from 'next';
import { DriverProvider } from '@/contexts/DriverContext';
import { ModalProvider } from '@/contexts/ModalContext';
import { DriverNavigation } from '@/components/driver/DriverNavigation';

export const metadata: Metadata = {
  title: 'Pinteya Driver - Navegación GPS',
  description: 'Sistema de navegación GPS para drivers de Pinteya E-commerce',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
  themeColor: '#2563eb',
  manifest: '/driver-manifest.json',
};

interface DriverLayoutProps {
  children: React.ReactNode;
}

export default function DriverLayout({ children }: DriverLayoutProps) {
  return (
    <DriverProvider>
      <ModalProvider>
        <div className="min-h-screen bg-gray-50">
          {/* Header de navegación mobile */}
          <DriverNavigation />

          {/* Contenido principal */}
          <main className="pb-20">
            {children}
          </main>
        </div>
      </ModalProvider>
    </DriverProvider>
  );
}









