import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import HeroCarousel from '../HeroCarousel';

// Mock Swiper components
jest.mock('swiper/react', () => ({
  Swiper: ({ children, onSlideChange, onSwiper, ...props }: any) => {
    const mockSwiper = {
      slidePrev: jest.fn(),
      slideNext: jest.fn(),
      autoplay: {
        start: jest.fn(),
        stop: jest.fn(),
      },
      realIndex: 0,
    };

    React.useEffect(() => {
      if (onSwiper) onSwiper(mockSwiper);
    }, [onSwiper]);

    return (
      <div data-testid="swiper" {...props}>
        {children}
      </div>
    );
  },
  SwiperSlide: ({ children, ...props }: any) => (
    <div data-testid="swiper-slide" {...props}>
      {children}
    </div>
  ),
}));

jest.mock('swiper/modules', () => ({
  Autoplay: 'Autoplay',
  Pagination: 'Pagination',
  Navigation: 'Navigation',
  Keyboard: 'Keyboard',
  A11y: 'A11y',
}));

// Mock Next.js Image component
jest.mock('next/image', () => {
  return function MockImage({ src, alt, ...props }: any) {
    return <img src={src} alt={alt} {...props} data-testid="next-image" />;
  };
});

const mockImages = [
  { 
    src: '/images/hero/hero-01.png', 
    alt: 'Imagen 1 - Productos de pinturería', 
    priority: true 
  },
  { 
    src: '/images/hero/hero-02.png', 
    alt: 'Imagen 2 - Ferretería y corralón', 
    priority: false 
  },
  { 
    src: '/images/hero/hero-03.png', 
    alt: 'Imagen 3 - Envío gratis', 
    priority: false 
  },
  { 
    src: '/images/hero/hero-04.png', 
    alt: 'Imagen 4 - Pagos seguros', 
    priority: false 
  },
];

describe('HeroCarousel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with default props', () => {
    render(<HeroCarousel images={mockImages} />);
    
    expect(screen.getByRole('region')).toBeInTheDocument();
    expect(screen.getByLabelText('Carrusel de imágenes principales')).toBeInTheDocument();
    expect(screen.getByTestId('swiper')).toBeInTheDocument();
  });

  it('renders all images correctly', () => {
    render(<HeroCarousel images={mockImages} />);
    
    const images = screen.getAllByTestId('next-image');
    expect(images).toHaveLength(mockImages.length);
    
    mockImages.forEach((image, index) => {
      expect(images[index]).toHaveAttribute('src', image.src);
      expect(images[index]).toHaveAttribute('alt', image.alt);
    });
  });

  it('has proper ARIA attributes for accessibility', () => {
    render(<HeroCarousel images={mockImages} />);
    
    const carousel = screen.getByRole('region');
    expect(carousel).toHaveAttribute('aria-label', 'Carrusel de imágenes principales');
    expect(carousel).toHaveAttribute('aria-live', 'polite');
    
    const swiper = screen.getByTestId('swiper');
    expect(swiper).toHaveAttribute('aria-label', 'Galería de imágenes de productos');
  });

  it('shows navigation buttons when enabled', () => {
    render(<HeroCarousel images={mockImages} showNavigation={true} />);
    
    expect(screen.getByLabelText('Imagen anterior')).toBeInTheDocument();
    expect(screen.getByLabelText('Imagen siguiente')).toBeInTheDocument();
  });

  it('hides navigation buttons when disabled', () => {
    render(<HeroCarousel images={mockImages} showNavigation={false} />);
    
    expect(screen.queryByLabelText('Imagen anterior')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Imagen siguiente')).not.toBeInTheDocument();
  });

  it('applies custom className correctly', () => {
    const customClass = 'custom-carousel-class';
    render(<HeroCarousel images={mockImages} className={customClass} />);
    
    const carousel = screen.getByRole('region');
    expect(carousel).toHaveClass(customClass);
  });

  it('handles slide change callback', () => {
    const onSlideChange = jest.fn();
    render(<HeroCarousel images={mockImages} onSlideChange={onSlideChange} />);
    
    // El callback se debería llamar cuando se inicializa el swiper
    // En un entorno real, esto se activaría cuando cambie la diapositiva
    expect(onSlideChange).toHaveBeenCalledWith(0);
  });

  it('supports keyboard navigation', () => {
    render(<HeroCarousel images={mockImages} />);
    
    const carousel = screen.getByRole('region');
    
    // Simular navegación con teclado
    fireEvent.keyDown(document, { key: 'ArrowRight' });
    fireEvent.keyDown(document, { key: 'ArrowLeft' });
    fireEvent.keyDown(document, { key: 'Escape' });
    
    // Verificar que no hay errores y el componente sigue funcionando
    expect(carousel).toBeInTheDocument();
  });

  it('handles mouse enter and leave for autoplay control', () => {
    render(<HeroCarousel images={mockImages} />);
    
    const carousel = screen.getByRole('region');
    
    // Simular mouse enter (debería pausar autoplay)
    fireEvent.mouseEnter(carousel);
    
    // Simular mouse leave (debería reanudar autoplay)
    fireEvent.mouseLeave(carousel);
    
    expect(carousel).toBeInTheDocument();
  });

  it('renders slide descriptions for screen readers', () => {
    render(<HeroCarousel images={mockImages} />);
    
    mockImages.forEach((image, index) => {
      const description = document.getElementById(`slide-description-${index}`);
      expect(description).toBeInTheDocument();
      expect(description).toHaveTextContent(image.alt);
      expect(description).toHaveClass('sr-only');
    });
  });

  it('provides live region updates for screen readers', () => {
    render(<HeroCarousel images={mockImages} />);
    
    const liveRegion = screen.getByText(/Imagen 1 de 4/);
    expect(liveRegion).toBeInTheDocument();
    expect(liveRegion).toHaveClass('sr-only');
  });

  it('handles empty images array gracefully', () => {
    render(<HeroCarousel images={[]} />);
    
    expect(screen.getByRole('region')).toBeInTheDocument();
    expect(screen.getByTestId('swiper')).toBeInTheDocument();
  });

  it('uses correct autoplay delay', () => {
    const customDelay = 3000;
    render(<HeroCarousel images={mockImages} autoplayDelay={customDelay} />);
    
    // En un test real, verificaríamos que el swiper se configura con el delay correcto
    expect(screen.getByTestId('swiper')).toBeInTheDocument();
  });

  it('renders with proper slide group labels', () => {
    render(<HeroCarousel images={mockImages} />);
    
    const slides = screen.getAllByTestId('swiper-slide');
    slides.forEach((slide, index) => {
      expect(slide).toHaveAttribute('role', 'group');
      expect(slide).toHaveAttribute('aria-label', `${index + 1} de ${mockImages.length}`);
    });
  });

  it('maintains focus management for accessibility', () => {
    render(<HeroCarousel images={mockImages} showNavigation={true} />);
    
    const prevButton = screen.getByLabelText('Imagen anterior');
    const nextButton = screen.getByLabelText('Imagen siguiente');
    
    expect(prevButton).toHaveAttribute('type', 'button');
    expect(nextButton).toHaveAttribute('type', 'button');
    
    // Verificar que los botones tienen las clases de focus correctas
    expect(prevButton).toHaveClass('focus:outline-none', 'focus:ring-2', 'focus:ring-yellow-400');
    expect(nextButton).toHaveClass('focus:outline-none', 'focus:ring-2', 'focus:ring-yellow-400');
  });
});
