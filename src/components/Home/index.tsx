"use client";

import React, { Suspense } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { useCategoryFilters } from "@/hooks/useCategoryFilters";

// Componentes críticos (above the fold) - carga inmediata
import Hero from "./Hero";
// import Categories from "./Categories"; // ELIMINADO: Sección "Explorar por Categoría"
import CategoryTogglePills from "./CategoryTogglePills";

// Componentes no críticos (below the fold) - lazy loading
const NewArrival = dynamic(() => import("./NewArrivals"), {
  loading: () => <div className="h-96 bg-gray-100 animate-pulse rounded-lg" />,
  ssr: true
});

const PromoBanner = dynamic(() => import("./PromoBanner"), {
  loading: () => <div className="h-32 bg-gray-100 animate-pulse rounded-lg" />,
  ssr: true
});

const BestSeller = dynamic(() => import("./BestSeller"), {
  loading: () => <div className="h-96 bg-gray-100 animate-pulse rounded-lg" />,
  ssr: true
});

const PinteyaRaffle = dynamic(() => import("./PinteyaRaffle"), {
  loading: () => <div className="h-64 bg-gray-100 animate-pulse rounded-lg" />,
  ssr: true
});

const TrustSection = dynamic(() => import("./TrustSection"), {
  loading: () => <div className="h-48 bg-gray-100 animate-pulse rounded-lg" />,
  ssr: true
});

const Testimonials = dynamic(() => import("./Testimonials"), {
  loading: () => <div className="h-64 bg-gray-100 animate-pulse rounded-lg" />,
  ssr: true
});

const Newsletter = dynamic(() => import("../Common/Newsletter"), {
  loading: () => <div className="h-32 bg-gray-100 animate-pulse rounded-lg" />,
  ssr: true
});

const Home = () => {
  const { selectedCategories, handleCategoryChange } = useCategoryFilters();
  const searchParams = useSearchParams();

  // Obtener término de búsqueda actual desde URL
  const currentSearchTerm = searchParams.get('q') || searchParams.get('search') || '';

  return (
    <main>
      {/* Filtros de categorías - entre header y hero */}
      <CategoryTogglePills
        selectedCategories={selectedCategories}
        onCategoryChange={handleCategoryChange}
        searchTerm={currentSearchTerm}
      />

      {/* Componentes críticos - carga inmediata */}
      <Hero />
      {/* <Categories /> ELIMINADO: Sección "Explorar por Categoría" */}

      {/* Componentes no críticos - lazy loading con Suspense */}
      <Suspense fallback={<div className="h-96 bg-gray-100 animate-pulse rounded-lg mx-4 my-8" />}>
        <NewArrival selectedCategories={selectedCategories} />
      </Suspense>

      <Suspense fallback={<div className="h-32 bg-gray-100 animate-pulse rounded-lg mx-4 my-8" />}>
        <PromoBanner />
      </Suspense>

      <Suspense fallback={<div className="h-96 bg-gray-100 animate-pulse rounded-lg mx-4 my-8" />}>
        <BestSeller selectedCategories={selectedCategories} />
      </Suspense>

      <Suspense fallback={<div className="h-64 bg-gray-100 animate-pulse rounded-lg mx-4 my-8" />}>
        <PinteyaRaffle />
      </Suspense>

      <Suspense fallback={<div className="h-48 bg-gray-100 animate-pulse rounded-lg mx-4 my-8" />}>
        <TrustSection />
      </Suspense>

      <Suspense fallback={<div className="h-64 bg-gray-100 animate-pulse rounded-lg mx-4 my-8" />}>
        <Testimonials />
      </Suspense>

      <Suspense fallback={<div className="h-32 bg-gray-100 animate-pulse rounded-lg mx-4 my-8" />}>
        <Newsletter />
      </Suspense>
    </main>
  );
};

export default Home;
