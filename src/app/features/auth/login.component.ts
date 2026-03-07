import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { SeoService } from '../../core/services/seo.service';

type Step = 'phone' | 'otp';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.component.html'
})
export class LoginComponent {
  auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private seo = inject(SeoService);

  step = signal<Step>('phone');
  phone = '';
  otpIndices = [0, 1, 2, 3, 4, 5];
  otpDigits: string[] = ['', '', '', '', '', ''];
  resendCountdown = signal(0);
  private countdownTimer?: ReturnType<typeof setInterval>;

  otp = () => this.otpDigits.join('');

  ngOnInit() {
    this.seo.set({ title: 'Login', noindex: true });
    if (this.auth.isLoggedIn) this.redirectAfterLogin();
  }

  onSendOtp() {
    if (this.phone.length !== 10) return;
    this.auth.sendOtp('+91' + this.phone).subscribe(res => {
      if (res) {
        this.step.set('otp');
        this.otpDigits = ['', '', '', '', '', ''];
        this.startCountdown();
      }
    });
  }

  onVerifyOtp() {
    if (this.otp().length !== 6) return;
    this.auth.verifyOtp('+91' + this.phone, this.otp()).subscribe(res => {
      if (res) this.redirectAfterLogin();
    });
  }

  private redirectAfterLogin() {
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') ?? '/account';
    this.router.navigateByUrl(returnUrl);
  }

  onOtpInput(index: number, event: Event) {
    const input = event.target as HTMLInputElement;
    const val = input.value.replace(/\D/g, '');
    this.otpDigits[index] = val.slice(-1);
    if (val && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  }

  onOtpKeydown(index: number, event: KeyboardEvent) {
    if (event.key === 'Backspace' && !this.otpDigits[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
  }

  onOtpPaste(event: ClipboardEvent) {
    const pasted = event.clipboardData?.getData('text').replace(/\D/g, '').slice(0, 6) ?? '';
    if (pasted.length === 6) {
      this.otpDigits = pasted.split('');
      event.preventDefault();
    }
  }

  private startCountdown(seconds = 30) {
    clearInterval(this.countdownTimer);
    this.resendCountdown.set(seconds);
    this.countdownTimer = setInterval(() => {
      this.resendCountdown.update(v => {
        if (v <= 1) { clearInterval(this.countdownTimer); return 0; }
        return v - 1;
      });
    }, 1000);
  }
}
