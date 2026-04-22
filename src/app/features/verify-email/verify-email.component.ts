import { ChangeDetectionStrategy, Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CardComponent } from '../../shared/components/card/card.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { AuthService } from '../../shared/services/auth.service';

@Component({
  selector: 'app-verify-email',
  imports: [CardComponent, ButtonComponent],
  templateUrl: './verify-email.html',
  styleUrls: ['./verify-email.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VerifyEmailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);

  verificationStatus = signal<'loading' | 'success' | 'error'>('loading');
  message = signal('');

  ngOnInit() {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (!token) {
      this.verificationStatus.set('error');
      this.message.set('Invalid verification link. No token provided.');
      return;
    }

    this.authService.verifyEmail(token).subscribe({
      next: () => {
        this.verificationStatus.set('success');
        this.message.set('Email verified successfully! You can now sign in.');
        localStorage.removeItem('pendingVerificationEmail');
      },
      error: (error) => {
        this.verificationStatus.set('error');
        this.message.set(error.error?.message || 'Email verification failed.');
      }
    });
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }
}
