import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CardComponent } from '../card/card.component';
import { ButtonComponent } from '../button/button.component';

@Component({
  selector: 'app-recently-viewed',
  standalone: true,
  imports: [CommonModule, RouterLink, CardComponent, ButtonComponent],
  template: `
    <section class="recently-viewed" *ngIf="recentProducts.length > 0">
      <div class="container">
        <div class="section-header">
          <h2>🔍 Recently Viewed</h2>
          <p>Continue exploring items you've seen</p>
        </div>

        <div class="recent-products">
          <app-card
            class="recent-item"
            *ngFor="let product of recentProducts; trackBy: trackById">
            <div class="product-content">
              <div class="product-emoji">{{ product.emoji }}</div>
              <h4>{{ product.name }}</h4>
              <p class="product-price">{{ product.price | currency }}</p>
              <app-button size="small" routerLink="/products">
                View Again
              </app-button>
            </div>
          </app-card>
        </div>

        <div class="view-all">
          <app-button variant="secondary" routerLink="/products">
            Browse All Products 🛍️
          </app-button>
        </div>
      </div>
    </section>
  `,
  styleUrls: ['./recently-viewed.component.scss']
})
export class RecentlyViewedComponent {
  // Mock recently viewed products - in real app, this would come from a service
  recentProducts = [
    { id: '1', name: 'Handmade Scarf', price: 25.99, emoji: '🧣' },
    { id: '2', name: 'Ceramic Mug', price: 12.50, emoji: '☕' },
    { id: '3', name: 'Jewelry Box', price: 45.00, emoji: '💍' },
    { id: '4', name: 'Decorative Pillow', price: 28.99, emoji: '🛋️' }
  ];

  trackById(index: number, item: any): string {
    return item.id;
  }
}