import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Apollo } from 'apollo-angular';
import { GET_FEATURED_PRODUCTS } from '../../core/graphql/queries/product.queries';
import { GET_COLLECTIONS } from '../../core/graphql/queries/collection.queries';
import { Product, Collection } from '../../core/graphql/shopify.types';
import { ProductCardComponent } from '../../shared/components/product-card/product-card.component';
import { SeoService } from '../../core/services/seo.service';
@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, ProductCardComponent],
  templateUrl: './home.component.html'
})
export class HomeComponent implements OnInit {
  private apollo = inject(Apollo);
  private seo = inject(SeoService);

  products = signal<Product[]>([]);
  collections = signal<Collection[]>([]);
  productsLoading = signal(true);
  collectionsLoading = signal(true);

  features = [
    { icon: '🚚', title: 'Free Shipping', desc: 'On all orders across India' },
    { icon: '↩️', title: 'Easy Returns', desc: '7-day hassle-free returns' },
    { icon: '⭐', title: 'Best Quality', desc: 'Curated trending products' },
    { icon: '🛡️', title: '100% Guarantee', desc: 'Authentic & safe products' },
  ];

  ngOnInit() {
    this.seo.set({
      title: 'Sparkbuys — Trending Gadgets & Home Essentials',
      description: 'Shop trending gadgets, home essentials, fitness gear and lifestyle products at best prices. COD available, free shipping across India.',
    });
    this.loadProducts();
    this.loadCollections();
  }

  private loadProducts() {
    this.apollo.query<{ products: { nodes: Product[] } }>({
      query: GET_FEATURED_PRODUCTS,
      variables: { first: 10 },
    }).subscribe(({ data }) => {
      if (data) this.products.set(data.products.nodes);
      this.productsLoading.set(false);
    });
  }

  private loadCollections() {
    this.apollo.query<{ collections: { nodes: Collection[] } }>({
      query: GET_COLLECTIONS,
      variables: { first: 4 },
    }).subscribe(({ data }) => {
      if (data) this.collections.set(data.collections.nodes);
      this.collectionsLoading.set(false);
    });
  }
}
