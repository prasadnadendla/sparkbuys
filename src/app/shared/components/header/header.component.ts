import { Component, inject, signal, OnDestroy, HostListener } from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { Apollo } from 'apollo-angular';
import { CartService } from '../../../core/services/cart.service';
import { AuthService } from '../../../core/services/auth.service';
import { SEARCH_PRODUCTS } from '../../../core/graphql/queries/search.queries';
import { Product } from '../../../core/graphql/shopify.types';
import { InrPipe } from '../../pipes/inr.pipe';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, FormsModule, InrPipe],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent implements OnDestroy {
  cart = inject(CartService);
  auth = inject(AuthService);
  private router = inject(Router);
  private apollo = inject(Apollo);

  menuOpen = signal(false);
  searchQuery = '';
  suggestions = signal<Product[]>([]);
  showSuggestions = signal(false);
  suggestionsLoading = signal(false);

  private searchInput$ = new Subject<string>();
  private destroy$ = new Subject<void>();

  constructor() {
    this.searchInput$.pipe(
      debounceTime(250),
      distinctUntilChanged(),
      takeUntil(this.destroy$),
    ).subscribe(q => {
      if (q.trim().length >= 2) {
        this.fetchSuggestions(q.trim());
      } else {
        this.suggestions.set([]);
        this.showSuggestions.set(false);
      }
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSearchInput() {
    this.searchInput$.next(this.searchQuery);
  }

  onSearch() {
    const q = this.searchQuery.trim();
    if (!q) return;
    this.closeSuggestions();
    this.router.navigate(['/search'], { queryParams: { q } });
    this.menuOpen.set(false);
  }

  selectSuggestion(product: Product) {
    this.searchQuery = product.title;
    this.closeSuggestions();
    this.router.navigate(['/products', product.handle]);
    this.menuOpen.set(false);
  }

  closeSuggestions() {
    this.showSuggestions.set(false);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.search-wrapper')) {
      this.closeSuggestions();
    }
  }

  private fetchSuggestions(q: string) {
    this.suggestionsLoading.set(true);
    this.showSuggestions.set(true);
    this.apollo.query<{ search: { nodes: Product[] } }>({
      query: SEARCH_PRODUCTS,
      variables: { query: q, first: 6 },
      fetchPolicy: 'network-only',
    }).subscribe(({ data }) => {
      this.suggestions.set(data?.search?.nodes ?? []);
      this.suggestionsLoading.set(false);
    });
  }
}
