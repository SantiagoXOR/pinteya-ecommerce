# Bundle Optimization Report

**Generated**: 27/9/2025, 12:11:02
**Build Path**: .next

## Performance Summary

- **Score**: 87/100 (Grade: B)
- **Bundle Size**: 420 KB
- **Gzipped Size**: 145 KB
- **First Load JS**: 88 KB
- **Total JS**: 350 KB

## Chunks Analysis

| Chunk         | Size  | Type    | Priority |
| ------------- | ----- | ------- | -------- |
| framework     | 65 KB | vendor  | critical |
| vendor        | 85 KB | vendor  | critical |
| main          | 45 KB | app     | critical |
| admin         | 75 KB | dynamic | medium   |
| ui-components | 35 KB | shared  | high     |
| charts        | 55 KB | dynamic | low      |

## Budget Violations

1. **Admin Chunk Size** (warning)
   - Actual: 75 KB
   - Expected: 60 KB
   - Impact: medium

## Recommendations

1. **lazy-loading** (high priority)
   - Implementar lazy loading para componentes admin
   - Estimated savings: 30 KB
   - Effort: low
