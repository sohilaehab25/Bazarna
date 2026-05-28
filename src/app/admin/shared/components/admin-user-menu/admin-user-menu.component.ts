import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../shared/services/auth.service';

@Component({
  selector: 'app-admin-user-menu',
  imports: [CommonModule, RouterLink],
  templateUrl: './admin-user-menu.component.html',
  styleUrl: './admin-user-menu.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminUserMenuComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly currentUser = this.authService.user$;
  readonly isOpen = signal(false);

  toggleMenu(): void {
    this.isOpen.update((isOpen) => !isOpen);
  }

  closeMenu(): void {
    this.isOpen.set(false);
  }

  logout(): void {
    this.authService.logout();
    this.closeMenu();
    this.router.navigateByUrl('/login');
  }

  getInitials(name: string | undefined): string {
    if (!name) {
      return 'AD';
    }

    const [first = '', second = ''] = name.trim().split(/\s+/);
    return `${first.charAt(0)}${second.charAt(0)}`.toUpperCase();
  }
}
