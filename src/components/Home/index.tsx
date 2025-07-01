"use client";

import React from "react";
import Hero from "./Hero";
import Categories from "./Categories";
import NewArrival from "./NewArrivals";
import PromoBanner from "./PromoBanner";
import BestSeller from "./BestSeller";
import PinteyaRaffle from "./PinteyaRaffle";
import TrustSection from "./TrustSection";
import Testimonials from "./Testimonials";
import Newsletter from "../Common/Newsletter";

const Home = () => {
  return (
    <main>
      {/* Componentes críticos - carga inmediata */}
      <Hero />
      <Categories />
      <PromoBanner />
      <BestSeller />
      <NewArrival />
      <PinteyaRaffle />
      
      {/* Componentes no críticos */}
      <TrustSection />
      <Testimonials />
      <Newsletter />
    </main>
  );
};

export default Home;
