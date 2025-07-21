#!/usr/bin/env node

/**
 * Script específico para testing de búsqueda "plav" en producción vs desarrollo
 */

const https = require('https');
const http = require('http');

const PRODUCTION_URL = 'https://pinteya-ecommerce.vercel.app';
const LOCAL_URL = 'http://localhost:3001';

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https');
    const client = isHttps ? https : http;
    
    const startTime = Date.now();
    
    const req = client.request(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const timing = Date.now() - startTime;
        
        try {
          const jsonData = JSON.parse(data);
          resolve({
            status: res.statusCode,
            data: jsonData,
            timing,
            success: res.statusCode >= 200 && res.statusCode < 300
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            data: data,
            timing,
            success: false,
            parseError: error.message
          });
        }
      });
    });
    
    req.on('error', (error) => {
      reject({
        error: error.message,
        timing: Date.now() - startTime
      });
    });
    
    req.end();
  });
}

async function testSearchTerm(baseUrl, term, environment) {
  const url = `${baseUrl}/api/products?search=${encodeURIComponent(term)}&limit=10`;
  
  console.log(`\n🔍 Testing "${term}" in ${environment.toUpperCase()}`);
  console.log(`📡 URL: ${url}`);
  
  try {
    const result = await makeRequest(url);
    
    console.log(`✅ Status: ${result.status} (${result.timing}ms)`);
    
    if (result.success && result.data) {
      console.log(`📊 API Success: ${result.data.success}`);
      console.log(`📦 Products found: ${result.data.data?.length || 0}`);
      
      if (result.data.data && result.data.data.length > 0) {
        console.log('🎯 Products:');
        result.data.data.forEach((product, index) => {
          console.log(`  ${index + 1}. ${product.name} (${product.brand})`);
        });
      } else {
        console.log('❌ No products in response');
      }
      
      if (result.data.error) {
        console.log(`🚨 API Error: ${result.data.error}`);
      }
    } else {
      console.log(`❌ Request failed: ${result.status}`);
      if (result.parseError) {
        console.log(`💥 Parse error: ${result.parseError}`);
      }
      console.log(`📄 Raw response: ${result.data.substring(0, 200)}...`);
    }
    
    return result;
    
  } catch (error) {
    console.log(`💥 Request failed: ${error.error}`);
    return error;
  }
}

async function main() {
  console.log('🚀 Testing "plav" search in production vs development\n');
  
  const searchTerms = ['plav', 'plavicon', 'pintura', 'latex'];
  
  for (const term of searchTerms) {
    console.log(`\n${'='.repeat(50)}`);
    console.log(`🔍 TESTING TERM: "${term}"`);
    console.log(`${'='.repeat(50)}`);
    
    // Test en producción
    await testSearchTerm(PRODUCTION_URL, term, 'production');
    
    // Pausa entre requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log(`\n✅ Testing completed!`);
  console.log(`💡 Compare results to identify differences between environments`);
}

if (require.main === module) {
  main().catch(error => {
    console.error(`💥 Error: ${error.message}`);
    process.exit(1);
  });
}
