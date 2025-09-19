#!/usr/bin/env node

/**
 * Debug script to understand Clerk authentication structure
 * This will help us identify how sessionClaims are structured
 */

const https = require('https');

async function debugClerkAuth() {
  console.log('🔍 DEBUGGING CLERK AUTHENTICATION STRUCTURE');
  console.log('============================================');

  try {
    // Create a test API endpoint to inspect sessionClaims structure
    console.log('\n📋 Creating debug endpoint to inspect Clerk sessionClaims...');
    
    const debugEndpoint = `
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const { userId, sessionClaims } = await auth();
    
    console.log('🔍 CLERK DEBUG INFO:', {
      userId,
      sessionClaims: JSON.stringify(sessionClaims, null, 2),
      publicMetadata: sessionClaims?.publicMetadata,
      metadata: sessionClaims?.metadata,
      role_from_publicMetadata: sessionClaims?.publicMetadata?.role,
      role_from_metadata: sessionClaims?.metadata?.role
    });

    return NextResponse.json({
      success: true,
      debug: {
        userId,
        sessionClaims,
        publicMetadata: sessionClaims?.publicMetadata,
        metadata: sessionClaims?.metadata,
        possibleRoleLocations: {
          'sessionClaims.publicMetadata.role': sessionClaims?.publicMetadata?.role,
          'sessionClaims.metadata.role': sessionClaims?.metadata?.role,
          'sessionClaims.role': sessionClaims?.role
        }
      }
    });
  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}`;

    console.log('\n📝 Debug endpoint code:');
    console.log('File: src/app/api/debug-clerk-session/route.ts');
    console.log(debugEndpoint);

    console.log('\n🔧 RECOMMENDED FIXES FOR MIDDLEWARE:');
    console.log('===================================');
    
    console.log('\n1. MOST LIKELY FIX - Update middleware to check publicMetadata:');
    console.log('   Change line 27 in src/middleware.ts from:');
    console.log('   const userRole = sessionClaims?.metadata?.role as string');
    console.log('   TO:');
    console.log('   const userRole = sessionClaims?.publicMetadata?.role as string');

    console.log('\n2. ROBUST FIX - Check multiple locations:');
    console.log(`   const userRole = sessionClaims?.publicMetadata?.role || 
                sessionClaims?.metadata?.role || 
                sessionClaims?.role as string`);

    console.log('\n3. FALLBACK FIX - Use Clerk API directly:');
    console.log(`   import { clerkClient } from '@clerk/nextjs/server'
   
   // In middleware, add fallback:
   if (!isAdmin && userId) {
     try {
       const user = await clerkClient.users.getUser(userId);
       const roleFromApi = user.publicMetadata?.role;
       isAdmin = roleFromApi === 'admin';
     } catch (error) {
       console.error('Fallback auth check failed:', error);
     }
   }`);

    console.log('\n🚀 IMMEDIATE ACTION STEPS:');
    console.log('=========================');
    console.log('1. Create the debug endpoint above');
    console.log('2. Access it while logged in to see sessionClaims structure');
    console.log('3. Update middleware based on the actual structure');
    console.log('4. Test admin access');

    console.log('\n🔍 ALTERNATIVE DEBUGGING:');
    console.log('=========================');
    console.log('You can also add console.log directly to middleware:');
    console.log('');
    console.log('In src/middleware.ts, line 30, add:');
    console.log('console.log("[DEBUG] Full sessionClaims:", JSON.stringify(sessionClaims, null, 2));');
    console.log('');
    console.log('Then check Vercel logs or local console for the output.');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Execute
debugClerkAuth().catch(console.error);
