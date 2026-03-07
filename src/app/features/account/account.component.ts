import { Component, inject, OnInit, signal } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { catchError, of } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { SeoService } from '../../core/services/seo.service';
import { GET_CUSTOMER } from '../../core/graphql/queries/customer.queries';
import { CustomerData, Order, MailingAddress } from '../../core/graphql/shopify.types';
import { InrPipe } from '../../shared/pipes/inr.pipe';
import { RouterLink } from '@angular/router';

type Tab = 'orders' | 'addresses';

@Component({
  selector: 'app-account',
  standalone: true,
  imports: [InrPipe, RouterLink],
  templateUrl: './account.component.html'
})
export class AccountComponent implements OnInit {
  auth = inject(AuthService);
  private apollo = inject(Apollo);
  private seo = inject(SeoService);

  activeTab = signal<Tab>('orders');
  loading = signal(true);
  error = signal(false);
  orders = signal<Order[]>([]);
  addresses = signal<MailingAddress[]>([]);
  defaultAddressId = signal<string | null>(null);
  customerName = signal<string>('');

  ngOnInit() {
    this.seo.set({ title: 'My Account', noindex: true });
    this.loadCustomer();
  }

  initials() {
    const name = this.customerName() || (this.auth.user()?.name ?? '');
    return name ? name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : '👤';
  }

  displayName() {
    return this.customerName() || (this.auth.user()?.name ?? 'Customer');
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  statusColor(status: string): string {
    const s = status.toLowerCase();
    if (s === 'paid' || s === 'fulfilled') return 'bg-green-100 text-green-700';
    if (s === 'pending' || s === 'in_progress' || s === 'partially_fulfilled') return 'bg-yellow-100 text-yellow-700';
    if (s === 'refunded' || s === 'cancelled') return 'bg-red-100 text-red-600';
    return 'bg-gray-100 text-gray-600';
  }

  formatStatus(status: string): string {
    return status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
  }

  private loadCustomer() {
    const token = this.auth.shopifyToken;
    if (!token) {
      this.loading.set(false);
      return;
    }
    this.apollo.query<{ customer: CustomerData }>({
      query: GET_CUSTOMER,
      variables: { token },
      fetchPolicy: 'network-only',
    }).pipe(
      catchError(() => { this.error.set(true); this.loading.set(false); return of(null); })
    ).subscribe(result => {
      this.loading.set(false);
      const c = result?.data?.customer;
      if (!c) return;
      this.orders.set(c.orders?.nodes ?? []);
      this.addresses.set(c.addresses?.nodes ?? []);
      this.defaultAddressId.set(c.defaultAddress?.id ?? null);
      const name = [c.firstName ?? '', c.lastName ?? ''].filter(Boolean).join(' ');
      if (name) this.customerName.set(name);
    });
  }
}
