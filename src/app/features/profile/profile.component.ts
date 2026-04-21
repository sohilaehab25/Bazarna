import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardComponent } from '../../shared/components/card/card.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { AuthService } from '../../shared/services/auth.service';
import { OrdersService } from '../../shared/services/orders.service';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
    selector: 'app-profile',
    standalone: true,
    imports: [CommonModule, CardComponent, ButtonComponent],
    templateUrl: './profile.component.html',
    styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {
    private authService = inject(AuthService);
    private ordersService = inject(OrdersService);
    private router = inject(Router);
    private _snackBar = inject(MatSnackBar);

    // use signal, not observable
    currentUser = this.authService.user$;
    isLoggedIn = this.authService.isLoggedIn;
    orders = this.ordersService.getOrders();

    ngOnInit(): void {
        // fetch profile once, update signal internally
        this.authService.userProfile().subscribe({
            next: () => {},
            error: (error) => {
                this._snackBar.open('Failed to load profile', 'Close', {
                    duration: 3000,
                    panelClass: ['error-snackbar']
                });
            }
        });
    }

    logout() {
        this.authService.logout();
        this.router.navigate(['/login']);
        this._snackBar.open('Logged out successfully', 'Close', {
            duration: 3000,
            panelClass: ['success-snackbar']
        });
    }
}