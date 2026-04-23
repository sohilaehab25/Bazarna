import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
    import { ButtonComponent } from '../button/button.component';
import { AuthService } from '../../services/auth.service';
import { CartService } from '../../services/cart.service';
import { MatSnackBar } from '@angular/material/snack-bar';

import { BazaarIconComponent } from '../bazaar-icon/bazaar-icon.component';

@Component({
    selector: 'app-navbar',
    standalone: true,
    imports: [CommonModule, RouterLink, RouterLinkActive, BazaarIconComponent],
    templateUrl: './header.component.html',
    styleUrls: ['./header.component.scss']
})
export class HeaderComponent {
    private authService = inject(AuthService);
    private cartService = inject(CartService);
    private _snackBar = inject(MatSnackBar);
    currentUser = this.authService.user$;
    isMenuOpen = signal(false);
    cartItemsCount = this.cartService.cartItemsCount;
    isLoggedIn = this.authService.isLoggedIn;

    toggleMenu(): void {
        this.isMenuOpen.set(!this.isMenuOpen());
    }

    closeMenu(): void {
        this.isMenuOpen.set(false);
    }

    logout(): void {
        this.authService.logout();
        this._snackBar.open('Logged out successfully', 'Close', {
                duration: 3000,
                panelClass: ['success-snackbar']
            });
        this.closeMenu();
    }
}