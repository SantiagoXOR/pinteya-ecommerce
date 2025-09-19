# 🚀 Deployment Guide - Secure E-commerce Boilerplate

## 📋 Pre-deployment Checklist

### 🔒 Security Verification
```bash
# Run complete security audit
npm run security:audit

# Verify CORS configuration
npm run security:cors-update

# Check authentication logs
npm run security:auth-logs

# Test security monitoring
npm run security:monitor
```

### 🧪 Testing
```bash
# Run all tests
npm test

# Run E2E tests
npm run test:e2e

# Performance tests
npm run test:performance

# Security tests
npm run test:security
```

## 🌐 Environment Configuration

### Production Environment Variables
```env
# Application
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://yourdomain.com

# Security Configuration
CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
CSP_REPORT_URI=/api/security/csp-report
SECURITY_LOG_LEVEL=warn
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX_REQUESTS=100

# Database
DATABASE_URL=your_production_database_url
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# Authentication
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=https://yourdomain.com

# Monitoring
MONITORING_ENABLED=true
LOG_LEVEL=info
```

### Development Environment Variables
```env
# Application
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Security Configuration (Development)
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
CSP_REPORT_URI=/api/security/csp-report
SECURITY_LOG_LEVEL=debug
RATE_LIMIT_WINDOW=60000
RATE_LIMIT_MAX_REQUESTS=1000

# Database (Development)
DATABASE_URL=your_development_database_url
SUPABASE_URL=your_dev_supabase_url
SUPABASE_ANON_KEY=your_dev_supabase_anon_key

# Authentication (Development)
NEXTAUTH_SECRET=development_secret
NEXTAUTH_URL=http://localhost:3000
```

## 🏗️ Deployment Platforms

### Vercel Deployment

1. **Connect Repository**
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Login and deploy
   vercel login
   vercel --prod
   ```

2. **Environment Variables Setup**
   - Go to Vercel Dashboard → Project → Settings → Environment Variables
   - Add all production environment variables
   - Ensure security variables are properly set

3. **Build Configuration**
   ```json
   // vercel.json
   {
     "buildCommand": "npm run build",
     "outputDirectory": ".next",
     "framework": "nextjs",
     "functions": {
       "app/api/**/*.ts": {
         "maxDuration": 30
       }
     },
     "headers": [
       {
         "source": "/(.*)",
         "headers": [
           {
             "key": "X-Frame-Options",
             "value": "DENY"
           },
           {
             "key": "X-Content-Type-Options",
             "value": "nosniff"
           },
           {
             "key": "Referrer-Policy",
             "value": "strict-origin-when-cross-origin"
           }
         ]
       }
     ]
   }
   ```

### Netlify Deployment

1. **Build Settings**
   ```toml
   # netlify.toml
   [build]
     command = "npm run build"
     publish = ".next"
   
   [build.environment]
     NODE_VERSION = "18"
   
   [[headers]]
     for = "/*"
     [headers.values]
       X-Frame-Options = "DENY"
       X-Content-Type-Options = "nosniff"
       Referrer-Policy = "strict-origin-when-cross-origin"
   ```

### Docker Deployment

1. **Dockerfile**
   ```dockerfile
   FROM node:18-alpine AS base
   
   # Install dependencies only when needed
   FROM base AS deps
   RUN apk add --no-cache libc6-compat
   WORKDIR /app
   
   COPY package.json package-lock.json* ./
   RUN npm ci --only=production
   
   # Rebuild the source code only when needed
   FROM base AS builder
   WORKDIR /app
   COPY --from=deps /app/node_modules ./node_modules
   COPY . .
   
   # Run security audit before build
   RUN npm run security:audit
   RUN npm run build
   
   # Production image
   FROM base AS runner
   WORKDIR /app
   
   ENV NODE_ENV production
   
   RUN addgroup --system --gid 1001 nodejs
   RUN adduser --system --uid 1001 nextjs
   
   COPY --from=builder /app/public ./public
   COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
   COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
   
   USER nextjs
   
   EXPOSE 3000
   
   ENV PORT 3000
   ENV HOSTNAME "0.0.0.0"
   
   CMD ["node", "server.js"]
   ```

2. **Docker Compose**
   ```yaml
   version: '3.8'
   services:
     app:
       build: .
       ports:
         - "3000:3000"
       environment:
         - NODE_ENV=production
         - CORS_ALLOWED_ORIGINS=https://yourdomain.com
         - CSP_REPORT_URI=/api/security/csp-report
       restart: unless-stopped
       healthcheck:
         test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
         interval: 30s
         timeout: 10s
         retries: 3
   ```

## 🔧 Post-Deployment Configuration

### 1. Security Headers Verification
```bash
# Test security headers
curl -I https://yourdomain.com

