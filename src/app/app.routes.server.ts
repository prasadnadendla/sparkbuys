import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  { path: '', renderMode: RenderMode.Prerender },
  { path: 'pages/contact', renderMode: RenderMode.Prerender },
  { path: 'pages/privacy-policy', renderMode: RenderMode.Prerender },
  { path: 'pages/refund-policy', renderMode: RenderMode.Prerender },
  { path: 'pages/shipping-policy', renderMode: RenderMode.Prerender },
  { path: 'pages/terms-of-service', renderMode: RenderMode.Prerender },
  { path: 'collections/all', renderMode: RenderMode.Server },
  { path: 'collections/:handle', renderMode: RenderMode.Server },
  { path: 'products/:handle', renderMode: RenderMode.Server },
  { path: 'search', renderMode: RenderMode.Server },
  { path: 'cart', renderMode: RenderMode.Client },
  { path: 'login', renderMode: RenderMode.Client },
  { path: 'account', renderMode: RenderMode.Client },
  { path: '**', renderMode: RenderMode.Server },
];
