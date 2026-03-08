import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CartService } from '../../core/services/cart.service';
import { AuthService } from '../../core/services/auth.service';
import { SeoService } from '../../core/services/seo.service';
import { PixelService } from '../../core/services/pixel.service';
import { InrPipe } from '../../shared/pipes/inr.pipe';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [RouterLink, InrPipe],
  templateUrl: './cart.component.html'
})
export class CartComponent implements OnInit {
  cart = inject(CartService);
  auth = inject(AuthService);
  private seo = inject(SeoService);
  private pixel = inject(PixelService);

  ngOnInit() {
    this.seo.set({ title: 'Cart', noindex: true });
  }

  updateQty(lineId: string, qty: number) {
    if (qty <= 0) this.cart.removeItem(lineId);
    else this.cart.updateQuantity(lineId, qty);
  }

  onCheckout() {
    this.pixel.initiateCheckout({
      num_items: this.cart.quantity(),
      value: parseFloat(this.cart.total()),
      currency: 'INR',
    });
  }
}
