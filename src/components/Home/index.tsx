'use client'

import Hero from './Hero'
// import PromoBanner from './PromoBanner';
import BestSeller from './BestSeller'
// import PinteyaRaffle from './PinteyaRaffle';
import NewArrivals from './NewArrivals'
import TrustSection from './TrustSection'
import Testimonials from './Testimonials'
import Newsletter from '@/components/Common/Newsletter'
import CategoryTogglePillsWithSearch from './CategoryTogglePillsWithSearch'
import CombosSection from './CombosSection'

const Home = () => {
  return (
    <main>
      {/* Combos promocionales bajo el header */}
      <CombosSection />
      <CategoryTogglePillsWithSearch />
      <BestSeller />
      {/* <PromoBanner /> */}
      {/* Carrusel Hero movido después de ofertas especiales */}
      <Hero />
      {/* Sección de nuevos productos bajo el hero */}
      <NewArrivals />
      {/* <PinteyaRaffle /> */}
      <TrustSection />
      <Testimonials />
      <Newsletter />
    </main>
  )
}

export default Home
