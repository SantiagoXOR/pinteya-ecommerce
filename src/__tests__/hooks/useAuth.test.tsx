// ===================================
// PINTEYA E-COMMERCE - TESTS PARA useAuth HOOK
// ===================================

import { renderHook, act, waitFor } from '@testing-library/react'
import { useAuth, useIsAdmin, useRequireAuth } from '@/hooks/useAuth'
import { useSession, signIn, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { createFullHookWrapper } from '@/__tests__/utils/test-utils'

// Mock next-auth/react
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
  signIn: jest.fn(),
  signOut: jest.fn(),
}))

// Mock next/navigation
const mockPush = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: mockPush,
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  })),
}))

describe('useAuth Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockPush.mockClear()
  })

  it('should return authenticated user when session exists', () => {
    const mockSession = {
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User',
        image: 'https://example.com/avatar.jpg',
      },
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    }

    ;(useSession as jest.Mock).mockReturnValue({
      data: mockSession,
      status: 'authenticated',
    })

    const { result } = renderHook(() => useAuth(), {
      wrapper: createFullHookWrapper({ authState: 'authenticated' }),
    })

    expect(result.current.isSignedIn).toBe(true)
    expect(result.current.isLoaded).toBe(true)
    expect(result.current.user).toEqual({
      id: 'test-user-id',
      email: 'test@example.com',
      name: 'Test User',
      image: 'https://example.com/avatar.jpg',
    })
  })

  it('should return unauthenticated state when no session', () => {
    ;(useSession as jest.Mock).mockReturnValue({
      data: null,
      status: 'unauthenticated',
    })

    const { result } = renderHook(() => useAuth(), {
      wrapper: createFullHookWrapper({ authState: 'unauthenticated' }),
    })

    expect(result.current.isSignedIn).toBe(false)
    expect(result.current.isLoaded).toBe(true)
    expect(result.current.user).toBeNull()
  })

  it('should return loading state when session is loading', () => {
    ;(useSession as jest.Mock).mockReturnValue({
      data: null,
      status: 'loading',
    })

    const { result } = renderHook(() => useAuth(), {
      wrapper: createFullHookWrapper({ authState: 'loading' }),
    })

    expect(result.current.isLoaded).toBe(false)
    expect(result.current.isSignedIn).toBe(false)
  })

  it('should handle sign in', async () => {
    const mockSignIn = signIn as jest.MockedFunction<typeof signIn>
    mockSignIn.mockResolvedValue({ ok: true, error: null, status: 200, url: '/admin' })

    ;(useSession as jest.Mock).mockReturnValue({
      data: null,
      status: 'unauthenticated',
    })

    const { result } = renderHook(() => useAuth(), {
      wrapper: createFullHookWrapper({ authState: 'unauthenticated' }),
    })

    await act(async () => {
      await result.current.signIn('google', { callbackUrl: '/admin' })
    })

    expect(mockSignIn).toHaveBeenCalledWith('google', {
      callbackUrl: '/admin',
      redirect: true,
    })
  })

  it('should handle sign out', async () => {
    const mockSignOut = signOut as jest.MockedFunction<typeof signOut>
    mockSignOut.mockResolvedValue({ ok: true, error: null, status: 200, url: '/' })

    ;(useSession as jest.Mock).mockReturnValue({
      data: {
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
          name: 'Test User',
        },
      },
      status: 'authenticated',
    })

    const { result } = renderHook(() => useAuth(), {
      wrapper: createFullHookWrapper({ authState: 'authenticated' }),
    })

    await act(async () => {
      await result.current.signOut({ callbackUrl: '/' })
    })

    expect(mockSignOut).toHaveBeenCalledWith({
      callbackUrl: '/',
      redirect: true,
    })
  })

  it('should use default callbackUrl for sign in', async () => {
    const mockSignIn = signIn as jest.MockedFunction<typeof signIn>
    mockSignIn.mockResolvedValue({ ok: true, error: null, status: 200, url: '/admin' })

    ;(useSession as jest.Mock).mockReturnValue({
      data: null,
      status: 'unauthenticated',
    })

    const { result } = renderHook(() => useAuth(), {
      wrapper: createFullHookWrapper({ authState: 'unauthenticated' }),
    })

    await act(async () => {
      await result.current.signIn()
    })

    expect(mockSignIn).toHaveBeenCalledWith('google', {
      callbackUrl: '/admin',
      redirect: true,
    })
  })

  it('should use default callbackUrl for sign out', async () => {
    const mockSignOut = signOut as jest.MockedFunction<typeof signOut>
    mockSignOut.mockResolvedValue({ ok: true, error: null, status: 200, url: '/' })

    ;(useSession as jest.Mock).mockReturnValue({
      data: {
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
          name: 'Test User',
        },
      },
      status: 'authenticated',
    })

    const { result } = renderHook(() => useAuth(), {
      wrapper: createFullHookWrapper({ authState: 'authenticated' }),
    })

    await act(async () => {
      await result.current.signOut()
    })

    expect(mockSignOut).toHaveBeenCalledWith({
      callbackUrl: '/',
      redirect: true,
    })
  })
})

describe('useIsAdmin Hook', () => {
  it('should return true for authenticated users', () => {
    ;(useSession as jest.Mock).mockReturnValue({
      data: {
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
          name: 'Test User',
        },
      },
      status: 'authenticated',
    })

    const { result } = renderHook(() => useIsAdmin(), {
      wrapper: createFullHookWrapper({ authState: 'authenticated' }),
    })

    expect(result.current).toBe(true)
  })

  it('should return false for unauthenticated users', () => {
    ;(useSession as jest.Mock).mockReturnValue({
      data: null,
      status: 'unauthenticated',
    })

    const { result } = renderHook(() => useIsAdmin(), {
      wrapper: createFullHookWrapper({ authState: 'unauthenticated' }),
    })

    expect(result.current).toBe(false)
  })
})

describe('useRequireAuth Hook', () => {
  beforeEach(() => {
    mockPush.mockClear()
  })

  it('should redirect when user is not authenticated', () => {
    ;(useSession as jest.Mock).mockReturnValue({
      data: null,
      status: 'unauthenticated',
    })

    renderHook(() => useRequireAuth('/signin'), {
      wrapper: createFullHookWrapper({ authState: 'unauthenticated' }),
    })

    expect(mockPush).toHaveBeenCalledWith('/signin')
  })

  it('should not redirect when user is authenticated', () => {
    ;(useSession as jest.Mock).mockReturnValue({
      data: {
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
          name: 'Test User',
        },
      },
      status: 'authenticated',
    })

    renderHook(() => useRequireAuth('/signin'), {
      wrapper: createFullHookWrapper({ authState: 'authenticated' }),
    })

    expect(mockPush).not.toHaveBeenCalled()
  })

  it('should use default redirect URL', () => {
    ;(useSession as jest.Mock).mockReturnValue({
      data: null,
      status: 'unauthenticated',
    })

    renderHook(() => useRequireAuth(), {
      wrapper: createFullHookWrapper({ authState: 'unauthenticated' }),
    })

    expect(mockPush).toHaveBeenCalledWith('/api/auth/signin')
  })
})
