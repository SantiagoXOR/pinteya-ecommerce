// ===================================
// PINTEYA E-COMMERCE - TESTS PARA HOOK SIDEBAR
// ===================================

import { renderHook, act } from '@testing-library/react'
import { useSidebar } from '@/hooks/useSidebar'

// Mock para eventos del DOM
const mockAddEventListener = jest.fn()
const mockRemoveEventListener = jest.fn()

beforeEach(() => {
  // Reset mocks
  mockAddEventListener.mockClear()
  mockRemoveEventListener.mockClear()

  // Mock document.addEventListener
  Object.defineProperty(document, 'addEventListener', {
    value: mockAddEventListener,
    writable: true,
  })

  Object.defineProperty(document, 'removeEventListener', {
    value: mockRemoveEventListener,
    writable: true,
  })
})

describe('useSidebar', () => {
  it('should initialize with closed state', () => {
    const { result } = renderHook(() => useSidebar())

    expect(result.current.isOpen).toBe(false)
  })

  it('should toggle sidebar state', () => {
    const { result } = renderHook(() => useSidebar())

    act(() => {
      result.current.toggle()
    })

    expect(result.current.isOpen).toBe(true)

    act(() => {
      result.current.toggle()
    })

    expect(result.current.isOpen).toBe(false)
  })

  it('should open sidebar', () => {
    const { result } = renderHook(() => useSidebar())

    act(() => {
      result.current.open()
    })

    expect(result.current.isOpen).toBe(true)
  })

  it('should close sidebar', () => {
    const { result } = renderHook(() => useSidebar())

    // First open it
    act(() => {
      result.current.open()
    })

    expect(result.current.isOpen).toBe(true)

    // Then close it
    act(() => {
      result.current.close()
    })

    expect(result.current.isOpen).toBe(false)
  })

  it('should add event listeners when sidebar is open', () => {
    const { result } = renderHook(() => useSidebar())

    act(() => {
      result.current.open()
    })

    expect(mockAddEventListener).toHaveBeenCalledWith('mousedown', expect.any(Function))
    expect(mockAddEventListener).toHaveBeenCalledWith('keydown', expect.any(Function))
  })

  it('should remove event listeners when sidebar is closed', () => {
    const { result } = renderHook(() => useSidebar())

    // Open sidebar first
    act(() => {
      result.current.open()
    })

    // Then close it
    act(() => {
      result.current.close()
    })

    expect(mockRemoveEventListener).toHaveBeenCalledWith('mousedown', expect.any(Function))
    expect(mockRemoveEventListener).toHaveBeenCalledWith('keydown', expect.any(Function))
  })

  it('should provide stable function references', () => {
    const { result, rerender } = renderHook(() => useSidebar())

    const initialToggle = result.current.toggle
    const initialOpen = result.current.open
    const initialClose = result.current.close

    rerender()

    expect(result.current.toggle).toBe(initialToggle)
    expect(result.current.open).toBe(initialOpen)
    expect(result.current.close).toBe(initialClose)
  })
})
