import { inject, Injectable, signal, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { from, of } from 'rxjs';
import { tap, catchError, switchMap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

const TOKEN_KEY = 'sb_token';
const USER_KEY = 'sb_user';
const SHOPIFY_TOKEN_KEY = 'sb_shopify_token';
const SHOPIFY_TOKEN_EXPIRY_KEY = 'sb_shopify_token_expiry';

export interface User {
  id: string;
  name?: string;
  phone: string;
  email?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);

  user = signal<User | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);

  get token(): string | null {
    if (!isPlatformBrowser(this.platformId)) return null;
    return localStorage.getItem(TOKEN_KEY);
  }

  get shopifyToken(): string | null {
    if (!isPlatformBrowser(this.platformId)) return null;
    return localStorage.getItem(SHOPIFY_TOKEN_KEY);
  }

  get isLoggedIn(): boolean {
    return !!this.token;
  }

  init() {
    if (!isPlatformBrowser(this.platformId)) return;
    const stored = localStorage.getItem(USER_KEY);
    if (stored) this.user.set(JSON.parse(stored));
  }

  sendOtp(phone: string) {
    this.loading.set(true);
    this.error.set(null);
    return from(
      fetch(`${environment.apiBaseURL}/signin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      })
    ).pipe(
      switchMap(res => {
        this.loading.set(false);
        if (!res.ok) {
          this.error.set('Failed to send OTP. Try again.');
          return of(null);
        }
        return of(true as const);
      }),
      catchError(() => {
        this.loading.set(false);
        this.error.set('Failed to send OTP. Try again.');
        return of(null);
      })
    );
  }

  verifyOtp(phone: string, otp: string) {
    this.loading.set(true);
    this.error.set(null);
    return from(
      fetch(`${environment.apiBaseURL}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code: otp }),
      })
    ).pipe(
      switchMap(res => {
        if (!res.ok) {
          this.loading.set(false);
          this.error.set('Invalid OTP. Please try again.');
          return of(null);
        }
        return from(res.json() as Promise<{
          token: string;
          shopifyToken?: { accessToken: string; expiresAt: string } | null;
        }>);
      }),
      tap(data => {
        if (!data) return;
        this.loading.set(false);
        localStorage.setItem(TOKEN_KEY, data.token);
        if (data.shopifyToken?.accessToken) {
          localStorage.setItem(SHOPIFY_TOKEN_KEY, data.shopifyToken.accessToken);
          localStorage.setItem(SHOPIFY_TOKEN_EXPIRY_KEY, data.shopifyToken.expiresAt);
        }
        // Decode phone from JWT payload for the user signal
        this.user.set({ id: '', phone });
        localStorage.setItem(USER_KEY, JSON.stringify({ phone }));
      }),
      catchError(() => {
        this.loading.set(false);
        this.error.set('Invalid OTP. Please try again.');
        return of(null);
      })
    );
  }

  logout() {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(SHOPIFY_TOKEN_KEY);
      localStorage.removeItem(SHOPIFY_TOKEN_EXPIRY_KEY);
    }
    this.user.set(null);
    this.router.navigate(['/']);
  }
}
