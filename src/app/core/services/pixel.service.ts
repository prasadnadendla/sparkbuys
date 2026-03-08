import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

declare function fbq(...args: any[]): void;

@Injectable({ providedIn: 'root' })
export class PixelService {
  private platformId = inject(PLATFORM_ID);

  private track(event: string, params?: object) {
    if (!isPlatformBrowser(this.platformId)) return;
    try { fbq('track', event, params); } catch { /* pixel not loaded */ }
  }

  pageView() {
    this.track('PageView');
  }

  viewContent(params: { content_name: string; content_ids: string[]; content_type: string; value: number; currency: string }) {
    this.track('ViewContent', params);
  }

  addToCart(params: { content_ids: string[]; content_name: string; content_type: string; value: number; currency: string }) {
    this.track('AddToCart', params);
  }

  initiateCheckout(params: { num_items: number; value: number; currency: string }) {
    this.track('InitiateCheckout', params);
  }
}
