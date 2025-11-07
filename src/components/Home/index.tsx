'use client'

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
      {/* Sección de nuevos productos */}
      <NewArrivals />
      {/* <PinteyaRaffle /> */}
      <TrustSection />
      <Testimonials />
      <Newsletter />
    </main>
  )
}

export default Home
