import { Component, input, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Product } from '../../../core/graphql/shopify.types';
import { CartService } from '../../../core/services/cart.service';
import { InrPipe } from '../../pipes/inr.pipe';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [RouterLink, InrPipe],
  templateUrl: './product-card.component.html'
})
export class ProductCardComponent {
  product = input.required<Product>();
  cart = inject(CartService);

  get price(): () => number {
    return () => parseFloat(this.product().priceRange.minVariantPrice.amount);
  }

  get comparePrice(): () => number {
    return () => parseFloat(this.product().compareAtPriceRange?.minVariantPrice?.amount ?? '0');
  }

  get discount(): () => number {
    return () => {
      const p = this.price();
      const c = this.comparePrice();
      if (!c || c <= p) return 0;
      return Math.round(((c - p) / c) * 100);
    };
  }

  addToCart(e: Event) {
    e.preventDefault();
    const variants = (this.product() as any).variants?.nodes;
    const variantId = variants?.[0]?.id ?? this.product().id;
    this.cart.addItem(variantId);
  }
}
