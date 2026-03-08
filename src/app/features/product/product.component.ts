import { Component, inject, OnInit, AfterViewInit, signal, computed, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Apollo } from 'apollo-angular';
import { catchError, of } from 'rxjs';
import { GET_PRODUCT } from '../../core/graphql/queries/product.queries';
import { GET_COLLECTION } from '../../core/graphql/queries/collection.queries';
import { Product, ProductVariant, Collection } from '../../core/graphql/shopify.types';
import { CartService } from '../../core/services/cart.service';
import { AuthService } from '../../core/services/auth.service';
import { SeoService } from '../../core/services/seo.service';
import { PixelService } from '../../core/services/pixel.service';
import { ProductCardComponent } from '../../shared/components/product-card/product-card.component';
import { InrPipe } from '../../shared/pipes/inr.pipe';

@Component({
  selector: 'app-product',
  standalone: true,
  imports: [RouterLink, InrPipe, ProductCardComponent],
  templateUrl: './product.component.html'
})
export class ProductComponent implements OnInit, AfterViewInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private apollo = inject(Apollo);
  private platformId = inject(PLATFORM_ID);
  cart = inject(CartService);
  auth = inject(AuthService);
  private seo = inject(SeoService);
  private pixel = inject(PixelService);

  product = signal<Product | null>(null);
  loading = signal(true);
  error = signal(false);
  activeImageIndex = signal(0);
  qty = signal(1);
  selectedOptions: Record<string, string> = {};
  relatedProducts = signal<Product[]>([]);
  showStickyBar = signal(false);
  shareToast = signal(false);
  Math = Math;

  images = computed(() => this.product()?.images?.nodes ?? (this.product()?.featuredImage ? [this.product()!.featuredImage!] : []));
  activeImage = computed(() => this.images()[this.activeImageIndex()]?.url ?? '');

  selectedVariant = computed<ProductVariant | undefined>(() => {
    const variants = this.product()?.variants?.nodes ?? [];
    if (!variants.length) return undefined;
    return variants.find(v =>
      v.selectedOptions.every(o => this.selectedOptions[o.name] === o.value)
    ) ?? variants[0];
  });

  selectedPrice = computed(() => parseFloat(this.selectedVariant()?.price.amount ?? '0'));
  compareAtPrice = computed(() => parseFloat(this.selectedVariant()?.compareAtPrice?.amount ?? this.product()?.compareAtPriceRange.minVariantPrice.amount ?? '0'));
  discount = computed(() => {
    const p = this.selectedPrice(), c = this.compareAtPrice();
    return (!c || c <= p) ? 0 : Math.round(((c - p) / c) * 100);
  });

  stockWarning = computed(() => {
    const qty = this.selectedVariant()?.quantityAvailable;
    return qty != null && qty > 0 && qty <= 10 ? `Only ${qty} left!` : null;
  });

  displayTags = computed(() =>
    (this.product()?.tags ?? []).filter(t => t.trim() && !t.includes(':'))
  );

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const handle = params.get('handle') ?? '';
      this.activeImageIndex.set(0);
      this.qty.set(1);
      this.relatedProducts.set([]);
      this.loadProduct(handle);
    });
  }

  ngAfterViewInit() {
    if (!isPlatformBrowser(this.platformId)) return;
    const ctaEl = document.getElementById('product-cta');
    if (!ctaEl) return;
    const obs = new IntersectionObserver(
      entries => this.showStickyBar.set(!entries[0].isIntersecting),
      { threshold: 0 }
    );
    obs.observe(ctaEl);
  }

  selectOption(name: string, value: string) {
    this.selectedOptions = { ...this.selectedOptions, [name]: value };
  }

  isOptionAvailable(optionName: string, value: string): boolean {
    return (this.product()?.variants?.nodes ?? []).some(v =>
      v.availableForSale && v.selectedOptions.some(o => o.name === optionName && o.value === value)
    );
  }

  addToCart() {
    const variant = this.selectedVariant();
    if (!variant?.id) return;
    this.pixel.addToCart({
      content_ids: [variant.id],
      content_name: this.product()!.title,
      content_type: 'product',
      value: this.selectedPrice() * this.qty(),
      currency: 'INR',
    });
    for (let i = 0; i < this.qty(); i++) this.cart.addItem(variant.id);
  }

  buyNow() {
    if (!this.auth.isLoggedIn) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: '/cart' } });
      return;
    }
    const variant = this.selectedVariant();
    if (!variant?.id) return;
    this.pixel.addToCart({
      content_ids: [variant.id],
      content_name: this.product()!.title,
      content_type: 'product',
      value: this.selectedPrice() * this.qty(),
      currency: 'INR',
    });
    for (let i = 0; i < this.qty(); i++) this.cart.addItem(variant.id);
    this.router.navigate(['/cart']);
  }

  share() {
    const p = this.product();
    if (!p || !isPlatformBrowser(this.platformId)) return;
    const url = `https://sparkbuys.in/products/${p.handle}`;
    if ((navigator as any).share) {
      (navigator as any).share({ title: p.title, url });
    } else {
      navigator.clipboard.writeText(url).then(() => {
        this.shareToast.set(true);
        setTimeout(() => this.shareToast.set(false), 2000);
      });
    }
  }

  private loadProduct(handle: string) {
    this.loading.set(true);
    this.error.set(false);
    this.product.set(null);
    this.apollo.query<{ productByHandle: Product }>({
      query: GET_PRODUCT,
      variables: { handle },
    }).pipe(
      catchError(() => { this.error.set(true); this.loading.set(false); return of(null); })
    ).subscribe(result => {
      if (!result) return;
      const p = result.data?.productByHandle ?? null;
      this.product.set(p);
      this.loading.set(false);
      if (p) {
        p.options?.forEach(opt => { this.selectedOptions[opt.name] = opt.values[0]; });
        this.seo.setProduct({
          title: p.seo?.title ?? p.title,
          description: p.seo?.description ?? p.description,
          image: p.featuredImage?.url,
          price: p.priceRange.minVariantPrice.amount,
          currency: p.priceRange.minVariantPrice.currencyCode,
          available: p.availableForSale,
        });
        this.pixel.viewContent({
          content_ids: [p.variants?.nodes?.[0]?.id ?? p.id],
          content_name: p.title,
          content_type: 'product',
          value: parseFloat(p.priceRange.minVariantPrice.amount),
          currency: 'INR',
        });
        const collectionHandle = p.collections?.nodes?.[0]?.handle;
        if (collectionHandle) this.loadRelated(collectionHandle, handle);
      }
    });
  }

  private loadRelated(collectionHandle: string, currentHandle: string) {
    this.apollo.query<{ collection: Collection }>({
      query: GET_COLLECTION,
      variables: { handle: collectionHandle, first: 8, sortKey: 'BEST_SELLING', reverse: false },
      fetchPolicy: 'cache-first',
    }).pipe(catchError(() => of(null))).subscribe(result => {
      const products = result?.data?.collection?.products?.nodes ?? [];
      this.relatedProducts.set(products.filter((p: Product) => p.handle !== currentHandle).slice(0, 4));
    });
  }
}
