/**
 * Página de demostración del sistema de Analytics
 * Muestra todas las funcionalidades implementadas
 */

import AnalyticsDemo from '@/components/Analytics/AnalyticsDemo';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Demo Analytics | Pinteya E-commerce',
  description: 'Demostración del sistema de analytics y métricas de Pinteya E-commerce',
};

export default function AnalyticsDemoPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <AnalyticsDemo />
    </div>
  );
}









