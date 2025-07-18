// ===================================
// PINTEYA E-COMMERCE - TEST API TRENDING SEARCHES
// ===================================

import { NextRequest } from 'next/server';
import { GET } from '@/app/api/search/trending/route';

// Mock Supabase
const mockSupabaseClient = {
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        eq: jest.fn(() => ({
          gte: jest.fn(() => ({
            not: jest.fn(() => ({
              data: [],
              error: null,
            })),
          })),
        })),
      })),
    })),
  })),
};

jest.mock('@/lib/supabase', () => ({
  getSupabaseClient: jest.fn(() => mockSupabaseClient),
}));

describe('API /api/search/trending', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return trending searches successfully', async () => {
    const request = new NextRequest('http://localhost:3000/api/search/trending');
    
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toBeDefined();
    expect(data.data.trending).toBeDefined();
    expect(Array.isArray(data.data.trending)).toBe(true);
    expect(data.data.trending.length).toBeGreaterThan(0);
  });

  it('should return limited results when limit parameter is provided', async () => {
    const request = new NextRequest('http://localhost:3000/api/search/trending?limit=3');
    
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.trending.length).toBeLessThanOrEqual(3);
  });

  it('should return trending searches with correct structure', async () => {
    const request = new NextRequest('http://localhost:3000/api/search/trending');
    
    const response = await GET(request);
    const data = await response.json();

    expect(data.data.trending[0]).toHaveProperty('id');
    expect(data.data.trending[0]).toHaveProperty('query');
    expect(data.data.trending[0]).toHaveProperty('count');
    expect(data.data.trending[0]).toHaveProperty('href');
    expect(data.data.trending[0]).toHaveProperty('type');
    expect(data.data.trending[0].type).toBe('trending');
  });

  it('should handle category filtering', async () => {
    const request = new NextRequest('http://localhost:3000/api/search/trending?category=pinturas');
    
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    // Should still return results (fallback data)
    expect(data.data.trending.length).toBeGreaterThan(0);
  });
});
