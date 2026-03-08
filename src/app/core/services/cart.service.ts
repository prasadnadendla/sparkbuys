import { inject, Injectable, signal, computed, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Apollo } from 'apollo-angular';
import { map, switchMap, tap, catchError, of } from 'rxjs';
import { CREATE_CART, ADD_TO_CART, UPDATE_CART_LINE, REMOVE_CART_LINES, GET_CART, CART_BUYER_IDENTITY_UPDATE } from '../graphql/queries/cart.queries';
import { Cart } from '../graphql/shopify.types';
import { AuthService } from './auth.service';

const CART_ID_KEY = 'sb_cart_id';

@Injectable({ providedIn: 'root' })
export class CartService {
  private apollo = inject(Apollo);
  private platformId = inject(PLATFORM_ID);
  private auth = inject(AuthService);

  cart = signal<Cart | null>(null);
  loading = signal(false);

  quantity = computed(() => this.cart()?.totalQuantity ?? 0);
  total = computed(() => this.cart()?.cost.totalAmount.amount ?? '0');
  items = computed(() => this.cart()?.lines.nodes ?? []);

  private get cartId(): string | null {
    if (!isPlatformBrowser(this.platformId)) return null;
    return localStorage.getItem(CART_ID_KEY);
  }

  private set cartId(id: string | null) {
    if (!isPlatformBrowser(this.platformId)) return;
    if (id) localStorage.setItem(CART_ID_KEY, id);
    else localStorage.removeItem(CART_ID_KEY);
  }

  loadCart() {
    const id = this.cartId;
    if (!id) return;
    this.apollo.query<{ cart: Cart }>({
      query: GET_CART,
      variables: { cartId: id },
      fetchPolicy: 'network-only',
    }).pipe(
      map(r => r.data?.cart ?? null),
      catchError(() => of(null)),
    ).subscribe(cart => {
      if (cart) this.cart.set(cart);
      else this.cartId = null;
    });
  }

  addItem(merchandiseId: string, quantity = 1) {
    this.loading.set(true);
    const lines = [{ merchandiseId, quantity }];
    const cartId = this.cartId;

    const mutation$ = cartId
      ? this.apollo.mutate<{ cartLinesAdd: { cart: Cart } }>({
          mutation: ADD_TO_CART,
          variables: { cartId, lines },
        }).pipe(map(r => r.data!.cartLinesAdd.cart))
      : this.apollo.mutate<{ cartCreate: { cart: Cart } }>({
          mutation: CREATE_CART,
          variables: { lines },
        }).pipe(
          map(r => r.data!.cartCreate.cart),
          tap(cart => {
            const token = this.auth.shopifyToken;
            if (token) this.linkCustomer(token, cart.id);
          }),
        );

    mutation$.pipe(
      tap(cart => {
        this.cart.set(cart);
        this.cartId = cart.id;
      }),
      catchError(() => of(null)),
    ).subscribe(() => this.loading.set(false));
  }

  updateQuantity(lineId: string, quantity: number) {
    const cartId = this.cartId;
    if (!cartId) return;
    this.loading.set(true);
    this.apollo.mutate<{ cartLinesUpdate: { cart: Cart } }>({
      mutation: UPDATE_CART_LINE,
      variables: { cartId, lines: [{ id: lineId, quantity }] },
    }).pipe(
      map(r => r.data!.cartLinesUpdate.cart),
      tap(cart => this.cart.set(cart)),
      catchError(() => of(null)),
    ).subscribe(() => this.loading.set(false));
  }

  removeItem(lineId: string) {
    const cartId = this.cartId;
    if (!cartId) return;
    this.loading.set(true);
    this.apollo.mutate<{ cartLinesRemove: { cart: Cart } }>({
      mutation: REMOVE_CART_LINES,
      variables: { cartId, lineIds: [lineId] },
    }).pipe(
      map(r => r.data!.cartLinesRemove.cart),
      tap(cart => this.cart.set(cart)),
      catchError(() => of(null)),
    ).subscribe(() => this.loading.set(false));
  }

  linkCustomer(shopifyToken: string, cartId?: string) {
    const id = cartId ?? this.cartId;
    if (!id) return;
    this.apollo.mutate<{ cartBuyerIdentityUpdate: { cart: Cart } }>({
      mutation: CART_BUYER_IDENTITY_UPDATE,
      variables: { cartId: id, buyerIdentity: { customerAccessToken: shopifyToken } },
    }).pipe(
      map(r => r.data?.cartBuyerIdentityUpdate.cart ?? null),
      catchError(() => of(null)),
    ).subscribe(cart => { if (cart) this.cart.set(cart); });
  }

  clearCart() {
    this.cart.set(null);
    this.cartId = null;
  }
}