# Expected headers:
# Content-Security-Policy: [nonce-based policy]
# X-Frame-Options: DENY
# X-Content-Type-Options: nosniff
# Referrer-Policy: strict-origin-when-cross-origin
```

### 2. CORS Testing
```bash
# Test CORS from allowed origin
curl -H "Origin: https://yourdomain.com" https://yourdomain.com/api/test

# Test CORS from disallowed origin (should fail)
curl -H "Origin: https://malicious-site.com" https://yourdomain.com/api/test
```

### 3. CSP Validation
```bash
# Check CSP nonce generation
curl -s https://yourdomain.com | grep -o "nonce-[a-zA-Z0-9+/=]*"
```

### 4. Security Monitoring Setup
```bash
# Test security monitoring endpoint
curl https://yourdomain.com/api/security/monitor

# Should return security statistics and events
```

## 📊 Monitoring & Maintenance

### Health Checks
```bash
# Application health
curl https://yourdomain.com/api/health

# Security monitoring
curl https://yourdomain.com/api/security/monitor

# Performance metrics
curl https://yourdomain.com/api/metrics
```

### Log Monitoring
```bash
# Check application logs
tail -f /var/log/app.log

# Security event logs
tail -f /var/log/security.log

# Authentication logs
tail -f /var/log/auth.log
```

### Regular Maintenance Tasks

#### Daily
- Monitor security dashboard
- Check error logs
- Verify application health

#### Weekly
- Run security audit: `npm run security:audit`
- Analyze authentication logs: `npm run security:auth-logs`
- Review performance metrics

#### Monthly
- Update dependencies
- Review and update security policies
- Backup security configurations
- Test disaster recovery procedures

## 🚨 Incident Response

### Security Incident Checklist
1. **Immediate Response**
   - Check security monitoring dashboard
   - Analyze recent logs with `npm run security:auth-logs`
   - Identify affected systems and data

2. **Investigation**
   - Review CORS and CSP violations
   - Check for suspicious IP addresses
   - Analyze attack patterns

3. **Mitigation**
   - Update security policies if needed
   - Block malicious IPs
   - Rotate secrets if compromised

4. **Recovery**
   - Verify system integrity
   - Update security configurations
   - Document lessons learned

### Emergency Contacts
- Security Team: security@yourdomain.com
- DevOps Team: devops@yourdomain.com
- Management: management@yourdomain.com

## 📈 Performance Optimization

### Build Optimization
```bash
# Analyze bundle size
npm run analyze-bundle

# Optimize imports
npm run optimize-imports

# Remove console logs
npm run remove-console
```

### Runtime Optimization
- Enable gzip compression
- Configure CDN for static assets
- Implement proper caching headers
- Monitor Core Web Vitals

## 🔄 CI/CD Pipeline

### GitHub Actions Example
```yaml
name: Deploy with Security Checks

on:
  push:
    branches: [main]

jobs:
  security-audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run security:audit
      - run: npm run test:security

  deploy:
    needs: security-audit
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - run: npm run deploy
```

## 📚 Additional Resources

- [Security Implementation Guide](./SECURITY-IMPROVEMENTS.md)
- [API Documentation](./docs/api/README.md)
- [Testing Guide](./docs/testing/README.md)
- [Performance Guide](./docs/performance/README.md)

---

**⚠️ Important**: Always run security audits before deploying to production. Ensure all environment variables are properly configured and secrets are secure.