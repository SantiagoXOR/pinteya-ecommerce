#!/usr/bin/env node

// 🧪 Enterprise Testing Script - Comprehensive Test Suite Runner

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// Logging utilities
const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✅${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}❌${colors.reset} ${msg}`),
  header: (msg) => console.log(`\n${colors.bright}${colors.cyan}🧪 ${msg}${colors.reset}\n`),
};

// Test configuration
const testConfig = {
  unit: {
    name: 'Unit Tests',
    command: 'npx jest --config=jest.config.enterprise.js --testPathPattern="__tests__.*\\.test\\.(js|ts|tsx)$" --coverage',
    timeout: 300000, // 5 minutes
  },
  integration: {
    name: 'Integration Tests',
    command: 'npx jest --config=jest.config.enterprise.js --testPathPattern="integration.*\\.test\\.(js|ts)$" --coverage',
    timeout: 600000, // 10 minutes
  },
  e2e: {
    name: 'E2E Tests',
    command: 'npx playwright test src/__tests__/e2e/',
    timeout: 1200000, // 20 minutes
  },
};

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  type: args.includes('--unit') ? 'unit' : 
        args.includes('--integration') ? 'integration' :
        args.includes('--e2e') ? 'e2e' : 'all',
  watch: args.includes('--watch'),
  coverage: args.includes('--coverage'),
  verbose: args.includes('--verbose'),
  bail: args.includes('--bail'),
  updateSnapshots: args.includes('--updateSnapshots'),
  silent: args.includes('--silent'),
};

// Utility functions
function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function runCommand(command, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, { 
      shell: true, 
      stdio: options.silent ? 'pipe' : 'inherit',
      ...options 
    });

    let stdout = '';
    let stderr = '';

    if (options.silent) {
      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });
    }

    child.on('close', (code) => {
      if (code === 0) {
        resolve({ code, stdout, stderr });
      } else {
        reject({ code, stdout, stderr });
      }
    });

    child.on('error', (error) => {
      reject({ error, stdout, stderr });
    });
  });
}

function generateTestReport(results) {
  const reportPath = path.join(process.cwd(), 'coverage', 'enterprise', 'test-summary.json');
  ensureDirectoryExists(path.dirname(reportPath));
  
  const report = {
    timestamp: new Date().toISOString(),
    results,
    summary: {
      total: results.length,
      passed: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
    },
  };

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  log.info(`Test report saved to: ${reportPath}`);
}

async function runUnitTests() {
  log.header('Running Unit Tests');
  
  try {
    let command = testConfig.unit.command;
    
    if (options.watch) command += ' --watch';
    if (options.verbose) command += ' --verbose';
    if (options.bail) command += ' --bail';
    if (options.updateSnapshots) command += ' --updateSnapshot';
    
    await runCommand(command, { 
      timeout: testConfig.unit.timeout,
      silent: options.silent 
    });
    
    log.success('Unit tests completed successfully');
    return { type: 'unit', success: true };
  } catch (error) {
    log.error('Unit tests failed');
    if (options.verbose) {
      console.error(error.stderr || error.stdout || error.error);
    }
    return { type: 'unit', success: false, error };
  }
}

async function runIntegrationTests() {
  log.header('Running Integration Tests');
  
  try {
    let command = testConfig.integration.command;
    
    if (options.verbose) command += ' --verbose';
    if (options.bail) command += ' --bail';
    
    await runCommand(command, { 
      timeout: testConfig.integration.timeout,
      silent: options.silent 
    });
    
    log.success('Integration tests completed successfully');
    return { type: 'integration', success: true };
  } catch (error) {
    log.error('Integration tests failed');
    if (options.verbose) {
      console.error(error.stderr || error.stdout || error.error);
    }
    return { type: 'integration', success: false, error };
  }
}

async function runE2ETests() {
  log.header('Running E2E Tests');
  
  try {
    // Check if Playwright is installed
    try {
      execSync('npx playwright --version', { stdio: 'pipe' });
    } catch {
      log.info('Installing Playwright browsers...');
      execSync('npx playwright install', { stdio: 'inherit' });
    }

    let command = testConfig.e2e.command;
    
    if (options.verbose) command += ' --reporter=list';
    
    await runCommand(command, { 
      timeout: testConfig.e2e.timeout,
      silent: options.silent 
    });
    
    log.success('E2E tests completed successfully');
    return { type: 'e2e', success: true };
  } catch (error) {
    log.error('E2E tests failed');
    if (options.verbose) {
      console.error(error.stderr || error.stdout || error.error);
    }
    return { type: 'e2e', success: false, error };
  }
}

async function checkTestEnvironment() {
  log.header('Checking Test Environment');
  
  const checks = [
    {
      name: 'Node.js version',
      check: () => {
        const version = process.version;
        const major = parseInt(version.slice(1).split('.')[0]);
        return major >= 18;
      },
      message: 'Node.js 18+ required',
    },
    {
      name: 'Jest configuration',
      check: () => fs.existsSync('jest.config.enterprise.js'),
      message: 'jest.config.enterprise.js not found',
    },
    {
      name: 'Test setup file',
      check: () => fs.existsSync('src/__tests__/setup/jest.setup.js'),
      message: 'Jest setup file not found',
    },
    {
      name: 'Coverage directory',
      check: () => {
        ensureDirectoryExists('coverage/enterprise');
        return true;
      },
      message: 'Coverage directory created',
    },
  ];

  for (const check of checks) {
    try {
      if (check.check()) {
        log.success(`${check.name}: OK`);
      } else {
        log.error(`${check.name}: ${check.message}`);
        process.exit(1);
      }
    } catch (error) {
      log.error(`${check.name}: ${check.message}`);
      process.exit(1);
    }
  }
}

async function main() {
  console.log(`${colors.bright}${colors.magenta}`);
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║                    🧪 ENTERPRISE TESTING SUITE               ║');
  console.log('║                     Pinteya E-commerce                       ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log(colors.reset);

  log.info(`Test type: ${options.type}`);
  log.info(`Watch mode: ${options.watch ? 'enabled' : 'disabled'}`);
  log.info(`Coverage: ${options.coverage ? 'enabled' : 'disabled'}`);
  log.info(`Verbose: ${options.verbose ? 'enabled' : 'disabled'}`);

  await checkTestEnvironment();

  const results = [];
  const startTime = Date.now();

  try {
    if (options.type === 'all' || options.type === 'unit') {
      const result = await runUnitTests();
      results.push(result);
      
      if (!result.success && options.bail) {
        log.error('Stopping due to unit test failures (--bail)');
        process.exit(1);
      }
    }

    if (options.type === 'all' || options.type === 'integration') {
      const result = await runIntegrationTests();
      results.push(result);
      
      if (!result.success && options.bail) {
        log.error('Stopping due to integration test failures (--bail)');
        process.exit(1);
      }
    }

    if (options.type === 'all' || options.type === 'e2e') {
      const result = await runE2ETests();
      results.push(result);
      
      if (!result.success && options.bail) {
        log.error('Stopping due to E2E test failures (--bail)');
        process.exit(1);
      }
    }

    const endTime = Date.now();
    const duration = Math.round((endTime - startTime) / 1000);

    // Generate report
    generateTestReport(results);

    // Summary
    log.header('Test Summary');
    const passed = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    log.info(`Total test suites: ${results.length}`);
    log.success(`Passed: ${passed}`);
    if (failed > 0) {
      log.error(`Failed: ${failed}`);
    }
    log.info(`Duration: ${duration}s`);

    if (failed === 0) {
      log.success('🎉 All tests passed!');
      process.exit(0);
    } else {
      log.error('❌ Some tests failed');
      process.exit(1);
    }

  } catch (error) {
    log.error('Test execution failed');
    console.error(error);
    process.exit(1);
  }
}

// Handle process signals
process.on('SIGINT', () => {
  log.warning('Test execution interrupted');
  process.exit(130);
});

process.on('SIGTERM', () => {
  log.warning('Test execution terminated');
  process.exit(143);
});

// Run main function
if (require.main === module) {
  main().catch((error) => {
    log.error('Unexpected error');
    console.error(error);
    process.exit(1);
  });
}

module.exports = { runUnitTests, runIntegrationTests, runE2ETests };
