// 🧪 Enterprise Global Setup for Jest

module.exports = async () => {
  console.log('🧪 Setting up enterprise test environment...');
  
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = 'test-clerk-key';
  process.env.CLERK_SECRET_KEY = 'test-clerk-secret';
  
  // Initialize test database if needed
  // await initializeTestDatabase();
  
  console.log('✅ Enterprise test environment ready');
};
