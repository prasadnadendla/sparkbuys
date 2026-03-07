import { inject, Injectable, signal, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap, catchError, of } from 'rxjs';
import { environment } from '../../../environments/environment';

const TOKEN_KEY = 'sb_token';
const USER_KEY = 'sb_user';

export interface User {
  id: string;
  name?: string;
  phone: string;
  email?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);

  user = signal<User | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);

  get token(): string | null {
    if (!isPlatformBrowser(this.platformId)) return null;
    return localStorage.getItem(TOKEN_KEY);
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
    return this.http.post<{ success: boolean; message: string }>(
      `${environment.apiBaseURL}/api/graph`,
      {
        query: `mutation SendOTP($phone: String!) { sendOTP(phone: $phone) { success message } }`,
        variables: { phone },
      }
    ).pipe(
      tap(() => this.loading.set(false)),
      catchError(err => {
        this.loading.set(false);
        this.error.set('Failed to send OTP. Try again.');
        return of(null);
      })
    );
  }

  verifyOtp(phone: string, otp: string) {
    this.loading.set(true);
    this.error.set(null);
    return this.http.post<{ data: { verifyOTP: { token: string; user: User } } }>(
      `${environment.apiBaseURL}/api/graph`,
      {
        query: `mutation VerifyOTP($phone: String!, $otp: String!) {
          verifyOTP(phone: $phone, otp: $otp) { token user { id name phone email } }
        }`,
        variables: { phone, otp },
      }
    ).pipe(
      tap(res => {
        this.loading.set(false);
        const payload = res?.data?.verifyOTP;
        if (payload?.token) {
          localStorage.setItem(TOKEN_KEY, payload.token);
          localStorage.setItem(USER_KEY, JSON.stringify(payload.user));
          this.user.set(payload.user);
        } else {
          this.error.set('Invalid OTP. Please try again.');
        }
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
    }
    this.user.set(null);
    this.router.navigate(['/']);
  }
}
