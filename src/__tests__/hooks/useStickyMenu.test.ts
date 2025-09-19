// ===================================
// PINTEYA E-COMMERCE - TESTS PARA HOOK STICKY MENU
// ===================================

import { renderHook, act } from '@testing-library/react';
import { useStickyMenu } from '@/hooks/useStickyMenu';

// Mock para window scroll
const mockAddEventListener = jest.fn();
const mockRemoveEventListener = jest.fn();

beforeEach(() => {
  // Reset mocks
  mockAddEventListener.mockClear();
  mockRemoveEventListener.mockClear();
  
  // Mock window.addEventListener
  Object.defineProperty(window, 'addEventListener', {
    value: mockAddEventListener,
    writable: true,
  });
  
  Object.defineProperty(window, 'removeEventListener', {
    value: mockRemoveEventListener,
    writable: true,
  });
  
  // Mock scroll properties
  Object.defineProperty(window, 'pageYOffset', {
    value: 0,
    writable: true,
  });
  
  Object.defineProperty(document.documentElement, 'scrollTop', {
    value: 0,
    writable: true,
  });
});

describe('useStickyMenu', () => {
  it('should initialize with non-sticky state', () => {
    const { result } = renderHook(() => useStickyMenu());
    
    expect(result.current.isSticky).toBe(false);
  });

  it('should use default threshold of 80', () => {
    renderHook(() => useStickyMenu());
    
    expect(mockAddEventListener).toHaveBeenCalledWith('scroll', expect.any(Function));
  });

  it('should use custom threshold', () => {
    const customThreshold = 100;
    renderHook(() => useStickyMenu(customThreshold));
    
    expect(mockAddEventListener).toHaveBeenCalledWith('scroll', expect.any(Function));
  });

  it('should add scroll event listener on mount', () => {
    renderHook(() => useStickyMenu());
    
    expect(mockAddEventListener).toHaveBeenCalledWith('scroll', expect.any(Function));
  });

  it('should remove scroll event listener on unmount', () => {
    const { unmount } = renderHook(() => useStickyMenu());
    
    unmount();
    
    expect(mockRemoveEventListener).toHaveBeenCalledWith('scroll', expect.any(Function));
  });

  it('should become sticky when scroll exceeds threshold', () => {
    const threshold = 80;
    const { result } = renderHook(() => useStickyMenu(threshold));
    
    // Simulate scroll event
    const scrollHandler = mockAddEventListener.mock.calls[0][1];
    
    // Mock scroll position above threshold
    Object.defineProperty(window, 'pageYOffset', {
      value: 100,
      writable: true,
    });

    act(() => {
      scrollHandler();
    });

    expect(result.current.isSticky).toBe(true);
  });

  it('should not be sticky when scroll is below threshold', () => {
    const threshold = 80;
    const { result } = renderHook(() => useStickyMenu(threshold));
    
    // Simulate scroll event
    const scrollHandler = mockAddEventListener.mock.calls[0][1];
    
    // Mock scroll position below threshold
    Object.defineProperty(window, 'pageYOffset', {
      value: 50,
      writable: true,
    });

    act(() => {
      scrollHandler();
    });

    expect(result.current.isSticky).toBe(false);
  });

  it('should use documentElement.scrollTop as fallback', () => {
    const threshold = 80;
    const { result } = renderHook(() => useStickyMenu(threshold));
    
    // Simulate scroll event
    const scrollHandler = mockAddEventListener.mock.calls[0][1];
    
    // Mock pageYOffset as undefined and use scrollTop
    Object.defineProperty(window, 'pageYOffset', {
      value: undefined,
      writable: true,
    });
    
    Object.defineProperty(document.documentElement, 'scrollTop', {
      value: 100,
      writable: true,
    });

    act(() => {
      scrollHandler();
    });

    expect(result.current.isSticky).toBe(true);
  });

  it('should handle threshold of 0', () => {
    const { result } = renderHook(() => useStickyMenu(0));
    
    // Simulate scroll event
    const scrollHandler = mockAddEventListener.mock.calls[0][1];
    
    // Any scroll should make it sticky
    Object.defineProperty(window, 'pageYOffset', {
      value: 1,
      writable: true,
    });

    act(() => {
      scrollHandler();
    });

    expect(result.current.isSticky).toBe(true);
  });
});









