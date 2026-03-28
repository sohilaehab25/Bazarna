import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardComponent } from '../../shared/components/card/card.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { AuthService } from '../../shared/services/auth.service';
import { OrdersService } from '../../shared/services/orders.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, CardComponent, ButtonComponent],
  template: `
    <div class="profile">
      <h1>Your Profile 👤</h1>

      @if (isLoggedIn()) {
        <app-card>
          <div class="profile-info">
            <h3>Welcome back, {{ currentUser()?.name }}!</h3>
            <p>Email: {{ currentUser()?.email }}</p>
            <div class="profile-actions">
              <app-button>Edit Profile</app-button>
              <app-button variant="secondary" (onClick)="logout()">
                Logout
              </app-button>
            </div>
          </div>
        </app-card>

        <div class="orders-section">
          <h2>Order History</h2>
          @if (orders().length === 0) {
            <app-card>
              <p>You haven't placed any orders yet. Start shopping! 🛍️</p>
            </app-card>
          } @else {
            @for (order of orders(); track order.id) {
              <app-card>
                <div class="order">
                  <div class="order__header">
                    <h3>Order {{ order.id }}</h3>
                    <span class="order__status order__status--{{ order.status }}">
                      {{ order.status | titlecase }}
                    </span>
                  </div>
                  <p class="order__date">{{ order.createdAt | date:'medium' }}</p>
                  <p class="order__total">{{ order.total | currency }}</p>
                  <p class="order__items">{{ order.items.length }} item(s)</p>
                </div>
              </app-card>
            }
          }
        </div>
      } @else {
        <app-card>
          <div class="profile-info">
            <h3>Please log in</h3>
            <p>Access your account to manage your profile and orders.</p>
            <div class="profile-actions">
              <app-button routerLink="/login">Login</app-button>
              <app-button variant="secondary">Sign Up</app-button>
            </div>
          </div>
        </app-card>
      }
    </div>
  `,
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent {
  private authService = inject(AuthService);
  private ordersService = inject(OrdersService);

  currentUser = this.authService.getCurrentUser();
  isLoggedIn = this.authService.isLoggedIn;
  orders = this.ordersService.getOrders();

  logout() {
    this.authService.logout();
  }
}