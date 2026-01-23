# 📊 Diagnóstico de Performance - Lighthouse

**Fecha:** 23/1/2026, 12:23:04
**URL:** https://www.pinteya.com
**Ambiente:** production

---

## Móvil

### 📈 Scores por Categoría

| Categoría | Score | Estado |
|-----------|-------|--------|
| Performance | 38/100 | 🔴 |
| Accessibility | 80/100 | 🟡 |
| Best Practices | 57/100 | 🟡 |
| SEO | 100/100 | 🟢 |

### ⚡ Core Web Vitals

| Métrica | Valor | Score | Estado |
|---------|-------|-------|--------|
| LCP | 16.1 s | 0/100 | 🔴 poor |
| FCP | 3.2 s | 43/100 | 🔴 poor |
| CLS | 0 | 100/100 | 🟢 good |
| TBT | 1,060 ms | 25/100 | 🔴 poor |
| SI | 9.2 s | 13/100 | 🔴 poor |
| TTI | 16.4 s | 5/100 | 🔴 undefined |

### 🎯 Oportunidades de Mejora (Top 10)

1. **Reduce unused JavaScript** - Ahorro potencial: 1.1s
   Reduce unused JavaScript and defer loading scripts until they are required to decrease bytes consumed by network activity. [Learn how to reduce unused...

2. **Reduce unused CSS** - Ahorro potencial: 330ms
   Reduce unused rules from stylesheets and defer CSS not used for above-the-fold content to decrease bytes consumed by network activity. [Learn how to r...

3. **Avoid serving legacy JavaScript to modern browsers** - Ahorro potencial: 170ms
   Polyfills and transforms enable legacy browsers to use new JavaScript features. However, many aren't necessary for modern browsers. Consider modifying...

4. **Initial server response time was short** - Ahorro potencial: 111ms
   Keep the server response time for the main document short because all other requests depend on it. [Learn more about the Time to First Byte metric](ht...

5. **Properly size images** - Ahorro potencial: 10ms
   Serve images that are appropriately-sized to save cellular data and improve load time. [Learn how to size images](https://developer.chrome.com/docs/li...


### 🚨 Problemas Críticos

1. **Browser errors were logged to the console** (Score: 0/100)
   Errors logged to the console indicate unresolved problems. They can come from network request failures and other browser concerns. [Learn more about t...

2. **Uses deprecated APIs** (Score: 0/100)
   Deprecated APIs will eventually be removed from the browser. [Learn more about deprecated APIs](https://developer.chrome.com/docs/lighthouse/best-prac...

3. **Uses third-party cookies** (Score: 0/100)
   Third-party cookies may be blocked in some contexts. [Learn more about preparing for third-party cookie restrictions](https://privacysandbox.google.co...

4. **Minimize main-thread work** (Score: 0/100)
   Consider reducing the time spent parsing, compiling and executing JS. You may find delivering smaller JS payloads helps with this. [Learn how to minim...

5. **Reduce JavaScript execution time** (Score: 0/100)
   Consider reducing the time spent parsing, compiling, and executing JS. You may find delivering smaller JS payloads helps with this. [Learn how to redu...

6. **Largest Contentful Paint element** (Score: 0/100)
   This is the largest contentful element painted within the viewport. [Learn more about the Largest Contentful Paint element](https://developer.chrome.c...

7. **`[aria-*]` attributes do not match their roles** (Score: 0/100)
   Each ARIA `role` supports a specific subset of `aria-*` attributes. Mismatching these invalidates the `aria-*` attributes. [Learn how to match ARIA at...

8. **Elements with an ARIA `[role]` that require children to contain a specific `[role]` are missing some or all of those required children.** (Score: 0/100)
   Some ARIA parent roles must contain specific child roles to perform their intended accessibility functions. [Learn more about roles and required child...

9. **Buttons do not have an accessible name** (Score: 0/100)
   When a button doesn't have an accessible name, screen readers announce it as "button", making it unusable for users who rely on screen readers. [Learn...

10. **Background and foreground colors do not have a sufficient contrast ratio.** (Score: 0/100)
   Low-contrast text is difficult or impossible for many users to read. [Learn how to provide sufficient color contrast](https://dequeuniversity.com/rule...


---

## Desktop

### 📈 Scores por Categoría

| Categoría | Score | Estado |
|-----------|-------|--------|
| Performance | 90/100 | 🟢 |
| Accessibility | 80/100 | 🟡 |
| Best Practices | 57/100 | 🟡 |
| SEO | 100/100 | 🟢 |

### ⚡ Core Web Vitals

| Métrica | Valor | Score | Estado |
|---------|-------|-------|--------|
| LCP | 3.5 s | 63/100 | 🟡 needs-improvement |
| FCP | 0.9 s | 100/100 | 🟢 good |
| CLS | 0 | 100/100 | 🟢 good |
| TBT | 70 ms | 99/100 | 🟢 good |
| SI | 2.8 s | 95/100 | 🟢 good |
| TTI | 3.6 s | 92/100 | 🔴 undefined |

### 🎯 Oportunidades de Mejora (Top 10)

1. **Reduce unused JavaScript** - Ahorro potencial: 170ms
   Reduce unused JavaScript and defer loading scripts until they are required to decrease bytes consumed by network activity. [Learn how to reduce unused...

2. **Reduce unused CSS** - Ahorro potencial: 140ms
   Reduce unused rules from stylesheets and defer CSS not used for above-the-fold content to decrease bytes consumed by network activity. [Learn how to r...

3. **Properly size images** - Ahorro potencial: 60ms
   Serve images that are appropriately-sized to save cellular data and improve load time. [Learn how to size images](https://developer.chrome.com/docs/li...

4. **Initial server response time was short** - Ahorro potencial: 47ms
   Keep the server response time for the main document short because all other requests depend on it. [Learn more about the Time to First Byte metric](ht...


### 🚨 Problemas Críticos

1. **Browser errors were logged to the console** (Score: 0/100)
   Errors logged to the console indicate unresolved problems. They can come from network request failures and other browser concerns. [Learn more about t...

2. **Uses deprecated APIs** (Score: 0/100)
   Deprecated APIs will eventually be removed from the browser. [Learn more about deprecated APIs](https://developer.chrome.com/docs/lighthouse/best-prac...

3. **Uses third-party cookies** (Score: 0/100)
   Third-party cookies may be blocked in some contexts. [Learn more about preparing for third-party cookie restrictions](https://privacysandbox.google.co...

4. **Minimize main-thread work** (Score: 0/100)
   Consider reducing the time spent parsing, compiling and executing JS. You may find delivering smaller JS payloads helps with this. [Learn how to minim...

5. **Reduce JavaScript execution time** (Score: 0/100)
   Consider reducing the time spent parsing, compiling, and executing JS. You may find delivering smaller JS payloads helps with this. [Learn how to redu...

6. **Largest Contentful Paint element** (Score: 0/100)
   This is the largest contentful element painted within the viewport. [Learn more about the Largest Contentful Paint element](https://developer.chrome.c...

7. **`[aria-*]` attributes do not match their roles** (Score: 0/100)
   Each ARIA `role` supports a specific subset of `aria-*` attributes. Mismatching these invalidates the `aria-*` attributes. [Learn how to match ARIA at...

8. **Elements with an ARIA `[role]` that require children to contain a specific `[role]` are missing some or all of those required children.** (Score: 0/100)
   Some ARIA parent roles must contain specific child roles to perform their intended accessibility functions. [Learn more about roles and required child...

9. **Buttons do not have an accessible name** (Score: 0/100)
   When a button doesn't have an accessible name, screen readers announce it as "button", making it unusable for users who rely on screen readers. [Learn...

10. **Background and foreground colors do not have a sufficient contrast ratio.** (Score: 0/100)
   Low-contrast text is difficult or impossible for many users to read. [Learn how to provide sufficient color contrast](https://dequeuniversity.com/rule...


---

## 📊 Comparativa Móvil vs Desktop

| Métrica | Móvil | Desktop |
|---------|-------|---------|
| Performance | 38/100 | 90/100 |
| LCP | 16.1 s | 3.5 s |
| FCP | 3.2 s | 0.9 s |

## 💡 Recomendaciones

### Prioridad Alta

- **Optimización de Imágenes**: 2 oportunidades identificadas
- **Optimización de JavaScript**: 5 oportunidades identificadas
- **Optimización de CSS**: 2 oportunidades identificadas

---

**Generado automáticamente por Lighthouse Diagnostic Script**
