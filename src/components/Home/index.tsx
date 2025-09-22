'use client';

import Hero from './Hero';
import PromoBanner from './PromoBanner';
import BestSeller from './BestSeller';
import PinteyaRaffle from './PinteyaRaffle';
import TrustSection from './TrustSection';
import Testimonials from './Testimonials';
import Newsletter from '@/components/Common/Newsletter';
import CategoryTogglePillsWithSearch from './CategoryTogglePillsWithSearch';

const Home = () => {
  return (
    <main>
      <Hero />
      <CategoryTogglePillsWithSearch />
      <BestSeller />
      <PromoBanner />
      <PinteyaRaffle />
      <TrustSection />
      <Testimonials />
      <Newsletter />
    </main>
  );
};

export default Home;









