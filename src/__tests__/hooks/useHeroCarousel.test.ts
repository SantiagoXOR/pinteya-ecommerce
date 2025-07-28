import { renderHook, act } from '@testing-library/react';
import { useHeroCarousel } from '@/hooks/useHeroCarousel';

// Mock de timers para controlar el autoplay
jest.useFakeTimers();

describe('useHeroCarousel', () => {
  const mockImages = [
    '/images/hero/hero-01.png',
    '/images/hero/hero-02.png',
    '/images/hero/hero-03.png',
  ];

  beforeEach(() => {
    jest.clearAllTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    jest.useFakeTimers();
  });

  it('should initialize with correct default values', () => {
    const { result } = renderHook(() =>
      useHeroCarousel({
        images: mockImages,
        autoPlayInterval: 5000,
        pauseOnHover: true,
      })
    );

    expect(result.current.currentIndex).toBe(0);
    expect(result.current.isPlaying).toBe(true);
    expect(result.current.isPaused).toBe(false);
  });

  it('should go to next slide', () => {
    const { result } = renderHook(() =>
      useHeroCarousel({
        images: mockImages,
        autoPlayInterval: 5000,
        pauseOnHover: true,
      })
    );

    act(() => {
      result.current.goToNext();
    });

    expect(result.current.currentIndex).toBe(1);
  });

  it('should go to previous slide', () => {
    const { result } = renderHook(() =>
      useHeroCarousel({
        images: mockImages,
        autoPlayInterval: 5000,
        pauseOnHover: true,
      })
    );

    // Ir al último slide primero
    act(() => {
      result.current.goToSlide(2);
    });

    expect(result.current.currentIndex).toBe(2);

    act(() => {
      result.current.goToPrevious();
    });

    expect(result.current.currentIndex).toBe(1);
  });

  it('should wrap around when going next from last slide', () => {
    const { result } = renderHook(() =>
      useHeroCarousel({
        images: mockImages,
        autoPlayInterval: 5000,
        pauseOnHover: true,
      })
    );

    // Ir al último slide
    act(() => {
      result.current.goToSlide(2);
    });

    expect(result.current.currentIndex).toBe(2);

    // Ir al siguiente debería volver al primero
    act(() => {
      result.current.goToNext();
    });

    expect(result.current.currentIndex).toBe(0);
  });

  it('should wrap around when going previous from first slide', () => {
    const { result } = renderHook(() =>
      useHeroCarousel({
        images: mockImages,
        autoPlayInterval: 5000,
        pauseOnHover: true,
      })
    );

    expect(result.current.currentIndex).toBe(0);

    act(() => {
      result.current.goToPrevious();
    });

    expect(result.current.currentIndex).toBe(2);
  });

  it('should go to specific slide', () => {
    const { result } = renderHook(() =>
      useHeroCarousel({
        images: mockImages,
        autoPlayInterval: 5000,
        pauseOnHover: true,
      })
    );

    act(() => {
      result.current.goToSlide(1);
    });

    expect(result.current.currentIndex).toBe(1);
  });

  it('should not go to invalid slide index', () => {
    const { result } = renderHook(() =>
      useHeroCarousel({
        images: mockImages,
        autoPlayInterval: 5000,
        pauseOnHover: true,
      })
    );

    const initialIndex = result.current.currentIndex;

    act(() => {
      result.current.goToSlide(-1);
    });

    expect(result.current.currentIndex).toBe(initialIndex);

    act(() => {
      result.current.goToSlide(10);
    });

    expect(result.current.currentIndex).toBe(initialIndex);
  });

  it('should pause and resume correctly', () => {
    const { result } = renderHook(() =>
      useHeroCarousel({
        images: mockImages,
        autoPlayInterval: 5000,
        pauseOnHover: true,
      })
    );

    expect(result.current.isPlaying).toBe(true);
    expect(result.current.isPaused).toBe(false);

    act(() => {
      result.current.pause();
    });

    expect(result.current.isPlaying).toBe(false);
    expect(result.current.isPaused).toBe(true);

    act(() => {
      result.current.resume();
    });

    expect(result.current.isPlaying).toBe(true);
    expect(result.current.isPaused).toBe(false);
  });

  it('should handle hover events when pauseOnHover is true', () => {
    const { result } = renderHook(() =>
      useHeroCarousel({
        images: mockImages,
        autoPlayInterval: 5000,
        pauseOnHover: true,
      })
    );

    expect(result.current.isPlaying).toBe(true);

    act(() => {
      result.current.setHover(true);
    });

    expect(result.current.isPlaying).toBe(false);
    expect(result.current.isPaused).toBe(true);

    act(() => {
      result.current.setHover(false);
    });

    expect(result.current.isPlaying).toBe(true);
    expect(result.current.isPaused).toBe(false);
  });

  it('should not pause on hover when pauseOnHover is false', () => {
    const { result } = renderHook(() =>
      useHeroCarousel({
        images: mockImages,
        autoPlayInterval: 5000,
        pauseOnHover: false,
      })
    );

    expect(result.current.isPlaying).toBe(true);

    act(() => {
      result.current.setHover(true);
    });

    expect(result.current.isPlaying).toBe(true);
    expect(result.current.isPaused).toBe(false);
  });

  it('should auto-advance slides when playing', () => {
    const { result } = renderHook(() =>
      useHeroCarousel({
        images: mockImages,
        autoPlayInterval: 1000,
        pauseOnHover: true,
      })
    );

    expect(result.current.currentIndex).toBe(0);

    // Avanzar el tiempo para que se ejecute el autoplay
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(result.current.currentIndex).toBe(1);

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(result.current.currentIndex).toBe(2);

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(result.current.currentIndex).toBe(0); // Debería volver al inicio
  });

  it('should not auto-advance when paused', () => {
    const { result } = renderHook(() =>
      useHeroCarousel({
        images: mockImages,
        autoPlayInterval: 1000,
        pauseOnHover: true,
      })
    );

    act(() => {
      result.current.pause();
    });

    expect(result.current.currentIndex).toBe(0);

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(result.current.currentIndex).toBe(0); // No debería haber cambiado
  });

  it('should not auto-advance when hovering', () => {
    const { result } = renderHook(() =>
      useHeroCarousel({
        images: mockImages,
        autoPlayInterval: 1000,
        pauseOnHover: true,
      })
    );

    act(() => {
      result.current.setHover(true);
    });

    expect(result.current.currentIndex).toBe(0);

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(result.current.currentIndex).toBe(0); // No debería haber cambiado
  });

  it('should handle single image gracefully', () => {
    const singleImage = ['/images/hero/hero-01.png'];
    
    const { result } = renderHook(() =>
      useHeroCarousel({
        images: singleImage,
        autoPlayInterval: 1000,
        pauseOnHover: true,
      })
    );

    expect(result.current.currentIndex).toBe(0);

    act(() => {
      result.current.goToNext();
    });

    expect(result.current.currentIndex).toBe(0); // Debería permanecer en 0

    act(() => {
      result.current.goToPrevious();
    });

    expect(result.current.currentIndex).toBe(0); // Debería permanecer en 0
  });

  it('should clean up timers on unmount', () => {
    const { unmount } = renderHook(() =>
      useHeroCarousel({
        images: mockImages,
        autoPlayInterval: 1000,
        pauseOnHover: true,
      })
    );

    // Verificar que hay un timer activo
    expect(jest.getTimerCount()).toBeGreaterThan(0);

    unmount();

    // Después del unmount, no debería haber timers pendientes
    expect(jest.getTimerCount()).toBe(0);
  });
});
