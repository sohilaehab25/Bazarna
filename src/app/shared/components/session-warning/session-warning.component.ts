import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalComponent } from '../modal/modal.component';
import { ButtonComponent } from '../button/button.component';
import { SessionActivityService } from '../../services/session-activity.service';

@Component({
  selector: 'app-session-warning',
  imports: [CommonModule, ModalComponent, ButtonComponent],
  templateUrl: './session-warning.component.html',
  styleUrls: ['./session-warning.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SessionWarningComponent {
  private sessionActivity = inject(SessionActivityService);

  isOpen = this.sessionActivity.warningOpen;
  countdownSeconds = this.sessionActivity.countdownSeconds;

  constructor() {
    this.sessionActivity.init();
  }

  continueSession(): void {
    this.sessionActivity.continueSession();
  }

  logout(): void {
    this.sessionActivity.logoutFromIdle();
  }
}
