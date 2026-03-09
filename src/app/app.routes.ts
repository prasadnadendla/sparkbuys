import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent),
  },
  {
    path: 'collections/all',
    loadComponent: () => import('./features/catalog/catalog.component').then(m => m.CatalogComponent),
  },
  {
    path: 'collections/:handle',
    loadComponent: () => import('./features/catalog/catalog.component').then(m => m.CatalogComponent),
  },
  {
    path: 'products/:handle',
    loadComponent: () => import('./features/product/product.component').then(m => m.ProductComponent),
  },
  {
    path: 'cart',
    canActivate: [authGuard],
    loadComponent: () => import('./features/cart/cart.component').then(m => m.CartComponent),
  },
  {
    path: 'search',
    loadComponent: () => import('./features/search/search.component').then(m => m.SearchComponent),
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login.component').then(m => m.LoginComponent),
  },
  {
    path: 'account',
    canActivate: [authGuard],
    loadComponent: () => import('./features/account/account.component').then(m => m.AccountComponent),
  },
  {
    path: 'pages/contact',
    loadComponent: () => import('./features/pages/contact/contact.component').then(m => m.ContactComponent),
  },
  {
    path: 'pages/privacy-policy',
    loadComponent: () => import('./features/pages/policy/policy.component').then(m => m.PolicyComponent),
    data: { type: 'privacy' },
  },
  {
    path: 'pages/refund-policy',
    loadComponent: () => import('./features/pages/policy/policy.component').then(m => m.PolicyComponent),
    data: { type: 'refund' },
  },
  {
    path: 'pages/shipping-policy',
    loadComponent: () => import('./features/pages/policy/policy.component').then(m => m.PolicyComponent),
    data: { type: 'shipping' },
  },
  {
    path: 'pages/terms-of-service',
    loadComponent: () => import('./features/pages/policy/policy.component').then(m => m.PolicyComponent),
    data: { type: 'terms' },
  },
  {
    path: '**',
    loadComponent: () => import('./features/pages/not-found/not-found.component').then(m => m.NotFoundComponent),
  },
];
