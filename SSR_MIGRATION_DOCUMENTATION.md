# Bazarna — Angular SSR Migration Documentation

**Project:** Bazarna E-Commerce Platform  
**Framework:** Angular v21  
**SSR Package:** `@angular/ssr` v21.0.4  
**Migration Date:** May 2026  
**Author:** Engineering Team  

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [SSR Architecture Overview](#2-ssr-architecture-overview)
3. [Files Added / Modified](#3-files-added--modified)
4. [Browser API Protection](#4-browser-api-protection)
5. [PLATFORM_ID and SSR Guards](#5-platform_id-and-ssr-guards)
6. [Authentication SSR Compatibility](#6-authentication-ssr-compatibility)
7. [Cart and Storage Handling](#7-cart-and-storage-handling)
8. [HTTP / API Rendering Behavior](#8-http--api-rendering-behavior)
9. [Angular Material and UI Compatibility](#9-angular-material-and-ui-compatibility)
10. [Hydration](#10-hydration)
11. [SEO Improvements](#11-seo-improvements)
12. [Performance Improvements](#12-performance-improvements)
13. [SSR Risks and Limitations](#13-ssr-risks-and-limitations)
14. [Best Practices](#14-best-practices)
15. [Debugging Guide](#15-debugging-guide)
16. [Testing Guide](#16-testing-guide)
17. [Final Migration Summary](#17-final-migration-summary)

---

## 1. Executive Summary

### Why SSR Was Added

Bazarna is an e-commerce application. E-commerce platforms have two fundamental requirements that a purely client-side rendered (CSR) Angular application fails to satisfy:

1. **Search Engine Indexability** — Search engine crawlers (Googlebot, Bingbot) fetch a URL and expect meaningful HTML content in the initial response. A pure CSR app returns a nearly empty HTML shell with a `<script>` tag. The crawler either skips the page entirely or waits for JavaScript execution, which degrades ranking signals. For an e-commerce site, this directly impacts organic traffic and product discoverability.

2. **Perceived and Actual Load Performance** — In CSR, the browser must: download the HTML shell → download the JavaScript bundle → parse and execute JavaScript → fetch API data → render the DOM → paint. The user sees a blank screen or spinner for the entire duration of this waterfall. On slow mobile connections, this can be several seconds. SSR collapses this waterfall significantly by sending a fully rendered HTML page in the first response.

### Problems SSR Solves

| Problem | CSR Behavior | SSR Behavior |
|---|---|---|
| Blank initial screen | User sees nothing until JS loads | User sees rendered HTML immediately |
| SEO — product pages | Crawlers see `<app-root></app-root>` | Crawlers see full product listings |
| First Contentful Paint | Blocked on JS bundle download | HTML paints on first byte |
| Social media previews | Open Graph tags not rendered | Tags present in server-rendered HTML |
| Slow network conditions | Large JS bundle required before any display | HTML renders independently of JS |

### Expected SEO and Performance Benefits

- **FCP (First Contentful Paint)** — Reduced by eliminating the JS parse/execute/fetch waterfall for initial content.
- **LCP (Largest Contentful Paint)** — Product images and headings are in the initial HTML, allowing the browser to begin loading them before JavaScript runs.
- **TTFB (Time to First Byte)** — Slightly higher than CSR (server must render) but subsequent payload is complete HTML, not a bare shell.
- **Crawlability** — 100% of public routes (`/`, `/products`, `/menu`, `/about`, `/contact`, `/login`) are now fully indexable without JavaScript execution.
- **Core Web Vitals** — Improved INP and CLS scores due to hydration event replay and stable initial layout.

### Hydration Benefits

Angular's **hydration** mechanism means the server-rendered HTML is not discarded after the JavaScript bundle loads. Instead, Angular reuses the existing DOM nodes and attaches event listeners to them. This eliminates the visible flash-of-re-render that old SSR implementations caused and provides instant interactivity once the JS bundle is parsed.

With `withEventReplay()`, user interactions (clicks, inputs) that happen before hydration completes are recorded and replayed once Angular is fully initialized — so no user action is ever lost.

### Server Rendering Flow (High Level)

```
User requests /products
       │
       ▼
  Express server (src/server.ts)
       │
       ▼
  AngularNodeAppEngine.handle(req)
       │
       ├── Looks up route in serverRoutes
       │   → /products = RenderMode.Server
       │
       ▼
  Angular bootstraps with app.config.server.ts
       │
       ├── ProductsService constructor runs
       ├── HTTP GET /api/products (Node.js Fetch)
       ├── Products signal populated
       │
       ▼
  Angular renders component tree to HTML string
       │
       ▼
  Transfer state serialized into HTML (HTTP cache)
       │
       ▼
  Complete HTML response sent to browser
       │
       ▼
  Browser displays HTML immediately (paint)
       │
       ▼
  Browser downloads Angular JS bundle
       │
       ▼
  Angular hydrates: attaches to existing DOM
  (no re-render, no flicker)
       │
       ▼
  Transfer state replays HTTP cache → zero duplicate API calls
       │
       ▼
  App is fully interactive
```

---

## 2. SSR Architecture Overview

### Angular SSR Architecture

Angular's SSR stack for this project is composed of four distinct layers:

```
┌─────────────────────────────────────────────────────────┐
│                      Browser Client                      │
│  main.ts → bootstrapApplication(App, appConfig)         │
│  + provideClientHydration(withEventReplay())             │
└───────────────────────┬─────────────────────────────────┘
                        │ HTTP Request
                        ▼
┌─────────────────────────────────────────────────────────┐
│                  Express Server (server.ts)              │
│  express() + helmet() + static file serving             │
│  AngularNodeAppEngine.handle(req) → response            │
└───────────────────────┬─────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│              Angular SSR Engine                          │
│  main.server.ts → bootstrapApplication(App, config)     │
│  config = mergeApplicationConfig(appConfig, serverConfig)│
│  serverConfig → provideServerRendering(withRoutes(...))  │
└───────────────────────┬─────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│              Route-Based Render Decision                 │
│  app.routes.server.ts                                   │
│  RenderMode.Prerender | Server | Client                  │
└─────────────────────────────────────────────────────────┘
```

### Three Render Modes Explained

Angular v17+ introduced a per-route rendering mode API. Bazarna uses all three modes strategically:

#### `RenderMode.Prerender`
The route is rendered **at build time**, producing a static HTML file stored on disk. When a request arrives, the Express server serves this static file without invoking the Angular engine. This is the fastest possible delivery — zero server compute per request.

**When to use:** Routes with no user-specific content and no frequently changing data.  
**Bazarna routes:** `/about`, `/contact`, `/login`

#### `RenderMode.Server`
The route is rendered **at request time** by the running Express + Angular engine. For every incoming request, Angular bootstraps, fetches data, renders the component tree to HTML, and returns a complete response. This is true SSR — the HTML reflects real-time data.

**When to use:** Public routes with dynamic API-backed data.  
**Bazarna routes:** `/` (home with categories), `/products`, `/menu`

#### `RenderMode.Client`
The server returns a minimal HTML shell with the Angular bootstrap scripts. The browser performs all rendering. This is effectively CSR, but the route is still served through the same Express pipeline.

**When to use:** Routes with user-specific content, authentication requirements, or browser-only APIs (localStorage, sessionStorage) that cannot safely run on the server.  
**Bazarna routes:** `/cart`, `/checkout`, `/profile`, `/edit-profile`, `/wishlist`, `/order-success`, `/confirm-signup`, `/auth/verify-email`

### Request Lifecycle (Full Detail)

```
1. Browser sends: GET /products HTTP/1.1

2. Express receives request
   └─ Static file check: no match in /browser directory
   └─ Falls through to Angular handler

3. AngularNodeAppEngine.handle(req)
   └─ Matches route: /products
   └─ Looks up serverRoutes: RenderMode.Server
   └─ Bootstraps Angular with app.config.server.ts

4. Angular DI initializes on server
   └─ ProductsService constructor runs (no platform check)
   └─ HttpClient (withFetch) → GET http://localhost:3009/api/products
   └─ Zone.js tracks this async task
   └─ Angular waits for all async tasks to complete

5. Component tree renders
   └─ ProductsComponent accesses productsService.getProducts()
   └─ Signal contains populated data
   └─ Template renders to HTML string

6. Transfer state is written
   └─ HTTP responses cached as JSON in <script type="application/json">

7. Complete HTML sent to browser
   └─ Contains full product list in DOM
   └─ Contains transfer state payload

8. Browser receives HTML → paints immediately (FCP)

9. Browser downloads JS bundle asynchronously

10. Angular bootstrap in browser
    └─ provideClientHydration() activates
    └─ Angular traverses existing DOM (no re-render)
    └─ Event listeners attached to existing elements
    └─ withEventReplay() replays any buffered interactions

11. Transfer state rehydrates HttpClient cache
    └─ When ProductsService constructor runs in browser,
       HttpClient checks transfer cache first
    └─ Cache hit → no duplicate API call made

12. App is fully interactive
```

### Rendering Differences: CSR vs SSR

| Aspect | CSR (Before) | SSR (After) |
|---|---|---|
| Initial HTML | `<app-root></app-root>` | Full rendered DOM |
| Data on first paint | None | Products/categories already in HTML |
| JavaScript required to see content | Yes | No |
| SEO crawlability | Poor | Full |
| First paint speed | Slow (JS waterfall) | Fast (HTML first) |
| Duplicate API calls | Never (single run) | Prevented by transfer cache |
| Auth-protected pages | Loaded in browser | Still browser-only (Client mode) |
| Socket.io | Initializes on load | Server-skipped, browser-only |

---

## 3. Files Added / Modified

### `@angular/ssr` was already installed

Inspection of `package.json` revealed that `@angular/ssr@^21.0.4` was already a dependency and all scaffolding files were already present. The migration focused entirely on **correctness** and **safety** fixes rather than initial scaffolding.

---

### `src/server.ts` — Express SSR Entry Point

**Status:** Pre-existing, no changes required.  
**Purpose:** Node.js HTTP server that serves the Angular application for SSR.

```typescript
import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import helmet from 'helmet';
import { join } from 'node:path';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();

// Serve pre-built static assets (Prerender routes, JS bundles, CSS)
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

// All other requests → Angular SSR engine
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});

// Start server standalone or via PM2
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) throw error;
    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

export const reqHandler = createNodeRequestHandler(app);
```

**Key decisions:**
- `helmet` provides security headers (XSS protection, HSTS, etc.) without explicit CSP, which avoids blocking Angular's hydration inline scripts.
- `maxAge: '1y'` on static assets enables aggressive browser caching with content-hashed filenames.
- `index: false` prevents Express from auto-serving `index.html`, ensuring all requests flow through the Angular engine for proper route handling.
- `AngularNodeAppEngine` is the bridge between Express and Angular's server-side bootstrap. It handles zone tracking, async task draining, and HTML serialization internally.

---

### `src/main.server.ts` — Server Bootstrap Entry Point

**Status:** Pre-existing, no changes required.  
**Purpose:** Exported default function that Angular's SSR engine calls to bootstrap the application for each server render.

```typescript
import { BootstrapContext, bootstrapApplication } from '@angular/platform-browser';
import { App } from './app/app';
import { config } from './app/app.config.server';

const bootstrap = (context: BootstrapContext) =>
    bootstrapApplication(App, config, context);

export default bootstrap;
```

**Key point:** This file exports a **factory function**, not a bootstrapped application. The Angular SSR engine calls this function for every request that requires server rendering. Each call creates a fresh, isolated Angular application instance — preventing state leakage between user requests.

---

### `src/app/app.config.server.ts` — Server Application Configuration

**Status:** Pre-existing, no changes required.  
**Purpose:** Merges the shared `appConfig` with server-only providers.

```typescript
import { mergeApplicationConfig, ApplicationConfig } from '@angular/core';
import { provideServerRendering, withRoutes } from '@angular/ssr';
import { appConfig } from './app.config';
import { serverRoutes } from './app.routes.server';

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(withRoutes(serverRoutes))
  ]
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
```

**`provideServerRendering(withRoutes(serverRoutes))`** does several things:
1. Registers the `PLATFORM_ID` token with value `'server'` — enabling all `isPlatformBrowser()` guards throughout the app to correctly return `false`.
2. Wires up the per-route render mode lookup from `serverRoutes`.
3. Installs the server-side HTTP transfer state writer that serializes API responses into the rendered HTML.
4. Disables browser-specific providers that would throw in Node.js.

---

### `src/app/app.routes.server.ts` — Per-Route Render Mode Configuration

**Status:** Modified (CRITICAL change).  
**Purpose:** Defines which render mode (Prerender / Server / Client) each route uses.

#### Before

```typescript
export const serverRoutes: ServerRoute[] = [
  {
    path: '**',
    renderMode: RenderMode.Prerender
  }
];
```

**The problem with the original configuration:** Applying `RenderMode.Prerender` to `**` means every route in the application — including `/profile`, `/cart`, `/checkout`, `/auth/verify-email` — would be pre-built as static HTML at build time. This causes:

- **Auth-protected pages prerendered as unauthenticated:** `AuthGuard.canActivate()` calls `initUser()` which returns `of(false)` on the server (no access token). The guard then calls `router.navigate(['/login'])` during prerendering, effectively prerendering a redirect rather than the actual page content.
- **`sessionStorage` crash:** `VerifyEmailComponent.ngOnInit()` called `sessionStorage.removeItem()` without a platform guard. During prerender, `sessionStorage` is `undefined` in Node.js → **runtime crash**.
- **User-specific pages baked as empty:** Cart, checkout, wishlist contain user-specific data that changes per session. Prerendering them produces a meaningless static snapshot.
- **Dynamic query params:** `/auth/verify-email?token=...` requires unique URL parameters per user. Prerendering a static version is impossible.

#### After

```typescript
export const serverRoutes: ServerRoute[] = [
  // Truly static pages — pre-built at build time for best performance
  { path: 'about', renderMode: RenderMode.Prerender },
  { path: 'contact', renderMode: RenderMode.Prerender },
  { path: 'login', renderMode: RenderMode.Prerender },

  // Dynamic public pages with API data — rendered per request on the server
  { path: '', renderMode: RenderMode.Server },
  { path: 'products', renderMode: RenderMode.Server },
  { path: 'menu', renderMode: RenderMode.Server },

  // User-specific / auth-dependent pages — client-only
  { path: 'cart', renderMode: RenderMode.Client },
  { path: 'checkout', renderMode: RenderMode.Client },
  { path: 'profile', renderMode: RenderMode.Client },
  { path: 'edit-profile', renderMode: RenderMode.Client },
  { path: 'wishlist', renderMode: RenderMode.Client },
  { path: 'order-success', renderMode: RenderMode.Client },
  { path: 'confirm-signup', renderMode: RenderMode.Client },
  { path: 'auth/verify-email', renderMode: RenderMode.Client },

  // Fallback
  { path: '**', renderMode: RenderMode.Server },
];
```

**Build output confirmation:**
```
Prerendered 3 static routes.    ← /about, /contact, /login
```

---

### `src/app/app.config.ts` — Browser Application Configuration

**Status:** Modified.  
**Purpose:** Root providers for the browser-side Angular application. Server config merges with this.

#### Before

```typescript
provideHttpClient(withInterceptors([authInterceptor])),
```

#### After

```typescript
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';

provideHttpClient(withFetch(), withInterceptors([authInterceptor])),
```

**Why `withFetch()` matters for SSR:**

Angular's `HttpClient` has two transport layers:
1. **`XMLHttpRequest`** (default without `withFetch`) — browser-native, does not exist in Node.js
2. **Fetch API** (`withFetch()`) — available natively in Node.js 18+ and all modern browsers

Without `withFetch()`, Angular uses a polyfill (`xhr2` package, visible in the build output as `chunk-BP7AI3FB.mjs | xhr2`) for server-side HTTP. While this polyfill works, the native Fetch API is more efficient and consistent across environments. `withFetch()` ensures:

- The same HTTP transport code path runs on both server and browser
- Angular's HTTP transfer cache works reliably (the cache key hashing is consistent)
- No polyfill overhead in the server bundle

The full `appConfig` after migration:

```typescript
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideAppInitializer(() => {
      const authService = inject(AuthService);
      return authService.initUser();
    }),
    provideRouter(routes),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor])),
    provideClientHydration(withEventReplay()),
    provideAnimationsAsync()
  ]
};
```

**`provideClientHydration(withEventReplay())`** — explained in depth in [Section 10](#10-hydration).

---

### `angular.json` — Build Configuration

**Status:** Pre-existing SSR configuration, no changes required.

The relevant SSR-enabling options were already present:

```json
"build": {
  "builder": "@angular/build:application",
  "options": {
    "browser": "src/main.ts",
    "server": "src/main.server.ts",
    "outputMode": "server",
    "ssr": {
      "entry": "src/server.ts"
    }
  }
}
```

**Key fields:**
- `"server": "src/main.server.ts"` — Points to the server bootstrap entry point. This triggers Angular CLI to build a server bundle in addition to the browser bundle.
- `"outputMode": "server"` — Instructs the builder to produce a Node.js-runnable server output. Contrast with `"static"` which produces only pre-rendered files.
- `"ssr": { "entry": "src/server.ts" }` — Points to the Express server file. The CLI bundles this into `dist/bazarna/server/server.mjs`.

---

### `package.json` — Scripts

**Status:** Pre-existing SSR script already present, no changes required.

```json
"scripts": {
  "start": "ng serve",
  "build": "ng build",
  "watch": "ng build --watch --configuration development",
  "test": "ng test",
  "serve:ssr:bazarna": "node dist/bazarna/server/server.mjs"
}
```

- `npm run build` — Builds browser + server bundles and pre-renders static routes.
- `npm run serve:ssr:bazarna` — Starts the Express SSR server from the compiled output.

---

## 4. Browser API Protection

### Why SSR Crashes With Browser APIs

When Angular SSR renders on the server, the execution environment is **Node.js**, not a browser. Node.js has no DOM, no `window` global, no `document` object, no `localStorage`, no `sessionStorage`, no `navigator`, and no browser-specific APIs.

When Angular code that references these APIs executes during server rendering, Node.js throws a `ReferenceError`:

```
ReferenceError: sessionStorage is not defined
ReferenceError: window is not defined
ReferenceError: document is not defined
```

These errors crash the entire SSR render for that request, resulting in a 500 server error.

The fix is to detect the execution environment before calling any browser-only API and branch accordingly. Angular provides this via `PLATFORM_ID` and `isPlatformBrowser()`.

---

### Fix 1 — `verify-email.component.ts`: `sessionStorage` in `ngOnInit`

**Severity:** HIGH — crashes the SSR server  
**Location:** `src/app/features/verify-email/verify-email.component.ts`

**Root Cause:**  
`ngOnInit()` is a lifecycle hook that runs during Angular's component initialization phase. With SSR, component initialization (including lifecycle hooks) runs **on the server** to produce the HTML output. The `sessionStorage` global does not exist in Node.js.

Even with `auth/verify-email` set to `RenderMode.Client` after the fix, defensive guards are the correct practice because render modes can change in the future and the code itself should not depend on external configuration for correctness.

#### Before

```typescript
import { ChangeDetectionStrategy, Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

export class VerifyEmailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);

  ngOnInit() {
    const token = this.route.snapshot.queryParamMap.get('token');
    // ...

    this.authService.verifyEmail(token).subscribe({
      next: () => {
        this.verificationStatus.set('success');
        this.message.set('Email verified successfully! You can now sign in.');
        sessionStorage.removeItem('pendingVerificationEmail'); // ❌ CRASHES on server
      },
      error: (error) => { /* ... */ }
    });
  }
}
```

#### After

```typescript
import { ChangeDetectionStrategy, Component, inject, signal, OnInit, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

export class VerifyEmailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);
  private platformId = inject(PLATFORM_ID); // ✅ injected

  ngOnInit() {
    const token = this.route.snapshot.queryParamMap.get('token');
    // ...

    this.authService.verifyEmail(token).subscribe({
      next: () => {
        this.verificationStatus.set('success');
        this.message.set('Email verified successfully! You can now sign in.');
        if (isPlatformBrowser(this.platformId)) {    // ✅ guarded
          sessionStorage.removeItem('pendingVerificationEmail');
        }
      },
      error: (error) => { /* ... */ }
    });
  }
}
```

---

### Fix 2 — `login.component.ts`: `sessionStorage` in `onSubmit`

**Severity:** LOW — `onSubmit` is a form submission handler triggered by user interaction. User interactions cannot occur on the server. However, the unguarded access is technically incorrect and must be fixed for future-proofing.

**Root Cause:** Direct `sessionStorage.setItem()` call in an event handler without a platform guard.

#### Before

```typescript
export class LoginComponent {
  // No PLATFORM_ID

  onSubmit() {
    // ...signup branch:
    this.authService.signup(name!, email!, password!).subscribe({
      next: () => {
        sessionStorage.setItem('pendingVerificationEmail', email!); // ❌ Unguarded
        this.router.navigate(['/confirm-signup']);
      },
    });
  }
}
```

#### After

```typescript
import { ChangeDetectionStrategy, Component, inject, signal, OnInit, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export class LoginComponent {
  private platformId = inject(PLATFORM_ID); // ✅

  onSubmit() {
    // ...signup branch:
    this.authService.signup(name!, email!, password!).subscribe({
      next: () => {
        if (isPlatformBrowser(this.platformId)) {    // ✅ guarded
          sessionStorage.setItem('pendingVerificationEmail', email!);
        }
        this.router.navigate(['/confirm-signup']);
      },
    });
  }
}
```

---

### Fix 3 — `confirm-signup.component.ts`: `sessionStorage` in `resendVerification`

**Severity:** LOW — user interaction handler, but unguarded.

#### Before

```typescript
export class ConfirmSignupComponent {
  // No PLATFORM_ID

  resendVerification() {
    const email = sessionStorage.getItem('pendingVerificationEmail'); // ❌ Unguarded
    if (!email) {
      // error handling...
      return;
    }
    // ...
  }
}
```

#### After

```typescript
import { ChangeDetectionStrategy, Component, inject, signal, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export class ConfirmSignupComponent {
  private platformId = inject(PLATFORM_ID); // ✅

  resendVerification() {
    if (!isPlatformBrowser(this.platformId)) return; // ✅ early exit on server

    const email = sessionStorage.getItem('pendingVerificationEmail');
    if (!email) {
      // error handling...
      return;
    }
    // ...
  }
}
```

---

### Pre-existing Correct Guards (Already SSR-Safe)

These APIs were already correctly guarded before this migration:

| File | API Protected | Guard Used |
|---|---|---|
| `auth.service.ts` | `window.localStorage`, `document.cookie` | `isPlatformBrowser(this.platformId)` |
| `auth.service.ts` | `initUser()` server path | `!isPlatformBrowser(this.platformId)` → returns `of(false)` |
| `cart.service.ts` | `sessionStorage` (all 3 usages) | `isPlatformBrowser(this.platformId)` |
| `cart.service.ts` | Constructor side effects | `isPlatformBrowser(this.platformId)` |
| `socket.service.ts` | `io()` (Socket.io init) | `isPlatformBrowser(this.platformId)` |
| `session-activity.service.ts` | DOM events, timers | `this.isBrowser` (set via `isPlatformBrowser`) |
| `modal.component.ts` | `document.addEventListener` | `this.isBrowser` guard |

---

### APIs Not Present in This Codebase

The following browser APIs were audited and confirmed absent:

- `navigator` — Not used anywhere
- `ResizeObserver` — Not used anywhere
- `IntersectionObserver` — Not used anywhere
- `matchMedia` — Not used anywhere
- Direct `window.*` (other than already guarded `window.localStorage`) — Not present

---

### Special Case: `auth.interceptor.ts`

The interceptor contains a module-level utility function that uses `typeof window`:

```typescript
const isDebugEnabled = (): boolean => {
  if (typeof window === 'undefined') return false;   // ← typeof check
  return window.localStorage.getItem(DEBUG_STORAGE_KEY) === 'true';
};
```

This pattern is **functionally correct** for SSR. The `typeof window === 'undefined'` check is a JavaScript-level guard that evaluates to `true` in Node.js. Angular's `isPlatformBrowser()` is preferred in component/service code because it integrates with Angular's DI and is testable, but for module-level functions that have no access to the Angular injector, `typeof window === 'undefined'` is an acceptable and explicit guard.

**This was intentionally left unchanged** to avoid unnecessary refactoring of a correctly functioning guard.

---

## 5. PLATFORM_ID and SSR Guards

### What is `PLATFORM_ID`?

`PLATFORM_ID` is an Angular **injection token** that holds a string identifying the current rendering platform. It is injected via Angular's DI system and is set automatically based on the bootstrap configuration:

- In `bootstrapApplication(App, appConfig)` (browser): `PLATFORM_ID = 'browser'`
- In `bootstrapApplication(App, config)` (server, via `app.config.server.ts` with `provideServerRendering`): `PLATFORM_ID = 'server'`

### `isPlatformBrowser(platformId)`

```typescript
import { PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class MyService {
  private platformId = inject(PLATFORM_ID);

  doSomething() {
    if (isPlatformBrowser(this.platformId)) {
      // Safe to access: window, document, localStorage, sessionStorage,
      // navigator, DOM APIs, browser events
    }
  }
}
```

Returns `true` only when `platformId === 'browser'`. Returns `false` for `'server'` and any other value (e.g., Web Workers).

### `isPlatformServer(platformId)`

```typescript
import { isPlatformServer } from '@angular/common';

if (isPlatformServer(this.platformId)) {
  // Runs only on server — useful for:
  // - Server-only optimizations
  // - Setting server-specific metadata
  // - Skipping browser animations
}
```

Returns `true` only when `platformId === 'server'`.

### When to Use Each

| Pattern | When to Use |
|---|---|
| `if (isPlatformBrowser(platformId))` | Wrapping any browser-only API call |
| `if (!isPlatformBrowser(platformId)) return` | Early exit in lifecycle hooks or constructors |
| `if (isPlatformServer(platformId))` | Server-specific logic (e.g., setting cache headers) |
| `isBrowser = isPlatformBrowser(platformId)` | Store as field for repeated checks in a class |

### Best Practices

**Always inject at class level, not inline:**

```typescript
// ✅ Correct
@Component({ ... })
export class MyComponent {
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

  ngOnInit() {
    if (this.isBrowser) { /* ... */ }
  }
}

// ❌ Avoid
@Component({ ... })
export class MyComponent {
  ngOnInit() {
    if (isPlatformBrowser(inject(PLATFORM_ID))) { /* inject() outside constructor */ }
  }
}
```

**Guard at the earliest possible point:**

```typescript
// ✅ Guard the constructor to prevent any browser-side effect
constructor() {
  if (!isPlatformBrowser(this.platformId)) return;

  this.initBrowserOnlyFeature();
  this.setupEventListeners();
}

// ❌ Worse: guard each individual call
constructor() {
  if (isPlatformBrowser(this.platformId)) {
    this.initBrowserOnlyFeature();
  }
  if (isPlatformBrowser(this.platformId)) {
    this.setupEventListeners();
  }
}
```

**Real project example from `CartService`:**

```typescript
constructor() {
  if (isPlatformBrowser(this.platformId)) {
    this.restoreCartFromStorage(); // reads sessionStorage
    if (this.authService.getAccessToken()) {
      this.loadCart();             // makes authenticated HTTP call
    }
    this.initStockUpdates();       // subscribes to socket events
  }
}
```

---

## 6. Authentication SSR Compatibility

### Auth Architecture Overview

Bazarna uses a **dual-token authentication** scheme:
- **HTTP-only `refreshToken` cookie** — Stored server-side in the browser's cookie jar. Cannot be read by JavaScript. Persists across browser sessions.
- **In-memory `accessToken`** — Stored in an Angular signal (`this.accessToken = signal<string | null>(null)`). Lives only in the JavaScript heap. Lost on page refresh unless restored via a refresh token call.
- **CSRF token** — Stored in a readable cookie (`csrf_token`), read via `document.cookie`, and sent as `X-CSRF-Token` header with mutating requests.

### Auth Flow Before SSR

```
Browser                          API Server
  │                                 │
  ├─ Load Angular app               │
  ├─ provideAppInitializer runs      │
  │   └─ authService.initUser()     │
  │       ├─ Read csrf_token cookie  │
  │       ├─ POST /auth/refresh ────►│
  │       │                ◄────────┤ 200 { accessToken, user }
  │       └─ accessToken signal set │
  │                                 │
  ├─ App renders with auth state    │
  └─ Authenticated user sees data   │
```

### Auth Flow With SSR

On the server, `initUser()` is guarded to return immediately:

```typescript
// auth.service.ts
initUser(): Observable<boolean> {
  if (!isPlatformBrowser(this.platformId)) {
    this.authInitialized.set(true);
    return of(false); // ← Server always returns unauthenticated
  }
  // ... browser auth flow continues
}
```

**Why this is correct:**

The access token is stored in memory (Angular signals). On the server, each request creates a **new, isolated Angular instance** — there is no shared state between requests. The server has no way to know the user's access token unless it's explicitly forwarded in the request context (which this implementation deliberately avoids for security).

The consequence: **Server-rendered pages are always rendered in an unauthenticated state.**

This is acceptable and intentional because:
1. All authenticated routes (`/profile`, `/edit-profile`, `/checkout`, `/order-success`) use `RenderMode.Client` — they are never server-rendered.
2. Public pages (`/products`, `/`, `/menu`) show the same content regardless of auth state (product listings are public).
3. The auth state is fully restored in the browser before any user interaction.

### Protected Routes

`AuthGuard` uses `canActivate()`:

```typescript
@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  private authService = inject(AuthService);
  private router = inject(Router);

  canActivate(): Observable<boolean> {
    return this.authService.initUser().pipe(
      map((isLoggedIn) => {
        if (!isLoggedIn) {
          this.router.navigate(['/login']);
        }
        return isLoggedIn;
      })
    );
  }
}
```

With `RenderMode.Client` for all protected routes, `canActivate()` only ever runs in the browser where `initUser()` performs the real refresh token check. If the browser has no valid refresh token cookie, the user is redirected to `/login`.

### Token Handling Updates

No changes were required to token handling. The existing design was already SSR-safe:

| Concern | Implementation | SSR Safety |
|---|---|---|
| Access token storage | Angular signal (in-memory) | ✅ Server gets fresh instance |
| Refresh token | HTTP-only cookie | ✅ Not readable by server JS |
| CSRF token | Readable cookie via `document.cookie` | ✅ Guarded by `isPlatformBrowser` |
| `initUser()` server path | Returns `of(false)` | ✅ Explicit server guard |
| Cookie reading | `readCookieValue()` | ✅ Returns `null` on server |

### Auth Interceptor

The `authInterceptor` runs on every HTTP request. On the server, `getAccessToken()` returns `null` (signal default), so no `Authorization` header is set. The server simply makes unauthenticated API calls, which correctly returns public data only.

```typescript
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getAccessToken(); // null on server

  if (token) {
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
  }
  // No token → request proceeds unauthenticated
  return next(req).pipe(/* ... 401 refresh logic ... */);
};
```

The 401 refresh retry logic in the interceptor calls `authService.refreshAccessToken()`. On the server, `refreshAccessToken()` would make an HTTP call to `/auth/refresh`. This is acceptable since the `withCredentials: true` setting would forward cookies if present in the server request context. In practice, since the server renders only public routes, authenticated endpoints are not called during SSR.

### Hydration Authentication Synchronization

After hydration, the browser's Angular instance runs `provideAppInitializer`:

```typescript
provideAppInitializer(() => {
  const authService = inject(AuthService);
  return authService.initUser(); // Runs in browser → real auth check
}),
```

Angular waits for this promise to resolve before completing the app bootstrap. This means:
1. The rendered HTML shows unauthenticated state
2. After hydration, `initUser()` fires a refresh token call
3. If the user has a valid refresh token, the access token is restored
4. Angular's signal reactivity automatically updates the UI (header shows user name, etc.)

This brief transition from unauthenticated to authenticated state is the correct and expected behavior. There is no hydration mismatch because authenticated-only UI elements (profile name, etc.) only appear **after** the client-side auth initialization completes — they are not part of the server-rendered HTML for public routes.

---

## 7. Cart and Storage Handling

### Why Storage Access Breaks in SSR

`sessionStorage` and `localStorage` are browser APIs defined on the global `window` object. In Node.js:

```
sessionStorage.getItem('key')
// ReferenceError: sessionStorage is not defined
```

### Cart Persistence Implementation

`CartService` uses `sessionStorage` to persist cart items across page navigations within a browser session. All storage operations are correctly guarded:

```typescript
@Injectable({ providedIn: 'root' })
export class CartService {
  private platformId = inject(PLATFORM_ID);
  private storageKey = 'cartItems';

  constructor() {
    if (isPlatformBrowser(this.platformId)) {  // ✅ Server: skips entirely
      this.restoreCartFromStorage();
      if (this.authService.getAccessToken()) {
        this.loadCart();
      }
      this.initStockUpdates();
    }
  }

  private restoreCartFromStorage() {
    if (!isPlatformBrowser(this.platformId)) return; // ✅ Double guard
    const raw = sessionStorage.getItem(this.storageKey);
    if (!raw) return;
    try {
      const items = JSON.parse(raw) as CartItem[];
      if (Array.isArray(items)) {
        this.cartItems.set(items);
      }
    } catch {
      sessionStorage.removeItem(this.storageKey);
    }
  }

  private persistCart() {
    if (!isPlatformBrowser(this.platformId)) return; // ✅ Guard
    sessionStorage.setItem(this.storageKey, JSON.stringify(this.cartItems()));
  }

  private clearStoredCart() {
    if (!isPlatformBrowser(this.platformId)) return; // ✅ Guard
    sessionStorage.removeItem(this.storageKey);
  }
}
```

### Hydration Restoration Strategy

Since `/cart` uses `RenderMode.Client`, the server never renders cart content. The browser-rendered cart component triggers:

1. Angular bootstrap in browser
2. `CartService` constructor runs → `isPlatformBrowser` is `true`
3. `restoreCartFromStorage()` reads `sessionStorage` → restores cart items into signal
4. If user is authenticated, `loadCart()` fetches backend cart and overwrites signal with server-authoritative data

This means the cart signal transitions: `[] → sessionStorage items → backend items`. The sessionStorage restore provides instant visual feedback while the API call is in flight.

### Fallback Behavior on Server

On the server, `CartService` constructor exits early. The `cartItems` signal remains at its default value `[]`. This is correct behavior since `/cart` is `Client` mode — the server never renders the cart component.

---

## 8. HTTP / API Rendering Behavior

### SSR HTTP Requests

During server rendering of `RenderMode.Server` routes, `HttpClient` makes real HTTP requests using Node.js's native Fetch API. Angular's Zone.js tracks these requests as async tasks. The SSR engine waits for Zone.js to drain (all async tasks complete) before serializing the HTML.

This means:

```typescript
// products.service.ts — constructor
constructor() {
  this.loadProducts();    // HTTP GET /api/products
  this.loadCategories();  // HTTP GET /api/categories
}
// Angular waits for both to complete before rendering
```

The rendered HTML will contain the populated product and category data.

### Before vs After: `products.service.ts`

#### Before (SSR-incompatible for Server mode routes)

```typescript
constructor() {
  if (isPlatformBrowser(this.platformId)) {
    this.loadProducts();    // ❌ Never called on server
    this.loadCategories();  // ❌ Never called on server
  }
}
```

With this guard, server-rendered pages (`/`, `/products`, `/menu`) would render with empty product/category lists. Crawlers would index empty pages. Hydration would then refetch, causing a visual jump.

#### After (SSR-enabled)

```typescript
constructor() {
  // Load on both server and browser.
  // provideClientHydration() transfer cache prevents duplicate browser requests.
  this.loadProducts();
  this.loadCategories();
}
```

Both calls run on server AND browser. The duplicate browser requests are intercepted by the HTTP transfer cache (see next section).

### Duplicate Request Prevention via Transfer Cache

`provideClientHydration()` automatically enables Angular's **HTTP Transfer Cache**. Here is exactly how it works:

```
Server Phase:
  1. ProductsService constructor runs on server
  2. HttpClient GET /api/products is made
  3. Response arrives, products signal populated
  4. Angular renders the HTML
  5. Transfer cache serializes the HTTP response:
     <script id="ng-transfer-state" type="application/json">
       { "B/api/products": { "body": [...], "status": 200, ... } }
     </script>
  6. This JSON is embedded in the final HTML

Browser Phase (Hydration):
  1. Browser receives HTML, parses it
  2. Angular hydrates (reuses existing DOM)
  3. Transfer state script is parsed into memory
  4. ProductsService constructor runs in browser
  5. HttpClient GET /api/products is issued
  6. Transfer cache intercepts the request
  7. Cache hit: returns cached server response immediately
  8. No actual HTTP request is made to /api/products in browser
  9. products signal populated from cache
  10. No UI change needed (data already in DOM)
```

This zero-duplicate-request behavior is critical for performance. Without it, every SSR-rendered page would trigger a second round of API calls after hydration.

### Error Handling During SSR

If an API call fails during server rendering:

```typescript
private loadProducts() {
  this.http.get<ApiResponse<Product[]>>(`${this.apiUrl}/products`).subscribe({
    next: (res) => {
      if (res.success) this.products.set(res.data);
    }
    // No error handler — silent failure
  });
}
```

Silent failure means:
- The products signal remains empty (`[]`)
- The server renders an empty products list
- No 500 error is thrown
- The browser re-fetches successfully (no transfer cache entry for the failed request)
- The UI updates when data arrives in the browser

This is acceptable behavior: degraded SSR (empty server-rendered page) with full browser recovery. For improved resilience, an explicit error handler could be added that logs server-side errors.

---

## 9. Angular Material and UI Compatibility

### Angular Material SSR Behavior

Angular Material components in this project (`MatSnackBar`, dialog overlays from `MatSnackBar.open()`) use Angular's `Overlay` service, which interacts with the DOM.

**`provideAnimationsAsync()`** — Used in `appConfig`. This defers animation module loading to async import. On the server, Angular Material's animation providers handle the absence of browser animation APIs gracefully. The `provideAnimationsAsync()` call is merged into the server config via `mergeApplicationConfig`, but Angular SSR's platform providers disable browser animations on the server.

**`MatSnackBar`** — Used in `HeaderComponent`, `ProfileComponent`. Snackbars are triggered by user interactions (button clicks) which only occur in the browser. No SSR concern.

### Hydration Mismatch Prevention

Angular Material components render with specific DOM structures. A hydration mismatch occurs when the server-rendered DOM structure differs from what Angular would render in the browser.

The key risk areas and their resolution:

| Component | Risk | Resolution |
|---|---|---|
| `MatSnackBar` | Only triggered on user interaction | No server rendering path |
| `ModalComponent` | `document.addEventListener` | Guarded by `isBrowser` |
| `provideAnimationsAsync()` | Animation state on server | Angular disables on server automatically |

### `ModalComponent` — Document Event Listener Guard

```typescript
export class ModalComponent {
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

  constructor() {
    effect(() => {
      const open = this.isOpen();

      if (!this.isBrowser) {          // ✅ Server: bypass DOM operations
        this.isVisible.set(open);
        this.isAnimating.set(open);
        return;
      }

      if (open) {
        this.isVisible.set(true);
        this.isAnimating.set(true);
        if (this.closeOnEscape()) {
          document.addEventListener('keydown', this.handleKeyDown); // ✅ Browser only
        }
        setTimeout(() => this.focusDialog(), 0);
      } else {
        this.isAnimating.set(false);
        setTimeout(() => {
          this.isVisible.set(false);
          document.removeEventListener('keydown', this.handleKeyDown);
        }, 300);
      }
    });
  }
}
```

---

## 10. Hydration

### What Is Hydration?

Traditional SSR implementations work in two phases:
1. **Server renders** full HTML → sent to browser
2. **Browser discards** server HTML → re-renders from scratch with Angular

This causes a visible flash between the server-rendered content and the Angular-rendered content.

**Angular Hydration** (introduced in Angular v16, stable in v17+) replaces this with:
1. **Server renders** full HTML → sent to browser → user sees content immediately
2. **Browser downloads** Angular bundle
3. **Angular hydrates** the existing server-rendered DOM instead of replacing it → attaches event listeners, activates two-way data binding
4. The DOM is **never destroyed and re-created** → zero flicker

### How Angular Hydration Works

```typescript
// app.config.ts
provideClientHydration(withEventReplay())
```

`provideClientHydration()` enables:
1. **DOM reuse:** Angular's reconciler identifies server-rendered nodes by their position in the component tree and reuses them instead of creating new nodes.
2. **Transfer state:** Serializes server-side HTTP responses into the HTML (as inline JSON) so the browser can skip duplicate API calls.
3. **DOM validation:** In development mode, Angular walks the hydrated DOM and warns if mismatches are detected.

`withEventReplay()` enables:
1. **Event buffering:** Before Angular's JS bundle loads and hydration completes, the browser still processes user events (clicks, keypresses). `withEventReplay()` captures these events in a queue.
2. **Event replay:** After hydration completes, the queued events are dispatched through Angular's normal event handling pipeline.
3. **Result:** No user interaction is ever lost due to the hydration window.

### Hydration Lifecycle

```
t=0ms   Server HTML received, browser starts painting
        ↓
t=~50ms First Contentful Paint — user sees product list
        ↓
t=~50ms Angular bundle download begins
        ↓
t=~200ms [If user clicks anything, withEventReplay() captures it]
        ↓
t=~500ms Angular bundle parsed
        ↓
t=~510ms Angular bootstrap with provideClientHydration()
         - Walks the DOM tree
         - Matches components to DOM nodes
         - Attaches event listeners
         - Replays transfer state HTTP cache
         ↓
t=~520ms Hydration complete
         - provideAppInitializer runs
         - authService.initUser() called
         - Buffered events replayed
         ↓
t=~600ms Auth state restored (if user has valid refresh token)
         - Header updates to show user name
         - Cart count restored
         ↓
t=~600ms App fully interactive
```

### Hydration Mismatch Causes

A hydration mismatch occurs when the DOM Angular expects (based on running the same component tree in the browser) differs from the DOM that was server-rendered. Angular logs warnings for these.

**Common causes:**

1. **Conditional DOM based on browser-only state:**
   ```html
   <!-- ❌ Server renders nothing (signal is false) -->
   <!-- Browser renders element (signal becomes true after init) -->
   @if (isBrowser) { <div>Browser content</div> }
   ```

2. **Date/time rendering:**
   ```typescript
   // ❌ Different time on server vs browser
   title = `Loaded at ${new Date().toLocaleTimeString()}`;
   ```

3. **Random values:**
   ```typescript
   // ❌ Different random values
   id = Math.random().toString();
   ```

4. **Missing platform guards (like our sessionStorage fixes):**
   If server-rendered content differs from browser content due to unguarded storage reads.

**Bazarna-specific hydration mismatch risk (mitigated):**

`isLoggedIn` computed signal is used in templates to show/hide auth-specific UI. On the server, `isLoggedIn()` is always `false` (no access token in memory). In the browser, after `initUser()` completes, it may become `true`. This transition happens **after** hydration completes (in `provideAppInitializer`), not during, so Angular's DOM comparison during hydration will see matching states (both false). No mismatch.

### Debugging Hydration Errors

Enable hydration debugging in development:

```typescript
// main.ts (development only)
import { enableDebugTools } from '@angular/platform-browser';

bootstrapApplication(App, appConfig).then(appRef => {
  enableDebugTools(appRef.components[0]);
});
```

Or use browser DevTools:
```javascript
// In browser console
ng.getComponent(document.querySelector('app-root'))
```

Angular's hydration mismatches appear as:

```
NG0500: To prevent this error, ensure the server-rendered content matches 
what Angular expects during hydration.
```

Check the Angular DevTools browser extension for a visual component tree diff.

---

## 11. SEO Improvements

### Why SSR Improves SEO

Search engine crawlers operate by:
1. Fetching a URL via HTTP GET
2. Parsing the returned HTML
3. Indexing the text content, links, and metadata found in the HTML

**CSR (before):** The HTML returned for `/products` was:
```html
<html>
  <head>
    <title>Bazarna</title>
  </head>
  <body>
    <app-root></app-root>
    <script src="main-HBQIUXAH.js"></script>
  </body>
</html>
```
Crawlers parsing this see no product names, no categories, no descriptions — only a `<script>` tag.

**SSR (after):** The HTML returned for `/products` contains:
```html
<html>
  <head>
    <title>Bazarna</title>
  </head>
  <body>
    <app-root>
      <app-layout>
        <app-navbar><!-- navigation links --></app-navbar>
        <main>
          <div class="products-grid">
            <div class="product-card">
              <h3>Product Name</h3>
              <p>Product Description</p>
              <span class="price">150 EGP</span>
            </div>
            <!-- all products... -->
          </div>
        </main>
      </app-layout>
    </app-root>
    <script type="application/json" id="ng-transfer-state">...</script>
    <script src="main-HBQIUXAH.js"></script>
  </body>
</html>
```

### Prerendered Routes — Best SEO

`/about`, `/contact`, `/login` are prerendered at build time. These pages are served as static HTML files with zero server compute. Crawlers receive these instantly and they score highest on TTFB.

### Server-Rendered Routes — Full Dynamic SEO

`/`, `/products`, `/menu` are server-rendered per request with live API data. Crawlers see real product names, categories, and prices.

### Social Media Previews

Open Graph tags (`og:title`, `og:description`, `og:image`) must be present in the server-returned HTML for social media platforms to generate link previews. With SSR, these can be set dynamically using Angular's `Meta` and `Title` services within components, and they will be present in the server HTML.

```typescript
// Example: future enhancement
import { Meta, Title } from '@angular/platform-browser';

@Component({ ... })
export class ProductsComponent {
  private meta = inject(Meta);
  private title = inject(Title);

  ngOnInit() {
    this.title.setTitle('Products | Bazarna');
    this.meta.updateTag({ property: 'og:title', content: 'Browse Products | Bazarna' });
    this.meta.updateTag({ property: 'og:description', content: 'Discover our full catalog...' });
  }
}
```

---

## 12. Performance Improvements

### First Contentful Paint (FCP)

**Definition:** The time from navigation start until the browser renders the first piece of DOM content.

**CSR:** FCP is blocked on: DNS → TCP → TLS → HTML download → JS download → JS parse → JS execute → first render. Typically 1–4 seconds on average mobile.

**SSR:** FCP occurs as soon as the HTML response body starts streaming. The browser paints immediately. FCP is reduced to: DNS → TCP → TLS → HTML download (first bytes). Typically 200–600ms.

### Largest Contentful Paint (LCP)

**Definition:** The time until the largest content element visible in the viewport is rendered.

**CSR:** Product images are only requested after JS runs and the DOM is built. LCP is blocked on the full JS waterfall.

**SSR:** Product image `<img src="...">` tags are in the initial HTML. The browser discovers and requests these images while the JS bundle is still downloading. LCP is significantly improved.

### Time to First Byte (TTFB)

**Definition:** Time from request to first byte of the response.

**CSR:** Very low TTFB — server returns the static HTML shell almost instantly.

**SSR:** Slightly higher TTFB — server must bootstrap Angular, fetch API data, and render before responding. The tradeoff is a complete, content-filled response vs. a near-instant empty one.

Typical SSR TTFB budget: < 200ms for prerendered routes (static file read), 200–800ms for Server mode routes (depending on API latency).

### No Duplicate API Calls (Transfer Cache)

Without the transfer cache, SSR would provide the HTML immediately but cause a second round of API requests after hydration — doubling the load on the API server and causing a visible data refresh in the UI.

With the transfer cache enabled by `provideClientHydration()`, the browser's Angular instance consumes the cached API responses from the inline JSON, making zero additional API calls for data already fetched during SSR.

### Bundle Size Observation

```
Browser bundles:
  main-HBQIUXAH.js    462.55 kB (97.51 kB gzipped)
  chunk-XCJ53UF4.js   184.23 kB (55.12 kB gzipped)
```

⚠️ The initial bundle exceeds Angular's default 500 kB budget. This is flagged in the build output as a warning. This is a pre-existing concern unrelated to SSR but worth addressing:

**Recommendation:** Convert route imports in `app.routes.ts` to lazy loading:

```typescript
// Before (eager)
import { ProductsComponent } from './features/products/products.component';
{ path: 'products', component: ProductsComponent }

// After (lazy)
{
  path: 'products',
  loadComponent: () => import('./features/products/products.component')
    .then(m => m.ProductsComponent)
}
```

This reduces the initial bundle by deferring non-critical route components to separate chunks loaded on demand.

---

## 13. SSR Risks and Limitations

### 1. API Availability at SSR Time

**Risk:** Server-rendered routes (`/`, `/products`, `/menu`) make live HTTP calls to `http://localhost:3009/api` during rendering. If the API server is unavailable:
- HTTP requests fail silently (no error handler in `loadProducts` / `loadCategories`)
- Server renders empty product list
- Crawlers index empty pages
- Browser recovers by re-fetching in the client

**Mitigation:**
- Add error handlers to `loadProducts()` / `loadCategories()` with server-side logging
- Consider a circuit breaker pattern for resilience
- Use health checks before starting the SSR server

### 2. Memory Leaks in SSR Context

**Risk:** Each SSR request creates a new Angular application instance. If a service holds subscriptions, timers, or event listeners that are not cleaned up, they leak memory.

**Current status:**
- `SessionActivityService` has `clearAllTimers()` guarded by `this.isBrowser` — safe
- `SocketService` only initializes in browser — safe
- All timers in `SessionActivityService` are browser-only — safe

**Rule:** Never start timers, subscriptions, or event listeners in constructors without platform guards or `ngOnDestroy` cleanup.

### 3. Shared Mutable State

**Risk:** If a service stores mutable state in a variable outside the Angular DI tree (e.g., a module-level variable), it will be shared across all SSR requests — a severe security issue where one user's data could leak to another.

```typescript
// ❌ DANGEROUS — module-level variable shared across all requests
let currentUser: User | null = null;

@Injectable({ providedIn: 'root' })
export class DangerousService {
  getUser() { return currentUser; }
}
```

**Current status:** All state in Bazarna is stored in Angular signals inside `@Injectable({ providedIn: 'root' })` services. With `provideServerRendering()`, each request gets a new DI scope, so `providedIn: 'root'` services are instantiated fresh per request. This is safe.

### 4. Server Load and Horizontal Scaling

**Risk:** SSR adds CPU cost per request (Angular bootstrap + rendering). Under high traffic, the Express server may become a bottleneck.

**Mitigations:**
- `RenderMode.Prerender` for static routes eliminates rendering cost entirely
- `RenderMode.Client` for user-specific routes keeps server load low
- Only `RenderMode.Server` routes (`/`, `/products`, `/menu`) incur per-request rendering cost
- Use PM2 cluster mode (`process.env['pm_id']` is already checked in `server.ts`)
- Add a CDN (Cloudflare, CloudFront) to cache server-rendered responses for public routes

### 5. Cookie and Authentication on SSR

**Risk:** If a future feature requires server-side authentication (e.g., personalized SSR product recommendations), the server-side Angular context cannot automatically access the user's refresh token cookie.

**Current status:** Not an issue — all auth-dependent pages are `RenderMode.Client`.

**If server-side auth is ever needed:**
```typescript
import { REQUEST } from '@angular/ssr';

@Injectable({ providedIn: 'root' })
export class ServerAuthService {
  private request = inject(REQUEST, { optional: true });

  getServerCookies(): string {
    return this.request?.headers.cookie ?? '';
  }
}
```

### 6. Browser-Only Libraries

`socket.io-client` is correctly guarded behind `isPlatformBrowser()`. No server-side socket connection is attempted.

**Remaining browser-only features that are correctly scoped to `RenderMode.Client`:**
- `sessionStorage` for cart and email verification flow
- Socket.io real-time stock updates
- Session activity tracking (idle timeout, mouse/keyboard events)

### 7. `standalone: true` Redundancy

Some components declare `standalone: true` explicitly (e.g., `HeaderComponent`, `HomeComponent`, `ProfileComponent`). In Angular v19+, all components are standalone by default. This is a cosmetic redundancy, not a bug, but should be cleaned up over time.

---

## 14. Best Practices

### SSR-Safe Angular Coding Standards

#### DO — Inject PLATFORM_ID for any browser API

```typescript
@Injectable({ providedIn: 'root' })
export class MyService {
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

  init() {
    if (!this.isBrowser) return;
    // browser-only code here
  }
}
```

#### DO — Guard constructor side effects

```typescript
constructor() {
  if (!isPlatformBrowser(this.platformId)) return;
  this.setupWebSocket();
  this.loadFromStorage();
  this.registerEventListeners();
}
```

#### DO — Use `DOCUMENT` token instead of `document` directly

```typescript
import { DOCUMENT } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class MyService {
  private document = inject(DOCUMENT);

  getCookies() {
    return this.document.cookie; // ✅ Uses DI token
  }
}
```

#### DO — Use Angular's `Title` and `Meta` services for SEO

```typescript
import { Title, Meta } from '@angular/platform-browser';

@Component({ ... })
export class ProductsComponent {
  private title = inject(Title);
  private meta = inject(Meta);

  ngOnInit() {
    this.title.setTitle('Products | Bazarna');
    this.meta.updateTag({ name: 'description', content: 'Browse our catalog...' });
  }
}
```

#### DO — Use `RenderMode.Client` for any route that cannot be safely server-rendered

#### DO — Use `withFetch()` in `provideHttpClient`

```typescript
provideHttpClient(withFetch(), withInterceptors([...]))
```

---

### FORBIDDEN Patterns

```typescript
// ❌ Direct window access without guard
const width = window.innerWidth;

// ❌ Direct sessionStorage without guard
sessionStorage.setItem('key', value);

// ❌ Direct document without guard
document.querySelector('.my-element');

// ❌ setTimeout/setInterval in constructor without guard
constructor() {
  setInterval(() => this.refresh(), 5000);
}

// ❌ Module-level mutable state
let globalUser: User | null = null; // shared across all SSR requests!

// ❌ nativeElement DOM manipulation in server-running lifecycle hooks
ngOnInit() {
  this.elementRef.nativeElement.style.display = 'none'; // ❌
}
```

---

### Future Development Guidelines

1. **New services with browser APIs:** Always inject `PLATFORM_ID` and guard immediately in the constructor.

2. **New routes:** Always add an explicit entry in `app.routes.server.ts`. Do not rely on the `**` fallback for production routes.

3. **New components with lifecycle hooks:** If `ngOnInit`, `ngAfterViewInit`, or `constructor` accesses any DOM/storage API, add `isPlatformBrowser` guard.

4. **`ngAfterViewInit`:** This hook is particularly risky — it runs after the view is created, but in SSR contexts it may still execute. Always guard DOM operations inside it.

5. **Third-party libraries:** Before adding any new npm package, verify SSR compatibility. Libraries using `window`, `document`, or `process.browser` flags require wrapping.

6. **Lazy loading:** All future feature routes should use `loadComponent` for lazy loading to minimize the initial bundle.

---

## 15. Debugging Guide

### Enable Verbose SSR Logging

Run the SSR server with debug output:

```bash
NODE_ENV=development node dist/bazarna/server/server.mjs
```

### Common SSR Errors and Solutions

#### `ReferenceError: sessionStorage is not defined`
**Cause:** `sessionStorage` accessed without `isPlatformBrowser` guard in a lifecycle hook or constructor.  
**Fix:** Wrap with `if (isPlatformBrowser(this.platformId))`.

#### `ReferenceError: window is not defined`
**Cause:** Direct `window.*` access without guard.  
**Fix:** Use `isPlatformBrowser` guard OR `inject(DOCUMENT)` for document-related operations.

#### `Error: NG0500: Angular hydration expects...`
**Cause:** Server-rendered DOM differs from what Angular expects on the browser.  
**Common sources:**
- `new Date()` rendering in templates (different server/browser time)
- Conditional content based on signals that differ between server/browser

**Fix:**
```typescript
// ❌ Causes mismatch
template: `<span>{{ currentDate }}</span>`
currentDate = new Date().toLocaleDateString();

// ✅ Defer browser-only values
currentDate = signal('');
ngOnInit() {
  if (isPlatformBrowser(this.platformId)) {
    this.currentDate.set(new Date().toLocaleDateString());
  }
}
```

#### `Error: NG0100: ExpressionChangedAfterItHasBeenCheckedError`
**Cause:** A signal or binding changes value between server render and hydration check.  
**Fix:** Ensure no state changes happen synchronously after `provideClientHydration()` completes. Use `afterNextRender()` for post-hydration DOM operations.

#### Build-time crash: `Cannot read properties of undefined (reading 'getItem')`
**Cause:** `sessionStorage.getItem()` called at module initialization time (not inside a class method/constructor).  
**Fix:** Move to instance method and guard with `isPlatformBrowser`.

### Hydration Debugging Checklist

1. Open browser DevTools Console → look for `NG0500` warnings
2. Open Network tab → verify no duplicate API calls for SSR-rendered data
3. Disable JavaScript in DevTools → verify meaningful HTML is still visible
4. Check View Source (Ctrl+U) → verify product listings, categories are in raw HTML
5. Use Lighthouse → run in Incognito mode → check FCP, LCP, TTFB scores

### Server Crash Debugging

```bash
# Run with full Node.js stack traces
NODE_OPTIONS="--stack-trace-limit=20" node dist/bazarna/server/server.mjs

# Watch server logs in real-time
node dist/bazarna/server/server.mjs 2>&1 | tee server.log
```

### Verifying Transfer State

Open browser DevTools → Elements → search for `ng-transfer-state`:

```html
<script id="ng-transfer-state" type="application/json">
  {"B/api/products":{"body":[...],"headers":{},"status":200,...}}
</script>
```

If this script element is absent, the HTTP transfer cache is not working — check that `provideClientHydration()` is in `appConfig`.

---

## 16. Testing Guide

### Local SSR Development

#### Option 1: Development Server (CSR only, fast iteration)
```bash
npm start
# → http://localhost:4200
# Angular dev server — no SSR, useful for component development
```

#### Option 2: SSR Build and Serve (full SSR test)
```bash
# Step 1: Build the SSR application
npm run build
# Expected output:
#   Browser bundles
#   Server bundles
#   Prerendered 3 static routes.
#   Application bundle generation complete.

# Step 2: Ensure backend API is running
cd backend && npm start
# → Backend runs on http://localhost:3009

# Step 3: Start SSR server
npm run serve:ssr:bazarna
# → http://localhost:4000
```

### Validation Checklist

#### Build Validation
- [ ] `npm run build` exits with code 0
- [ ] Output: `Prerendered 3 static routes.` (exactly 3: about, contact, login)
- [ ] `dist/bazarna/browser/` directory contains hashed JS/CSS files
- [ ] `dist/bazarna/server/server.mjs` exists
- [ ] No TypeScript errors in build output

#### SSR Functionality Validation
- [ ] `http://localhost:4000/` — View Source shows category names in HTML
- [ ] `http://localhost:4000/products` — View Source shows product names/prices in HTML
- [ ] `http://localhost:4000/about` — View Source shows About page content (prerendered)
- [ ] `http://localhost:4000/login` — View Source shows login form (prerendered)
- [ ] `http://localhost:4000/cart` — View Source shows empty shell (Client mode)
- [ ] `http://localhost:4000/profile` — Redirects to `/login` after browser hydration

#### Hydration Validation
- [ ] Open browser DevTools Console — no `NG0500` hydration warnings
- [ ] Open Network tab — no duplicate API calls for `/api/products`, `/api/categories`
- [ ] Products visible immediately on page load (before JS loads)
- [ ] App remains interactive after JS loads

#### Auth Validation
- [ ] Login form works after hydration
- [ ] Authenticated routes redirect to `/login` when unauthenticated
- [ ] After login, header updates with user name
- [ ] Refresh token restores session on page reload

#### Storage Validation
- [ ] Add items to cart, navigate to another page, return — cart persists
- [ ] Complete signup → `confirm-signup` page shows — verify `/confirm-signup` is Client mode (no sessionStorage access on server)
- [ ] Email verification link works end-to-end

#### Security Validation
- [ ] HTTP response headers include `X-Content-Type-Options`, `X-Frame-Options` (from helmet)
- [ ] No sensitive data (tokens, user data) visible in View Source for public routes

### Production Validation Steps

```bash
# Production build
npm run build -- --configuration production

# Check bundle sizes
# ⚠️ Current: initial exceeds 500kB budget — address with lazy loading

# Verify prerendered files
ls dist/bazarna/browser/about/     # → index.html should exist
ls dist/bazarna/browser/contact/   # → index.html should exist
ls dist/bazarna/browser/login/     # → index.html should exist

# Run Lighthouse CI (install first: npm i -g @lhci/cli)
lhci autorun --collect.url=http://localhost:4000

# Check for hydration mismatches in browser console after deploying
# Look for: NG0500, NG0100, HYDRATION_ERROR
```

---

## 17. Final Migration Summary

### Completed Tasks

| # | Task | Status | Impact |
|---|---|---|---|
| 1 | SSR Infrastructure Audit | ✅ Complete | Confirmed existing setup correctness |
| 2 | `@angular/ssr` package verification | ✅ Complete | Already installed (v21.0.4) |
| 3 | Per-route render mode configuration | ✅ Complete | **CRITICAL** — prevents crashes and mismatches |
| 4 | `withFetch()` added to HttpClient | ✅ Complete | Native Fetch for SSR HTTP calls |
| 5 | `products.service.ts` — server-side loading | ✅ Complete | Products render in SSR HTML |
| 6 | `verify-email.component.ts` — `ngOnInit` guard | ✅ Complete | Prevents server crash |
| 7 | `login.component.ts` — `onSubmit` guard | ✅ Complete | Defensive correctness |
| 8 | `confirm-signup.component.ts` — guard | ✅ Complete | Defensive correctness |
| 9 | Build verification | ✅ Passing | 0 errors, 3 routes prerendered |

### Architecture Changes Summary

**Before migration (functional but broken SSR):**
- All routes: `RenderMode.Prerender` → build-time crash on auth-protected routes
- `products.service.ts` → browser-only loading → empty server-rendered pages
- `provideHttpClient` → no `withFetch()` → XHR polyfill for Node.js
- `verify-email.component.ts` → unguarded `sessionStorage` in `ngOnInit`
- `login.component.ts`, `confirm-signup.component.ts` → unguarded `sessionStorage`

**After migration (correct SSR):**
- 3 routes prerendered (static)
- 3 routes server-rendered per request (with live API data)
- 8 routes client-rendered (user-specific / auth-dependent)
- Products and categories load on server, transfer cache prevents browser re-fetch
- All `sessionStorage` accesses guarded by `isPlatformBrowser()`
- Native Fetch API used for all HTTP calls

### Technical Debt Removed

- ❌ Blanket `RenderMode.Prerender` wildcard rule
- ❌ `isPlatformBrowser` blocking server-side product loading
- ❌ Unguarded `sessionStorage` in lifecycle hooks

### Remaining TODOs (Future Work)

| Priority | Task | Description |
|---|---|---|
| High | Lazy-load all feature routes | Reduce initial bundle from 657 kB to < 300 kB |
| Medium | Add `Meta` / `Title` service to `ProductsComponent` | Dynamic SEO metadata per page |
| Medium | Add error handling to `loadProducts()` / `loadCategories()` | Log server-side API failures |
| Low | Remove redundant `standalone: true` declarations | Clean up Angular v19+ components |
| Low | Investigate `content-security-policy` for `helmet` | Explicit CSP with nonces for Angular hydration scripts |
| Low | Add PM2 configuration | Cluster mode for production SSR scaling |

### Rendering Mode Decision Reference (for future routes)

When adding a new route, use this decision tree:

```
Is the page content the same for all users?
├── YES → Does it have frequently changing data?
│         ├── YES → RenderMode.Server
│         └── NO  → RenderMode.Prerender
└── NO  → Does it require auth / user-specific storage?
          ├── YES → RenderMode.Client
          └── NO  → Does it have query params that vary per user?
                    ├── YES → RenderMode.Client
                    └── NO  → RenderMode.Server
```

---

*Documentation generated for the Bazarna Angular SSR migration — May 2026.*
