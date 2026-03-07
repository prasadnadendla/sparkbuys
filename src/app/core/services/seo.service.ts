import { inject, Injectable } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
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
const DEFAULT_IMAGE = `${BASE_URL}/icons/icon-512x512.png`;
const DEFAULT_DESC = 'Shop trending gadgets, home essentials, fitness gear and lifestyle products at best prices. COD available, free shipping across India.';

@Injectable({ providedIn: 'root' })
export class SeoService {
  private title = inject(Title);
  private meta = inject(Meta);
  private router = inject(Router);

  set(config: SeoConfig) {
    const pageTitle = config.title ? `${config.title} | ${SITE_NAME}` : SITE_NAME;
    const description = config.description ?? DEFAULT_DESC;
    const image = config.image ?? DEFAULT_IMAGE;
    const url = `${BASE_URL}${this.router.url}`;

    this.title.setTitle(pageTitle);

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

  setProduct(product: { title: string; description?: string; image?: string }) {
    this.set({
      title: product.title,
      description: product.description,
      image: product.image,
      type: 'product',
    });
  }

  setCollection(collection: { title: string; description?: string }) {
    this.set({
      title: collection.title,
      description: collection.description,
    });
  }
}
