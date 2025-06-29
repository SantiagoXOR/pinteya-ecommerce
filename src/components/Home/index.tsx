"use client";

import React, { Suspense, lazy } from "react";
import Hero from "./Hero";
import Categories from "./Categories";
import NewArrival from "./NewArrivals";
import PromoBanner from "./PromoBanner";
import BestSeller from "./BestSeller";
import CounDown from "./Countdown";

// Lazy loading para componentes no críticos
const LazyTestimonials = lazy(() => import("./Testimonials"));
const LazyTrustSection = lazy(() => import("./TrustSection"));
const LazyNewsletter = lazy(() => import("../Common/Newsletter"));

// Componente de loading optimizado
const ComponentSkeleton = ({ height = "h-32" }: { height?: string }) => (
  <div className={`animate-pulse bg-gray-200 rounded-lg ${height} mx-auto max-w-7xl`}>
    <div className="flex space-x-4 p-4">
      <div className="rounded-full bg-gray-300 h-10 w-10"></div>
      <div className="flex-1 space-y-2 py-1">
        <div className="h-4 bg-gray-300 rounded w-3/4"></div>
        <div className="h-4 bg-gray-300 rounded w-1/2"></div>
      </div>
    </div>
  </div>
);

const Home = () => {
  return (
    <main>
      {/* Componentes críticos - carga inmediata */}
      <Hero />
      <Categories />
      <NewArrival />
      <PromoBanner />
      <BestSeller />
      <CounDown />
      
      {/* Componentes no críticos - lazy loading */}
      <Suspense fallback={<ComponentSkeleton height="h-40" />}>
        <LazyTrustSection />
      </Suspense>
      
      <Suspense fallback={<ComponentSkeleton height="h-64" />}>
        <LazyTestimonials />
      </Suspense>
      
      <Suspense fallback={<ComponentSkeleton height="h-48" />}>
        <LazyNewsletter />
      </Suspense>
    </main>
  );
};

export default Home;
