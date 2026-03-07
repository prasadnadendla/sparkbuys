import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Apollo } from 'apollo-angular';
import { FormsModule } from '@angular/forms';
import { catchError, of } from 'rxjs';
import { GET_PRODUCTS } from '../../core/graphql/queries/product.queries';
import { GET_COLLECTION } from '../../core/graphql/queries/collection.queries';
import { Product, Collection, PageInfo } from '../../core/graphql/shopify.types';
import { ProductCardComponent } from '../../shared/components/product-card/product-card.component';
import { SeoService } from '../../core/services/seo.service';

type SortOption = { label: string; key: string; reverse: boolean };

const SORT_OPTIONS: SortOption[] = [
  { label: 'Relevance', key: 'RELEVANCE', reverse: false },
  { label: 'Best Selling', key: 'BEST_SELLING', reverse: false },
  { label: 'Price: Low to High', key: 'PRICE', reverse: false },
  { label: 'Price: High to Low', key: 'PRICE', reverse: true },
  { label: 'Newest', key: 'CREATED', reverse: true },
];

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [RouterLink, ProductCardComponent, FormsModule],
  templateUrl: './catalog.component.html'
})
export class CatalogComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private apollo = inject(Apollo);
  private seo = inject(SeoService);

  products = signal<Product[]>([]);
  collection = signal<Collection | null>(null);
  pageInfo = signal<PageInfo | null>(null);
  loading = signal(true);
  error = signal(false);
  sortOptions = SORT_OPTIONS;
  sortIndex = 0;

  collectionTitle = computed(() => this.collection()?.title ?? 'All Products');

  private handle = '';
  private readonly PAGE_SIZE = 20;

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      this.handle = params.get('handle') ?? '';
      this.reset();
      this.load();
    });
  }

  onSortChange() {
    this.reset();
    this.load();
  }

  loadMore() {
    this.load(this.pageInfo()?.endCursor ?? undefined);
  }

  private reset() {
    this.products.set([]);
    this.pageInfo.set(null);
    this.loading.set(true);
    this.error.set(false);
  }

  private load(after?: string) {
    this.loading.set(true);
    const sort = SORT_OPTIONS[this.sortIndex];

    if (this.handle && this.handle !== 'all') {
      this.apollo.query<{ collection: Collection }>({
        query: GET_COLLECTION,
        variables: { handle: this.handle, first: this.PAGE_SIZE, after, sortKey: sort.key, reverse: sort.reverse },
        fetchPolicy: 'network-only',
      }).pipe(
        catchError(() => { this.error.set(true); this.loading.set(false); return of(null); })
      ).subscribe(result => {
        if (!result) return;
        const col = result.data?.collection;
        if (!col) return;
        this.collection.set(col);
        this.products.update(prev => [...prev, ...(col.products?.nodes ?? [])]);
        this.pageInfo.set(col.products?.pageInfo ?? null);
        this.loading.set(false);
        this.seo.setCollection({ title: col.title, description: col.description });
      });
    } else {
      this.apollo.query<{ products: { nodes: Product[]; pageInfo: PageInfo } }>({
        query: GET_PRODUCTS,
        variables: { first: this.PAGE_SIZE, after, sortKey: sort.key, reverse: sort.reverse },
        fetchPolicy: 'network-only',
      }).pipe(
        catchError(() => { this.error.set(true); this.loading.set(false); return of(null); })
      ).subscribe(result => {
        if (!result?.data) return;
        this.products.update(prev => [...prev, ...result.data!.products.nodes]);
        this.pageInfo.set(result.data!.products.pageInfo);
        this.loading.set(false);
        this.seo.setCollection({ title: 'All Products' });
      });
    }
  }
}
