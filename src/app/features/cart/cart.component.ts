import { Component, inject, OnInit, AfterViewInit, signal, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Apollo } from 'apollo-angular';
import { catchError, of } from 'rxjs';
import { CartService } from '../../core/services/cart.service';
import { AuthService } from '../../core/services/auth.service';
import { SeoService } from '../../core/services/seo.service';
import { PixelService } from '../../core/services/pixel.service';
import { GET_COLLECTION } from '../../core/graphql/queries/collection.queries';
import { Collection, Product } from '../../core/graphql/shopify.types';
import { ProductCardComponent } from '../../shared/components/product-card/product-card.component';
import { InrPipe } from '../../shared/pipes/inr.pipe';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [RouterLink, FormsModule, InrPipe, ProductCardComponent],
  templateUrl: './cart.component.html'
})
export class CartComponent implements OnInit, AfterViewInit {
  cart = inject(CartService);
  auth = inject(AuthService);
  private router = inject(Router);
  private seo = inject(SeoService);
  private pixel = inject(PixelService);
  private apollo = inject(Apollo);
  private platformId = inject(PLATFORM_ID);

  discountInput = '';
  showLoginModal = signal(false);
  showStickyCheckout = signal(false);
  trendingProducts = signal<Product[]>([]);

  ngOnInit() {
    this.seo.set({ title: 'Cart', noindex: true });
    this.loadTrending();
  }

  ngAfterViewInit() {
    if (!isPlatformBrowser(this.platformId)) return;
    const el = document.getElementById('cart-checkout-btn');
    if (!el) return;
    new IntersectionObserver(
      entries => this.showStickyCheckout.set(!entries[0].isIntersecting),
      { threshold: 0 }
    ).observe(el);
  }

  updateQty(lineId: string, qty: number) {
    if (qty <= 0) this.cart.removeItem(lineId);
    else this.cart.updateQuantity(lineId, qty);
  }

  applyDiscount() {
    if (!this.discountInput.trim()) return;
    this.cart.applyDiscount(this.discountInput);
    this.discountInput = '';
  }

  removeDiscount() {
    this.cart.applyDiscount('');
  }

  onCheckout(event: MouseEvent) {
    if (!this.auth.isLoggedIn) {
      event.preventDefault();
      this.showLoginModal.set(true);
      return;
    }
    this.firePixelAndCheckout();
  }

  continueAsGuest() {
    this.showLoginModal.set(false);
    this.firePixelAndCheckout();
    const url = this.cart.cart()?.checkoutUrl;
    if (url && isPlatformBrowser(this.platformId)) window.open(url, '_blank');
  }

  goToLogin() {
    this.showLoginModal.set(false);
    this.router.navigate(['/login'], { queryParams: { returnUrl: '/cart' } });
  }

  private firePixelAndCheckout() {
    this.pixel.initiateCheckout({
      num_items: this.cart.quantity(),
      value: parseFloat(this.cart.total()),
      currency: 'INR',
    });
  }

  private loadTrending() {
    this.apollo.query<{ collection: Collection }>({
      query: GET_COLLECTION,
      variables: { handle: 'trending-now', first: 4, sortKey: 'BEST_SELLING', reverse: false },
      fetchPolicy: 'cache-first',
    }).pipe(catchError(() => of(null))).subscribe(result => {
      this.trendingProducts.set(result?.data?.collection?.products?.nodes ?? []);
    });
  }
}
