import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SeoService } from '../../../core/services/seo.service';

const POLICIES: Record<string, { title: string; content: string }> = {
  privacy: {
    title: 'Privacy Policy',
    content: `
      <h2>Information We Collect</h2>
      <p>We collect information you provide directly to us, such as your name, phone number, email address, and delivery address when you create an account or place an order.</p>
      <h2>How We Use Your Information</h2>
      <p>We use the information we collect to process transactions, send order confirmations, and improve our services. We do not sell or rent your personal information to third parties.</p>
      <h2>Data Security</h2>
      <p>We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.</p>
      <h2>Contact Us</h2>
      <p>If you have questions about this Privacy Policy, please contact us at sparkbuysofficial@gmail.com.</p>
    `,
  },
  refund: {
    title: 'Refund Policy',
    content: `
      <h2>Return Window</h2>
      <p>We accept returns within 7 days of delivery. Items must be unused, in original condition, and in original packaging.</p>
      <h2>How to Initiate a Return</h2>
      <p>Email us at sparkbuysofficial@gmail.com with your order number and reason for return. We will arrange for pickup within 2-3 business days.</p>
      <h2>Refund Processing</h2>
      <p>Once we receive and inspect the returned item, refunds are processed within 5-7 business days to your original payment method. For COD orders, refunds are via bank transfer.</p>
      <h2>Non-Returnable Items</h2>
      <p>Products that are damaged, used, or missing original packaging are not eligible for return.</p>
    `,
  },
  shipping: {
    title: 'Shipping Policy',
    content: `
      <h2>Free Shipping</h2>
      <p>We offer free shipping on all orders across India, no minimum order value required.</p>
      <h2>Delivery Time</h2>
      <p>Orders are typically delivered within 5-8 business days. Remote areas may take up to 10 business days.</p>
      <h2>Order Processing</h2>
      <p>Orders are processed within 1-2 business days. You will receive a confirmation email with tracking details once your order is shipped.</p>
      <h2>Cash on Delivery</h2>
      <p>COD is available across India. Please keep exact change ready at the time of delivery.</p>
      <h2>Tracking</h2>
      <p>Once shipped, you will receive tracking information via email/SMS to monitor your delivery.</p>
    `,
  },
  terms: {
    title: 'Terms of Service',
    content: `
      <h2>Acceptance of Terms</h2>
      <p>By accessing and using Sparkbuys (sparkbuys.in), you accept and agree to be bound by these Terms of Service.</p>
      <h2>Products</h2>
      <p>We reserve the right to modify or discontinue products at any time. Prices are subject to change without notice.</p>
      <h2>Orders</h2>
      <p>We reserve the right to refuse or cancel any order. If your order is cancelled, you will be notified and any payment made will be refunded.</p>
      <h2>User Accounts</h2>
      <p>You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.</p>
      <h2>Limitation of Liability</h2>
      <p>Sparkbuys shall not be liable for any indirect, incidental, or consequential damages arising from the use of our products or services.</p>
      <h2>Contact</h2>
      <p>Questions about Terms of Service can be sent to sparkbuysofficial@gmail.com.</p>
    `,
  },
};

@Component({
  selector: 'app-policy',
  standalone: true,
  templateUrl: './policy.component.html'
})
export class PolicyComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private seo = inject(SeoService);

  policy = POLICIES['privacy'];

  ngOnInit() {
    const type = this.route.snapshot.data['type'] ?? 'privacy';
    this.policy = POLICIES[type] ?? POLICIES['privacy'];
    this.seo.set({ title: this.policy.title });
  }
}
