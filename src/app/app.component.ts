import { Component, inject, OnInit } from '@angular/core';
import { Router, NavigationEnd, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { HeaderComponent } from './shared/components/header/header.component';
import { FooterComponent } from './shared/components/footer/footer.component';
import { AuthService } from './core/services/auth.service';
import { CartService } from './core/services/cart.service';
import { PixelService } from './core/services/pixel.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, FooterComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  private auth = inject(AuthService);
  private cart = inject(CartService);
  private pixel = inject(PixelService);
  private router = inject(Router);

  ngOnInit() {
    this.auth.init();
    this.cart.loadCart();
    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(() => {
      this.pixel.pageView();
    });
  }
}
