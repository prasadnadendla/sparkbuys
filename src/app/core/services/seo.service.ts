import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Title, Meta } from '@angular/platform-browser';
import { DOCUMENT } from '@angular/common';
import { Router } from '@angular/router';

export interface SeoConfig {
  title?: string;
  description?: string;
  image?: string;
  type?: string;
  noindex?: boolean;
}

const SITE_NAME = 'Sparkbuys';
const BASE_URL = 'https://sparkbuys.in';
const DEFAULT_IMAGE = `${BASE_URL}/icons/logo.webp`;
const DEFAULT_DESC = 'Shop trending gadgets, home essentials, fitness gear and lifestyle products at best prices. COD available, free shipping across India.';

@Injectable({ providedIn: 'root' })
export class SeoService {
  private title = inject(Title);
  private meta = inject(Meta);
  private router = inject(Router);
  private doc = inject(DOCUMENT);
  private platformId = inject(PLATFORM_ID);

  set(config: SeoConfig) {
    const pageTitle = config.title ? `${config.title} | ${SITE_NAME}` : SITE_NAME;
    const description = config.description ?? DEFAULT_DESC;
    const image = config.image ?? DEFAULT_IMAGE;
    const url = `${BASE_URL}${this.router.url.split('?')[0]}`;

    this.title.setTitle(pageTitle);
    this.setCanonical(url);

    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({ property: 'og:title', content: pageTitle });
    this.meta.updateTag({ property: 'og:description', content: description });
    this.meta.updateTag({ property: 'og:image', content: image });
    this.meta.updateTag({ property: 'og:url', content: url });
    this.meta.updateTag({ property: 'og:type', content: config.type ?? 'website' });
    this.meta.updateTag({ property: 'og:site_name', content: SITE_NAME });
    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title', content: pageTitle });
    this.meta.updateTag({ name: 'twitter:description', content: description });
    this.meta.updateTag({ name: 'twitter:image', content: image });

    if (config.noindex) {
      this.meta.updateTag({ name: 'robots', content: 'noindex, nofollow' });
    } else {
      this.meta.updateTag({ name: 'robots', content: 'index, follow' });
    }
  }

  setProduct(product: { title: string; description?: string; image?: string; price?: string; currency?: string; available?: boolean }) {
    this.set({ title: product.title, description: product.description, image: product.image, type: 'product' });
    if (product.price) {
      const schema = {
        '@context': 'https://schema.org/',
        '@type': 'Product',
        name: product.title,
        description: product.description,
        image: product.image,
        offers: {
          '@type': 'Offer',
          price: product.price,
          priceCurrency: product.currency ?? 'INR',
          availability: product.available !== false ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
          url: `${BASE_URL}${this.router.url.split('?')[0]}`,
        },
      };
      let script = this.doc.querySelector<HTMLScriptElement>('script[type="application/ld+json"]');
      if (!script) {
        script = this.doc.createElement('script');
        script.setAttribute('type', 'application/ld+json');
        this.doc.head.appendChild(script);
      }
      script.textContent = JSON.stringify(schema);
    }
  }

  setCollection(collection: { title: string; description?: string }) {
    this.set({
      title: collection.title,
      description: collection.description,
    });
  }

  private setCanonical(url: string) {
    let link = this.doc.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = this.doc.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.doc.head.appendChild(link);
    }
    link.setAttribute('href', url);
  }
}
