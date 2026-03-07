import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { SeoService } from '../../core/services/seo.service';

@Component({
  selector: 'app-account',
  standalone: true,
  imports: [],
  templateUrl: './account.component.html'
})
export class AccountComponent {
  auth = inject(AuthService);
  private seo = inject(SeoService);

  ngOnInit() {
    this.seo.set({ title: 'My Account', noindex: true });
  }

  initials() {
    const name = this.auth.user()?.name ?? '';
    return name ? name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : '👤';
  }
}
