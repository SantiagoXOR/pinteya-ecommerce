// ===================================
// PINTEYA E-COMMERCE - TESTS PARA HOOK USER PROFILE
// ===================================

import { renderHook, waitFor } from '@testing-library/react';
import { useUserProfile } from '@/hooks/useUserProfile';

// Mock fetch
global.fetch = jest.fn();

const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

const mockUserProfile = {
  id: '1',
  clerk_id: 'clerk_123',
  name: 'Juan Pérez',
  email: 'juan@example.com',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

beforeEach(() => {
  mockFetch.mockClear();
});

describe('useUserProfile', () => {
  it('should initialize with loading state', () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, profile: mockUserProfile }),
    } as Response);

    const { result } = renderHook(() => useUserProfile());

    expect(result.current.loading).toBe(true);
    expect(result.current.profile).toBe(null);
    expect(result.current.error).toBe(null);
  });

  it('should fetch profile successfully', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, profile: mockUserProfile }),
    } as Response);

    const { result } = renderHook(() => useUserProfile());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.profile).toEqual(mockUserProfile);
    expect(result.current.error).toBe(null);
    expect(mockFetch).toHaveBeenCalledWith('/api/user/profile');
  });

  it('should handle fetch error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: false, error: 'Usuario no encontrado' }),
    } as Response);

    const { result } = renderHook(() => useUserProfile());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.profile).toBe(null);
    expect(result.current.error).toBe('Usuario no encontrado');
  });

  it('should handle network error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useUserProfile());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.profile).toBe(null);
    expect(result.current.error).toBe('Error de conexión');
  });

  it('should update profile successfully', async () => {
    // Mock initial fetch
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, profile: mockUserProfile }),
    } as Response);

    const { result } = renderHook(() => useUserProfile());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Mock update
    const updatedProfile = { ...mockUserProfile, name: 'Juan Carlos Pérez' };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, profile: updatedProfile }),
    } as Response);

    const updateResult = await result.current.updateProfile({ name: 'Juan Carlos Pérez' });

    expect(updateResult).toBe(true);
    expect(result.current.profile).toEqual(updatedProfile);
    expect(mockFetch).toHaveBeenLastCalledWith('/api/user/profile', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: 'Juan Carlos Pérez' }),
    });
  });

  it('should handle update error', async () => {
    // Mock initial fetch
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, profile: mockUserProfile }),
    } as Response);

    const { result } = renderHook(() => useUserProfile());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Mock update error
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: false, error: 'Error de validación' }),
    } as Response);

    const updateResult = await result.current.updateProfile({ name: '' });

    expect(updateResult).toBe(false);
    expect(result.current.error).toBe('Error de validación');
    expect(result.current.profile).toEqual(mockUserProfile); // Should remain unchanged
  });

  it('should refresh profile', async () => {
    // Mock initial fetch
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, profile: mockUserProfile }),
    } as Response);

    const { result } = renderHook(() => useUserProfile());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Mock refresh
    const refreshedProfile = { ...mockUserProfile, name: 'Juan Actualizado' };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, profile: refreshedProfile }),
    } as Response);

    result.current.refreshProfile();

    await waitFor(() => {
      expect(result.current.profile).toEqual(refreshedProfile);
    });

    expect(mockFetch).toHaveBeenCalledTimes(3); // Initial + refresh
  });

  it('should provide stable function references', () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, profile: mockUserProfile }),
    } as Response);

    const { result, rerender } = renderHook(() => useUserProfile());

    const initialUpdateProfile = result.current.updateProfile;
    const initialRefreshProfile = result.current.refreshProfile;

    rerender();

    expect(result.current.updateProfile).toBe(initialUpdateProfile);
    expect(result.current.refreshProfile).toBe(initialRefreshProfile);
  });

  it('should handle update network error', async () => {
    // Mock initial fetch
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, profile: mockUserProfile }),
    } as Response);

    const { result } = renderHook(() => useUserProfile());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Mock update network error
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const updateResult = await result.current.updateProfile({ name: 'Test' });

    expect(updateResult).toBe(false);
    expect(result.current.error).toBe('Error de conexión');
  });
});
