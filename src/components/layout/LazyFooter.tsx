"use client";

import { lazy, Suspense } from 'react';

// Lazy load del Footer principal
const Footer = lazy(() => import('./Footer'));

// Skeleton optimizado para Footer
const FooterSkeleton = () => (
  <footer className="bg-white border-t border-gray-200">
    {/* Mobile skeleton */}
    <div className="block md:hidden">
      <div className="max-w-7xl mx-auto px-4 py-4 pb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="h-7 w-24 bg-gray-200 rounded animate-pulse"></div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
            <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
          </div>
        </div>
        <div className="flex items-center justify-center gap-1 mb-3">
          <div className="h-6 w-20 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-6 w-24 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
        </div>
      </div>
    </div>
    
    {/* Desktop skeleton */}
    <div className="hidden md:block">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-4 gap-8 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-4">
              <div className="h-5 bg-gray-200 rounded animate-pulse"></div>
              <div className="space-y-2">
                {[...Array(4)].map((_, j) => (
                  <div key={j} className="h-4 bg-gray-200 rounded animate-pulse"></div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="border-t pt-6">
          <div className="flex justify-between items-center">
            <div className="h-4 bg-gray-200 rounded w-48 animate-pulse"></div>
            <div className="flex gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="w-6 h-6 bg-gray-200 rounded animate-pulse"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  </footer>
);

// Componente principal con lazy loading
const LazyFooter = () => {
  return (
    <Suspense fallback={<FooterSkeleton />}>
      <Footer />
    </Suspense>
  );
};

export default LazyFooter;
export { FooterSkeleton };