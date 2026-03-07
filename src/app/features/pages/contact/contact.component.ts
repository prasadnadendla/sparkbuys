import { Component, inject } from '@angular/core';
import { SeoService } from '../../../core/services/seo.service';

@Component({
  selector: 'app-contact',
  standalone: true,
  templateUrl: './contact.component.html'
})
export class ContactComponent {
  private seo = inject(SeoService);
  ngOnInit() { this.seo.set({ title: 'Contact Us' }); }
}
