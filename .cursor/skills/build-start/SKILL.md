---
name: build-start
description: Specialized skill for building and starting Next.js applications, handling build errors, verifying production builds, and managing development servers. Use when building the application, starting development servers, troubleshooting build issues, or verifying production readiness.
---

# Build & Start

## Quick Start

When building or starting the application:

1. **Development**: `npm run dev` or `npm run dev:turbo`
2. **Production Build**: `npm run build`
3. **Production Start**: `npm run start`
4. **Vercel Build**: `npm run build:vercel`

## Commands

### Development Server

```bash
# Standard development server
npm run dev

# Development with Turbopack (faster)
npm run dev:turbo
```

**Port**: 3000 (default)  
**Features**: Hot reload, error overlay, fast refresh

### Production Build

```bash
# Standard production build
npm run build

# Vercel-optimized build
npm run build:vercel
```

**Output**: `.next` directory  
**Time**: Typically 20-60 seconds  
**Verification**: Check for build errors and warnings

### Production Server

```bash
# Start production server
npm run start
```

**Port**: 3000 (default)  
**Environment**: Requires `NODE_ENV=production`

## Build Process

### Pre-build Steps

The build process includes automatic pre-build steps:

1. **React Cache Polyfill**: `scripts/create-react-cache-polyfill.js`
   - Creates polyfill for `react/cache` compatibility
   - Required for Next.js 16 compatibility

### Build Configuration

Key build settings in `next.config.js`:

- **TypeScript**: Build errors ignored (temporary)
- **Compiler**: Console removal in production
- **Output**: Optimized for Vercel deployment
- **Bundle Analyzer**: Enabled with `ANALYZE=true`

### Common Build Issues

#### TypeScript Errors

If TypeScript errors block the build:

```bash
# Check TypeScript errors
npx tsc --noEmit

# Build ignores TypeScript errors (configured in next.config.js)
npm run build
```

#### Memory Issues

If build fails due to memory:

```bash
# Increase Node memory limit
NODE_OPTIONS="--max-old-space-size=4096" npm run build
```

#### Module Resolution Errors

If you see module resolution errors:

1. Clear `.next` directory: `rm -rf .next`
2. Clear node_modules: `rm -rf node_modules && npm install`
3. Rebuild: `npm run build`

## Verification Checklist

After building:

- [ ] Build completes without errors
- [ ] No critical warnings in console
- [ ] `.next` directory created successfully
- [ ] Production server starts correctly
- [ ] Pages load without runtime errors
- [ ] Environment variables loaded correctly

## Environment Variables

Required for production build:

- `NEXT_PUBLIC_*` variables (exposed to client)
- Database connection strings
- API keys and secrets
- Tenant configuration

Check `.env.local.example` for required variables.

## Performance Targets

- **Build Time**: < 20s (target)
- **First Load JS**: < 500KB
- **Bundle Size**: Optimized with code splitting

## Troubleshooting

### Build Fails with React Cache Error

```bash
# Ensure polyfill script runs
node scripts/create-react-cache-polyfill.js
npm run build
```

### Build Succeeds but Runtime Errors

1. Check browser console for errors
2. Verify environment variables are set
3. Check server logs for API errors
4. Verify database connections

### Slow Build Times

1. Use Turbopack: `npm run dev:turbo`
2. Check for large dependencies
3. Review bundle analyzer output
4. Consider incremental builds

## Key Files

- `next.config.js` - Build configuration
- `package.json` - Build scripts
- `scripts/create-react-cache-polyfill.js` - Pre-build script
- `.env.local` - Environment variables
