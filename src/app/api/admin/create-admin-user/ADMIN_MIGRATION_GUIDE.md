# Admin User Creation Migration Guide

## Overview

This guide explains how to migrate from the separate admin user creation routes to the new unified API endpoint.

## Previous Routes (Deprecated)

### Basic Route

- **Path**: `/api/admin/create-admin-user`
- **Features**: Simple security key, basic validation, direct Supabase client
- **Use Case**: Basic admin user creation

### Enterprise Route

- **Path**: `/api/admin/create-admin-user-enterprise`
- **Features**: Enterprise auth, RLS checks, advanced validation, audit logging
- **Use Case**: Enterprise-grade admin user creation with security features

## New Unified Route

### Endpoint

- **Path**: `/api/admin/create-admin-user/unified`
- **Methods**: `POST`, `GET`

### Features

- ✅ Unified authentication (supports both security keys)
- ✅ Comprehensive validation (email, password complexity)
- ✅ Optional enterprise features (RLS, audit logging)
- ✅ Flexible security levels
- ✅ Consistent error handling
- ✅ Cache invalidation
- ✅ Detailed response formatting

## Migration Steps

### Phase 1: Update Client Code

#### Before (Basic)

```javascript
const response = await fetch('/api/admin/create-admin-user', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'admin@example.com',
    password: 'password123',
    securityKey: 'your-security-key',
  }),
})
```

#### Before (Enterprise)

```javascript
const response = await fetch('/api/admin/create-admin-user-enterprise', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'admin@example.com',
    password: 'ComplexPass123!',
    enterpriseKey: 'your-enterprise-key',
    securityLevel: 'high',
  }),
})
```

#### After (Unified)

```javascript
// Basic usage
const response = await fetch('/api/admin/create-admin-user/unified', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'admin@example.com',
    password: 'password123',
    securityKey: 'your-security-key',
  }),
})

// Enterprise usage
const response = await fetch('/api/admin/create-admin-user/unified', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'admin@example.com',
    password: 'ComplexPass123!',
    enterpriseKey: 'your-enterprise-key',
    securityLevel: 'high',
    enableRLS: true,
    enableAuditLogging: true,
  }),
})
```

### Phase 2: Request Schema

#### Required Fields

- `email`: Valid email address
- `password`: Minimum 8 characters (enterprise: complexity requirements)
- `securityKey` OR `enterpriseKey`: Authentication key

#### Optional Fields

- `securityLevel`: 'standard' | 'high' | 'critical' (default: 'standard')
- `enableRLS`: boolean (default: false)
- `enableAuditLogging`: boolean (default: false)
- `metadata`: Additional user metadata object

### Phase 3: Response Format

#### Success Response

```json
{
  "success": true,
  "action": "admin_user_created",
  "user": {
    "id": "user-uuid",
    "email": "admin@example.com",
    "role": "admin"
  },
  "profile": {
    "id": "profile-uuid",
    "user_id": "user-uuid",
    "role": "admin",
    "security_level": "standard"
  },
  "security": {
    "rls_enabled": false,
    "audit_logging": false,
    "created_by": "system"
  },
  "cache": {
    "invalidated": true
  }
}
```

#### Error Response

```json
{
  "success": false,
  "error": "validation_failed",
  "message": "Password does not meet complexity requirements",
  "details": {
    "field": "password",
    "requirements": ["8+ characters", "uppercase", "lowercase", "number", "special char"]
  }
}
```

## Testing Migration

### 1. Test Basic Functionality

```bash
# Test basic admin creation
curl -X POST http://localhost:3000/api/admin/create-admin-user/unified \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test-admin@example.com",
    "password": "testpass123",
    "securityKey": "your-security-key"
  }'
```

### 2. Test Enterprise Features

```bash
# Test enterprise admin creation
curl -X POST http://localhost:3000/api/admin/create-admin-user/unified \
  -H "Content-Type: application/json" \
  -d '{
    "email": "enterprise-admin@example.com",
    "password": "ComplexPass123!",
    "enterpriseKey": "your-enterprise-key",
    "securityLevel": "high",
    "enableRLS": true,
    "enableAuditLogging": true
  }'
```

### 3. Test API Documentation

```bash
# Get API documentation
curl -X GET http://localhost:3000/api/admin/create-admin-user/unified
```

## Migration Checklist

- [ ] Update all client-side API calls to use unified endpoint
- [ ] Update security keys in environment variables
- [ ] Test basic admin user creation functionality
- [ ] Test enterprise features (if applicable)
- [ ] Verify error handling and validation
- [ ] Update documentation and API references
- [ ] Test cache invalidation
- [ ] Verify RLS and audit logging (enterprise)
- [ ] Remove old route dependencies
- [ ] Update monitoring and logging

## Environment Variables

```env
# Required
ADMIN_SECURITY_KEY=your-basic-security-key
ENTERPRISE_SECURITY_KEY=your-enterprise-security-key
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Optional (Enterprise)
ENABLE_RLS_BY_DEFAULT=false
ENABLE_AUDIT_LOGGING=false
DEFAULT_SECURITY_LEVEL=standard
```

## Benefits of Migration

1. **Unified Interface**: Single endpoint for all admin creation needs
2. **Flexible Security**: Choose between basic and enterprise features
3. **Better Validation**: Comprehensive input validation and error handling
4. **Consistent Responses**: Standardized response format
5. **Enhanced Security**: Optional RLS and audit logging
6. **Maintainability**: Single codebase to maintain
7. **Documentation**: Built-in API documentation endpoint

## Rollback Plan

If issues arise during migration:

1. Keep old routes temporarily during transition
2. Use feature flags to switch between old and new endpoints
3. Monitor error rates and performance metrics
4. Have database backups ready
5. Prepare quick rollback scripts

## Support

For migration assistance:

- Check the unified route's GET endpoint for API documentation
- Review error responses for detailed validation information
- Test in development environment before production deployment
- Monitor logs for any authentication or validation issues

---

**Note**: The old routes (`/api/admin/create-admin-user` and `/api/admin/create-admin-user-enterprise`) should be deprecated after successful migration to the unified endpoint.
