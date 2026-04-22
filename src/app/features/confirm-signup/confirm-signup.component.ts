import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CardComponent } from '../../shared/components/card/card.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { AuthService } from '../../shared/services/auth.service';

@Component({
  selector: 'app-confirm-signup',
  imports: [RouterLink, CardComponent, ButtonComponent],
  templateUrl: './confirm-signup.component.html',
  styleUrls: ['./confirm-signup.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmSignupComponent {
  private authService = inject(AuthService);

  resendMessage = signal('');
  resendMessageType = signal<'success' | 'error'>('success');
  isResending = signal(false);

  resendVerification() {
    const email = localStorage.getItem('pendingVerificationEmail');
    if (!email) {
      this.resendMessage.set('Unable to resend verification email. Please try signing up again.');
      this.resendMessageType.set('error');
      return;
    }

    this.isResending.set(true);
    this.resendMessage.set('');

    this.authService.resendVerification(email).subscribe({
      next: (response) => {
        this.resendMessage.set(response.message || 'Verification email sent successfully.');
        this.resendMessageType.set('success');
        this.isResending.set(false);
      },
      error: (error) => {
        this.resendMessage.set(error.error?.message || 'Failed to resend verification email.');
        this.resendMessageType.set('error');
        this.isResending.set(false);
      }
    });
  }
}