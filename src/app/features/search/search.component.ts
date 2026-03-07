import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { Apollo } from 'apollo-angular';
import { SEARCH_PRODUCTS } from '../../core/graphql/queries/search.queries';
import { Product } from '../../core/graphql/shopify.types';
import { ProductCardComponent } from '../../shared/components/product-card/product-card.component';
import { SeoService } from '../../core/services/seo.service';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [FormsModule, ProductCardComponent],
  templateUrl: './search.component.html'
})
export class SearchComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private apollo = inject(Apollo);
  private seo = inject(SeoService);

  private queryInput$ = new Subject<string>();
  private destroy$ = new Subject<void>();

  query = '';
  products = signal<Product[]>([]);
  loading = signal(false);
  searched = signal(false);
  lastQuery = signal('');

  ngOnInit() {
    this.seo.set({ title: 'Search' });

    this.queryInput$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$),
    ).subscribe(q => {
      if (q.trim().length >= 2) {
        this.doSearch(q.trim());
      } else if (!q.trim()) {
        this.products.set([]);
        this.searched.set(false);
      }
    });

    this.route.queryParamMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const q = params.get('q') ?? '';
      if (q) { this.query = q; this.doSearch(q); }
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onQueryChange() {
    this.queryInput$.next(this.query);
  }

  onSearch() {
    const q = this.query.trim();
    if (!q) return;
    this.router.navigate([], { queryParams: { q }, queryParamsHandling: 'merge' });
  }

  private doSearch(q: string) {
    this.loading.set(true);
    this.searched.set(false);
    this.lastQuery.set(q);
    this.apollo.query<{ search: { nodes: Product[] } }>({
      query: SEARCH_PRODUCTS,
      variables: { query: q, first: 20 },
      fetchPolicy: 'network-only',
    }).subscribe(({ data }) => {
      this.products.set(data?.search?.nodes ?? []);
      this.loading.set(false);
      this.searched.set(true);
      this.seo.set({ title: `Search: ${q}`, noindex: true });
    });
  }
}
