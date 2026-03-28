import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CardComponent } from '../card/card.component';
import { ButtonComponent } from '../button/button.component';

@Component({
  selector: 'app-promotion-banner',
  standalone: true,
  imports: [CommonModule, RouterLink, CardComponent, ButtonComponent],
  template: `
    <section class="promotion-banner">
      <div class="container">
        <app-card class="promo-card">
          <div class="promo-content">
            <div class="promo-text">
              <div class="promo-badge">🎉 Limited Time Offer</div>
              <h2>Free Shipping on Orders Over $50!</h2>
              <p>
                Enjoy complimentary shipping on all orders above $50.
                Plus, get exclusive access to new artisan collections.
              </p>
              <div class="promo-features">
                <div class="feature">
                  <span class="feature-icon">🚚</span>
                  <span>Free Shipping</span>
                </div>
                <div class="feature">
                  <span class="feature-icon">🎁</span>
                  <span>Exclusive Deals</span>
                </div>
                <div class="feature">
                  <span class="feature-icon">⭐</span>
                  <span>Premium Quality</span>
                </div>
              </div>
              <app-button routerLink="/products" class="promo-cta">
                Shop Now & Save 💸
              </app-button>
            </div>
            <div class="promo-visual">
              <div class="promo-emoji">🛒</div>
              <div class="promo-decoration">
                <div class="decoration-item">💝</div>
                <div class="decoration-item">✨</div>
                <div class="decoration-item">🎊</div>
              </div>
            </div>
          </div>
        </app-card>
      </div>
    </section>
  `,
  styleUrls: ['./promotion-banner.component.scss']
})
export class PromotionBannerComponent {}