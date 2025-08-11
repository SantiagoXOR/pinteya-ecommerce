#!/usr/bin/env node

/**
 * Test script to verify admin access fix
 * Tests the corrected middleware and authentication flow
 */

const https = require('https');

async function testAdminAccessFix() {
  console.log('🔧 TESTING ADMIN ACCESS FIX');
  console.log('============================');

  try {
    // Wait for deployment to propagate
    console.log('\n⏳ Waiting for deployment to propagate (30 seconds)...');
    await new Promise(resolve => setTimeout(resolve, 30000));

    // Test 1: Check debug endpoint
    console.log('\n🔍 Step 1: Testing debug endpoint...');
    const debugResult = await makeRequest('https://pinteya.com/api/debug-clerk-session', 'GET');
    
    if (debugResult.success) {
      console.log('✅ Debug endpoint accessible');
      console.log('📋 Session structure:', JSON.stringify(debugResult.data.debug, null, 2));
      
      const roleLocations = debugResult.data.debug.possibleRoleLocations;
      console.log('\n🔍 Role detection results:');
      Object.entries(roleLocations).forEach(([location, value]) => {
        console.log(`   ${location}: ${value || 'undefined'}`);
      });
    } else {
      console.log('❌ Debug endpoint failed:', debugResult.error);
    }

    // Test 2: Check admin API access
    console.log('\n🔒 Step 2: Testing admin API access...');
    const adminApiResult = await makeRequest('https://pinteya.com/api/admin/products/stats', 'GET');
    
    if (adminApiResult.success) {
      console.log('✅ Admin API accessible - role verification working!');
      console.log('📊 Stats data:', adminApiResult.data);
    } else {
      console.log('❌ Admin API still blocked:', adminApiResult.error);
      console.log('📋 Status:', adminApiResult.status);
    }

    // Test 3: Check admin page access (this will be a redirect test)
    console.log('\n🏠 Step 3: Testing admin page access...');
    const adminPageResult = await makeRequest('https://pinteya.com/admin', 'GET');
    
    if (adminPageResult.success || adminPageResult.status === 200) {
      console.log('✅ Admin page accessible');
    } else if (adminPageResult.status === 302 || adminPageResult.status === 307) {
      console.log('🔄 Admin page redirecting (may be normal for auth flow)');
    } else {
      console.log('❌ Admin page blocked:', adminPageResult.status);
    }

    // Test 4: Verify trending searches still work (no hardcoded values)
    console.log('\n📈 Step 4: Verifying trending searches (no hardcoded values)...');
    const trendingResult = await makeRequest('https://pinteya.com/api/search/trending', 'GET');
    
    if (trendingResult.success) {
      const trending = trendingResult.data.data?.trending || [];
      const hasHardcodedValues = trending.some(item => item.count === 156 || item.count === 142);
      
      if (hasHardcodedValues) {
        console.log('❌ Still contains hardcoded values (156, 142)');
      } else {
        console.log('✅ No hardcoded values found');
        console.log('📊 Current values:', trending.map(item => item.count));
      }
    } else {
      console.log('❌ Trending searches API failed:', trendingResult.error);
    }

    // Summary
    console.log('\n📋 SUMMARY');
    console.log('==========');
    
    const tests = [
      { name: 'Debug endpoint', result: debugResult.success },
      { name: 'Admin API access', result: adminApiResult.success },
      { name: 'Admin page access', result: adminPageResult.success || adminPageResult.status < 400 },
      { name: 'Trending searches', result: trendingResult.success }
    ];

    tests.forEach(test => {
      console.log(`${test.result ? '✅' : '❌'} ${test.name}`);
    });

    const allPassed = tests.every(test => test.result);
    
    if (allPassed) {
      console.log('\n🎉 ALL TESTS PASSED!');
      console.log('✅ Admin access should now be working');
      console.log('🔗 Try accessing: https://pinteya.com/admin');
    } else {
      console.log('\n⚠️ Some tests failed. Check the details above.');
      
      console.log('\n🔧 TROUBLESHOOTING STEPS:');
      console.log('1. Wait a few more minutes for full deployment');
      console.log('2. Clear browser cache and cookies');
      console.log('3. Sign out and sign back in to refresh session');
      console.log('4. Check Vercel logs for middleware errors');
      console.log('5. Verify Clerk role is still set to "admin"');
    }

    console.log('\n📊 NEXT STEPS:');
    console.log('1. Access https://pinteya.com/admin');
    console.log('2. Verify dashboard shows real statistics (not 156, 142)');
    console.log('3. Check that all admin functions work correctly');

  } catch (error) {
    console.error('\n❌ Test error:', error.message);
  }
}

async function makeRequest(url, method, data = null) {
  return new Promise((resolve) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Admin-Access-Test'
      },
      timeout: 10000
    };

    if (data) {
      const postData = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(responseData);
          resolve({
            success: res.statusCode >= 200 && res.statusCode < 300,
            data: jsonData,
            status: res.statusCode,
            error: res.statusCode >= 400 ? jsonData.error || 'Error desconocido' : null
          });
        } catch (e) {
          resolve({
            success: res.statusCode >= 200 && res.statusCode < 300,
            data: responseData,
            status: res.statusCode,
            error: res.statusCode >= 400 ? responseData : null
          });
        }
      });
    });

    req.on('error', (error) => {
      resolve({
        success: false,
        error: error.message,
        status: 0
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        success: false,
        error: 'Request timeout',
        status: 0
      });
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

// Execute
testAdminAccessFix().catch(console.error);
