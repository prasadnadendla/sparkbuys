import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Apollo } from 'apollo-angular';
import { catchError, of } from 'rxjs';
import { GET_PRODUCT } from '../../core/graphql/queries/product.queries';
import { Product, ProductVariant } from '../../core/graphql/shopify.types';
import { CartService } from '../../core/services/cart.service';
import { AuthService } from '../../core/services/auth.service';
import { SeoService } from '../../core/services/seo.service';
import { PixelService } from '../../core/services/pixel.service';
import { InrPipe } from '../../shared/pipes/inr.pipe';

@Component({
  selector: 'app-product',
  standalone: true,
  imports: [RouterLink, InrPipe],
  templateUrl: './product.component.html'
})
export class ProductComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private apollo = inject(Apollo);
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

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const handle = params.get('handle') ?? '';
      this.loadProduct(handle);
    });
  }

  selectOption(name: string, value: string) {
    this.selectedOptions = { ...this.selectedOptions, [name]: value };
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
        p.options?.forEach(opt => {
          this.selectedOptions[opt.name] = opt.values[0];
        });
        this.seo.setProduct({
          title: p.seo?.title ?? p.title,
          description: p.seo?.description ?? p.description,
          image: p.featuredImage?.url,
        });
        this.pixel.viewContent({
          content_ids: [p.variants?.nodes?.[0]?.id ?? p.id],
          content_name: p.title,
          content_type: 'product',
          value: parseFloat(p.priceRange.minVariantPrice.amount),
          currency: 'INR',
        });
      }
    });
  }
}
