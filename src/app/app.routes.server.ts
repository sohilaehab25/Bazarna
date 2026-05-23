import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // Truly static pages — pre-built at build time for best performance
  { path: 'about', renderMode: RenderMode.Prerender },
  { path: 'contact', renderMode: RenderMode.Prerender },
  { path: 'login', renderMode: RenderMode.Prerender },

  // Dynamic public pages with API data — rendered per request on the server
  { path: '', renderMode: RenderMode.Server },
  { path: 'products', renderMode: RenderMode.Server },
  { path: 'menu', renderMode: RenderMode.Server },

  // User-specific / auth-dependent pages — client-only (browser handles auth & storage)
  { path: 'cart', renderMode: RenderMode.Client },
  { path: 'checkout', renderMode: RenderMode.Client },
  { path: 'profile', renderMode: RenderMode.Client },
  { path: 'edit-profile', renderMode: RenderMode.Client },
  { path: 'wishlist', renderMode: RenderMode.Client },
  { path: 'order-success', renderMode: RenderMode.Client },
  { path: 'confirm-signup', renderMode: RenderMode.Client },
  // Query-param driven + sessionStorage → client-only
  { path: 'auth/verify-email', renderMode: RenderMode.Client },

  // Fallback
  { path: '**', renderMode: RenderMode.Server },
];
