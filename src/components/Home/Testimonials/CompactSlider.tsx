"use client";

import TestimonialSlider from "@/components/ui/testimonial-slider";
import { useTenantTestimonials } from "./useTenantTestimonials";

const CompactSlider = () => {
  // ⚡ MULTITENANT: Obtener testimonios específicos del tenant
  const tenantTestimonials = useTenantTestimonials()
  
  const testimonials = tenantTestimonials.map(testimonial => ({
    img: testimonial.authorImg || "https://images.unsplash.com/photo-1502685104226-ee32379fefbe?w=200&h=200&fit=crop",
    quote: testimonial.review,
    name: testimonial.authorName,
    role: testimonial.authorRole,
  }));

  return <TestimonialSlider testimonials={testimonials} autorotateTiming={6000} />;
};

export default CompactSlider;
